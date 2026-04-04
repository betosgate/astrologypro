# Product Category List Route Study (`/product/category`)

This document provides a technical specification for the Product Category management interface, detailing API interactions, UI sections, and functional logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/product/category`
- **Associated Component**: `ProductCategoryListComponent`
- **Module**: `ProductModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `product-category/product-category-list`
  - **Purpose**: Fetches the initial list of categories for the table.
  - **Payload**:
    ```json
    {
      "condition": { "limit": 10, "skip": 0 },
      "searchcondition": {},
      "sort": { "type": "desc", "field": "created_on" },
      "project": {},
      "token": ""
    }
    ```

---

## 2. Core API Endpoints

### 2.1 Initialization & Global Data
| Feature | Endpoint | Method | Payload | Key Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Category List** | `product-category/product-category-list` | POST | `{ "condition": { "limit": 10, ... }, ... }` | `{ "results": { "res": [ ... ] } }` |
| **Category Count**| `product-category/product-category-list-count` | POST | Same as List Payload | `{ "count": number }` |

### 2.2 Management Actions (API Driven)
| Action | Endpoint | Method | Payload |
| :--- | :--- | :--- | :--- |
| **Status Toggle** | `product-category/product-category-update` | POST | `{ "data": { "_id": string, "status": integer } }` |
| **Delete (Single)**| `product-category/product-category-delete` | POST | `{ "_id": string }` |
| **Delete (Bulk)** | `product-category/product-category-deletemany` | POST | `{ "ids": [string] }` |

---

## 3. UI Sections & Functional Details

### 3.1 Product Category List Section
Displays a comprehensive table of product categories with the following columns:
1.  **Image**: Displays the category icon/image using `image_generate_url`.
2.  **Title**: The display name of the category.
3.  **Description**: A short summary of what the category contains.
4.  **Status**: Active/Inactive toggle.
5.  **Priority**: Numeric order for category display.
6.  **Created On**: Formatted timestamp (`MMMM D YYYY, hh:mm A`).
7.  **Updated On**: Formatted timestamp (`MMMM D YYYY, hh:mm A`).

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint |
| :--- | :--- | :--- |
| **Add Category** | Navigates to `product/category-add` | None |
| **Edit** | Navigates to `product/product-category_edit/:_id` | `product-category/product-category-fetch` (via edit resolver) |
| **Delete** | Triggers confirmation modal and deletion | `product-category/product-category-delete` |
| **Status Toggle** | Updates status in real-time | `product-category/product-category-update` |

#### **Advanced Searching & Sorting**
-   **Text Search**: "Search By Image Title" (field: `title`).
-   **Select Search**: "Search By Status" (Active/Inactive).
-   **Date Search**:
    -   "Search By Created On" (field: `created_on`).
    -   "Search By Update On" (field: `updated_on`).
-   **Sorting**:
    -   Supported fields: `title`, `priority`, `description`, `created_on`, `updated_on`.
    -   Default: `created_on` (DESC).

---

## 4. Add/Edit Category Deep Dive (`/product/category-add` & `/product-category_edit/:_id`)

### 4.1 Form Implementation & Image Management
- **Fields**:
  - `title` (Text, Required)
  - `description` (Textarea, Required)
  - `priority` (Number, Required)
  - `status` (Select: Active/Inactive)
  - `image` (File Upload)

- **Image Upload Logic**:
  - **Bucket Name**: `all-frontend-assets`
  - **Path**: `divine-infinity-being/packages-image/`
  - **Request URL API**: `user-profile/request-bucket-url` (POST)
    - **Sample Payload**:
      ```json
      {
        "name": "1775126705821Screenshot.png",
        "type": "image/png",
        "path": "divine-infinity-being/packages-image/",
        "bucket": "all-frontend-assets"
      }
      ```
  - **Delete Image API**: `user-profile/delete-image-from-bucket` (POST)
    - **Sample Payload**:
      ```json
      {
        "file": "1775126705821Screenshot.png",
        "path": "divine-infinity-being/packages-image/",
        "bucket": "all-frontend-assets",
        "secret": "na",
        "token": ""
      }
      ```

### 4.2 Submission Logic
- **Add Mode**: `product-category/product-category-add` (POST)
- **Edit Mode**: `product-category/product-category-update` (POST)
- **Payload Extension**: Automatically appends `created_by` from the logged-in user's cookie data.

---

## 5. Replication Checklist
To replicate this module:
1.  **Library Dependency**: Uses `lib-listing` for the table and `lib-form` for the add/edit pages.
2.  **Date Pipes**: Uses `MMMM D YYYY, hh:mm A` for timestamp formatting strings.
3.  **Image Resolution**: The `image_generate_url` field is expected in the data to render the category images.
4.  **Bulk Actions**: Requires UI support for multiple selection to trigger the `deletemany` endpoint.
5.  **User Context**: Reaches out to `login_user_details` cookie for the `created_by` field during data submission.
