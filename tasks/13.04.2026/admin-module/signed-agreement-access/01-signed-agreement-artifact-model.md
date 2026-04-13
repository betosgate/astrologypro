# Task 01: Signed Agreement Artifact Model

## Goal

Introduce a stable signed-agreement artifact model so access and delivery operate on what was actually signed.

## Why This Is Needed

The current system stores:

- legal document
- version
- acceptance timestamp

That is not enough for robust access workflows if:

- templates change later
- dynamic fields are introduced
- admin or user needs the exact accepted copy

## Required Model

### 1. Agreement snapshot

Store or derive a signed artifact record containing:

- acceptance id
- user id
- document/template id
- rendered content snapshot
- rendered variable payload if applicable
- version
- content hash
- accepted_at

### 2. Download artifact pointer

Support either:

- generated-on-demand PDF from snapshot
- or persisted PDF artifact URL with regeneration policy

The key is that the source must be the snapshot, not the latest live template.

### 3. Email source of truth

Any emailed agreement should use the same snapshot and same artifact source as the download flow.

## Acceptance Criteria

- signed-agreement access is based on accepted snapshot data
- later document edits do not alter the signed artifact shown to the user
