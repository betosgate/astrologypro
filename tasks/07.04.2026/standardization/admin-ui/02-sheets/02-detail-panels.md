# Task 02 - Standardize View Details Panels

## Objective
Establish the "User Detail Sheet" pattern as the universal standard for all right-side detail views in the administrative interface.

## Why This Task Exists
Administrative tasks often require quick inspections without losing the current table state or filters. A consistent right-side panel provides a focused and lightweight way to view/edit auxiliary information.

## Standard Reference Pattern
- **Reference File**: `src/components/admin/user-detail-sheet.tsx`
- **Key Component**: `Sheet` from `@/components/ui/sheet`
- **Navigation**: `Tabs` (Info, Notes, History)

## Global Rules for Detail Sheets
### 1. Panel Layout
- Use `SheetContent` with a responsive width (e.g., `w-full sm:max-w-xl`).
- Include a fixed header with the entity's name (e.g., `User Name`) and status badges (e.g., `Active`, `Blocked`, `Role`).

### 2. Tabbed Content
- Detail panels should default to an "Overview" or "Info" tab.
- Use `Tabs` from shadcn to separate information (e.g., `Info`, `Notes`, `Logs`).
- Icons (from `lucide-react`) must accompany tab labels for visual reinforcement.

### 3. InfoRow Component
- Information should be displayed as a list of key-value pairs.
- Use a standard `InfoRow` helper for consistent alignment.
- Labels must be capitalized and use a secondary text color (`text-muted-foreground`).

### 4. Direct Actions
- Primary actions related to the entity (e.g., `Block`, `Unblock`, `Award Badge`) must be placed at the bottom of the "Info" tab.
- Actions should use standard variants (e.g., `destructive` for `Block`, `outline` for others).

### 5. Optimistic Updates
- When an action is taken inside the sheet (e.g., status change), the sheet must trigger an optimistic UI update and close or refresh the parent table.

## Required Implementation (Generic)
For any target module detail panel:
1. Wrap the content in a shadcn `Sheet`.
2. Implement a tabbed layout using `Tabs`.
3. Standardize the key-value display using the `InfoRow` pattern.
4. Place entity-level action buttons at the bottom of the first tab.
5. Provide a callback (e.g., `onUserChanged`) to update the parent view optimistically.

## Verification Test Plan
- [ ] Verify that clicking "View Details" in the table opens the panel from the right.
- [ ] Confirm tabs switch smoothly and correctly display their content.
- [ ] Verify info rows are consistently aligned.
- [ ] Ensure that closing and re-opening the sheet clears any temporary state (e.g., unsaved note text).
