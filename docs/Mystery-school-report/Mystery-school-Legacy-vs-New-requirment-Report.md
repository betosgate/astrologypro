# Mystery School Legacy Coverage vs New Team Assignment Report

## Purpose

This report focuses only on one question:

> From the **legacy Mystery School implementation**, which items are **covered in the new team assignment requirements**, which are **partially covered**, and which **legacy items are not explicitly covered** in the new requirement document.

### Source Files
- Legacy Mystery School architecture / audit / analysis: :contentReference[oaicite:0]{index=0}
- New team module assignment requirements: :contentReference[oaicite:1]{index=1}

---

# 1. Summary View

| Category | Meaning |
|---|---|
| Covered in New Requirements | The legacy capability is clearly represented in the new team assignment file |
| Partially Covered | The legacy capability is represented conceptually, but not fully or not in the same form |
| Not Covered in New Requirements | The legacy capability existed in the old project report, but is not clearly mentioned in the new team assignment file |

---

# 2. Legacy Mystery School Scope vs New Team Assignment Coverage

| Legacy Mystery School Item | Legacy Had It? | Covered in New Team Assignment? | Coverage Status | Notes |
|---|---|---|---|---|
| Mystery School paid signup / onboarding flow | Yes | Yes | Covered | New requirements include Mystery School enrollment and pricing flow |
| Stripe-based Mystery School subscription flow | Yes | Yes | Covered | New requirements mention Mystery School enrollment payment/subscription model |
| Subscription success / activation flow | Yes | Yes | Partially Covered | Payment activation is implied, but old success-page flow is not described in the same technical detail |
| Gated Mystery School access after payment | Yes | Yes | Covered | New structure clearly assumes gated access for enrolled students |
| Mystery School dashboard | Yes | Yes | Covered | New requirements define student dashboard views for Foundation and Decan phases |
| Continue Learning / progress-driven dashboard entry | Yes | Yes | Partially Covered | New system has curriculum dashboards, but not the same old “continue learning” pattern explicitly |
| Training center | Yes | Partially | Partially Covered | New system has structured curriculum delivery, but does not explicitly mention a generic “training center” module |
| Lesson detail page | Yes | Partially | Partially Covered | New system has week detail, decan detail, ritual tasks, and journals instead of generic lesson pages |
| Video / audio / assets in lesson flow | Yes | Partially | Partially Covered | New requirements mention Beto audio for Foundation and ritual content, but not the same generalized media lesson model |
| Lesson completion tracking | Yes | Yes | Covered | New requirements include task completion, week completion, and decan completion tracking |
| Quiz integration | Yes | No clear mention | Not Covered | New Mystery School modules do not explicitly mention quiz-based learning inside Mystery School |
| Downloadable learning assets | Yes | No clear mention | Not Covered | New requirement file does not clearly describe downloadable lesson assets for Mystery School |
| Shared quiz engine reuse | Yes | No clear mention | Not Covered | New file does not mention reuse of a shared quiz engine for Mystery School |
| Training progress percentage | Yes | Partially | Partially Covered | New system has progress states, but not the same percentage-driven training-report structure explicitly |
| Next training / next lesson recommendation | Yes | No clear mention | Not Covered | New file focuses on week/decan flow, not old next-lesson recommendation logic |
| Mystery School header/navigation | Yes | No clear mention | Not Covered | New requirement file does not describe old dedicated header/navigation components |
| Dashboard switcher / cross-dashboard switching | Yes | No clear mention | Not Covered | New file does not explicitly mention switching between dashboards/modules |
| Perennial Mandalism entry into Mystery School | Yes | Yes | Covered | New enrollment flow includes joining Mystery School from community / marketing path |
| Dynamic signup intake form | Yes | No clear mention | Not Covered | New file defines enrollment and curriculum, but not the old long-form dynamic intake model |
| User preview / prefilled signup editing | Yes | No clear mention | Not Covered | Not explicitly described in the new requirement file |
| Cookie-based Mystery School access state | Yes | No clear mention | Not Covered | New file defines product requirements, not old cookie/session implementation details |
| Unsubscribe / cancel subscription flow | Yes | Yes | Covered | New requirements mention cancellation and access revocation at end of billing period |
| Pause / resume subscription handling | Legacy had limited subscription handling | Yes | Partially Covered | New file explicitly mentions pause/resume; old report had subscription state handling but not same enrollment lifecycle model |
| Wheel of the Year / zodiac visual section | Yes | Partially | Partially Covered | New system is deeply decan/zodiac based, but does not mention preserving the exact old wheel UI |
| Event slot section on dashboard | Yes | No clear mention | Not Covered | Old dashboard had event-slot logic, but new Mystery School requirements do not mention it |
| Event subscription / unsubscription from dashboard | Yes | No clear mention | Not Covered | Not present in the new Mystery School requirement list |
| Resource library count cards | Yes | No clear mention | Not Covered | Old dashboard had this, but new requirement file does not mention it |
| Content count APIs on dashboard | Yes | No clear mention | Not Covered | Not described in new Mystery School requirements |
| Asset modal / S3-based lesson file viewing | Yes | No clear mention | Not Covered | Not specified in the new team assignment file |
| Generic training-category based learning model | Yes | Partially | Partially Covered | New system moves from training-category model to Foundation + Decan model |
| Mark-as-done flow after lesson/video completion | Yes | Partially | Partially Covered | New system has completion states, but not the same video-end → mark-as-done pattern explicitly |

