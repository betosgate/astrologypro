**Status:** Done
**Verified 2026-04-08:** src/app/admin/tarot/cards/page.tsx with src/components/admin/tarot-cards-table-client.tsx using SortHeader/pushParams pattern.

# Task: Tarot Card List

## Target Details
- **Route:** `/admin/tarot/cards`
- **File:** `src/app/(admin)/admin/tarot/cards/page.tsx`

## Objective
Enhance the Tarot Card list page in Next.js to match the project's standard list pattern, including search filters, pagination, and row actions.

## List Details

### Implementation Pattern
- Use `@/components/ui/table` for the list display.
- Follow the pattern in `src/components/admin/user-management-client.tsx` for state management and filtering.

### Column Specification
- `name` (Card Name)
- `arcana` (Major/Minor)
- `suit`
- `is_active` (Status)
- `created_at` (Created On)

### Row Actions
- **Edit**: Navigate to `/admin/tarot/cards/edit/[id]`
- **Delete**: Trigger soft-delete logic (move to archive or mark as inactive)
- **Status Toggle**: Toggle `is_active` via API

### Search & Filtering
- **Text Search**: Filter by `name`
- **Date Range**: Filter by `created_at` using `created_from` and `created_to` query params.
