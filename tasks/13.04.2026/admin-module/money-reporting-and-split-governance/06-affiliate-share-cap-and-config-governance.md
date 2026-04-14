# Task 06: Affiliate Share Cap and Configuration Governance

## Goal

Implement the requested rule that diviners can choose affiliate shares, but only up to an admin-configured maximum, initially `60%`.

## Why This Is Needed

The repo already supports commission rules, but there is no single global cap policy enforced everywhere.

The requested business rule is specific:

- affiliate share comes from the diviner share
- diviner can choose the amount
- the amount cannot exceed the admin-configured max

## Required Configuration Model

### 1. Global platform setting

Add a field to platform settings such as:

- `max_diviner_affiliate_share_percent`

Initial value:

- `60`

### 2. Validation points

This cap must be enforced in all places that create or update affiliate commission rules:

- diviner self-service rule creation
- admin affiliate commission rule creation
- any background or migration logic that seeds rules

### 3. Percentage semantics

The cap applies to percentage-based commission rules on the diviner side.

If fixed-value rules are supported, the system should still ensure they cannot imply a payout larger than the allowed diviner-side share for the given order.

### 4. UI clarity

Diviner-facing rule forms should display:

- current maximum allowed percentage
- validation errors when exceeded

Admin-facing configuration should display:

- current cap
- when it was last changed
- who changed it

### 5. Rule resolution hierarchy

If there are multiple commission-rule layers, the selected effective rule must still obey the global cap.

No override path should silently bypass it unless product deliberately introduces a higher-trust admin super-override and documents it.

## Acceptance Criteria

- the affiliate-share cap is stored in configuration
- all rule creation/update flows enforce it
- the cap applies consistently regardless of which commission-rule surface is used

## Status

Done.

Implemented with:
- `supabase/migrations/20260413000198_affiliate_share_cap.sql`
- `src/lib/affiliate-share-cap.ts`
- `src/app/api/admin/platform-settings/route.ts`
- `src/app/admin/platform-settings/page.tsx`
- cap enforcement in main admin and diviner affiliate-rule routes
