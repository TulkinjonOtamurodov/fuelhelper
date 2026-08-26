# FuelHelper

FuelHelper is a private fleet fuel-operations workspace. The dashboard and MAKIMA share unit records through a small FastAPI service backed by SQLite. It uses ordinary HTTP/database requests—no AI calls or token usage.

## Architecture

- `fuelhelper`: Nginx frontend on port `4173`, protected by Basic Auth.
- `fuelhelper-api`: internal FastAPI service; it is not published directly.
- `fuelhelper_data`: persistent SQLite Docker volume.
- MAKIMA calls `/api/...` with a Bearer token.
- The browser calls `/dashboard-api/...`; Nginx supplies the token server-side, so JavaScript never sees it.

## Security files

These files must exist on the VPS and must never be committed:

- `.env` — contains `FUEL_API_KEY`.
- `.htpasswd` — contains the frontend login hash. The configured username from the existing deployment is `fueladmin`.

Create a fresh API key:

```bash
openssl rand -hex 32
nano /opt/fuelhelper/.env
```

Store it as:

```text
FUEL_API_KEY=PASTE_THE_NEW_VALUE_HERE
```

Set MAKIMA's `FUELHELPER_API_TOKEN` to the exact same new value, then restart MAKIMA. Never paste either value into `app.js`, Git, GitHub, or a public message.

Create or replace the frontend login file:

```bash
sudo apt-get update
sudo apt-get install -y apache2-utils
cd /opt/fuelhelper
htpasswd -c .htpasswd fueladmin
```

## Safe VPS upgrade from the manually created API

First push this repository from the laptop. On the VPS, back up the live database and the manually created files before pulling:

```bash
mkdir -p /opt/fuelhelper-backups/2026-08-26
docker cp fuelhelper-api:/app/data/fuelhelper.db /opt/fuelhelper-backups/2026-08-26/fuelhelper.db
cd /opt/fuelhelper
cp backend_main.py Dockerfile.api requirements.txt docker-compose.yml default.conf /opt/fuelhelper-backups/2026-08-26/
mv backend_main.py Dockerfile.api requirements.txt docker-compose.yml /opt/fuelhelper-backups/2026-08-26/
git pull --ff-only origin main
```

Keep `.env`, `.htpasswd`, and `default.conf` in place. The new Compose file uses `default.conf.template`; the old `default.conf` is retained only as a backup.

Because the previously used API key was shared in chat, rotate it before starting the new containers. Update the FuelHelper `.env` and MAKIMA `FUELHELPER_API_TOKEN` with the same fresh value.

Then build and start:

```bash
cd /opt/fuelhelper
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 fuelhelper-api
```

Do not run `docker compose down -v`; `-v` deletes the persistent database volume.

## Smoke tests on the VPS

Public health check:

```bash
curl --fail http://127.0.0.1:4173/api/health
```

Protected unit list without printing the token:

```bash
cd /opt/fuelhelper
set -a
source .env
set +a
curl --fail -H "Authorization: Bearer $FUEL_API_KEY" http://127.0.0.1:4173/api/units
unset FUEL_API_KEY
```

Open the dashboard at `http://YOUR_VPS_IP:4173` and log in as `fueladmin`. Update one test unit, refresh the page, and verify the change remains. Then make one MAKIMA status change and verify the dashboard reflects it after Refresh.

## Local development

Frontend demo only:

```powershell
python -m http.server 4173
```

Open `http://localhost:4173/?demo=1`. Demo edits remain in memory and reset on reload.

Backend tests on Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Frontend tests when Node is installed:

```powershell
npm test
npm run check
```

## API contract

- `GET /api/health` — public service health only.
- `GET /api/units` — list units; Bearer auth required.
- `GET /api/units/{unit_number}` — get one unit; Bearer auth required.
- `POST /api/units` — create one unit; Bearer auth required.
- `PATCH /api/units/{unit_number}` — update selected fields; Bearer auth required.

Allowed fuel values are `Arranged`, `Need to arrange`, and `Need to check`.

## Rollback

If the new deployment fails, inspect logs first:

```bash
cd /opt/fuelhelper
docker compose ps
docker compose logs --tail=200 fuelhelper-api
docker compose logs --tail=200 fuelhelper
```

The pre-upgrade database and server-created files remain under `/opt/fuelhelper-backups/2026-08-26`. Do not remove the Docker volume while troubleshooting.