---

# 3. Covered Legacy Items in the New Team Assignment

These are the legacy Mystery School areas that are clearly represented in the new requirement document.

| Legacy Item | Covered in New File? | Notes |
|---|---|---|
| Paid Mystery School entry | Yes | New file includes enrollment and pricing model |
| Subscription-based access | Yes | New file includes subscription lifecycle for Mystery School |
| Gated member access | Yes | New student access model clearly depends on enrollment |
| Student dashboard | Yes | New file defines Foundation and Decan dashboard experiences |
| Progress / completion tracking | Yes | New file includes week completion, decan completion, and graduation requirements |
| Curriculum-based student journey | Yes | New file defines Q1 and Q2–Q5 structured progression |
| Perennial/community entry into Mystery School | Yes | New file includes join path from community/back office or marketing |
| Cancellation / access revocation concept | Yes | New file includes subscription cancellation behavior |

---

# 4. Partially Covered Legacy Items

These legacy items are reflected in the new requirement file only conceptually, or they appear in a changed form.

| Legacy Item | Partial Reason |
|---|---|
| Subscription success page / activation processing | New file implies payment activation, but does not describe the old technical success-page flow |
| Continue Learning block | New file has structured progression, but does not explicitly mention the old dashboard widget |
| Training center | New file has structured learning, but not a generic training center in the old form |
| Lesson page | Replaced conceptually by week detail, decan dashboard, ritual task flow, and journal submissions |
| Video/audio/assets lesson flow | Some audio/content exists in new requirements, but not the same generalized lesson-media structure |
| Training progress percentage | New requirements track status and completion, but not explicitly the old percentage-report API style |
| Wheel of the Year visual section | New system is zodiac/decan-based, but the same old UI section is not explicitly preserved |
| Generic training-category model | New system is curriculum/decan-driven rather than generic training-driven |
| Mark-as-done lesson flow | New system has completion tracking, but not the exact old interaction pattern |

---

# 5. Legacy Items Not Explicitly Covered in the New Team Assignment

These were present in the legacy Mystery School report, but are not clearly mentioned in the new team assignment requirements.

| Legacy Item | Why It Is Not Covered |
|---|---|
| Quiz engine inside Mystery School | New Mystery School modules do not explicitly mention quiz use |
| Downloadable lesson assets | Not clearly described in new Mystery School scope |
| Shared quiz engine reuse from another module | Not mentioned |
| Next lesson / next training recommendation system | Not mentioned explicitly |
| Mystery School specific header/navigation components | Not mentioned |
| Cross-dashboard switcher | Not mentioned |
| Dynamic intake-heavy signup form | Not described in the new Mystery School scope |
| User-preview prefill flow for signup | Not mentioned |
| Cookie-based access-control implementation | Not mentioned as a product requirement |
| Event slot dashboard section | Not mentioned |
| Event subscription/unsubscription | Not mentioned |
| Resource library cards/counts | Not mentioned |
| Content count dashboard blocks | Not mentioned |
| Asset modal / S3 file-viewing behavior | Not mentioned |
| Dedicated training-fetch / lesson-fetch style implementation | Not mentioned in requirement form |
| Legacy commented richer dashboard sections | Not covered in new requirements |

---

# 6. Key Conclusion

## What the legacy project had
The legacy Mystery School already had a real working implementation for:

- paid signup and subscription,
- gated access,
- dashboard entry,
- training/lesson delivery,
- progress tracking,
- and some extended dashboard/resource/event capabilities.

## What the new team assignment still covers from that legacy scope
The new requirement file still covers the **core product direction** of:

- paid Mystery School enrollment,
- gated student access,
- dashboard-driven student journey,
- structured content progression,
- completion tracking,
- and community/Perennial entry into Mystery School.

## What is left out from the old legacy scope in the new requirement file
The new file does **not explicitly cover** several old implementation details and legacy features, especially:

- quiz-based Mystery School lesson flow,
- downloadable learning assets,
- dynamic intake form behavior,
- training-center specific old structure,
- cross-dashboard switching,
- event/resource dashboard blocks,
- and old technical implementation patterns like cookie-driven state and success-page orchestration.

---

# 7. Final Interpretation

The new team assignment **does cover the core business purpose** of the legacy Mystery School, but it does **not fully carry forward every old legacy feature or implementation detail**.

So the correct interpretation is:

- **Core legacy Mystery School business flow is still covered**
- **Some old structures are only partially represented**
- **Several old legacy features are not explicitly included in the new requirement document**

---