# Training Lesson Management Study (`admin-dashboard/training/training-lesson`)

This document provides a technical specification for the Training Lesson management interface, detailing API interactions, UI sections, and complex functional logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard/training/training-lesson`
- **Associated Component**: `LessonComponent`
- **Module**: `TrainingModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `admin/lesson-list`
  - **Purpose**: Fetches the initial list of training lessons for the management table.
  - **Payload**: `{}` (via router data configuration).

---

## 2. Core API Endpoints

### 2.1 Content Retrieval
| Feature | Endpoint | Method | Payload |
| :--- | :--- | :--- | :--- |
| **Lesson List** | `admin/lesson-list` | POST | See **Listing Payload** below. |
| **Lesson Count**| `admin/lesson-list-count` | POST | See **Listing Payload** below. |
| **Fetch for Edit** | `admin/lesson-edit` | POST | `{ "_id": string }` |
| **Fetch for Preview**| `admin/lesson-fetch`| POST | `{ "_id": string }` |

**Listing Payload Structure (Shared for List & Count):**
```json
{
  "condition": { "limit": 10, "skip": 0 },
  "searchcondition": {
    "lesson_name": { "$regex": "SearchTerm", "$options": "i" },
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
| **Add Lesson** | `admin/lesson-add` | POST | See **Upsert Payload** below. |
| **Update Lesson**| `admin/lesson-update`| POST | See **Upsert Payload** (includes `_id`). |
| **Status Toggle** | `admin/lesson-status-change` | POST | `{ "id": string, "status": 0/1 }` |
| **Delete (Single)**| `admin/lesson-delete` | POST | `{ "_id": string }` |
| **Delete (Bulk)** | `admin/lesson-delete` | POST | `{ "ids": [string] }` |

---

## 3. UI Sections & Functional Details

### 3.1 Training Lesson List Section
Displays a comprehensive table using `lib-listing` with the following columns:
1.  **Lesson Name**: The display title of the lesson.
2.  **Category Name**: The training category it belongs to (`cat_name`).
3.  **Pre-Requisite Lesson**: The lesson that must be completed first (`prerequisite_lesson_name`).
4.  **Status**: Active/Inactive toggle.
5.  **Created On**: Displayed timestamp (`createdon_datetime`).

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint / Component |
| :--- | :--- | :--- |
| **Add Lesson** | Navigates to `admin-dashboard/training/training-lesson-add` | None |
| **Edit** | Navigates to `admin-dashboard/training/training-lesson-edit/:_id` | `admin/lesson-edit` (via edit resolver) |
| **Preview** | Opens a generic info dialog | `admin/lesson-fetch` (POST) |
| **Status Toggle** | Updates status in real-time | `admin/lesson-status-change` |
| **Delete** | Triggers deletion for selection | `admin/lesson-delete` |

---

## 4. Add/Edit Training Lesson Deep Dive (`/training-lesson-add` & `/training-lesson-edit/:_id`)

### 4.1 Initial Data Fetching
- **Category Fetch**: `admin/training-category-fetch` (GET) - Populates the Category dropdown.
- **Pre-Requisite Dynamic Fetch**: `admin/prerequisite-lesson?category_id=...` (GET)
  - This API is called whenever the `category_id` field changes.
  - It filters the available lessons to only those belonging to the newly selected category.

### 4.2 Form Configuration & Media Management
The lesson form supports multiple file types across dedicated storage paths:
1.  **Lesson Name**: `lesson_name` (Text, Required).
2.  **Category**: `category_id` (Select, Required).
3.  **Accuracy**: `accuracy` (Number, Required) - Percentage required for quiz success.
4.  **Description**: `description` (Rich Text Editor).
5.  **Media Uploads** (S3 Bucket: `all-frontend-assets`):
    - **Images**: `divine-infinity-being/lesson-images/`
    - **Audio**: `divine-infinity-being/lesson-audio/`
    - **Video**: `divine-infinity-being/lesson-videos/`
    - **Assets**: `divine-infinity-being/lesson-assets/`

**Image/Asset Payloads:**
- **Request URL**: `user-profile/request-bucket-url`
  ```json
  {
    "name": "1775126705821filename.mp4",
    "type": "video/mp4",
    "path": "divine-infinity-being/lesson-videos/",
    "bucket": "all-frontend-assets"
  }
  ```
- **Delete Image**: `user-profile/delete-image-from-bucket`
  ```json
  {
    "file": "1775126705821filename.mp4",
    "path": "divine-infinity-being/lesson-videos/",
    "bucket": "all-frontend-assets",
    "secret": "na",
    "token": ""
  }
  ```

---

## 5. Replication Checklist
1.  **Dynamic Filtering**: Must implement the `listenFormFieldChange` logic to update the pre-requisite lesson list whenever the category is switched.
2.  **Sequential State**: Ensure the `sequential_lock` environment variable is checked to validate prerequisites.
3.  **Media Cleanup**: Automatically delete previous files from the bucket if they are replaced or the lesson is deleted.
4.  **Bulk Deletion**: Ensure `deleteendpointmany` is correctly mapped for batch removal of lessons.
