# Product Management Route Study (`/product/management`)

This document provides a technical specification for the Product Management interface, detailing API interactions, UI sections, and complex functional logic.

---

## 1. Route Configuration & Initialization
- **Path**: `/product/management`
- **Associated Component**: `ManagementListComponent`
- **Module**: `ProductModule`
- **Resolver**: `ResolveService`
  - **Endpoint**: `product-management/product-management-list`
  - **Purpose**: Fetches the initial list of products for the management table.
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
| **Product List** | `product-management/product-management-list` | POST | `{ "condition": { "limit": 10, ... }, ... }` | `{ "results": { "res": [ ... ] } }` |
| **Product Count**| `product-management/product-management-list-count` | POST | Same as List Payload | `{ "count": number }` |

### 2.2 Management Actions (API Driven)
| Action | Endpoint | Method | Payload |
| :--- | :--- | :--- | :--- |
| **Status Toggle** | `product-management/product-management-update` | POST | `{ "data": { "_id": string, "status": integer } }` |
| **Set Visibility** | `product-management/set-the-visibility` | POST | `{ "_id": string, "is_visible": boolean }` |
| **Delete (Single)**| `product-management/product-management-delete` | POST | `{ "_id": string }` |

---

## 3. UI Sections & Functional Details

### 3.1 Product Management List Section
Displays a comprehensive table of products with the following columns:
1.  **Name**: internal name.
2.  **Product Name**: Display name.
3.  **Offer Price**: Current sale price.
4.  **Preorder Price**: Price for pre-orders.
5.  **Status**: Active/Inactive toggle.
6.  **Priority**: Display order.
7.  **Visible**: Public visibility status.
8.  **Created On**: Formatted timestamp (`MMMM D YYYY, hh:mm A`).
9.  **Updated On**: Formatted timestamp (`MMMM D YYYY, hh:mm A`).

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint |
| :--- | :--- | :--- |
| **Add Product** | Navigates to `product/management-add` | None |
| **Edit** | Navigates to `product/product-management_edit/:_id` | `product-management/product-management-fetch` (via edit resolver) |
| **Customer Visibility**| Opens Visibility Modal (Admin only) | `product-management/set-the-visibility` (POST) |
| **Delete** | Triggers confirmation and deletion | `product-management/product-management-delete` |

#### **Advanced Searching & Sorting**
-   **Text Search**: "Search By Image Name" (field: `name`).
-   **Select Search**: "Search By Status" (Active/Inactive).
-   **Date Search**: Filters by `created_on` or `updated_on`.
-   **Sorting**: Supports `name`, `product_name`, `offer_price`, `preorder_price`, `priority`, `status`, `is_visible`, `created_on`, `updated_on`.

---

## 4. Add/Edit Product Deep Dive (`/product/management-add` & `/product-management_edit/:_id`)

### 4.1 Dynamic Form Implementation
- **Base Fields**: Name, Description, MRP, Offer Price, Preorder Price, Priority, Category (Select), Status.
- **Conditional Logic**: If the selected Category is "Tarrot", the form dynamically injects two additional select fields:
  1.  **Main Category**
  2.  **Sub Category**
- **Dynamic Field API**: `product-category/fetch-category-all` (GET) - Used to populate the Category, Main Category, and Sub Category dropdowns.

### 4.2 Image Upload Configuration (Multi-field)
The product management uses two distinct file upload fields:
1.  **Upload Image** (`image`): Multiple files supported.
2.  **Details Page Upload Image** (`detail_page_image`): Multiple files supported.

**Shared Image Logic:**
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

---

## 5. Replication Checklist
To replicate this module:
1.  **Admin Check**: The "Customer Visibility" button must be conditionally rendered based on `user_type === 'is_admin'`.
2.  **Dynamic Rendering**: implement an observer for the `category_id` field to trigger the injection of sub-category fields when "Tarrot" (by name matching) is selected.
3.  **Multi-Image Handling**: Ensure the form logic supports `multiple: true` for both product images and detail page images.
4.  **Bulk Deletion**: Ensure `deleteendpointmany` is configured pointing to the deletion endpoint for batch processing.
