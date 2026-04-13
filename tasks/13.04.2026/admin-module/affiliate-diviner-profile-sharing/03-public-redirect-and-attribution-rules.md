# 03 Public Redirect and Attribution Rules

## Goal

Define how affiliate clicks land on diviner profiles while preserving attribution.

## Required Rule

Affiliate attribution must survive the redirect into:

- `/{username}`
- `/{username}/services/{slug}`

without breaking canonical public URLs.

## Deliverables

- redirect rules
- attribution persistence rules
- fallback behavior for invalid targets
