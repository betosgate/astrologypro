# Perennial Legacy Gap Audit

## Purpose

This audit compares the legacy Perennial MD description against the current Next.js project in this repository.

It focuses on:

- legacy fetchers that are no longer present
- legacy functionality that is no longer present
- legacy functionality that still exists, but only in a changed/reworked form

Current project reference area:

- `src/app/community/*`
- `src/app/api/community/*`
- `src/components/community/*`

Legacy Perennial route base from MD:

- `/perennial-mandalism-dashboard`

Current replacement route base:

- `/community`

---

## Audit Legend

| Status | Meaning |
| --- | --- |
| Missing | Legacy item is not present in the current project |
| Changed | Legacy item exists only as a rewritten or partial replacement |
| Present | Legacy item is effectively present in the current project |

---

## 1. Access Audit

| Legacy MD Item | Status | Current Project Notes | Current File / Route |
| --- | --- | --- | --- |
| Login redirect via `userinfo.user_type === 'is_Perennial_Mandalism'` | Missing | Current project does not use legacy cookie role logic | N/A |
| Login redirect via `userinfo.is_perennial_mandalism === 1` | Missing | Current project uses Supabase auth plus `community_members.membership_type` | [community layout](d:/Projects/Divine/astrologypro/src/app/community/layout.tsx) |
| Guard check via `AuthGuardService` | Missing | No Angular guard in current project | N/A |
| Guard check via `perennial_mandalism_status === 'subscription running'` | Missing | Replaced by `membership_status === "active"` | [community layout](d:/Projects/Divine/astrologypro/src/app/community/layout.tsx) |
| Renewal fallback when `perennial_subscription_id` exists | Missing | No equivalent Perennial renewal guard found | N/A |
| Resolver-level access via `ResolveService` | Missing | Current project uses server-side Supabase queries and client `fetch()` | N/A |
| Protected access for active Perennial users | Present | Present, but implemented through community membership status | [community layout](d:/Projects/Divine/astrologypro/src/app/community/layout.tsx) |

---

## 2. Legacy Fetcher Audit

### 2.1 Membership and User Fetchers

| Legacy Fetcher | Status | Current Replacement / Notes | Current File |
| --- | --- | --- | --- |
| `user/fetch-membership-details` | Missing | Replaced by direct Supabase reads from `community_members` | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| `user/perennial_mandalism_aditonal_member-details-fetch` | Missing | Replaced by `/api/community/family` and `community_family_members` | [family API](d:/Projects/Divine/astrologypro/src/app/api/community/family/route.ts) |
| `user/fetch-user-by-id` | Missing | No direct Perennial equivalent found | N/A |
| `user/add-aditonal-member` | Missing | Replaced by `POST /api/community/family` | [family API](d:/Projects/Divine/astrologypro/src/app/api/community/family/route.ts) |
| `user/update_perenial_memeber` | Missing | Replaced by `PATCH /api/community/family/[id]` | [family item API](d:/Projects/Divine/astrologypro/src/app/api/community/family/[id]/route.ts) |
| `user/remove_perennial_mandalism_member` | Missing | Replaced by `DELETE /api/community/family/[id]` | [family item API](d:/Projects/Divine/astrologypro/src/app/api/community/family/[id]/route.ts) |

### 2.2 Astrology and Chart Fetchers

| Legacy Fetcher | Status | Current Replacement / Notes | Current File |
| --- | --- | --- | --- |
| `/user/customer-astro-response-details-fetch` | Missing | Replaced by explicit natal generation and summary polling APIs | [generate natal API](d:/Projects/Divine/astrologypro/src/app/api/community/generate-natal/route.ts) |
| `astro_toolkit_tab: "western_horoscope_v2"` polling flow | Missing | No exact fetcher/tab model in current project | N/A |
| `astro_toolkit_tab: "tropical_transits_monthly_v3"` polling flow | Missing | Replaced by `monthly_transits` table and cron generation | [monthly transits cron](d:/Projects/Divine/astrologypro/src/app/api/cron/monthly-transits/route.ts) |

### 2.3 Content and Resource Fetchers

