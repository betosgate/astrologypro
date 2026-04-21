# Data Task - Repair Existing Family Birth Location Records

- Status: Planned
- Priority: P1
- Area: Data Repair / Community Family / Birth Location
- Files: TBD by implementation approach
- Related Table: `community_family_members`
- Depends On:
  - `03-backend-family-birth-location-save-contract.md`
  - Completed frontend family birth location form work

---

## Problem

Some existing family member rows have the country embedded in `birth_city` while `birth_country` is null.

Known example:

```json
{
  "id": "f071b86c-bd87-417e-90fc-653a4edafb00",
  "full_name": "Louis Williams",
  "birth_city": "Miami, FL, United States of America",
  "birth_country": null
}
```

This causes the profile status to show:

```txt
Missing: Birth country
```

even though the visible birth place text includes country information.

## Required Data Fix

Create a safe repair plan for existing rows where:

```sql
birth_country IS NULL
AND birth_city includes a country-like suffix
```

The repair can be one of:

- additive SQL migration,
- admin-safe one-time script,
- scoped admin repair endpoint,
- manual admin SQL only if explicitly approved.

Document the chosen approach before running it.

## Repair Rules

Use conservative parsing.

For labels like:

```txt
Miami, FL, United States of America
```

the country should become:

```txt
United States of America
```

Do not overwrite rows that already have `birth_country`.

Do not guess country when the label format is ambiguous.

## Acceptance Criteria

- [ ] Existing rows with clear country suffix are repaired.
- [ ] Rows with existing `birth_country` are not overwritten.
- [ ] Ambiguous rows are skipped and reported.
- [ ] Louis Williams row no longer has `birth_country = null` if the country can be safely parsed.
- [ ] Family profile completion reflects repaired country data.

## QA Checklist

- [ ] Identify affected rows before repair.
- [ ] Run repair only after reviewing affected row count.
- [ ] Verify repaired rows have `birth_country`.
- [ ] Verify no unrelated rows were changed.
- [ ] Open affected family member detail page.
- [ ] Confirm Profile Status no longer says `Missing: Birth country`.

## Important Constraints

- Do not run broad destructive SQL.
- Do not overwrite existing country values.
- Do not guess country for ambiguous labels.
- Do not use this repair as a substitute for fixing create/edit save behavior.
