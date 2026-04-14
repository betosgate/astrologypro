# 05 Reporting Governance and Canonical URL Rules

## Goal

Ensure affiliate profile sharing is measurable without creating SEO or analytics confusion.

## Required Reporting

Reporting should distinguish:

- profile-share clicks
- service-share clicks
- homepage or generic referral clicks

## Canonical Rule

Referral params and redirects must not create competing canonical public URLs.

## Deliverables

- reporting dimensions
- canonical URL rules
- analytics breakdown for affiliate profile traffic

## Status

Done.

Reporting already distinguishes link intent through `affiliate_referral_links.product_type`, and the redirect layer now lands on canonical public profile or service URLs with only the `ref` attribution param added.
