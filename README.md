# Fuel Desk

Fuel Desk is a dependency-light fleet operations prototype based on the provided Fuel Management board. It is intentionally read-only with respect to Google Sheets: the current app uses realistic local mock data and keeps edits in browser memory.

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
