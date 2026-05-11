# Task - Gate Floating Print Button Until Chart Is Ready

- Status: Planned
- Priority: P1
- Area: Community / Astrology Charts / Print UX
- Page Routes:
  - Nativity chart generation/view pages
  - Monthly transit chart generation/view pages
  - Relationship chart generation/view pages
- Date: 2026-05-11

---

## Goal

Ensure the floating Print button is enabled only when the chart page has successfully loaded enough chart data to print.

This should work correctly for both first-time chart generation and viewing an already generated chart.

## Current Problem

The floating Print button can be available before the chart is fully generated, fetched, or rendered.

That can allow users to print an incomplete, loading, or failed chart page.

## Required Behavior

Use chart readiness, not only generation state, to control the Print button.

### First-Time Generation

- Disable the floating Print button while chart generation is running.
- Keep it disabled until generation completes successfully.
- Enable it only after the generated chart data is available and the printable chart UI is ready.

### Viewing Existing Generated Chart

- Do not keep Print disabled just because this is not a new generation.
- Disable Print only while the existing chart/report is loading or being fetched.
- Enable Print once the existing chart data is successfully fetched and visible.

## Readiness Rule

The floating Print button should be enabled only when:

- the page is not generating a chart
- the page is not loading/fetching an existing chart
- required chart data exists
- there is no blocking chart error
- the printable chart section is rendered and ready

Example state model:

```ts
const printDisabled =
  isGenerating ||
  isLoadingExistingChart ||
  !chartData ||
  hasChartError ||
  !isPrintableChartReady;
```

## Implementation Notes

- Audit floating Print button usage across nativity, monthly transit, and relationship chart pages.
- Identify each page's existing loading, generation, fetch, success, and error states.
- Normalize the button disabled condition around a chart-ready boolean.
- Prefer a shared helper or consistent local pattern if the three pages already share components.
- Do not enable printing during partial loading states, skeleton states, empty states, or failed generation/fetch states.
- Preserve current print behavior once the button is enabled.
- Add an accessible disabled state and clear visual disabled styling if not already present.

## Out Of Scope

- Redesigning chart pages.
- Changing chart generation APIs.
- Changing saved chart/report persistence.
- Changing the printable layout.
- Adding new print formats.
- Changing chart entitlement or purchase logic.

## Acceptance Criteria

- [ ] Nativity chart first-time generation keeps Print disabled until the chart is successfully generated and rendered.
- [ ] Monthly transit first-time generation keeps Print disabled until the chart is successfully generated and rendered.
- [ ] Relationship chart first-time generation keeps Print disabled until the chart is successfully generated and rendered.
- [ ] Viewing an existing nativity chart enables Print after the existing chart finishes loading successfully.
- [ ] Viewing an existing monthly transit chart enables Print after the existing chart finishes loading successfully.
- [ ] Viewing an existing relationship chart enables Print after the existing chart finishes loading successfully.
- [ ] Print remains disabled for loading, generating, empty, and error states.
- [ ] Print behavior is unchanged once the chart is ready.
- [ ] Disabled styling clearly communicates that Print is unavailable.
- [ ] The Print button remains keyboard and screen-reader safe.

## QA Checklist

- [ ] Start a first-time nativity chart generation and confirm Print is disabled while generating.
- [ ] Confirm Print becomes enabled after the nativity chart fully renders.
- [ ] Open an already generated nativity chart and confirm Print enables after fetch/render success.
- [ ] Repeat the same checks for monthly transit charts.
- [ ] Repeat the same checks for relationship charts.
- [ ] Trigger or simulate a chart generation error and confirm Print stays disabled.
- [ ] Trigger or simulate an existing chart fetch error and confirm Print stays disabled.
- [ ] Confirm clicking Print after readiness still opens the correct print flow.
- [ ] Confirm mobile and desktop floating button states are consistent.
