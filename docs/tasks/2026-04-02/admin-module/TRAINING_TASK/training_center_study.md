# Training Center Route Study (`admin-dashboard/training/training-center`)

This document provides a technical specification for the Training Center interface, detailing its dual-column layout, API integrations, and navigation logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard/training/training-center`
- **Associated Component**: `TrainingMainComponent`
- **Module**: `TrainingCenterModule` (Lazy loaded)
- **Resolver**: `ResolveService`
  - **Endpoint**: `training-centre/training-centre-list`
  - **Purpose**: Fetches the directory of all training categories and their lessons.
  - **Payload**: `{}` (Empty POST payload by default via router data).

---

## 2. Core API Endpoints

### 2.1 Initialization & Navigation
| Feature | Endpoint | Method | Payload | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **All Trainings** | `training-centre/training-centre-list` | POST | `{ "user_id": string }` | Initial load of the sidebar/category list. |
| **Category Detail**| `admin/training-fetch` | POST | `{ "_id": string, "user_id": string }` | Fetches specific lessons and metadata for a category. |
| **Lesson Detail** | `admin/lesson-fetch` | POST | `{ "_id": string, "user_id": string }` | Used for individual lesson validation and lock checks. |
| **Progress Stats** | `training-centre/training-report-percentage` | POST | `{ "role": string, "user_id": string }` | Fetches completion percentage for the progress bar. |

---

## 3. Sample API Payloads

### 3.1 Initial Training List Load
**Endpoint**: `training-centre/training-centre-list`
```json
{
  "user_id": "64b65f06d604ceb16647a710"
}
```

### 3.2 Progress Report Calculation
**Endpoint**: `training-centre/training-report-percentage`
```json
{
  "role": "is_admin",
  "user_id": "64b65f06d604ceb16647a710"
}
```

### 2.2 Progress & Status (Sub-components)
- **Progress Tracking**: Handled by `app-training-progress`, which calculates completion percentage based on the user session.
- **Mark as Done**: Lessons inside `app-training-lesson-show` emit events to update completion status (typically via a specialized training-status update API).

---

## 3. UI Sections & Functional Details

### 3.1 Dual-Column "Sticky" Layout
The interface uses a dynamic column-locking mechanism to improve UX in long training lists:
1.  **Left Column (`app-training-lesson-show`)**: Displays the current lesson video, description, and "Mark as Done" controls.
2.  **Right Column (`app-training-category-list`)**: Displays the hierarchical list of categories and lessons.
3.  **Sticky Logic**: Uses a `ResizeObserver` to compare the heights of both columns. The **shorter** column is given the `.make-sticky` class, allowing it to stay in view while the longer column scrolls.

### 3.2 Navigation & Access Logic
- **Sequential Locking**: If enabled in the environment, the `admin/lesson-fetch` API checks the `lesson_completed_flag` of the previous lesson. If false, the UI blocks navigation to the next lesson with a notification.
- **Auto-Next Category**: Upon completing the last lesson in a category, the "Next" button automatically identifies the first lesson of the subsequent category in the `categoryDataSet`.
- **Completion Modal**: When the absolute final lesson is reached, an `AllTrainingCompletedModalComponent` is triggered to offer a restart or completion confirmation.

---

## 4. Replication Checklist
To replicate this module:
1.  **Module Reuse**: Ensure `TrainingCenterModule` (originally from `astrologer-dashboard`) is properly imported or shared.
2.  **Sticky Implementation**: Requires `ResizeObserver` support in the browser or a polyfill to handle the dynamic column heights.
3.  **User Context**: Requires `login_user_details` cookie to provide `user_id` for detail-fetch APIs.
4.  **Sequential Lock**: Must define `environment.sequencial_lock` boolean to toggle the access validation logic.
5.  **Hierarchical Data**: The API `training-centre/training-centre-list` must return a nested structure where each category contains a `lesson_data` array.
