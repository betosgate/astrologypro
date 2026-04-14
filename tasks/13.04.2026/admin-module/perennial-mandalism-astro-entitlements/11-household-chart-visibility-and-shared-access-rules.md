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

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000188_household_chart_visibility.sql`

### Helper function
**`get_household_member_id() → UUID`** (SQL, STABLE, SECURITY DEFINER)
- Returns the `community_members.id` for the current auth user via two paths:
  1. Primary path: `community_members.user_id = auth.uid()`
  2. Household path: `community_family_members.user_id = auth.uid() AND invite_status = 'accepted'`
- Used in all household-aware RLS policies to keep them DRY

### RLS policy changes

#### `community_family_members`
- Dropped: `member_own_family` (FOR ALL) — replaced with four separate policies
- Added: `household_read_family_members` (SELECT) — uses `get_household_member_id()`
- Added: `primary_insert_family_members` (INSERT) — primary owner only
- Added: `primary_update_family_members` (UPDATE) — primary owner only
- Added: `primary_delete_family_members` (DELETE) — primary owner only

#### `relationship_charts`
- Dropped: `member_own_relationship_charts` (FOR ALL)
- Added: `household_read_relationship_charts` (SELECT) — uses `get_household_member_id()`
- Added: `primary_insert_relationship_charts`, `primary_update_relationship_charts`, `primary_delete_relationship_charts`

#### `monthly_transits`
- Dropped: `member_own_transits` (SELECT)
- Added: `household_read_monthly_transits` (SELECT) — uses `get_household_member_id()` via family member lookup

### Access matrix
| User type | Read natal charts | Read relationship charts | Read monthly transits | Write any chart |
|-----------|------------------|--------------------------|----------------------|-----------------|
| Primary owner | ✅ all household | ✅ all household | ✅ all household | ✅ |
| Accepted household user | ✅ all household | ✅ all household | ✅ all household | ❌ |
| Pending invite (not accepted) | ❌ | ❌ | ❌ | ❌ |
| Other households | ❌ | ❌ | ❌ | ❌ |

### Future extension points
- Per-profile privacy flags: add `is_chart_private BOOLEAN` to `community_family_members` and AND it into the household read policies
- Adult vs child visibility: add `visible_to_household BOOLEAN` per profile
- Consent gating: add a `household_consent_given_at` column and require it in the policy
