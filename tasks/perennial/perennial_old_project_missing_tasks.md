# Perennial Old Project Missing Tasks

## Purpose

This file lists the Perennial tasks that were present in the old project but are **not implemented** in the current project.

Comparison:

- Old project: legacy Angular Perennial module
- Current project: Next.js community-based Perennial replacement under `/community`

---

## Fully Not Implemented Tasks

### Access and Architecture

- Cookie-based Perennial login redirect using `userinfo.user_type === 'is_Perennial_Mandalism'`
- Cookie-based Perennial login redirect using `userinfo.is_perennial_mandalism === 1`
- Angular `AuthGuardService` Perennial route protection
- Legacy subscription status guard using `perennial_mandalism_status === 'subscription running'`
- Renewal fallback access flow using `perennial_subscription_id`
- Angular `ResolveService` preloading for Perennial routes

### Legacy Fetchers

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

### Legacy Routes and Screens

- `/perennial-mandalism-dashboard`
- `/perennial-mandalism-dashboard/product/:_id`
- `/perennial-mandalism-dashboard/relationship-details`
- `/perennial-mandalism-dashboard/success`
- Dedicated Perennial product detail page
- Dedicated legacy relationship-details screen
- Legacy my-account deep-link route pattern

### Subscription and Billing

- Legacy Stripe payment modal flow for Perennial renewal
- Payment-intent based Perennial renewal modal
- Setup-intent based Perennial renewal modal
- Perennial unsubscribe with confirmation flow
- Cookie-based UI sync after subscription changes

### Charts and Astrology

- Legacy horoscope deep-link launcher flow
- Legacy `western_horoscope_v2` polling model
- Legacy `tropical_transits_monthly_v3` polling model

### Content and Dashboard

- Perennial dashboard date-range content filtering matching legacy behavior
- Legacy frontend blog fetcher flow
- Legacy frontend video fetcher flow

### Ritual System

- Ritual media playback fetch pipeline from backend ritual config
- Ritual media/video loading equivalent to old `ritual-invocation/ritual-invocation-configure-list`
- Full legacy ritual playback backend integration

### Relationship and Navigation

- Selected member summary and extra-info screen matching the old relationship-details page

---

## Partially Implemented But Not Fully Matching Old Project

### Additional Members

- Explicit deactivate-member flow matching the old project
- Separate add-member page route
- Separate edit-member page route

### Ritual Flow

- Modal-based ritual creation entry flow
- Full legacy ritual playback ordering and media assembly logic

### Chart Flow

- Old single-fetcher chart readiness flow
- Exact old polling architecture shared across natal and monthly outputs

---

## Count Summary

- Fully not implemented tasks: `44`
- Partially implemented but not fully matching old project: `7`
- Total listed gaps: `51`

---

## Summary

The current project has a Perennial replacement under `/community`, but it does not fully match the old project.

What is missing from the old project:

- old access and resolver architecture
- old fetcher set
- old route structure
- old subscription renewal and unsubscribe flow
- old ritual playback backend flow
- several old dedicated screens and UI patterns
