# Master Task - Perennial Product Module Implementation - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: Product CRUD APIs, Category integration, Add/Edit Form UI, Product List with filters, Image Uploads
- Estimate: 3-5 days
- Task File: `tasks/perennial/2026-04-07/06-master-task-perennial-product-module.md`

## Objective

Implement a complete Product Management module for the Perennial dashboard that allows admins to create, edit, delete, and view products. This module must follow the specific field requirements and layout shared from the legacy project reference.

## Child Tasks

1. `06.1-product-api-crud-endpoints-and-schema.md`
2. `06.2-product-management-add-edit-form-ui.md`
3. `06.3-product-management-list-and-actions.md`

## Required Outcome

1. A robust API to handle Product creation and updates (unified), deletion, and fetching (List/Detail).
2. A high-fidelity "Add Product" form matching the shared UI reference with all required fields (MRP, Offer Price, Preorder Price, Category, etc.).
3. A comprehensive "Product List" table showing all products with status, priority, and actions.
4. Support for dual-image uploads (Main Image and Details Page Image).
5. Full CRUD functionality: Admin can create, edit, delete, and toggle visibility of products.

## Done Definition

- Product schema is defined in the database.
- CRUD APIs (POST/PUT, DELETE, GET) are functional and tested.
- "Product Add" and "Product Edit" forms capture all requested fields.
- Image upload handles both Main and Detail images correctly.
- Product list displays with the correct headers and responsive layout.
- Actions (Edit, Delete, View) are fully wired and working.

## Verification Gate

1. Open the Product Management list and verify all headers match the reference image.
2. Click "Add Product" and verify the form contains all 10+ requested fields and upload zones.
3. Create a product and verify it appears in the list with the correct details.
4. Edit the product and confirm the changes persist.
5. Delete a product and confirm it is removed from the database and UI.

## Notion Ready Summary

P1 Product Module: Implementation of a full CRUD system for Perennial products, including a complex add/edit form (MRP, pricing tiers, categories, dual-images) and a high-density management list, ensuring parity with the legacy project's feature set.
