# Task: Planetary Zodiacal Ritual Configurator

- Status: Completed (2026-04-08, verified)
- Completion Notes: Dynamic configurator in rituals/new/page.tsx with planet/sign tag generation; persists via POST /api/community/rituals.

## Objective
Build the advanced **Planetary Zodiacal Invocation Ritual** builder with dynamic tag generation and legacy-parity validation.

## Requirements
- [ ] **Configurator UI**:
    - **Mode Switch**: Toggle between `Invocation` and `Banishing`.
    - **Planet Selection**: List of selectable planets.
    - **Zodiac Selection**: List of selectable zodiac signs (Disabled in Banishing mode).
- [ ] **Validation Logic**:
    - **Banishing**: Requires at least one selected planet.
    - **Invocation**: Requires at least one planet OR one zodiac (Zodiac-only invocation is valid).
- [ ] **Tag Generation Engine**:
    - Automatically inject `Ritual_Opening` and `Ritual_Closing`.
    - Map planets to `[Planet]_Gate_[Mode]_Ritual` and `[Planet]_[Mode]_Ritual`.
    - Map zodiacs to `[Zodiac]_Gate_Invocation_Ritual` and `[Zodiac]_Invocation_Ritual`.
- [ ] **Submit Workflow**:
    - De-duplicate tags before sending.
    - Navigate to the saved ritual result immediately after creation.

## Technical Details
- Ensure selection state is cleared when switching modes (e.g. clear zodiacs when moving to Banishing).
- Logic must match legacy tag generation exactly to ensure correct video fetching downstream.
