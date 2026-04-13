# Task 01: Contract Lineage Model for Base Agreements vs Amendments

## Goal

Introduce an explicit contract-lineage model so the system can distinguish between full agreements and amendments.

## Why This Is Needed

The current legal model treats every active document version as the current truth for a document type. That is too flat for amendment behavior.

The system needs to know whether a legal artifact is:

- a base agreement
- an amendment to a prior agreement
- a consolidated successor agreement for future signups

## Required Model

### 1. Contract lineage

Add a structure such as:

- `contract_families`
- `contract_versions`

where each version can be tagged as:

- `base`
- `amendment`
- `consolidated`

### 2. Parent relationship

Amendments should reference the agreement lineage they modify.

Example fields:

- `contract_family_id`
- `version_kind`
- `amends_version_id`

### 3. Applicability mode

Each version should declare whether it applies to:

- existing users only
- future users only
- all users from a specific date forward

### 4. Consolidation rule

When an amendment is later folded into a new consolidated agreement, new signups should sign the consolidated agreement only.

They should not need:

- base agreement
- then separate amendment

## Acceptance Criteria

- the system can tell base agreements apart from amendments
- future-user agreements can be consolidated without breaking historical amendment chains
