# Task 01: Add `Service Config` Menu Item In Admin Plan Section

- Status: Pending
- Priority: High

## Goal
Add a new admin navigation item named `Service Config` under the `Plan` menu section and create the initial page shell for it.

## Why This Task Exists
- A new admin-controlled service module is needed.
- Admin needs a clear place to manage booking services.
- The module should live in the admin area, under the existing `Plan` menu.

## Expected Result
- Admin sidebar or menu shows `Service Config` under `Plan`
- Clicking it opens the new service-config page
- The page loads correctly and matches current admin layout patterns

## Scope
- Admin navigation
- Route / page creation
- Basic page shell only

## Steps

### 1. Find The Admin Navigation Source
- Locate the file that builds the admin sidebar / navigation menu
- Find the `Plan` section
- Check how other menu items are added there

### 2. Add The New Menu Item
- Add a new item labeled `Service Config`
- Point it to the new admin route
- Use the same icon, spacing, and active-state patterns already used in the admin UI

### 3. Create The New Page
- Add the new page route for `Service Config`
- Follow the same page layout pattern used by nearby admin modules
- Add a title and short description so the page is understandable even before CRUD is implemented

### 4. Add A Placeholder State
- Show a basic placeholder or empty state such as:
  - page title
  - short explanation
  - area reserved for service table / service form
- This helps confirm navigation is wired correctly before the CRUD work starts

### 5. Verify
- Open admin dashboard
- Expand or open `Plan`
- Confirm `Service Config` appears
- Click it
- Confirm the new page opens with no route or render error

## Notes For Implementation
- Do not build the full CRUD inside this task
- Keep this task focused on navigation and page entry point only
- Match the current admin information architecture

## Acceptance Checklist
- [ ] `Service Config` is visible under `Plan`
- [ ] Route exists and opens successfully
- [ ] Page has proper title and description
- [ ] UI matches current admin navigation style
