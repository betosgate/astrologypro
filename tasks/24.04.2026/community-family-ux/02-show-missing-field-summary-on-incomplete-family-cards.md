# Task 02 - Show Missing Field Summary On Incomplete Family Cards

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Family Cards
- Dashboard Route: `/community`
- Primary File: `src/app/community/page.tsx`
- Helper Source: `src/lib/community/family-profile-completion.ts`

---

## Objective

Make incomplete family-member cards tell the user what is missing instead of only showing a completion percent.

## Problem

The current card can show:

- `84%`
- `Profile incomplete`
- `Complete Profile ->`

But that still forces the user to guess which field is missing.

## Required UX

For incomplete cards, show a short helper line such as:

- `Missing: relationship`
- `Missing: birth country`
- `Missing: relationship, birth country`

If there are more than two missing fields, truncate cleanly:

- `Missing: relationship, birth country +2 more`

## Implementation Notes

- Reuse `completion.missing`
- Do not duplicate the completion rules in the component
- Keep the line short enough for the dashboard card layout

## Acceptance Criteria

- [ ] Incomplete cards show a missing-field summary
- [ ] The summary is derived from `completion.missing`
- [ ] The text remains compact on dashboard cards
- [ ] Complete cards do not show a missing-field summary

