# FuelHelper API Integration Design

## Goal

Make the VPS API a reproducible part of the FuelHelper repository and make the dashboard read and update the same SQLite records used by MAKIMA. The API secret must remain server-side and the existing bot contract under `/api/` must continue to work.

## Current gap

The repository contains only a static frontend. `app.js` loads `createMockDataSource()` and all edits disappear on refresh. The FastAPI, SQLite, Nginx, and Docker files described in the VPS notes are not in Git, so a fresh clone cannot recreate the deployed system.

The documented authentication also fails open when `FUEL_API_KEY` is missing. In addition, mounting the whole repository into the Nginx document root risks serving non-public files.

## Architecture

Two containers remain in one private Compose network:

- `fuelhelper`: Nginx serves four public frontend assets, enforces Basic Auth, and proxies API traffic.
- `fuelhelper-api`: FastAPI owns validation and CRUD behavior; SQLite is stored in a named volume.

MAKIMA continues to call `/api/...` with `Authorization: Bearer <token>`. Browser code calls `/dashboard-api/...` with no embedded API key. Nginx protects that route with the existing Basic Auth and injects the Bearer credential while proxying internally to `/api/...`.

The API container is not published directly to the VPS. Only Nginx port 4173 is exposed.

## Data contract

The backend stores the fields already used by the dashboard:

- `unit_number`
- `driver`
- `notes`
- `ownership`
- `status`
- `fuel_status`
- `tolls`
- `toll_status`
- `check_in_time`
- timestamps

`unit_number` is unique. Fuel status accepts `Arranged`, `Need to arrange`, or `Need to check`. PATCH requests reject empty bodies and unknown units. The API returns snake_case JSON; the frontend adapter converts it to the existing camelCase UI record shape.

On first start, an empty database is seeded with the current roster so deployment does not produce a blank dashboard. Existing non-empty databases are never overwritten.

## Authentication and exposure

- Startup fails if `FUEL_API_KEY` is absent or too short.
- Token comparison uses constant-time comparison.
- `/api/health` is public and reveals only service status.
- Every unit read or write endpoint requires Bearer authentication.
- `.env`, `.htpasswd`, SQLite files, and local data directories are ignored by Git.
- Nginx mounts only `index.html`, `styles.css`, `app.js`, and `data.js` into its document root.
- The generated Nginx configuration exists only inside the running container; the committed template contains no secret.

## Frontend behavior

The dashboard loads `/dashboard-api/units`. Unit quick actions and the edit form issue PATCH requests, then replace local state with the returned server record. The refresh button reloads from SQLite.

If the API cannot be reached, the app displays an explicit connection error instead of silently showing mock data. Mock data remains available only through an opt-in `?demo=1` URL for local design/testing.

Automations remain local prototype data because the current API scope has no automation endpoints.

## Deployment compatibility

The Compose service and container names remain `fuelhelper` and `fuelhelper-api`, port 4173 remains public, and the named database volume remains `fuelhelper_data`. The `.env` key and `.htpasswd` stay on the VPS across `git pull` and container rebuilds.

Before replacing the VPS deployment, the existing database volume must be backed up. The application code will not delete or recreate a non-empty database.

## Testing

- Node tests cover API-to-UI field mapping and request payload mapping.
- Python tests cover missing/invalid auth, CRUD, validation, unknown units, and seed-only-when-empty behavior.
- JavaScript and Python syntax checks run locally.
- `docker compose config --quiet` validates deployment structure without printing expanded secrets.
- A final manual smoke test verifies health, authenticated units, browser load, and a PATCH round trip on the VPS.

## Out of scope

Google Sheets synchronization, Telegram bot changes, multiple user accounts, automation persistence, audit history, and public-domain TLS routing are separate upgrades.
