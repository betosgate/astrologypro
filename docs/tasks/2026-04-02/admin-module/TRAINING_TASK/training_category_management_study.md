# Training Category Management Study (`admin-dashboard/training/training-category`)

This document provides a technical specification for the Training Category management interface, detailing API interactions, UI sections, and management logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard/training/training-category`
- **Associated Component**: `TrainingCategoryComponent`
- **Module**: `TrainingModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `admin/training-list`
  - **Purpose**: Fetches the initial list of training categories for the management table.
  - **Payload**: `{}` (via router data configuration).

---

## 2. Core API Endpoints

### 2.1 Content Retrieval
| Feature | Endpoint | Method | Payload |
| :--- | :--- | :--- | :--- |
| **Category List** | `admin/training-list` | POST | See **Listing Payload** below. |
| **Category Count**| `admin/training-list-count` | POST | See **Listing Payload** below. |
| **Fetch for Edit** | `admin/training-edit` | POST | `{ "_id": string }` |
| **Fetch for Preview**| `admin/training-fetch`| POST | `{ "_id": string, "user_id": string }` |

**Listing Payload Structure (Shared for List & Count):**
```json
{
  "condition": { "limit": 10, "skip": 0 },
  "searchcondition": {
    "category_name": { "$regex": "SearchTerm", "$options": "i" },
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
| **Add Category** | `admin/training-category-add` | POST | See **Upsert Payload** below. |
| **Update Category**| `admin/training-category-update`| POST | See **Upsert Payload** (includes `_id`). |
| **Status Toggle** | `admin/training-status-change` | POST | `{ "id": string, "status": 0/1 }` |
| **Status Toggle (Bulk)**| `admin/training-status-change` | POST | `{ "ids": [string], "status": 0/1 }` |
| **Delete (Single)**| `admin/training-category-delete` | POST | `{ "_id": string }` |
| **Delete (Bulk)** | `admin/training-category-delete` | POST | `{ "ids": [string] }` |

**Upsert Payload (Add/Update):**
```json
{
  "category_name": "New Category",
  "priority": 5,
  "role": ["is_admin", "all"],
  "description": "<p>HTML Content</p>",
  "image": {
    "files": ["filename.png"],
    "path": "divine-infinity-being/lesson-images/",
    "bucket": "all-frontend-assets"
  },
  "status": 1,
  "created_by": "user_id_string",
  "_id": "6890..." // Only for Update
}
```

---

## 3. UI Sections & Functional Details

### 3.1 Training Category List Section
Displays a comprehensive table using `lib-listing` with the following columns:
1.  **Category Name**: The primary title of the training module.
2.  **Package Name**: The related package (`related_package_name`).
3.  **Priority**: Numeric display order.
4.  **Status**: Active/Inactive toggle.
5.  **Created On**: Displayed timestamp (`createdon_datetime`).

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint / Component |
| :--- | :--- | :--- |
| **Add Category** | Navigates to `admin-dashboard/training/training-category-add` | None |
| **Edit** | Navigates to `admin-dashboard/training/training-category-edit/:_id` | `admin/training-edit` (via edit resolver) |
| **Preview** | Opens `DialogTrainingPreviewComponent` | `admin/training-fetch` (inside modal) |
| **Status Toggle** | Updates status in real-time | `admin/training-status-change` |
| **Delete** | Triggers deletion for selection | `admin/training-category-delete` |

#### **Advanced Searching & Sorting**
-   **Text Search**: "Search By Category Name" (field: `category_name`).
-   **Select Search**: "Search By Status" (Active/Inactive).
-   **Date Search**: "Update On" date range (field: `updatedon_datetime`).
-   **Sorting**: Supports `category_name`, `priority`, `createdon_datetime`, `updatedon_datetime`, `status`.

---

## 4. Add/Edit Training Category Deep Dive (`/training-category-add` & `/training-category-edit/:_id`)

### 4.1 Initialization & Dynamic Data
Before rendering the form, the component performs several auxiliary API calls:
- **Role List**: `admin/fetch-role-list` (GET) - Populates the "Role" multi-select dropdown.
- **Package List**: `package/fetch-all-package` (GET) - Fetches the list of related packages (used for administrative mapping).
- **Edit Fetch** (Edit Mode Only): `admin/training-edit` (POST)
  - **Payload**: `{ "_id": string }`
  - **Purpose**: Pre-fills the form fields with existing category data.

### 4.2 Form Configuration & Fields
The form is built using a generic configuration with the following specifications:
1.  **Category Name**: `category_name` (Text, Required).
2.  **Priority**: `priority` (Number, Required) - Converted to integer on submission.
3.  **Role Selection**: `role` (Multi-select, Required) - Maps to the slugs returned by the Role API.
4.  **Description**: `description` (Rich Text Editor) - Uses CKEditor 4 with a customized toolbar including Image/Iframe support.
5.  **Thumbnail Upload**: `image` (File Upload).
    - **S3 Path**: `divine-infinity-being/lesson-images/`
    - **Bucket**: `all-frontend-assets`
    - **Request URL API**: `user-profile/request-bucket-url` (POST)
      - **Sample Payload**:
        ```json
        {
          "name": "1775126705821Screenshot.png",
          "type": "image/png",
          "path": "divine-infinity-being/lesson-images/",
          "bucket": "all-frontend-assets"
        }
        ```
    - **Delete Image API**: `user-profile/delete-image-from-bucket` (POST)
      - **Sample Payload**:
        ```json
        {
          "file": "1775126705821Screenshot.png",
          "path": "divine-infinity-being/lesson-images/",
          "bucket": "all-frontend-assets",
          "secret": "na",
          "token": ""
        }
        ```
6.  **Status**: `status` (Checkbox) - Defaults to 1 (Active) for new categories.

### 4.3 Form Submission & Navigation
- **Add Endpoint**: `admin/training-category-add`
- **Update Endpoint**: `admin/training-category-update`
- **Logic**:
  - Automatically parses `priority` to `parseInt()`.
  - Converts boolean status to `0` or `1`.
  - Post-submission, the user is redirected back to the primary category list (`admin-dashboard/training/training-category`) regardless of success or common error statuses.

---

## 5. Training Preview Dialog (`DialogTrainingPreviewComponent`)
When the **Preview** button is clicked, it opens a modal passing the `_id` of the category.
- **Internal API**: `admin/training-fetch`
- **Purpose**: Displays the hierarchical structure of the training (categories and lessons) in a read-only preview format.

---

## 5. Replication Checklist
To replicate this module:
1.  **Library Dependency**: Uses `lib-listing` for the table rendering.
2.  **Custom Listeners**: The Edit and Preview buttons are implemented as `type: 'listner'` in `libdata.custombuttons`. You must handle their logic in `listenLiblistingChange()`.
3.  **Endpoint Mapping**: Ensure `updateendpointmany` and `deleteendpointmany` are configured for bulk operations.
4.  **Date Alignment**: Search logic uses `updatedon_datetime` while display uses `createdon_datetime`.