| Legacy Fetcher | Status | Current Replacement / Notes | Current File |
| --- | --- | --- | --- |
| `content/content-list-for-frontend` | Missing | Replaced by direct Supabase reads from `mandalism_content` | [resources page](d:/Projects/Divine/astrologypro/src/app/community/resources/page.tsx) |
| `content/content-type-counts` | Missing | Count logic is done directly in dashboard code | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| `blogmanagement/list-for-front-end` | Missing | Replaced by direct reads from `blog_posts` | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| `videomanagement/list-for-front-end` | Missing | No exact Perennial frontend video fetcher equivalent found | N/A |

### 2.4 Subscription Fetchers

| Legacy Fetcher | Status | Current Replacement / Notes | Current File |
| --- | --- | --- | --- |
| `cart_management/subscription-payment` | Missing | Replaced by `POST /api/community/checkout` using Stripe Checkout | [community checkout API](d:/Projects/Divine/astrologypro/src/app/api/community/checkout/route.ts) |
| `stripe/unsubscribe-stripe-Perennial` | Missing | No member-facing Perennial unsubscribe API found in current project | N/A |

### 2.5 Ritual Fetchers

| Legacy Fetcher | Status | Current Replacement / Notes | Current File |
| --- | --- | --- | --- |
| `/ritual-invocation/get-ritual-configuration-of-user` | Missing | Replaced by `GET /api/community/rituals/[id]` | [ritual detail API](d:/Projects/Divine/astrologypro/src/app/api/community/rituals/[id]/route.ts) |
| `ritual-invocation/ritual-list` | Missing | Replaced by `GET /api/community/rituals` | [rituals API](d:/Projects/Divine/astrologypro/src/app/api/community/rituals/route.ts) |
| `ritual-invocation/ritual-list-count` | Missing | No separate count fetcher; list is loaded directly | [rituals page](d:/Projects/Divine/astrologypro/src/app/community/rituals/page.tsx) |
| `ritual-invocation/add-ritual-configuration` | Missing | Replaced by `POST /api/community/rituals` | [rituals API](d:/Projects/Divine/astrologypro/src/app/api/community/rituals/route.ts) |
| `ritual-invocation/ritual-invocation-configure-list` | Missing | No equivalent ritual media/config playback fetcher found | N/A |

---

## 3. Legacy Route Audit

| Legacy Route | Status | Current Replacement / Notes | Current File / Route |
| --- | --- | --- | --- |
| `/perennial-mandalism-dashboard` | Missing | Replaced by `/community` for Perennial members | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| `/perennial-mandalism-dashboard/product/:_id` | Missing | No direct Perennial product detail replacement found | N/A |
| `/perennial-mandalism-dashboard/ritual-result/:_id` | Changed | Replaced by `/community/rituals/[id]` | [ritual detail page](d:/Projects/Divine/astrologypro/src/app/community/rituals/[id]/page.tsx) |
| `/perennial-mandalism-dashboard/my-rituals` | Changed | Replaced by `/community/rituals` | [rituals page](d:/Projects/Divine/astrologypro/src/app/community/rituals/page.tsx) |
| `/perennial-mandalism-dashboard/additional_member` | Changed | Replaced by `/community/family` | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| `/perennial-mandalism-dashboard/add-member` | Changed | Member creation is inside `/community/family` UI instead of separate route | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| `/perennial-mandalism-dashboard/add-member/:_id` | Changed | Replaced by inline edit form and `/community/family/[id]` chart page | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| `/perennial-mandalism-dashboard/relationship-details` | Missing | No exact route; closest replacement is `/community/charts` | [charts page](d:/Projects/Divine/astrologypro/src/app/community/charts/page.tsx) |
| `/perennial-mandalism-dashboard/success` | Missing | No Perennial success page equivalent found | N/A |

---

## 4. Functionality Audit

### 4.1 Membership Dashboard Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Load membership summary | Present | Present via `community_members` query | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| Show subscription-related info | Present | Present via membership status and expiry fields | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| Show member-related counts/details | Present | Present, including family preview and content counts | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| Show dashboard-level resources/content | Present | Present | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |

### 4.2 Additional Member Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Fetch additional members | Present | Present as family member list | [family API](d:/Projects/Divine/astrologypro/src/app/api/community/family/route.ts) |
| Show relationship and member cards | Present | Present in family page and dashboard preview | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| Add member | Present | Present | [family API](d:/Projects/Divine/astrologypro/src/app/api/community/family/route.ts) |
| Edit member | Present | Present | [family item API](d:/Projects/Divine/astrologypro/src/app/api/community/family/[id]/route.ts) |
| Deactivate or remove member | Changed | Remove exists; explicit legacy-style deactivate flow not found | [family item API](d:/Projects/Divine/astrologypro/src/app/api/community/family/[id]/route.ts) |

