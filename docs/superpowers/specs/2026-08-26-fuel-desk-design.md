# Fuel Desk Design

## Goal

Create a polished read-only fleet fuel-management prototype based on the provided Fuel Management Google Sheet. The prototype uses realistic local mock data, keeps driver and unit records editable in local app state, and isolates data access so a future API or Google Sheets connector can replace the mock source.

## Scope

- Dashboard overview with operational metrics and attention queues.
- Searchable and filterable unit/driver directory.
- Editable detail drawer for a unit/driver record.
- Operations view grouped by fuel and toll actions.
- Integrations view showing future connection points.
- Responsive desktop/tablet layout with accessible controls.
- No external writes and no live Google Sheets dependency in v1.

## Architecture

The app is a static browser application. `data.js` owns the domain model, mock records, derived metrics, and a `FleetDataSource` interface-like adapter shape. `app.js` owns UI state, routing between views, rendering, filtering, and local edits. `styles.css` owns the visual system. A future API adapter can implement `getRecords()` without changing the presentation layer.

## Data Model

Each record maps the board's visible columns: `unit`, `driver`, `notes`, `ownership`, `status`, `fuelStatus`, `tolls`, `tollStatus`, and `checkInTime`. Records also include a stable `id`, a derived `initials`, and optional `lastActivity` for the prototype UI.

## Success Criteria

- App opens locally without a build step or external service.
- Dashboard visibly reflects the sample fleet data.
- Search, ownership/status filters, navigation, and record editing work.
- Empty/error/loading states are represented in the UI.
- A future integration can replace the mock source behind one adapter boundary.
