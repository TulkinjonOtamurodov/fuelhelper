# Fuel Desk Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the conflicting dark interface with one polished light operations-console design while preserving existing behavior.

**Architecture:** Keep `data.js` and application event behavior unchanged. Update semantic copy and shell markup in `index.html` and `app.js`, then replace `styles.css` completely with one responsive token-driven system.

**Tech Stack:** HTML, CSS, JavaScript modules, Node built-in tests, browser smoke tests.

**Spec:** `docs/superpowers/specs/2026-08-26-fuel-desk-visual-redesign.md`

## Global Constraints

- Preserve all current local-only functionality.
- Add no backend, external writes, AI, API keys, or Telegram credentials.
- Replace the stylesheet instead of appending overrides.
- Use a light professional visual system with restrained status colors.

### Task 1: Simplify the shell and product copy

**Files:**
- Modify: `index.html`
- Modify: `app.js`

**Interfaces:**
- Consumes current `data-view`, `data-record-id`, `data-action`, and form IDs.
- Produces the same selectors so event handling remains unchanged.

- [ ] Change the shell theme metadata, typography imports, brand, navigation copy, and local-state indicator.
- [ ] Tighten dashboard, workspace, automation, and connection copy without removing controls.
- [ ] Run `node --check app.js` and confirm success.

### Task 2: Replace the visual system

**Files:**
- Replace: `styles.css`

**Interfaces:**
- Consumes every class currently emitted by `index.html` and `app.js`.
- Produces desktop, tablet, and mobile layouts without altering JavaScript.

- [ ] Define neutral, typography, spacing, status, control, and focus tokens.
- [ ] Style shell, dashboard, tables, workspace, board, rules, endpoints, feedback, and empty states.
- [ ] Add responsive layouts at 1120px, 820px, and 640px.

### Task 3: Verify behavior and presentation

**Files:**
- Test: `data.test.js`

- [ ] Run `node --test data.test.js` and JavaScript syntax checks.
- [ ] Browser-test navigation, unit selection, quick actions, detailed save, filters, rule toggling, and rule creation.
- [ ] Inspect desktop and mobile layouts and confirm no browser console errors.
