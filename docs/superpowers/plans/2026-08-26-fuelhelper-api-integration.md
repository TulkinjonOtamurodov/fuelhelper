# FuelHelper API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Version the FuelHelper API deployment and connect the dashboard to the same persistent unit data used by MAKIMA without exposing the Bearer token to browser code.

**Architecture:** Nginx remains the only published service. It passes MAKIMA's Bearer-authenticated `/api/` calls through unchanged and provides a Basic-Auth-protected `/dashboard-api/` bridge that injects the server-side token. FastAPI validates records and stores them in SQLite on the existing named volume.

**Tech Stack:** HTML, CSS, JavaScript modules, Node test runner, Python 3.12, FastAPI, Pydantic, SQLite, Nginx Alpine, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-08-26-fuelhelper-api-integration-design.md`

## Global Constraints

- Preserve MAKIMA's `/api/units` and `/api/units/{unit_number}` contract.
- Never commit `.env`, `.htpasswd`, a database, or a real token.
- Never place the Bearer token in browser JavaScript.
- Keep port `4173`, container names `fuelhelper` and `fuelhelper-api`, and volume name `fuelhelper_data`.
- Seed only a genuinely empty database; never replace existing unit rows.

---

### Task 1: Frontend API data boundary

**Files:**
- Modify: `data.test.js`
- Modify: `data.js`
- Modify: `app.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `mapApiUnit(apiUnit)`, `toApiPatch(changes)`, and `createApiDataSource({ baseUrl, fetchImpl })`.
- `getRecords()` returns the existing camelCase record shape.
- `updateRecord(unitNumber, changes)` returns one mapped server record.

- [ ] Add tests asserting `unit_number` maps to `unit`, API timestamps map to `lastActivity`, and only allowed camelCase fields become snake_case PATCH fields.
- [ ] Run `npm test` and verify failure because the mapping exports do not exist.
- [ ] Implement the pure mappers and rerun `npm test` until green.
- [ ] Add request tests with a small fake `fetchImpl`, checking `GET /dashboard-api/units`, `PATCH /dashboard-api/units/152`, JSON headers/body, and useful errors for non-2xx responses.
- [ ] Run those tests and verify they fail before implementing `createApiDataSource`.
- [ ] Implement the adapter, then update `app.js` to load it by default, persist quick/form updates, and reload on Refresh. Keep mock mode only when `?demo=1` is present.
- [ ] Update the topbar/sidebar connection text and run `npm test && npm run check`.

### Task 2: Persistent backend service

**Files:**
- Create: `backend_store.py`
- Create: `backend_main.py`
- Create: `seed_units.json`
- Create: `tests/test_backend.py`
- Create: `requirements.txt`
- Create: `requirements-dev.txt`

**Interfaces:**
- `backend_store.initialize_database(db_path, seed_path)` creates/migrates the table and seeds only when empty.
- `backend_store.list_units`, `get_unit`, `create_unit`, and `update_unit` return dictionaries.
- FastAPI exposes public `GET /api/health` and protected unit GET/POST/PATCH routes.

- [ ] Write database tests for unique unit numbers, seed-only-when-empty, creation, partial update, and unknown-unit behavior.
- [ ] Run `python -m unittest discover -s tests -v` and verify failure because `backend_store` does not exist.
- [ ] Implement the minimal SQLite store with parameterized queries, migrations for missing expected columns, UTC timestamps, and no destructive reset; rerun tests until green.
- [ ] Add FastAPI tests for a public health check, missing/wrong/correct Bearer auth, invalid fuel status, empty PATCH, duplicate create, and missing unit.
- [ ] Run tests and verify failure because `backend_main` does not exist.
- [ ] Implement Pydantic request models, constant-time token checking, startup rejection for a missing/short key, endpoint status codes, and error bodies; rerun all Python tests.

### Task 3: Hardened reproducible deployment

**Files:**
- Create: `Dockerfile.api`
- Create: `default.conf.template`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- `/api/` passes caller authorization to `fuelhelper-api:8000`.
- `/dashboard-api/` requires `.htpasswd`, rewrites to `/api/`, and injects `Bearer ${FUEL_API_KEY}` inside Nginx.
- Only the frontend's four public files are mounted under `/usr/share/nginx/html`.

- [ ] Add Compose with the existing names, port, and volume; make both services read `.env`, keep the API internal, and add health checks.
- [ ] Add an Nginx template that preserves Basic Auth for the app/dashboard bridge, disables Basic Auth only for bot `/api/`, blocks dotfiles, and forwards standard proxy headers.
- [ ] Add an API image pinned to Python 3.12 slim and copy only backend runtime files.
- [ ] Ignore all secrets, databases, virtual environments, caches, and local data while committing only `.env.example`.
- [ ] Run `docker compose config --quiet` using a disposable local placeholder environment and verify no expanded configuration is printed.

### Task 4: Documentation and full verification

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] Document first install, safe upgrade, database backup, token rotation, Basic Auth creation, Makima variables, health/auth smoke tests, and rollback.
- [ ] Add a combined check command without ever echoing `.env` or `docker compose config` output.
- [ ] Run Node tests/checks and Python tests from a clean dependency environment.
- [ ] Build both Compose services and inspect the Nginx document root to confirm `.env`, `.git`, backend files, and `.htpasswd` are absent.
- [ ] Review `git diff --check`, `git status --short`, and changed files for hard-coded secrets.
