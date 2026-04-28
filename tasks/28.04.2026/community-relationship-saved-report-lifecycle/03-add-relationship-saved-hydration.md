# Task 03 - Add Relationship Saved Hydration

- Status: Planned
- Priority: P0
- Area: Toolkit / Saved Relationship Reports
- Route: `/community/charts/detailed`

---

## Goal

When a saved relationship report exists, render it from DB and skip live compute / chart / AI generation.

## Required Behavior

On `/community/charts/detailed`:

- Validate auth, active membership, and household ownership as today.
- Normalize mode:
  - `romantic` → `romantic`
  - `friendship` → `friendship`
  - `business` → `partnership`
- Call `loadLinkedRelationshipReport({ personAId, personBId, reportType })`.
- If a linked saved report exists:
  - Pass it to an opt-in saved-report hydration mode/wrapper.
  - Render the same UI layout as a generated relationship report.
  - Do not auto-submit the toolkit.
  - Do not call compute, synastry, composite, wheel, or AI interpretation APIs.
- If no linked saved report exists:
  - Render existing generation flow.

## Toolkit Requirements

Use the same saved-hydration pattern used for natal charts.

The saved payload should restore:

- `ai_response`
- `form_data`
- `astro_api_data`
- `natal_chart` self/partner data
- chart SVG/image fields:
  - self chart
  - partner chart
  - transit/comparison chart fields if present

## Regenerate Entry

When viewing saved data:

- Show an explicit `Regenerate` action.
- Regenerate must call the live generation path and save/link a new artifact only after successful generation.
- If regeneration fails, keep the existing saved report visible.

## Acceptance Criteria

- [ ] Saved romantic report opens without live compute/AI calls.
- [ ] Saved friendship report opens without live compute/AI calls.
- [ ] Saved partnership report opens without live compute/AI calls.
- [ ] Regenerate remains explicit.
- [ ] Admin `HoroscopeToolkitPage` behavior is unchanged unless saved mode props are passed.
