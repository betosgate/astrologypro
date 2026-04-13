# 11 Household Chart Visibility and Shared Access Rules

## Goal

Define the visibility rules for natal charts, relationship charts, and family-dynamic outputs inside a shared Perennial Mandalism household.

## Product Rule

The visibility model must support:

- the main or primary user can see other household users' charts
- users under the same primary household can see each other's charts

This should be treated as an intentional household-sharing model, not an accidental side effect of broad access.

## Current Repo Grounding

The current family and relationship model is already household-oriented:

- `community_members`
- `community_family_members`
- `relationship_charts`
- `monthly_transits`

The current community charts experience already loads family members and pairwise charts from a household context:

- `src/app/community/charts/page.tsx`

This suggests the UX is already family-centric, but the authorization and product rules need to be made explicit.

## Required Visibility Model

### Primary user access

The primary household user should be able to see:

- their own natal chart
- every eligible household member natal chart
- all relationship charts within that household
- derived family-dynamic summaries
- household monthly transits where product allows household-level viewing

### Secondary household user access

Users under the same household should be able to see:

- their own natal chart
- other household users' natal charts
- shared relationship charts within the same household
- family-dynamic summaries

## Important Product Decision

This is a shared-household astrology model.

That means natal charts are not private by default within the same subscribed household unless product explicitly adds consent or visibility controls later.

If the business wants stronger privacy later, the architecture should leave room for:

- per-profile privacy flags
- adult-versus-child visibility rules
- consent gating for shared household viewing

## Recommended MVP Rule

For now:

- all users linked to the same household can see the same household chart set

This matches the request most directly and keeps the experience coherent.

## Data Ownership Rule

Visibility must still be constrained by household boundary.

That means:

- no cross-household access
- no exposure to unrelated community members
- admin-only cross-household access remains separate

## Artifact-Level Rules

### Natal charts

Visible to:

- primary user
- all authenticated users linked to the same household

### Relationship charts

Visible to:

- primary user
- all authenticated users linked to the same household

### Monthly transits

Recommended MVP:

- visible to the same household audience as natal charts

If product later wants person-specific privacy for transits, this can be narrowed, but that is not the current requirement.

## Deliverables

- household chart visibility matrix
- primary versus secondary access rules
- same-household authorization requirements
- future extension notes for privacy or consent controls
