# Fuel Desk Visual Redesign

## Goal

Rebuild Fuel Desk as a calm, professional personal operations console while preserving all current local functionality.

## Critique of the Existing Interface

The existing stylesheet contains two overlapping design systems. Dense dark surfaces, excessive badges, undersized type, repeated borders, and decorative labels create weak hierarchy. The narrow unit editor makes routine changes feel complex. Dashboard cards compete equally for attention, and the automation/API pages resemble developer tools rather than an operator's workspace.

## Visual Direction

Use a warm neutral canvas, white work surfaces, navy text, muted slate secondary text, and a restrained emerald action color. Use red and amber only for exceptions. Typography uses Inter for interface text and IBM Plex Mono only for unit identifiers and compact metadata. Spacing follows an eight-pixel rhythm, controls have a consistent forty-pixel height, and surfaces use subtle borders with minimal shadows.

## Layout

The desktop shell uses a compact 232-pixel navy sidebar and a bright main workspace. The dashboard leads with one action-oriented summary strip, followed by an attention table and compact readiness panel. The unit workspace gives more width to the editable record while retaining a scannable roster. The operations board uses clear columns with light tinted headers. Automations use straightforward rule rows and one create form. Mobile collapses navigation and stacks all primary areas.

## Functional Constraints

- Preserve navigation, filters, quick actions, local unit editing, operation cards, automation creation, and rule toggles.
- Keep all data local and make no external network or API calls.
- Do not add decorative charts or new product scope.
- Ensure focus states, readable contrast, minimum control heights, and responsive behavior.
