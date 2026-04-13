# Affiliate Diviner Profile Sharing Pack

## Objective

Define the product model so affiliates can share diviner profile pages directly, not only signup or generic referral destinations.

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing referral-link infrastructure

The repo already has affiliate referral links and public redirect handling through:

- `src/app/api/ref/[slug]/route.ts`
- `affiliate_referral_links`

Current behavior:

- affiliate links resolve a slug
- clicks are tracked
- destination is currently limited mainly to homepage or package destination

### Existing public diviner profiles

The repo already has public diviner profile pages at:

- `src/app/[username]/page.tsx`

This makes diviner profiles a strong share target for affiliates.

## Product Direction

Affiliates should be able to share:

- diviner profile pages
- diviner service pages
- other supported referral destinations where allowed

The system should track those shares with the same affiliate attribution model instead of forcing everything through one generic landing.

## Workstreams

1. `01-referral-destination-model-for-diviner-profiles.md`
2. `02-affiliate-link-generation-for-profile-and-service-sharing.md`
3. `03-public-redirect-and-attribution-rules.md`
4. `04-affiliate-dashboard-share-tools-and-ux.md`
5. `05-reporting-governance-and-canonical-url-rules.md`

## Acceptance Standard

This feature set is complete only when:

- affiliates can generate share links for diviner profiles
- attribution survives the redirect into the public profile or service flow
- affiliate sharing works for both profile-level and service-level destinations where permitted
- reporting can distinguish profile-share traffic from other affiliate traffic
