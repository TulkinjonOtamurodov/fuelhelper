# Fuel Desk v2 Design

## Goal

Improve day-to-day fuel operations in the static prototype by making unit status updates clear, stable, and fast; add a local automation workspace; preserve a clean path to a later bot/API integration.

## User Experience

The dashboard leads with the action queue and fleet readiness. The Unit Workspace holds the selected unit beside the roster, so updates do not open a shifting overlay or remove the user from their context. One-click actions handle the common cases: mark fuel arranged and clear a toll review. The Operations Board groups the same records into operational stages.

## Automation and Future API

Automation rules are local browser state in this version. The UI represents each rule as a name, trigger, action, and enabled state. A future protected REST API can persist units and rules for both the browser dashboard and Makima Telegram watcher. The static prototype makes no network calls beyond browser font loading and contains no AI, token, Telegram, or API-key integration.

## Quality Constraints

- Local updates remain in memory only.
- A selected unit is retained through local status updates.
- Quick actions change exactly one operational field.
- Automated behavior is described but never executed externally.
