# Task: Tarot Spread List

## Target Details
- **Route:** `/admin/tarot/spreads`
- **File:** `src/app/(admin)/admin/tarot/spreads/page.tsx`

## Objective
Update the Tarot Spread list page to align with the project's standard list pattern.

## List Details

### Column Specification
- `name` (Spread Name)
- `card_count`
- `priority`
- `is_active` (Status)
- `created_at` (Created On)

### Interaction Pattern
- Use `@/components/ui/table` for the list display.
- Row actions for Edit, Delete, and Status Toggle.
