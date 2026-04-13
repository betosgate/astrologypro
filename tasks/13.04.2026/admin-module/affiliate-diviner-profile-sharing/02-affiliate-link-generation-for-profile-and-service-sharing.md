# 02 Affiliate Link Generation for Profile and Service Sharing

## Goal

Define how affiliates generate links for:

- a diviner profile
- a specific diviner service

## Product Rule

Affiliate tooling should allow intentional sharing targets rather than one generic referral link only.

## Deliverables

- link-generation UX rules
- profile-share versus service-share selection rules
- permission checks for which diviners an affiliate may promote

## Status

Done.

The affiliate detail page at `src/app/dashboard/affiliates/[id]/page.tsx` now lets the diviner generate `general`, `diviner_profile`, and `diviner_service` referral links with destination previews and owned-service selection.
