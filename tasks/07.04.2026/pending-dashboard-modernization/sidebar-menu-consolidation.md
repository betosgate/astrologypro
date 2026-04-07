# Sidebar Menu Consolidation (Calendar Submenu)

## Goal
Consolidate the four calendar-related menu items (**Bookings**, **Schedule**, **Availability**, **Calendar**) into a single parent menu titled **"Calendar"** with nested sub-items to reduce sidebar clutter and group related functionality together.

## Requirements
- [ ] **Update Sidebar Structure**: Modify `navItems` in `src/components/dashboard/sidebar.tsx` to support `children`.
- [ ] **Create Parent Menu**: Add a "Calendar" parent item with a `CalendarDays` icon.
- [ ] **Nesting**:
  *   **Bookings** -> Child of Calendar
  *   **Schedule** -> Child of Calendar
  *   **Availability** (list) -> Child of Calendar
  *   **Calendar View** -> Child of Calendar
- [ ] **Visual Hierarchy**:
  *   Show an expansion arrow (chevron) for the parent menu.
  *   Indent child items or use a subtle tree-view style.
  *   Ensure the parent is "Active" if any of its children are active.
- [ ] **Mobile Parity**: Ensure the mobile `Sheet` navigation also supports this nested structure.

## Technical Details
- **File**: `src/components/dashboard/sidebar.tsx`
- **Icon**: Use `CalendarDays` for the parent.
- **Active Logic**: `pathname.startsWith("/dashboard/calendar")`, `/dashboard/bookings`, `/dashboard/schedule`, `/dashboard/availability`.
