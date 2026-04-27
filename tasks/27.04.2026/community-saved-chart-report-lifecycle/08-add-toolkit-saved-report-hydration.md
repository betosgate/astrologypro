# Task 08 - Add Toolkit Saved Report Hydration

- Status: Planned
- Priority: P0
- Area: Astro Toolkit / Saved Reports

---

## Goal

Allow `HoroscopeToolkitPage` or a community wrapper around it to render a saved report payload without re-running compute and AI generation.

## Current Gap

The toolkit can generate rich results, but PM/community View must load from saved DB data and render the identical UI.

That requires hydration support.

## Implementation Options

### Option A - Extend `HoroscopeToolkitPage`

Add props such as:

```ts
mode?: "generate" | "view-saved";
savedReport?: AstroAiSavedReport;
onGeneratedSave?: (report: GeneratedToolkitReport) => Promise<void>;
```

### Option B - Add Community Wrapper

Create a wrapper such as:

```txt
CommunitySavedToolkitReport
```

Responsibilities:

- fetch saved report
- pass prefill to toolkit
- pass saved data in view mode
- handle save callback after generation
- update domain lifecycle record

This option may be safer if admin toolkit behavior should remain untouched.

## Required Saved Payload Shape

The saved payload must contain enough data to render:

- raw astrology API data
- chart SVG/image outputs
- AI section responses
- selected tool slug
- form data
- report type metadata

## Acceptance Criteria

- [ ] Saved report can render without compute/AI calls.
- [ ] Generated view and saved view are visually/data-equivalent.
- [ ] Admin toolkit behavior remains stable.
- [ ] Community wrappers preserve ownership and membership checks.
- [ ] Missing/invalid saved payload falls back to Generate/Regenerate state.
