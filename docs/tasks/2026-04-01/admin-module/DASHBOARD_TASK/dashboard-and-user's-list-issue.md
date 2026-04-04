# Dashboard User List Task - April 1st, 2026

## Previously Implemented Fixes
The Admin Dashboard was experiencing issues with the User List table and statistics due to:
1.  **Missing Total Count**: The user list API (`/user/user-list`) was not returning the total data count, causing the pagination to fail (always showing 0 or 1 page).
2.  **Incorrect Payload Structure**: the backend interface for the user list API changed, requiring pagination parameters (`limit`, `skip`) to be nested inside the `condition` object, along with additional mandatory fields (`token`, `static_id`, `project`, `count`).

### Solution Implemented
- **Updated `useApiList` Hook**: Supported new nested pagination structure and added mandatory fields.
- **Updated User List Table**: Configured to use `user/user-list-count` for fetching the total record count.
- **Updated Dashboard Statistics**: Fixed "Total Users" stat card to call the count endpoint.

---

## 🚨 Pending Issue: Search & Reset Functionality

### Problem Statement
The User List table needs explicit **Search** and **Reset** buttons to control data fetching. Currently, filters are being sent in an incorrect payload structure, which prevents proper data filtering on the backend.

### Requirements
1.  **Search Button**: On click, perform API calls to `user/user-list` and `user/user-list-count`.
2.  **Reset Button**: On click, reset all filters and call APIs with the default (empty) filter payload.

### Payload Comparison (Filters)

#### ❌ Wrong Payload (Current)
Filter parameters (like `user_type`) are incorrectly placed inside the `condition` object along with pagination:
```json
{
  "condition": {
    "user_type": "is_admin",
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {},
  "sort": {
    "type": "desc",
    "field": "createdon_datetime"
  },
  "token": "",
  "static_id": "",
  "project": {},
  "count": true
}
```

#### ✅ Correct Payload (Required)
Filter parameters (like `user_type`) must be placed inside the `searchcondition` object. Only pagination/limit should remain in `condition`:
```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {
    "user_type": "is_admin"
  },
  "sort": {
    "type": "desc",
    "field": "createdon_datetime"
  },
  "token": "",
  "static_id": "",
  "project": {},
  "count": true
}
```

## Affected APIs
- `user/user-list`
- `user/user-list-count`
