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

## Status

Done.

`src/app/api/ref/[slug]/route.ts` now redirects profile links to `/{username}?ref={slug}` and service links to `/{username}/services/{slug}?ref={slug}`, while preserving click tracking and falling back cleanly when a target no longer resolves.
