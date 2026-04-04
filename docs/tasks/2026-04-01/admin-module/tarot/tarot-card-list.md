# Task: Tarot Card List

**Date:** 2026-04-01
**Status:** Done

## Target Details
- **Route:** `/admin/tarot/cards`
- **File:** `src/app/(admin)/admin/tarot/cards/page.tsx`

## Objective
Enhance the Tarot Card list page in Next.js to match the Angular implementation, including all required columns, search filters, and row actions.

## List Details

### API Endpoints
- **List:** `tarot-card/card-list`
- **Count:** `tarot-card/card-list-count`

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
| `card_name` | Card Name | text | Yes |
| `related_spread_name` | Related Spreads | text | No |
| `priority` | Priority | number | Yes |
| `status` | Status | status | No |
| `updated_on` | Updated On | date | Yes |
| `created_on` | Created On | date | Yes |

### Row Actions
- **Edit:** Standard edit icon (navigates to `/admin/tarot/cards/edit/:id`)
- **Delete:** Standard delete icon (calls `tarot-card/card-delete`)
- **Status Toggle:** Toggle status between Active/Inactive (calls `tarot-card/card-status-change`)
- **Preview:** Opens a preview modal showing the card image and details (Missing in Next.js).

### Search & Filtering
- **Text Search:** `card_name` (Target field: `card_name`)
- **Select Search:** `status` (Active/Inactive)
- **Select Search:** `related_spreads` (Dropdown, values fetched from `tarot-spreads/spread-list`)
- **Date Range:** `created_on` (`$gte`, `$lte` in `condition`)
- **Date Range:** `updated_on` (`$gte`, `$lte` in `condition`)

## Action Items
- [ ] Update `src/app/(admin)/admin/tarot/cards/page.tsx` with missing columns.
- [ ] Implement `related_spreads` filter in the toolbar.
- [ ] Add date range filter support in `GenericListPage` (shared task).
- [ ] Implement the **Preview** row action and modal.
