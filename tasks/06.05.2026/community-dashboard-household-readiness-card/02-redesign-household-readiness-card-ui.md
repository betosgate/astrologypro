# Task 02 - Redesign Household Readiness Card UI

- Status: Done
- Priority: P1
- Area: UI / Community Dashboard
- Route: `/community`
- Reference Screenshot: User-provided screenshot of the current `Birth Data Readiness` card.
- Reference Mockup: `/home/influxiq100/.codex/generated_images/019dfb98-821e-7732-84af-67564ae0ca78/ig_08f5a4484168ffec0169fb100ce1148191a2a8ab46ddd86864.png`

---

## Goal

Replace the current low-information readiness card with a richer summary card that fits the dashboard quality.

The new card should act as a compact household setup and chart-readiness command center. It must not become another full member-card grid because the dashboard already has a detailed `Your Circle` section below.

## Proposed Card Name

Use one of these, based on final copy review:

- `Household Readiness`
- `Profile Readiness`
- `Setup Readiness`

Recommended: `Household Readiness`

## Required Layout

Build one dashboard card with three clear zones:

1. Top metric row
   - `Your Birth Data`
   - `Members Complete`
   - `Charts Ready`
   - `Missing Details`

2. Middle status checklist
   - Self profile complete or missing fields
   - Count of members with complete birth data
   - Count of natal charts already generated
   - Count of members still needing birth details

3. Action area
   - `Manage Family`
   - `View Charts`
   - `Complete Missing Details` only when there are incomplete members

## Visual Requirements

- Keep the card compact and dashboard-friendly.
- Use the existing dark blue card style and border language.
- Use green for complete/view-ready states.
- Use orange/gold for generate or incomplete-action states.
- Avoid a carousel here unless product explicitly asks for member-level browsing inside this card.
- Do not duplicate the lower `Your Circle` member cards.
- Do not show large empty space under the metrics.

## UX Rules

- The card must communicate summary status at a glance.
- Do not use `Household Members 100%` unless it truly means all household member profiles are complete.
- If household data is incomplete, the card should immediately show what action is needed.
- If everything is complete, the card should shift toward chart access and summary readiness instead of only saying `100%`.

## Acceptance Criteria

- [x] Card title no longer creates confusion between self birth data and household readiness.
- [x] The card shows more than two circular meters.
- [x] The card has useful actions that match the current state.
- [x] The card does not visually duplicate the `Your Circle` member grid.
- [x] Mobile layout remains readable without text overlap.

---

## Implementation Notes

- New component: `src/components/community/household-readiness-section.tsx`.
- Title: **`Household Readiness`**.
- Three zones built per spec:
  1. **Top metric tiles** (4): `Your Birth Data`, `Members Complete`, `Charts Ready`, `Missing Details`. Tile tone is green when fully ready, amber when action is needed, neutral when there's nothing yet to measure (e.g. zero chart-eligible members). Replaces the two circular rings — fewer pixels, more truth.
  2. **Status checklist**: self birth-data state (with specific missing fields when known), members-complete summary, charts summary, plus a "members still need details" line that only appears when `missingDetailsCount > 0`.
  3. **Action area**: `Manage Family` and `View Charts` always; `Complete Missing Details` appears only when `missingDetailsCount > 0`. When everything is set up, a positive confirmation line replaces the action prompt.
- Mobile (375px): metric tiles wrap to 2 columns, action buttons take `flex-1` so they wrap cleanly without overflow.
- Tablet/desktop: metric tiles render as 4 columns (`sm:grid-cols-4`); buttons revert to natural width (`sm:flex-none`).
- Old `profile-progress-section.tsx` is left in place but no longer imported — kept for traceability per the project's consolidation pattern.
