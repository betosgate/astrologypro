# Task 04: PDF Download and Rendering Standards

## Goal

Define a reliable downloadable format for signed agreements.

## Why This Is Needed

A legal download should not be a fragile screen scrape. It should be a stable, readable artifact suitable for records and support workflows.

## Required Standards

### 1. PDF contents

Include:

- agreement title
- version
- effective date
- signer identity
- accepted date/time
- rendered agreement body
- optional acceptance metadata footer

### 2. Visual standard

Use a clean legal-document layout, not a marketing page layout.

### 3. Source of rendering

Render from the stored signed snapshot, not the live template.

### 4. Regeneration policy

If PDF is generated on demand:

- the source snapshot must be immutable

If PDF is pre-generated and stored:

- artifact invalidation and storage policy must be documented

## Acceptance Criteria

- downloaded agreements are stable and human-readable
- PDF output reflects the signed artifact, not current template edits
