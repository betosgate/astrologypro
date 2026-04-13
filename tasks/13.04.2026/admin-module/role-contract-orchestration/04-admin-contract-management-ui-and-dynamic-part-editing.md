# Task 04: Admin Contract Management UI and Dynamic Part Editing

## Goal

Give admin a backend interface to manage both static legal text and dynamic contract variables easily.

## Why This Is Needed

The user requirement is explicit: admin must be able to manage dynamic parts like dates, name, company name, and similar values very easily.

The current admin legal tools manage documents, but they are not optimized for templated variable editing.

## Required Admin UX

### 1. Template editor

Admin should be able to manage:

- contract title
- static body text
- variable placeholders
- effective date
- activation state
- role assignments

### 2. Variable manager

For each template, admin should be able to define or edit:

- variable key
- display label
- data source
- fallback/default value
- whether it is required

### 3. Simple override UI

For organization-wide values like:

- company name
- legal address
- governing law
- support email
- standard effective date

admin should not have to edit raw markdown every time. These should be top-level editable settings or variable values.

### 4. Preview mode

Admin must be able to preview:

- raw template
- rendered contract with sample data
- rendered contract for a specific user/role if needed

## Acceptance Criteria

- admin can manage contracts from backend tools
- dynamic fields are editable without raw-text surgery for common changes
- previewing rendered output is easy before activation
