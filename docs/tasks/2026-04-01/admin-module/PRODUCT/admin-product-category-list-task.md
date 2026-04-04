# Task: Admin Product Category List Implementation

## Overview
Implement the product category list page for the admin module.

## Details
- **Route**: `admin/products/categories`
- **Source File**: `src/app/(admin)/admin/products/categories/page.tsx`

## API Endpoints
- **List API**: `product-category/product-category-list`
- **Count API**: `product-category/product-category-list-count`

## Payload Structure
The payload for both listing and counting remains consistent:
```json
 {
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "searchcondition": {},
  "sort": {
    "type": "desc",
    "field": "created_on"
  },
  "project": {},
  "token": ""
}
```

## Table Columns
| Column Name | Data Field | Requirements |
| :--- | :--- | :--- |
| **Category Name** | `title` | Show the `title` field. |
| **Image** | `image_generate_url` | Add an image column showcasing the category image. |
| **Created At** | `created_on` | Display `created_on` (Unix millis) in the format: `February 17 2025, 05:48 PM`. |

All other existing columns in the table should be preserved as they are.

## Additional Requirements
- **Proper Pagination**: Implement proper pagination using the `condition` object (limit and skip) based on the total count from `product-category-list-count`.
