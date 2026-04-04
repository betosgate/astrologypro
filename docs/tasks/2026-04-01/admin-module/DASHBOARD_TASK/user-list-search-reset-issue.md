# User List Search and Reset Functionality Issue

## Overview
The User List in the Admin Dashboard (`src/app/(admin)/admin/dashboard/page.tsx`) currently lacks explicit **Search** and **Reset** buttons for filtering. Additionally, the API payload structure for filtering is incorrect, leading to potential data retrieval issues.

## Problem Description

### 1. Missing Search and Reset Controls
Currently, the user list table does not have dedicated buttons to trigger a search or reset all filters.
- **Requirement**: Add a **Search** button that, when clicked, triggers the `user/user-list` and `user/user-list-count` API calls with the selected filters.
- **Requirement**: Add a **Reset** button that, when clicked, clears all active filters and re-fetches the complete user list (default state).

### 2. Incorrect Payload Structure
The current implementation generates a payload where filter conditions (like `user_type`) are placed incorrectly within the request body.

#### ❌ Current (Incorrect) Payload
The filter fields are being nested inside the `condition` object along with pagination, while `searchcondition` remains empty:
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

#### ✅ Expected (Correct) Payload
Filter fields like `user_type` must be placed inside the `searchcondition` object. The `condition` object should only contain pagination/limit parameters:
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

## Affected Endpoints
The following endpoints are affected by this payload structure issue:
1. `user/user-list`
2. `user/user-list-count`

## Next Steps
- Implement the UI for Search and Reset buttons.
- Update the filter/search logic to ensure parameters are mapped to the correct keys in the API payload.
- Ensure state is properly reset when the "Reset" button is clicked.
