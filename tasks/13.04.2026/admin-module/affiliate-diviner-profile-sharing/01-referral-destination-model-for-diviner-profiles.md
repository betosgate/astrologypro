# 01 Referral Destination Model for Diviner Profiles

## Goal

Extend the referral-link destination model so links can target diviner profiles, not only generic or package destinations.

## Current Gap

The current redirect route mainly resolves:

- homepage
- package destination

It needs a richer destination model such as:

- `diviner_profile`
- `diviner_service`
- `package`
- `homepage`

## Deliverables

- destination-type model
- profile and service target rules
- target-validation requirements

## Status

Done.

`affiliate_referral_links.product_type` now supports `diviner_profile` and `diviner_service`, with service-target validation enforced in both dashboard link-generation APIs.
