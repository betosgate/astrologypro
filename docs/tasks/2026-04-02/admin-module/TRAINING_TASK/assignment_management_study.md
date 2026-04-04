# Assignment Management Study (`admin-dashboard/training/assignment-list`)

This document provides a technical specification for the Training Assignment management interface, detailing API interactions, data validation, and form configurations.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard/training/assignment-list`
- **Associated Component**: `AssignmentListComponent` (List) and `AddEditAssignmentComponent` (Add/Edit).
- **Module**: `TrainingModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `training-centre/assignment-list`
  - **Purpose**: Fetches the initial list of assignments.
  - **Payload**: `{}` (via router data configuration).

---

## 2. Core API Endpoints

### 2.1 Content Retrieval
| Feature | Endpoint | Method | Payload | Key Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Assignment List**| `training-centre/assignment-list` | POST | See **Listing Payload** below. | `{ "results": { "res": [ ... ] } }` |
| **Assignment Count**| `training-centre/assignment-list-count`| POST | See **Listing Payload** below. | `{ "count": number }` |
| **Fetch for Edit** | `training-centre/assignment-preview`| POST | `{ "_id": string }` | Full assignment object. |
| **Lesson Autocomplete**| `admin/lesson-name-autocomplete-with-assignment`| POST | `{ "lesson_name": string }` | Used for list filtering. |

**Listing Payload Structure (Shared):**
```json
{
  "condition": { "limit": 10, "skip": 0 },
  "searchcondition": {
    "assignment_title": { "$regex": "Title", "$options": "i" },
    "status": 1
  },
  "sort": { "field": "createdon_datetime", "type": "desc" },
  "project": {},
  "token": ""
}
```

### 2.2 Management Actions
| Action | Endpoint | Method | Sample Payload |
| :--- | :--- | :--- | :--- |
| **Add Assignment** | `training-centre/assginment-add` | POST | See **Upsert Payload** below. |
| **Update Assignment**| `training-centre/assignment-edit`| POST | See **Upsert Payload** (includes `_id`). |
| **Status Toggle** | `training-centre/assignment-status-change` | POST | `{ "id": string, "status": 0/1 }` |
| **Delete** | `training-centre/assignment-delete` | POST | `{ "_id": string }` or `{ "ids": [string] }` |

---

## 3. UI Sections & Functional Details

### 3.1 Assignment List Table
Displays assignments with the following columns:
1.  **Assignment Title**: The display name of the task.
2.  **Lesson Name**: The parent lesson linked to this assignment.
3.  **Status**: Active/Inactive toggle.
4.  **Created On**: Displayed timestamp (`createdon_datetime`).

---

## 4. Add/Edit Assignment Deep Dive (`/assignment-add` & `/assignment-edit/:_id`)

### 4.1 Initialization & Dynamic Data
- **Lesson List Fetch**: `admin/fetch-lesson-list` (POST)
  - **Payload**: `{ "condition": {}, "searchcondition": {}, "sort": { "field": "createdon_datetime", "type": "desc" } }`
  - **Purpose**: Populates the "Assignment Lesson" dropdown.

### 4.2 Form Configuration & Fields
1.  **Assignment Title**: `assignment_title` (Text, Required).
2.  **Assignment Lesson**: `assignment_lesson` (Select, Required).
3.  **Priority**: `priority` (Number, Required).
4.  **Assignment Description**: `assignment_description` (Rich Text Editor) - Uses CKEditor for detailed instruction sets.
5.  **Status**: `status` (Checkbox).

**Upsert Payload (Add/Update):**
```json
{
  "assignment_title": "Divine Integration Task",
  "assignment_lesson": "64c1...",
  "priority": 1,
  "assignment_description": "<h1>Instructions</h1><p>Perform the ritual...</p>",
  "status": 1,
  "_id": "6724..." // Only for Update
}
```

---

## 5. Replication Checklist
1.  **Endpoint Typo Note**: The addition endpoint is explicitly `training-centre/assginment-add` (with the `g` before `s` typo preserved from the backend).
2.  **Rich Text Integration**: Ensure CKEditor is configured to handle HTML tags used in assignment descriptions.
3.  **Status Conversion**: Convert boolean checkbox states to `0` or `1` during the `listenFormFieldChange` phase.
4.  **Bulk Operations**: Map `updateendpointmany` and `deleteendpointmany` to the status-change and delete endpoints for grid management.
