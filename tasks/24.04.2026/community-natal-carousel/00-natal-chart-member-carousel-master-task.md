# Master Task - Convert Natal Charts Card To Member Carousel

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Astrology / Natal Charts
- Page Route: `/community`

---

## Goal

Update the dashboard `Natal Charts` card so the ready-state experience is no longer a single-member snapshot card.

Instead, the card should present a member carousel that lets the user browse available member charts.

## Why This Task Exists

The current dashboard card shows one ready-state card at a time:

- `Chart Ready`
- member name
- DOB
- `View Full Chart`

That no longer matches the updated product direction.

The client has clarified that this area should represent charts across members, not just a single chart result.

## Required Outcome

When natal chart data is available, the card should:

- behave like a member carousel
- surface member-by-member chart entries
- let the user move through available member chart cards from this dashboard section

## Task Breakdown

1. `01-audit-current-natal-chart-card-data-shape.md`
   Confirm what data the dashboard currently receives for natal-chart readiness and whether it already includes enough member-level fields for a carousel.

2. `02-replace-single-ready-card-with-member-carousel.md`
   Replace the current single ready-state card UI with a member carousel pattern.

3. `03-regression-and-qa-checklist.md`
   Verify zero, one, and multiple-member chart states on desktop and mobile.

## Out Of Scope

- Rebuilding horoscope detail pages
- Changing monthly transit card architecture
- Rewriting chart-generation backend contracts unless audit proves it is required
- Family management UI outside this natal-chart card

## Acceptance Criteria

- [ ] The ready-state natal chart UI is presented as a member carousel
- [ ] Multiple members can be browsed from the dashboard card
- [ ] Each member card still has a clear route into the full chart view
- [ ] Zero-state and loading-state behavior remain stable
- [ ] Mobile and desktop both remain usable
