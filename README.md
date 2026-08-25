# Fuel Desk

Fuel Desk is a dependency-light fleet operations prototype based on the provided Fuel Management board. It uses realistic local mock data and keeps edits in browser memory.

## What v2 includes

- Operations-first dashboard that prioritizes the open action queue.
- Stable Unit Workspace: select a unit, use quick actions, or save detailed edits without losing your place.
- Operations board for fuel stages: Fuel now, Verify, and Ready.
- Local Automation Center for defining triggers and actions before a bot or backend is connected.
- API blueprint for a future shared backend used by Fuel Desk and a Telegram bot.

No API key, Telegram credential, Google Sheets write, AI request, or token usage exists in this static version.

## Run locally

Serve this folder with any static server, for example:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Test

```powershell
npm test
npm run check
```

## Future connection

`data.js` exposes the small data-source boundary used by the UI:

```js
const source = { async getRecords() { return recordsFromApi; } };
```

Replace `createMockDataSource()` in `app.js` with a secure API-backed adapter later. Keep credentials server-side and preserve the same record fields: `unit`, `driver`, `notes`, `ownership`, `status`, `fuelStatus`, `tolls`, `tollStatus`, and `checkInTime`.

Suggested future endpoints:

```text
GET /api/units
PATCH /api/units/:id
GET /api/automations
```
