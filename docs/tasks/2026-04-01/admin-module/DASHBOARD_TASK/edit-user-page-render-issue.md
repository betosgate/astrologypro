# Edit User Page Lifecycle Warning Fix

## Issue Description
While navigating to the Edit User page (`/admin/users/edit/[id]`), the following React warning was occurring:
`Warning: Cannot update a component (HotReload) while rendering a different component (EditUserPage).`

This error typically implies that a state update (either via `setState`, `reset()`, or a side-effect like `router.push`) was triggered directly within the render body of a functional component instead of within a `useEffect` hook.

## Root Cause Analysis
In `EditUserPage`, several factors contributed to this instability:

### 1. Unstable Object References
Options for dropdowns (Roles, States, Gender) were being recreated on every single render:
```tsx
const roleOptions = (rolesData ?? []).map((r) => ({ value: r.user_type, label: r.role_name }));
const stateOptions = (statesData ?? []).map((s) => ({ value: s.state_name, label: s.state_name }));
```
Because these arrays were fresh objects on every render, components like `SelectField` (which use these options) detected a change and could trigger internal re-registrations or state updates during the render cycle.

### 2. Broad Effect Dependencies
The `useEffect` responsible for resetting the form when data arrived depended on the entire `form` object:
```tsx
useEffect(() => {
  if (userData) {
    form.reset({ ... });
  }
}, [userData, form]);
```
The `form` object reference from `react-hook-form` is generally stable, but in certain lifecycle transitions, depending on the entire object instead of specifically `form.reset` can lead to unnecessary effect executions.

## Solution Implemented

### 1. Memoization of Derived Data
Wrapped all options and calculations in `useMemo` hooks to ensure stable object identities:
- `roleOptions`
- `stateOptions`
- `memoizedGenderOptions`

This prevents downstream components from seeing "new" props when the underlying data has not actually changed.

### 2. Refined Form Reset Effect
Extracted the `reset` function from `form` and used it as the specific dependency for the `useEffect`. This ensures the form is reset only when the `userData` actually changes or the component is mounted.

### 3. Safer Query Logic
Added basic error handling to the `userData` fetch to prevent the component from hanging in an indeterminate `isLoading` state if the API fails.

## Benefits
- Eliminated the "update during render" warning in the development environment.
- Improved rendering performance by reducing unnecessary re-renders of form field components.
- Stabilized the form's initial load and data-population cycle.