### 4.3 Astrology and Chart Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Load natal chart output | Present | Present | [family member page](d:/Projects/Divine/astrologypro/src/app/community/family/[id]/page.tsx) |
| Load monthly transit chart output | Present | Present, but see transit schema mismatch risk | [transits page](d:/Projects/Divine/astrologypro/src/app/community/transits/page.tsx) |
| Poll until chart data becomes available | Changed | Summary polling exists through `/api/community/astro-charts`, not legacy fetcher | [astro charts section](d:/Projects/Divine/astrologypro/src/components/community/astro-charts-section.tsx) |
| Open full horoscope result in a new tab | Missing | No equivalent legacy deep-link flow found | N/A |

### 4.4 Content and Resource Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Load frontend content blocks | Present | Present via `mandalism_content` | [resources page](d:/Projects/Divine/astrologypro/src/app/community/resources/page.tsx) |
| Load content counts | Present | Present in dashboard | [community page](d:/Projects/Divine/astrologypro/src/app/community/page.tsx) |
| Filter content by date range | Missing | No Perennial dashboard date-range filter found | N/A |
| Support file, video, and embed content display | Present | Present | [resources page](d:/Projects/Divine/astrologypro/src/app/community/resources/page.tsx) |

### 4.5 Account and Navigation Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Navigate to relationship-details page | Missing | Replaced conceptually by `/community/charts`, but no exact route | [charts page](d:/Projects/Divine/astrologypro/src/app/community/charts/page.tsx) |
| Navigate to add-member page | Changed | Add member happens inline on `/community/family` | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| Navigate to member-edit page | Changed | Edit also happens inline on `/community/family` | [family page](d:/Projects/Divine/astrologypro/src/app/community/family/page.tsx) |
| Navigate to my-account details page | Missing | Community shell only links to `/account`; no legacy detail route equivalent found | [community layout](d:/Projects/Divine/astrologypro/src/app/community/layout.tsx) |

### 4.6 Subscription Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Start subscription or renewal | Present | Present via checkout session creation | [community checkout API](d:/Projects/Divine/astrologypro/src/app/api/community/checkout/route.ts) |
| Open Stripe payment modal | Missing | Current project redirects to Stripe Checkout instead | N/A |
| Support payment-intent and setup-intent flow | Missing | No member-facing modal PI/SI flow found | N/A |
| Unsubscribe with confirmation | Missing | No Perennial unsubscribe flow found | N/A |
| Keep UI state in sync with updated subscription cookie data | Missing | No legacy cookie sync model exists | N/A |

### 4.7 Ritual Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Open ritual creation modal | Changed | Ritual creation is a page, not modal | [ritual create page](d:/Projects/Divine/astrologypro/src/app/community/rituals/new/page.tsx) |
| Create standard ritual presets | Present | Present | [ritual create page](d:/Projects/Divine/astrologypro/src/app/community/rituals/new/page.tsx) |
| Create dynamic ritual by selecting planets and zodiac signs | Present | Present | [ritual create page](d:/Projects/Divine/astrologypro/src/app/community/rituals/new/page.tsx) |
| Save ritual configuration | Present | Present | [rituals API](d:/Projects/Divine/astrologypro/src/app/api/community/rituals/route.ts) |
| Show ritual list and history | Present | Present | [rituals page](d:/Projects/Divine/astrologypro/src/app/community/rituals/page.tsx) |
| Open ritual result page | Present | Present | [ritual detail page](d:/Projects/Divine/astrologypro/src/app/community/rituals/[id]/page.tsx) |
| Load ritual media and videos | Missing | No ritual media playback/config fetcher equivalent found | N/A |
| Sort ritual sequence | Present | Present at a simpler tag-sequence level | [ritual detail page](d:/Projects/Divine/astrologypro/src/app/community/rituals/[id]/page.tsx) |
| Support dynamic ritual start flow | Present | Present in simplified form | [ritual detail page](d:/Projects/Divine/astrologypro/src/app/community/rituals/[id]/page.tsx) |

### 4.8 Relationship Details Functionality

