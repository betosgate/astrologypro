# Task 01: Contract Template and Variable Model

## Goal

Move from simple legal document blobs to contract templates with structured dynamic variables.

## Why This Is Needed

The current `legal_documents` model stores content by document type and version. That works for static policies, but it is not enough for contracts that need dynamic insertions such as:

- user full name
- company name
- effective date
- role title
- payout terms
- platform fee percentage
- governing entity name

## Required Data Model

### 1. Contract template entity

Introduce a contract-template layer such as:

- `contract_templates`

Recommended fields:

- `contract_key`
- `title`
- `role_scope`
- `template_body`
- `summary_text`
- `is_active`
- `version`
- `effective_date`

### 2. Dynamic variable definitions

Introduce a variable schema such as:

- `contract_template_variables`

Recommended fields:

- `template_id`
- `variable_key`
- `label`
- `source_type`
- `default_value`
- `is_required`
- `help_text`

### 3. Source types

Support variable sources like:

- system setting
- role profile field
- user profile field
- admin-specified override
- runtime generated value

### 4. Rendered contract snapshot

When a user is shown a contract, store the rendered snapshot, not just the template reference.

That avoids later disputes when the underlying template changes.

## Acceptance Criteria

- contracts can contain placeholders safely
- dynamic variables are structured and manageable
- rendered contracts can be snapshotted and audited
