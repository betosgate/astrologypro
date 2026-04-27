# Task 03 - Define Monthly Summary Contract

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Monthly Summary
- Route: `/community/transits`
- Table: `monthly_transits`

---

## Goal

Define `monthly_transits` as a lightweight current-month summary cache for Perennial community users and family members.

This table should not be treated as the full monthly report store.

## Current Usage

`/community/transits` reads:

- `monthly_transits.month`
- `monthly_transits.transit_data`
- related `community_family_members.full_name`

The page displays:

- short highlights
- current planet positions
- supportive/challenging aspect counts
- family/member-level cards

## Required Contract

A valid `monthly_transits.transit_data` row should represent summary-card data only.

Expected minimum shape:

- `month`
- `planets` array
- each planet has `name`, `sign`, `degree`, `retrograde`, and `aspects`
- `highlights` array
- `generatedAt` or equivalent timestamp
- optional `source` and `schemaVersion`

## Legacy/Dummy Guard

Do not treat old rows as valid only because a row exists.

Rows should be considered invalid/stale if:

- `transit_data` is empty
- required fields are missing
- `planets` is not an array
- `highlights` is not an array
- `generation_status` is `failed`
- row belongs to the wrong month
- source/schema version does not match the expected current summary generator, once versioning exists

## Recommended Metadata

Future migration or JSON fields should capture:

- `generation_source`: `community_monthly_summary_v1`
- `schema_version`: `1`
- `generated_for_month`: `YYYY-MM`
- `family_member_id`
- `natal_chart_generated_at` or an input hash

## Acceptance Criteria

- [ ] `monthly_transits` is documented as lightweight summary data.
- [ ] Full monthly report data is not stored in `monthly_transits`.
- [ ] Current-month reads validate row shape before display/reuse.
- [ ] Old dummy/internal rows are treated as stale when shape/version does not match.
- [ ] Failed rows can be retried.
- [ ] Existing valid rows are reused.
