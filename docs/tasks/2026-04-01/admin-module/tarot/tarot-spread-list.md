# Task: Tarot Spread List

**Date:** 2026-04-01
**Status:** Done

## Target Details
- **Route:** `/admin/tarot/spreads`
- **File:** `src/app/(admin)/admin/tarot/spreads/page.tsx`

## Objective
Update the Tarot Spread list page in Next.js to match the Angular implementation, including all required columns and search filters.

## List Details

### API Endpoints
- **List:** `tarot-spreads/spread-list`
- **Count:** `tarot-spreads/spread-list-count`

### Request Payload (List & Count)
```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {},
  "sort": {
    "type": "desc",
    "field": "created_on"
  },
  "project": {},
  "token": ""
}
```

### Column Specification
| Key | Label | Type | Sortable |
|-----|-------|------|----------|
| `spread_name` | Spread Name | text | Yes |
| `description` | Description | text | No |
| `priority` | Priority | number | Yes |
| `status` | Status | status | No |
| `updated_on` | Updated On | date | Yes |
| `created_on` | Created On | date | Yes |

### Row Actions
- **Edit:** Standard edit icon (navigates to `/admin/tarot/spreads/edit/:id`)
- **Delete:** Standard delete icon (calls `tarot-spreads/spread-delete`)
- **Status Toggle:** Toggle status between Active/Inactive (calls `tarot-spreads/spread-status-change`)
- **Preview:** Preview the spread layout/details (Missing in Next.js, listed in documentation).

## Action Items
- [ ] Update `src/app/(admin)/admin/tarot/spreads/page.tsx` with missing columns (`updated_on`).
- [ ] Add search filters for `status` and date ranges in the toolbar.
- [ ] Implement date range filter support in `GenericListPage` (shared task).
