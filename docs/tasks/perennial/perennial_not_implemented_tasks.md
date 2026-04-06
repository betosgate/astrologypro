# Perennial Not Implemented Tasks

## Purpose

This file contains a clean bullet-point list of Perennial tasks that are **not implemented** in the current project, based on comparison with the legacy Perennial MD and the current Next.js codebase.

Current project Perennial replacement area:

- `src/app/community/*`
- `src/app/api/community/*`
- `src/components/community/*`

---

## Access and Architecture Tasks Not Implemented

- Angular cookie-based Perennial login redirect logic
- Angular `AuthGuardService` Perennial guard flow
- legacy `perennial_mandalism_status === 'subscription running'` access model
- renewal fallback using `perennial_subscription_id`
- Angular `ResolveService` route preloading for Perennial screens

## Legacy Fetchers Not Implemented

- `user/fetch-membership-details`
- `user/perennial_mandalism_aditonal_member-details-fetch`
- `user/fetch-user-by-id`
- `user/add-aditonal-member`
- `user/update_perenial_memeber`
- `user/remove_perennial_mandalism_member`
- `/user/customer-astro-response-details-fetch`
- `content/content-list-for-frontend`
- `content/content-type-counts`
- `blogmanagement/list-for-front-end`
- `videomanagement/list-for-front-end`
- `cart_management/subscription-payment`
- `stripe/unsubscribe-stripe-Perennial`
- `/ritual-invocation/get-ritual-configuration-of-user`
- `ritual-invocation/ritual-list`
- `ritual-invocation/ritual-list-count`
- `ritual-invocation/add-ritual-configuration`
- `ritual-invocation/ritual-invocation-configure-list`

## Legacy Routes Not Implemented

- `/perennial-mandalism-dashboard`
- `/perennial-mandalism-dashboard/product/:_id`
- `/perennial-mandalism-dashboard/relationship-details`
- `/perennial-mandalism-dashboard/success`

## Subscription Tasks Not Implemented

- legacy Stripe payment modal flow for Perennial renewal
- payment-intent and setup-intent based Perennial subscription modal
- Perennial unsubscribe with confirmation flow
- cookie-based UI sync after subscription changes

## Chart and Astrology Tasks Not Implemented

- legacy horoscope deep-link launcher flow
- legacy `western_horoscope_v2` polling model
- legacy `tropical_transits_monthly_v3` polling model

## Content and Dashboard Tasks Not Implemented

- Perennial dashboard date-range content filtering matching legacy behavior
- legacy frontend blog fetcher flow
- legacy frontend video fetcher flow
- Perennial product detail page

## Ritual Tasks Not Implemented

- ritual media playback fetch pipeline from backend ritual config
- ritual video/media loading equivalent to old `ritual-invocation/ritual-invocation-configure-list`
- full legacy ritual playback backend integration

## Relationship and Navigation Tasks Not Implemented

- dedicated legacy relationship-details screen
- selected member summary and extra-info screen matching old relationship-details page
- legacy my-account deep-link route pattern

## Additional Member Tasks Partially Implemented But Not Fully Matching Legacy

- explicit deactivate-member flow matching old project
- separate add-member page route
- separate edit-member page route

## Ritual Tasks Partially Implemented But Not Fully Matching Legacy

- modal-based ritual creation entry flow
- full legacy ritual playback ordering and media assembly logic

## Chart Tasks Partially Implemented But Not Fully Matching Legacy

- old single fetcher-based chart readiness flow
- exact old polling architecture shared across natal and monthly outputs

---

## Summary

The current project has a rewritten Perennial experience under `/community`, but the items listed above are still missing or only partially matched compared with the older Perennial system.