| Legacy Functionality | Status | Current Project Notes | Current File |
| --- | --- | --- | --- |
| Fetch additional members again for relationship view | Changed | Relationship chart page loads family members | [relationship charts API](d:/Projects/Divine/astrologypro/src/app/api/community/relationship-charts/route.ts) |
| Map members into simplified display model | Changed | Different UI model, but relationship pair display exists | [charts page](d:/Projects/Divine/astrologypro/src/app/community/charts/page.tsx) |
| Show selected member summary and extra info | Missing | No exact legacy relationship-details screen found | N/A |

---

## 5. Missing Legacy Fetchers Summary

These legacy fetchers are not present in the current project as named:

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

---

## 6. Missing Legacy Functionality Summary

These legacy behaviors from the old Perennial system are not present in the current project:

- Angular cookie-based Perennial login redirect logic
- Angular `AuthGuardService` Perennial subscription guard logic
- Angular `ResolveService` Perennial preloading flow
- legacy `/perennial-mandalism-dashboard/*` route structure
- Perennial product detail page
- legacy relationship-details page
- legacy my-account deep-link route pattern
- Stripe modal renewal/payment-intent/setup-intent flow
- Perennial unsubscribe flow
- legacy horoscope deep-link launcher flow
- ritual media/video playback fetch pipeline from ritual backend config
- date-range dashboard content filtering matching old frontend behavior

---

## 7. Final Conclusion

The current project contains a rewritten Perennial experience under `/community`, but it is **not a 1:1 migration** of the legacy Angular Perennial module.

What still exists in some form:

- protected Perennial access
- membership dashboard
- family/additional-member management
- natal chart generation
- relationship chart generation
- monthly transit reporting
- ritual creation/list/view
- resources and content pages
- subscription checkout

What is missing from the old project:

- almost all legacy fetcher names
- the old Angular access/resolver architecture
- the old Stripe renewal/unsubscribe flow
- several old dedicated routes/screens
- the old ritual media/config playback backend flow

This means the current project should be treated as a **new implementation with partial business continuity**, not as an exact feature parity copy of the old Perennial system.

---

## 8. Not Implemented Task List

Below is the simplified bullet-list of Perennial tasks that are **not implemented** in the current project, based on the legacy MD comparison.

### Access and Architecture Tasks Not Implemented

- Angular cookie-based Perennial login redirect logic
- Angular `AuthGuardService` Perennial guard flow
- legacy `perennial_mandalism_status === 'subscription running'` guard model
- renewal fallback using `perennial_subscription_id`
- Angular `ResolveService` route preloading for Perennial screens

### Legacy Fetchers Not Implemented

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

### Legacy Routes Not Implemented

- `/perennial-mandalism-dashboard`
- `/perennial-mandalism-dashboard/product/:_id`
- `/perennial-mandalism-dashboard/relationship-details`
- `/perennial-mandalism-dashboard/success`

### Subscription Tasks Not Implemented

- legacy Stripe payment modal flow for Perennial renewal
- payment-intent and setup-intent based Perennial subscription modal
- Perennial unsubscribe with confirmation flow
- cookie-based UI sync after subscription changes

### Chart and Astrology Tasks Not Implemented

- legacy horoscope deep-link launcher flow
- legacy `western_horoscope_v2` polling model
- legacy `tropical_transits_monthly_v3` polling model

### Content and Dashboard Tasks Not Implemented

- Perennial dashboard date-range content filtering matching legacy behavior
- legacy frontend blog fetcher flow
- legacy frontend video fetcher flow
- Perennial product detail page

### Ritual Tasks Not Implemented

- ritual media playback fetch pipeline from backend ritual config
- ritual video/media loading equivalent to old `ritual-invocation/ritual-invocation-configure-list`
- full legacy ritual playback backend integration

### Relationship and Navigation Tasks Not Implemented

- dedicated legacy relationship-details screen
- selected member summary and extra-info screen matching old relationship-details page
- legacy my-account deep-link route pattern

### Additional Member Tasks Partially Implemented But Not Fully Matching Legacy

- explicit deactivate-member flow matching old project
- separate add-member page route
- separate edit-member page route

### Ritual Tasks Partially Implemented But Not Fully Matching Legacy

- modal-based ritual creation entry flow
- full legacy ritual playback ordering and media assembly logic

### Chart Tasks Partially Implemented But Not Fully Matching Legacy

- old single fetcher-based chart readiness flow
- exact old polling architecture shared across natal and monthly outputs
