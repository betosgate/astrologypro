# Divine Infinite Being — Next.js Admin Back-Office Master Task List
**Generated:** 2026-04-01
**Source:** Full Angular → Next.js gap analysis (deep audit)
**Status key:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## EXISTING REPO TASK FILES (5 tasks)

| ID | File | Summary |
|---|---|---|
| REPO-01 | `PRODUCT/admin-product-category-list-task.md` | Product category list: add `image_generate_url` column, fix pagination with count endpoint |
| REPO-02 | `DASHBOARD_TASK/dashboard-visibility-issue.md` | Ingress Charts: wrong `nestedPagination` + missing count endpoint |
| REPO-03 | `DASHBOARD_TASK/dashboard-visibility-issue.md` | Ritual List: missing from `dashboard/page.tsx` entirely |
| REPO-04 | `DASHBOARD_TASK/edit-user-page-render-issue.md` | Edit User page lifecycle warning — memoize options + stable form.reset dep |
| REPO-05 | `DASHBOARD_TASK/user-list-search-reset-issue.md` | User list: add Search/Reset buttons + fix filter payload (`searchcondition` not `condition`) |

---

## USERS (7 tasks)

| ID | Priority | Summary |
|---|---|---|
| U-01 | 🔴 | Preview uses wrong endpoint (`user/user-single-fecth`) → should be `user/user-preview` |
| U-02 | 🟠 | Preview dialog missing `package_names`, training percentages (admin/diviner/mystery) |
| U-03 | ✅ DONE | Action buttons: Send Mail, Reset Password, Manage Role, Login Info, Training Settings, etc. |
| U-04 | 🟡 | Missing date range filter on `createdon_datetime` |
| U-05 | 🟡 | `user_type` dynamic select — label key may be `role_name` not `name` from `fetch-role-list` |
| U-06 | 🟢 | Add/Edit: no profile image upload field |
| U-07 | 🟠 | User list filter payload puts `user_type` in `condition` — should be in `searchcondition` (see REPO-05) |

---

## ROLES (8 tasks)

| ID | Priority | Summary |
|---|---|---|
| R-01 | 🔴 | GenericFormPage sends `{ id }` to fetchEndpoint but API expects `{ _id }` — pre-population silently fails (see also SYS-11) |
| R-02 | 🔴 | Missing `priority` field in form — required in Angular + DB schema (`@Prop({ required: true })`) |
| R-03 | 🟠 | Missing preview action on list (endpoint: `admin/role-preview`, fields: role_name/description/priority/createdon_datetime/updatedon_datetime) |
| R-04 | 🟢 | Slug field should auto-generate from role name |
| R-05 | 🔴 | List column keys wrong: `name` → `role_name`, `created_at` → `createdon_datetime` — all cells render `—` (key mismatch with API response) |
| R-06 | 🟠 | List missing columns: `description`, `priority`, `updatedon_datetime` — all shown in Angular |
| R-07 | 🟠 | List missing status filter select (`selectsearch: status` in Angular) |
| R-08 | 🟡 | Form `description` field not marked `required: true` — Angular + DB schema both require it |

---

## PACKAGES (17 tasks)

| ID | Priority | Summary |
|---|---|---|
| P-01 | 🟠 | List missing preview modal — Angular opens dialog via `package/fetch-single-package`, shows name/purchase_type/sessions/subscription_period/package_type/price/description/priority/status |
| P-02 | 🟠 | List missing `purchase_type` column |
| P-03 | 🔴 | List + form: field key `package_name` should be `name` (API schema field `name`) |
| P-04 | 🔴 | `package_type` options completely wrong — should be `astrology_package`, `tarot_package`, `combo_package`, `customer_package` (not monthly/yearly/one_time) |
| P-05 | 🔴 | Missing `purchase_type` field (single/multiple/subscription) — required, drives conditional fields |
| P-06 | 🔴 | Conditional: `purchase_type=subscription` → show `subscription_period` select (daily/monthly/quarterly/yearly) |
| P-07 | 🔴 | Conditional: `purchase_type=multiple` → show `sessions` number field (required) |
| P-08 | 🟠 | Missing `webinar_id` multi-select (fetched from `webinar/fetch-all-webinar`, val=`_id`, label=`title`) |
| P-09 | 🟠 | Missing package image upload (S3 bucket: `all-frontend-assets`, path: `divine-infinity-being/packages-image/`; on submit build full CDN URL: `https://d37pbainmkhx6o.cloudfront.net/{path}{fileservername}`) |
| P-10 | 🔴 | fetchEndpoint IS present but pre-population fails — covered by SYS-11 (`{ id }` vs `{ _id }` mismatch); update body also missing `_id` key |
| P-11 | 🔴 | Delete endpoint wrong: Next.js `package/package-delete` ≠ Angular `package/delete-package` — deletes fail silently |
| P-12 | 🔴 | Status endpoint wrong: Next.js `package/package-status-change` ≠ Angular `package/change-status` — status toggles fail |
| P-13 | 🟠 | List missing `basecondition: { added_by: currentUserId }` — shows all packages from all users; Angular scopes to current user |
| P-14 | 🟠 | List has zero search fields — no text search, no date range filter, no status filter (Angular has all three) |
| P-15 | 🟡 | `package_type` field should only show when `for_customer=false` (admin context); currently always shown |
| P-16 | 🟠 | Submit payload missing `added_by` (current user `_id`) and `for_customer` (boolean: false for admin) — Angular injects both on submit |
| P-17 | 🟡 | Preview modal conditional display: hide `package_type` if `for_customer=true`; hide `subscription_period` if `purchase_type=multiple`; hide `sessions` if `purchase_type=subscription` |

---

## TRAINING (34 tasks)

| ID | Priority | Summary |
|---|---|---|
| T-01 | 🟠 | Categories: `role` field must be **multi-select** loaded dynamically from `admin/fetch-role-list` (val: slug, name: role_name) with `All` option prepended — currently single static select |
| T-02 | 🟡 | Categories: missing image upload (S3 bucket: `all-frontend-assets`, path: `divine-infinity-being/lesson-images/`) |
| T-03 | 🔴 | Categories edit: fetchEndpoint IS present (`admin/training-fetch`) but SYS-11 `{ id }` vs `{ _id }` bug causes pre-population failure; also Angular uses `admin/training-edit` — verify which endpoint is correct |
| T-04 | 🔴 | Training Center page (`admin/training/center`) is built on phantom API endpoints — `training-centre-add`, `training-centre-update`, `training-centre-delete`, `training-centre-status-change`, `training-centre-list-count`, `training-centre-single-fetch` DO NOT EXIST. The `training-centre/training-centre-list` only takes `{ user_id, role }` and is user-facing. This entire CRUD page must be removed or replaced. |
| T-05 | 🔴 | Categories list: delete endpoint `admin/training-delete` → `admin/training-category-delete` (wrong endpoint, deletes will fail) |
| T-06 | 🔴 | Categories list: status endpoint `admin/training-status-update` → `admin/training-status-change` (wrong endpoint, toggle fails) |
| T-07 | 🟠 | Categories list: column `created_at` → `createdon_datetime` (cells show `—`); missing `related_package_name` column; `role` column shown but not in Angular table |
| T-08 | 🟠 | Categories list: zero search fields (needs category_name text, updatedon_datetime date range, status select filter) |
| T-09 | 🟠 | Categories list: missing Preview action (endpoint: `admin/training-fetch`, fields: category_name/related_package_name/priority/status/description) |
| T-10 | 🟡 | Categories form `description`: should be CKEditor rich text, not plain textarea |
| T-11 | 🔴 | Lessons form `category_id` binding wrong: field key is `category_name` (should be `category_id`); endpoint should be GET `admin/training-category-fetch` (not POST `admin/training-list`); label key is `category_name` not `title` |
| T-12 | 🟠 | Lessons: missing `accuracy` (Quiz Accuracy %) field — required (number), used to gate quiz pass/fail |
| T-13 | 🟠 | Lessons: missing image (multiple), audio (multiple), video (multiple), assets (multiple) file uploads (all S3 `all-frontend-assets`, paths: lesson-images/, lesson-audio, lesson-videos, lesson-assets) |
| T-14 | 🟠 | Lessons: `prerequisite_lesson` options should reload from GET `admin/prerequisite-lesson?category_id=X` when `category_id` changes; currently uses generic lesson-list |
| T-15 | 🔴 | Lessons edit: fetchEndpoint IS present but SYS-11 bug causes failure; Angular uses `admin/lesson-edit` — verify vs `admin/lesson-fetch` |
| T-16 | 🟠 | Lessons list: zero search fields (lesson_name text, updatedon_datetime date range, status filter) |
| T-17 | 🟠 | Lessons list: missing Preview action (endpoint: `admin/lesson-fetch`, fields: lesson_name/category_name/prerequisite_lesson_name/accuracy/status/description) |
| T-18 | 🟡 | Lessons list column keys may be wrong: `category_name` → `cat_name`, `pre_requisite_lesson` → `prerequisite_lesson_name` (what API actually returns vs what table expects) |
| T-19 | 🟡 | Lessons form `description`: should be CKEditor rich text, not plain textarea |
| T-20 | 🔴 | Quizzes form: `quiz_title` → should be `question`; `lesson_name` → `lesson_id`; `description` field does not exist in Angular — must be removed |
| T-21 | 🔴 | Quizzes: form needs **Answer panel** — `externaldata` type opens MatDialog per-answer with `answer` text + `correct_answer` boolean; submit blocked if no correct answer marked (validation error shown) |
| T-22 | 🟡 | Quizzes: missing `review_start_time_in_second` + `review_end_time_in_second` number fields |
| T-23 | 🔴 | Quizzes edit: fetchEndpoint IS present (`admin/quiz-fetch`) but SYS-11 causes failure; `quiz_title` pre-populate also maps to wrong field key |
| T-24 | 🟠 | Quizzes list: `quiz_title` column key may be wrong — Angular stores `question` not `quiz_title`; `lesson_name` is a joined field, verify API returns it |
| T-25 | 🔴 | Assignments form: field `lesson_name` → should be `assignment_lesson`; lesson options endpoint should be `admin/fetch-lesson-list` (POST, Angular confirmed), not `admin/lesson-list` |
| T-26 | 🔴 | Assignments form: field `description` → should be `assignment_description`; must be CKEditor rich text (required) |
| T-27 | 🔴 | Assignments edit: missing `fetchEndpoint` — should be `training-centre/assignment-preview` (confirmed in Angular routing) |
| T-28 | 🟠 | Assignments form: `pre_requisite_lesson` field does NOT exist in Angular — remove from form |
| T-29 | 🔴 | Assignment add endpoint typo: `training-centre/assginment-add` — the typo IS in the real API (confirmed in NestJS controller `@Post('assginment-add')`), so Next.js must keep the typo to match |
| T-30 | 🔴 | Assignment list: `created_at` column key — Angular uses `createdon_datetime`; `pre_requisite_lesson` column doesn't appear in Angular list |
| T-31 | 🟠 | Assignments list: missing status filter and date range search |
| T-32 | 🟠 | Assignment Notifications list: zero search/filter (lesson autocomplete, name/email text, date range by `createdon_datetime`) |
| T-33 | 🟡 | Lessons form `priority` missing `required` validation (Angular has required) |
| T-34 | 🟡 | Quizzes: `priority` missing `required: true` (Angular has required validation) |

---

## CALENDAR EVENTS (17 tasks)

| ID | Priority | Summary |
|---|---|---|
| C-01 | 🔴 | Form field `event_name` key → should be `title` (Angular field name confirmed); list column `event_name` → may also be `title`. All data silently stored in wrong key. |
| C-02 | 🔴 | Missing `start_time` / `end_time` timepicker2 fields (24-hour format) — both **required** |
| C-03 | 🟠 | Missing `timezoneValue` select — 10 US timezone options (Eastern/Central/Mountain/Pacific/Alaska/Hawaii/Arizona/Puerto Rico/Guam/Virgin Islands) — **required** |
| C-04 | 🟠 | Missing `category` text field — **required** |
| C-05 | 🟠 | Missing `displayed_event_for` select (Public/Members-Only/Students-Only/Members and Guests) — **required** |
| C-06 | 🟠 | Missing `role` multi-select (all/is_astrologer/is_tarotreader) — **required** |
| C-07 | 🟠 | Missing `color_code` text field — **required** |
| C-08 | 🟠 | Missing `is_recurring` checkbox → conditional: day-of-week checkboxes (sun/mon/tues/wed/thurs/fri/sat) + `weekend`/`weekdays`/`everyday` mutual-exclusion buttons |
| C-09 | 🟠 | Missing `subscription_availability` checkbox → conditional: `notification_template` CKEditor (required when checked) |
| C-10 | 🟠 | Missing `quarter` multi-select (all/spring_quarter/summer_quarter/autumn_quarter/winter_quarter) — **required** |
| C-11 | 🟠 | Missing `visible_in_frontend`, `not_available_slot`, `holiday_event` checkboxes |
| C-12 | 🟠 | Submit payload missing `timezoneName` (derived from timezoneValue lookup) and `by_ai: false` — Angular injects both on submit |
| C-13 | 🟡 | `start_date`, `end_date`, `priority` must be marked `required: true` (Angular has required validation) |
| C-14 | 🟡 | `description` field: Angular uses plain `type: 'text'` with cols:2 span — Next.js uses textarea. Verify if rich text needed or just multiline text. |
| C-15 | 🟡 | Calendar Events list: zero search fields (needs event name text search, date range, status filter) |
| C-16 | ⚠️ VERIFY | C-06 (reminders toggle) — NOT found in Angular form — may be incorrect task; needs cross-check with another Angular version or API entity |
| C-17 | ⚠️ VERIFY | C-07 (thumbnail upload) — NOT found in Angular form — may be incorrect task; needs cross-check with API schema |

---

## BLOG (19 tasks)

| ID | Priority | Summary |
|---|---|---|
| B-01 | 🟠 | Form: `description` must be CKEditor rich text (not plain textarea) — Angular uses `type: 'editor'`, field is required |
| B-02 | 🟠 | Form: Missing `audios` multi-upload (S3: `divine-infinity-being/blog-audio/`) with `audio_title` + `audio_Desc` sub-fields per item |
| B-03 | 🟠 | Form: Missing `videos` multi-upload (S3: `divine-infinity-being/blog-video/`) with `video_title` + `video_Desc` sub-fields per item |
| B-04 | 🟠 | Form: Missing `available_for_perennial` checkbox ("Only for Perennial Mandalism") — confirmed in Angular submit payload |
| B-05 | 🔴 | Form: `tags` field does NOT exist in Angular blog form — must be removed from Next.js form entirely |
| B-06 | 🟠 | Form: `image` field needs `img_status` checkbox sub-field ("Set as Thumbnail") per uploaded image — Angular shows it beside each uploaded image |
| B-07 | 🟠 | Form: Missing `files` multi-upload (S3: `divine-infinity-being/blog-file/`) with `file_title` + `file_Desc` sub-fields per item |
| B-08 | 🟡 | Form: Audio `audio_title` + `audio_Desc` sub-fields must be text inputs rendered inline per audio item |
| B-09 | 🟡 | Form: Video `video_title` + `video_Desc` sub-fields must be text inputs rendered inline per video item |
| B-10 | 🔴 | Form: `author` field does NOT exist in Angular blog form — must be removed from Next.js form entirely |
| B-11 | 🔴 | Form: `image` field key is wrong — Angular uses `images` (plural) as multi-upload (S3: `divine-infinity-being/blog-image/`); Next.js has single `image` field with wrong key and path |
| B-12 | 🔴 | List: column `created_at` → API returns `created_on`; all date cells render `—` (key mismatch) |
| B-13 | 🟠 | List: missing `available_for_perennial` column — shown in Angular table |
| B-14 | 🟠 | List: missing `updated_on` date column — shown in Angular table |
| B-15 | 🟠 | List: missing status filter select — Angular has `selectsearch: status` filter |
| B-16 | 🟠 | List: missing date range filters on `created_on` and `updated_on` — Angular has both |
| B-17 | 🟡 | List: missing `priority` text search field |
| B-18 | 🟠 | List: missing Preview action — Angular uses CommonPreviewModalComponent per row |
| B-19 | 🟠 | Submit payload: Angular explicitly builds `{ title, description, priority, status, available_for_perennial, images, files, audios, videos }` — no `author` or `tags`; Next.js must match this shape |

---

## VIDEOS (14 tasks)

| ID | Priority | Summary |
|---|---|---|
| V-01 | 🔴 | Form: `video_url` (URL field) does NOT exist in Angular video form — must be removed from Next.js |
| V-02 | 🔴 | Form: `thumbnail` file upload does NOT exist in Angular video form — must be removed from Next.js |
| V-03 | 🔴 | Form: `description` must be CKEditor rich text (required) — Angular uses `type: 'editor'`; Next.js uses plain textarea (not required) |
| V-04 | 🔴 | Form: `uploadvideo` field is `externaldata` type that opens `VideoUploadModal` dialog — not a simple form field; Next.js has no equivalent. Must build a custom video-upload dialog. |
| V-05 | 🔴 | VideoUploadModal: `videotype` select (val 1 = Youtube Link, val 3 = Video File) drives conditional fields. Youtube (1): `youtube_link` text (prefix: `https://www.youtube.com/watch?v=`), `youtube_title` text, `youtube_description` text. File (3): multiple file upload with `video_title` + `video_Desc` sub-fields per item. |
| V-06 | 🟠 | VideoUploadModal File type: S3 bucket must be `all-frontend-assets` (Angular has wrong old bucket `awsbackend-dev-patient-files-test`). Correct path for Next.js: `divine-infinity-being/video-management/` (or confirm correct sub-path with API) |
| V-07 | 🟠 | Form submit: `videos` array must be accumulated from VideoUploadModal (add/edit/delete per item) and injected into payload — Next.js has no mechanism for building this array |
| V-08 | 🔴 | List: `countEndpoint` wrong — Next.js uses `videomanagement/video-management-list-count` but Angular uses `videomanagement/video-list-count` (count calls fail, pagination breaks) |
| V-09 | 🔴 | List: `created_at` column key → API returns `created_on`; date cells render `—` |
| V-10 | 🟠 | List: missing `description` column and missing `updated_on` column — both shown in Angular table |
| V-11 | 🟠 | List: missing Preview action — Angular shows title, description, priority, status, created_on, updated_on, videos |
| V-12 | 🟠 | List: missing autocomplete title search (`videomanagement/video-title-autocomplete`) — current text search is not autocomplete |
| V-13 | 🟡 | List: missing priority text search, status select filter, date range filters on `created_on` and `updated_on` |
| V-14 | 🟠 | List: in-line video playback — Angular has a play icon that opens `vodeoPlayModal` with embedded YouTube iframe or file player. Preview modal should include a way to play/view the `videos` array items. |

---

## BROADCASTING (9 tasks)

| ID | Priority | Summary |
|---|---|---|
| BC-01 | 🟢 | No recipient targeting — Angular also doesn't have this; keep as future enhancement note |
| BC-02 | 🟢 | No scheduled send time — Angular also doesn't have this; keep as future enhancement note |
| BC-03 | 🔴 | Form: `image` (Broadcast Image) file upload does NOT exist in Angular broadcasting form — must be removed from Next.js |
| BC-04 | 🟠 | Form: `shortDescription` field IS present but must be CKEditor rich text (required) — Angular `type: 'editor'`; Next.js has plain textarea |
| BC-05 | 🟠 | Form: `description` field IS present but must be CKEditor rich text (required) — Angular `type: 'editor'`; Next.js has plain textarea |
| BC-06 | 🔴 | List: `created_at` column key wrong — Angular uses `updated_on` as the date column (displayed as "Updated on"); all date cells render `—` |
| BC-07 | 🟠 | List: missing `shortDescription` and `description` columns — both appear in Angular table headers |
| BC-08 | 🟡 | List: missing status filter select + date range filter on `updated_on` (Angular has both) |
| BC-09 | ⚠️ VERIFY | List delete endpoint: Next.js `brodcasting/brodcasting-deletemany` but Angular libdata has `brodcasting/brodcasting-delete` — verify which is correct in API |

---

## TAROT (16 tasks)

### Tarot Cards

| ID | Priority | Summary |
|---|---|---|
| TC-01 | 🔴 | Form: `suit` field does NOT exist in Angular tarot card form — must be removed from Next.js (was incorrectly flagged as "should be a select") |
| TC-02 | 🟠 | Form: `card_number` field does NOT exist in Angular — must be removed |
| TC-03 | 🟠 | Form: `keywords` field does NOT exist in Angular — must be removed |
| TC-04 | 🔴 | Form: missing `priority` number field (required) — Angular has it with required validation |
| TC-05 | 🟠 | Form: missing `related_spreads` multi-select from `tarot-spreads/spread-list` (val: `_id`, name: `spread_name`), required |
| TC-06 | 🟠 | Form: missing `card_image` file upload (multiple), S3 bucket `all-frontend-assets`, path `divine-infinity-profile-images/`; CDN URL: `https://d37pbainmkhx6o.cloudfront.net/${baseurl}${fileservername}` |
| TC-07 | 🔴 | Add endpoint: Next.js `tarot-card/card-add` ≠ Angular `tarot-card/tarot-card-add` — card adds fail |
| TC-08 | 🔴 | List: `created_at` column key → API returns `created_on`; date cells render `—` |
| TC-09 | 🟠 | List: missing `related_spread_name`, `priority`, `updated_on` columns — all shown in Angular table |
| TC-10 | 🟠 | List: missing text search on `card_name`, date range on `created_on`+`updated_on`, status select, related_spreads select filter |
| TC-11 | 🟠 | List: missing Preview action (Angular opens custom PreviewModal with full card data) |

### Tarot Spreads

| ID | Priority | Summary |
|---|---|---|
| TS-01 | 🟠 | Form: missing `thumbnail` image upload (multiple), S3 `all-frontend-assets`, path `divine-infinity-being/tarot-spread-image/`; CDN URL construction same pattern |
| TS-02 | 🔴 | List: `created_at` column key → API returns `created_on`; date cells render `—` |
| TS-03 | 🟠 | List: missing `updated_on` column — shown in Angular table |
| TS-04 | 🟡 | List: missing date range filters on `created_on`+`updated_on`, status select filter (only spread_name text search present) |
| TS-05 | 🟡 | Form: `description` field is not required — Angular has required validation; Next.js has it as optional textarea |

---

## ASTROLOGY (21 tasks)

### Wheel Signs

| ID | Priority | Summary |
|---|---|---|
| WS-01 | 🔴 | Form: field keys `start_date_time`/`end_date_time` → must be `start_date` (date) + `end_date` (date); Angular combines them with `start_time`/`end_time` into `startDateTime`/`endDateTime` epoch ms before submit |
| WS-02 | 🟠 | Form: missing `start_time` / `end_time` timepicker2 fields (AM/PM) — both required in Angular |
| WS-03 | 🟠 | Form: missing `theme_image` file upload (S3 `all-frontend-assets`, path `divine-infinity-being/wheel_sign_images/`) |
| WS-04 | 🟠 | Form: missing `icon_image` file upload (S3 `all-frontend-assets`, path `divine-infinity-being/wheel_sign_images/`) |
| WS-05 | 🟠 | Form: missing `assets` multi-upload (S3 `all-frontend-assets`, path `divine-infinity-being/wheel_sign_assets/`) |
| WS-06 | 🟠 | Submit: Angular combines `start_date`+`start_time` → `startDateTime` (epoch ms) and `end_date`+`end_time` → `endDateTime` (epoch ms); removes individual fields; adds `is_unlockOn: 0`, `is_available` (now+30 days), `unlockedDaysBefore: 7` |
| WS-07 | ⚠️ NOTE | Wheel Sign UPDATE uses `payload['id']` (not `_id`) — confirmed in Angular line 279. This is an intentional EXCEPTION to SYS-11. When fixing SYS-11 globally, wheel-sign edit must keep using `id` not `_id`. |
| WS-08 | 🔴 | List: column keys wrong — Next.js has `start_date_time`/`end_date_time` but API returns `startDateTime`/`endDateTime`; missing `createdAt` and `updatedAt` columns |
| WS-09 | 🔴 | List: Next.js has `statusEndpoint` + `deleteEndpoint` configured — Angular sets `hidestatustogglebutton: true` AND `hidedeletebutton: true`; wheel signs cannot be deleted or status-toggled in Angular; these actions must be removed |
| WS-10 | 🟡 | List: missing autocomplete search (`wheel_signs/wheel-sign-autocomplete`) + date range on `startDateTime` |

### Decan Info

| ID | Priority | Summary |
|---|---|---|
| DI-01 | 🔴 | Form: completely wrong fields — Next.js has title/priority/description/status but Angular needs: `sign` (dynamic select from `wheel_signs/wheel-sign-autocomplete`, val=`_id`), `planet` (text, required), `tarrot_name` (text, required), `greek_daemon` (text, required), `decan` (select: First/Second/Third Decan, required), `decan_priority` (number, required), `tarot_short_description` (text, required) |
| DI-02 | 🟠 | Form: missing `images` upload (S3: `all-frontend-assets`, path `divine-infinity-being/tarrot_thumb_image_url/`); stored key is `tarrot_thumb_image` not `images` |
| DI-03 | ⚠️ VERIFY | DI-02 (endpoint): Next.js uses `wheel_signs/astro-terrot-decan-image-video-info-add-edit` for both add and edit — verify if this is the correct shared endpoint in API or if separate `astro-decan-info-add`/`update` exist |
| DI-04 | 🟡 | Submit payload: `sign` field value is `sign_id` (the `_id` from sign autocomplete); Angular injects both `sign_id` (ObjectId) and `sign` (human name) into payload |

### Decan Videos

| ID | Priority | Summary |
|---|---|---|
| DV-01 | 🔴 | Form: `content_type` select must drive conditional fields — "uploaded Video": title, desc, thumbnail upload (S3: `divine-infinity-being/tarrot_video_thumb_url/`), video file upload; "YouTube Video": youtube_url; "add pronouncement": name, desc, assets upload. Currently only has a static `video_url` text field. |
| DV-02 | 🔴 | List: delete endpoint is `event/event-delete` (wrong module — leftover copy-paste) |
| DV-03 | 🟡 | Submit: content-type conditional fields may need to be nested under `content` object — verify with API schema |
| DV-04 | 🟡 | Endpoint typos: `single-video-pronuncement-fetch` and list `astro-decan-video-pronumcement-list` have different spellings — verify which exact spelling the API uses |

---

## SOCIAL ADVOCACY (12 tasks)

| ID | Priority | Summary |
|---|---|---|
| SA-01 | 🔴 | Form: missing `frequency` select field (daily/weekly/monthly/customs) — required in Angular |
| SA-02 | 🔴 | Form: missing `link` text field — required in Angular |
| SA-03 | 🟠 | Form: missing `images` multi-upload (S3 `all-frontend-assets`, path `divine-infinity-being/social-advo-image/`) |
| SA-04 | 🟠 | Form: missing `audio` multi-upload (S3 `all-frontend-assets`, path `divine-infinity-being/social-advo-audio/`) |
| SA-05 | 🟡 | Form: missing `freq_change_enable` checkbox (Enable Frequency Change By Social Advo) |
| SA-06 | 🟡 | Form: missing `video` multi-upload (S3 `all-frontend-assets`, path `divine-infinity-being/social-advo-video/`) |
| SA-07 | 🔴 | Form: edit endpoint `social-advo/social-advo-update` ≠ Angular `social-advo/social-advo-post-update` — edits silently fail |
| SA-08 | 🔴 | Form: `priority` field does NOT exist in Angular social-advo form — must be removed |
| SA-09 | 🔴 | List: status toggle uses `social-advo/social-advo-status-change` but Angular uses `social-advo/social-advo-post-update` as the update/status endpoint — verify correct endpoint |
| SA-10 | 🔴 | List: missing Delete action — Angular has `deleteendpoint = social-advo/social-advo-delete`; Next.js custom list page has no delete column |
| SA-11 | 🟡 | List: frequency filter includes "yearly" which is NOT a valid Angular option (options: daily/weekly/monthly/customs only) |
| SA-12 | 🟡 | List: missing date range filters on `created_at` + `updatedon_datetime` — Angular has both |

---

## RITUAL INVOCATION (5 tasks)

| ID | Priority | Summary |
|---|---|---|
| RI-01 | 🟠 | List: no Delete action — need per-row delete with endpoint `ritual-invocation/ritual-invocation-delete` (verify exact endpoint in API) |
| RI-02 | 🔴 | CORRECTION: `tags` field does NOT exist in Angular ritual invocation form — prior task was incorrect; Angular form only has: name, priority, description, status. No tags. Remove from Next.js if added. |
| RI-03 | ⚠️ VERIFY | Form: Angular pre-populates `name` field from `this.formValue?.ritual_name` (API key `ritual_name`) but submits as `name` — verify whether API stores as `ritual_name` or `name` and align form key accordingly |
| RI-04 | ⚠️ VERIFY | Angular list is completely broken (copy-paste from Quarters: deleteendpoint=`quatermanagement/Quarter-delete`, status=`quatermanagement/quarter-status-change`, preview=`quatermanagement/quarter-fetch`) — do NOT use Angular list as reference; verify all ritual-invocation list endpoints directly against the NestJS API |
| RI-05 | ⚠️ VERIFY | Angular form submit is fully commented out (lines 149–166 in Angular component) — Angular form never actually calls the API in production. Next.js is the implementation reference here. Confirm `ritual-invocation/ritual-invocation-add-edit` is the correct shared add+edit endpoint. |

---

## PERENNIAL CONTENT (10 tasks)

| ID | Priority | Summary |
|---|---|---|
| PC-01 | 🔴 | Form: no `fetchEndpoint` on either add or edit page — edit pre-population completely broken |
| PC-02 | 🔴 | Form: `content_type` options wrong — Next.js has ritual/meditation/teaching/general; Angular has: Live Stream, Video Library, Document, YouTube Video, Announcement |
| PC-03 | 🔴 | Form: each content type requires different conditional fields — Live Stream: title, description, thumbnail, stream_source, scheduled_date, duration, access_control, reminders, tags, display_start_date, display_end_date, link; Video Library: video_source (Video File/YouTube URL/Video URL) + conditional fields, title, description, access_control, priority, tags; Document: file upload, title, description, access_control, tags; YouTube Video: youtube_url, title, description, access_control, tags; Announcement: title, description, display_start_date, display_end_date, access_control, priority, tags |
| PC-04 | 🟡 | Form: `reminders` checkbox (Live Stream only) → conditional `reminder_time` + `reminder_method` (Push Notification/Email) |
| PC-05 | 🔴 | List: column `status` → API uses `content_status`; `created_at` → `display_dates`; missing `content_type` and `access_control` columns |
| PC-06 | 🟠 | List: missing all search/filters — Angular has: title text search, `content_status` select (Publish/Not Publish), `access_control` select (Free/Members), `content_type` select, date range on `display_dates` |
| PC-07 | 🔴 | List: Angular has `hidestatustogglebutton: true` — status toggle should be hidden/removed from Next.js list; `content/content-status-change` endpoint may not exist |
| PC-08 | 🟠 | Form: missing `access_control` select (Free / Members) — applies to all content types |
| PC-09 | 🟠 | Form: missing `content_status` select (Publish / Not Publish) — Angular uses this instead of a boolean `status` switch |
| PC-10 | 🟡 | Form: `priority` field exists in Next.js — confirm whether Angular includes priority (it appears in list for Video Library/Announcement, verify if it's a form field too) |

---

## PERENNIAL MANDALISM (21 tasks)

### Members Add/Edit Form
| ID | Priority | Summary |
|---|---|---|
| PM-01 | 🔴 | Members edit page: no `fetchEndpoint` — form cannot pre-populate on edit |
| PM-06 | 🔴 | Members form uses single `name` field — Angular uses separate `firstname` (required) + `lastname` (required) fields |
| PM-07 | 🔴 | Members form missing required profile fields: `relation_type` (select: husband/wife/son/daughter/father/mother/brother/sister/friend/colleague/relative/other — add only), `gender` (select: male/female/others), `relationship_status` (select: single/married/divorced/widowed/others), `state` (all US states select), `city`, `zip`, `address` — all required in Angular |
| PM-08 | 🟠 | Members form missing lifestyle text fields: `personality`, `strengths`, `lifeAreasFulfilling`, `lifeAreasImprovement`, `longTermGoals`, `majorLifeEvents`, `relationship_with_family`, `biggest_current_challenges`, `mainConcern`, `additionalInfo`, `achieveFromReading`, `additional_info` (textarea) |
| PM-09 | 🟠 | Members form missing 12 boolean checkbox fields: `focus_on_specific_relationships`, `stressManagement`, `workLifeBalance`, `concerns_about_romantic_life`, `social_life_fulfillment`, `spiritualPractices`, `guidance_on_specific_decision`, `ongoing_projects_or_plans`, `selfDiscovery`, `externalInfluences`, `specificQuestions`, `goalsOutcomes` |
| PM-10 | 🔴 | Members add: missing `password` + `confirmpassword` fields (required on add only, not on edit) |
| PM-11 | 🔴 | Members add submit: must inject `relation_with: session.user.cognito_user_id` and `user_type: 'is_Perennial_Mandalism'` into payload — Angular does this; Next.js does not |
| PM-12 | 🔴 | Members edit submit: Angular sends `cognito_user_id` in payload (from fetched `formEditData.cognito_user_id`); Next.js sends default `id` from params — wrong field name |

### Rituals List
| ID | Priority | Summary |
|---|---|---|
| PM-13 | 🔴 | Ritual list missing `user_id` filter — Angular sets `basecondition.user_id = cookieData.userinfo._id`; Next.js fetches all rituals without filtering by logged-in user |
| PM-14 | 🟠 | Ritual list: status column must be hidden — Angular `hidestatustogglebutton: true`; Next.js shows status badge |
| PM-15 | 🔴 | Ritual list missing "Navigate" button — Angular custom button opens `ritual-result/{config_id}` in new tab; Next.js has no mechanism to navigate to the ritual player |
| PM-16 | 🟠 | Ritual list: delete and edit actions must be hidden — Angular `hidedeletebutton: true`, `hideeditbutton: true` |

### Rituals Add/Edit Pages
| ID | Priority | Summary |
|---|---|---|
| PM-17 | 🔴 | Ritual add page approach is wrong — Angular creates rituals via a dialog (4 standard presets + 1 custom planetary configurator); Next.js has a GenericFormPage with `name`/`priority`/`description` fields which do not exist in Angular |
| PM-18 | 🔴 | Ritual add payload mismatch — Angular submits `{ user_id, ritual_tags }` to `add-ritual-configuration`; Next.js submits `{ name, priority, description }` |
| PM-19 | 🟠 | Ritual edit page has no Angular equivalent — Angular never edits rituals; `/rituals/edit/[id]` route should be removed or hidden |

### Ritual Result Page
| ID | Priority | Summary |
|---|---|---|
| PM-20 | 🟠 | Ritual result navigation approach differs — Angular navigates to `ritual-result/{config_id}` (route param), then fetches config to extract `ritual_tags`; Next.js passes tags directly via URL search params (`?tags=...`) — verify which produces correct video set |
| PM-21 | 🟡 | Ritual result API payload mismatch — Angular calls `ritual-invocation/ritual-invocation-configure-list` with `{ tag: ritual_tags }` (plain array); Next.js wraps as `condition: { tag: { $in: tags } }` — verify which payload format the API accepts |

### Dashboard
| ID | Priority | Summary |
|---|---|---|
| PM-02 | 🟡 | Two simultaneous ritual add entry points (list page dialog + `/rituals/add` page) — should consolidate once PM-17/PM-18 are resolved |
| PM-03 | 🟡 | Dashboard: natal chart + monthly chart polling every 10s (`user/customer-astro-response-details-fetch`) — confirm if Next.js dashboard implements this |
| PM-04 | 🟡 | Dashboard: content list + type counts (`content/content-list-for-frontend`, `content/content-type-counts`) — confirm if Next.js dashboard implements this |
| PM-05 | 🟠 | Stripe subscription flow: create (`stripe/create-subscription-mystery-school`) + unsubscribe (`stripe/unsubscribe-stripe-Perennial`) — Next.js dashboard uses `cart_management/subscription-payment` which may be a different endpoint |

---

## GENERAL CONTENT (9 tasks)

### Form
| ID | Priority | Summary |
|---|---|---|
| GC-01 | 🔴 | `sign` field is free text — Angular uses dynamic select from `wheel_signs/wheel-sign-autocomplete`; on edit sets value to `sign_id`, on submit sends both `sign_id` and resolved `sign` name |
| GC-02 | 🟠 | Missing `assets` file upload — S3 bucket `all-frontend-assets`, path `divine-infinity-being/gernal-content-assets`; Angular constructs S3 URL as `assets_path_link` on submit |
| GC-03 | 🟠 | Submit payload must inject `added_by: session.user._id` — Angular reads from cookie and appends to payload |
| GC-04 | 🔴 | Form has `status` switch field — Angular form has NO status field at all; remove from form |
| GC-05 | 🔴 | Form submit payload mismatch: Next.js sends `sign` as raw text; Angular sends `sign_id = form.sign` + resolves `sign = signList.find(item => item.val === sign)?.name` — must split the field correctly |

### List
| ID | Priority | Summary |
|---|---|---|
| GC-06 | 🔴 | List has `statusEndpoint: "wheel_signs/journal-status-change"` — Angular `hidestatustogglebutton: true`; status toggle must be removed from list |
| GC-07 | 🟡 | List `created_at` column key should be `created_on` |
| GC-08 | 🟡 | List missing `user_name_with_email` ("Added By") column — present in Angular `modify_header_array` |
| GC-09 | 🟡 | List missing search: sign autocomplete (`wheel_signs/sign-autocomplete-search-title`), decan autocomplete (`wheel_signs/decan-autocomplete-search`), added_by autocomplete (`wheel_signs/journal-auto-complete-addedBy`) |

---

## SPIRITUAL WISDOM (5 tasks)

| ID | Priority | Summary |
|---|---|---|
| SW-01 | 🟠 | Form missing `descriptive_title` field — shown in list headers but not present in the form |
| SW-02 | 🔴 | All endpoints use typo `spiritual-wishdom` — verify whether the API path actually uses this spelling or if it should be `spiritual-wisdom` |
| SW-03 | 🟠 | Angular add and YouTube sub-form components are completely empty (no fields defined) — Next.js form is the de facto reference but needs verification against the actual API |
| SW-04 | 🟡 | Angular `hideeditbutton: true` and custom Edit handler is fully commented out — edit route exists in Next.js but Angular never uses it; decide whether to keep or remove edit route |
| SW-05 | 🟡 | List missing search filters: date range on `created_at` and `updatedon_datetime`, text search on `title`, status select |

---

## QUARTERS (7 tasks)

### Form
| ID | Priority | Summary |
|---|---|---|
| Q-01 | 🔴 | Form missing `sit_count` (number, required) field — present in Angular but absent from Next.js form |
| Q-02 | 🟡 | Form `description` is textarea — Angular uses CKEditor (`type: 'editor'`); also description is required in Angular |
| Q-03 | 🟡 | Delete endpoint uses capital `Q`: `quatermanagement/Quarter-delete` — verify whether API actually requires this casing |
| Q-04 | 🟠 | Form submit must inject `added_by: session.user._id` and `for_customer: user_type !== 'is_admin'` — Angular does this; Next.js does not |

### List
| ID | Priority | Summary |
|---|---|---|
| Q-05 | 🟠 | List `created_at` column is wrong — Angular skips `created_at` and shows `updated_at`; Next.js shows `created_at` instead |
| Q-06 | 🟡 | List missing columns: `sit_count`, `description`, `updated_at` — all in Angular `modify_header_array` and `tableheaders` |
| Q-07 | 🟡 | List missing search: date range on `updated_at`, text on `quarter_name`, select on `status` |

---

## CLASS CONFIGURATION (2 tasks)

| ID | Priority | Summary |
|---|---|---|
| CC-01 | 🔴 | List delete button hits `social-advo/social-advo-delete` (wrong endpoint) |
| CC-02 | 🟠 | Edit: session dropdown has no options on page load — must pre-populate options from saved `schedule` value |

---

## PAYMENTS (4 tasks)

| ID | Priority | Summary |
|---|---|---|
| PAY-01 | 🟠 | Missing preview modal per row — Angular opens `PaymentPreviewModal` after fetching `payment/payment-fetch`; shows purchase_type-conditional view |
| PAY-02 | 🟠 | Missing refund initiation button per row — Angular opens `RefundPreviewModal` after fetching `payment/payment-fetch` |
| PAY-03 | 🔴 | Angular `RefundPreviewModal` "Yes" button has no click handler (Angular bug) — do NOT replicate; implement a working refund confirmation flow in Next.js |
| PAY-04 | 🟡 | Angular sets `basecondition.added_by = login_user_details.userinfo._id` — payment list is scoped to current admin user; Next.js fetches all payments globally — verify intended behaviour |

---

## REFUNDS (7 tasks)

| ID | Priority | Summary |
|---|---|---|
| REF-01 | 🟠 | Missing Activity Log button/modal — Angular opens `RefundRequestActivityLogComponent` after fetching `refund-activity/refund-activity-log-list` with `{ searchcondition: { refundRequestId } }` |
| REF-02 | 🟠 | Missing Refund User button/action — Angular fetches `refund-processing/fetch-refund-details` then opens `RefundUserComponent`; Next.js has no "Refund" row action |
| REF-03 | 🟠 | Comments in Angular are a separate modal (`RefundRequestCommentSectionAdminComponent` fetching `refund-processing/fetch-refund-request-comment-list-details`); Next.js embeds comments inside the preview sheet — verify if separate modal flow is required |
| REF-04 | 🟠 | Status Change: Angular requires note/comment text to be non-empty before submitting (shows validation error); Next.js `comment` textarea is fully optional — make it required |
| REF-05 | 🟡 | Search missing user autocomplete (`refund-processing/user-name-autocomplete-search` on `user_id` field) and date range on `createdAt` |
| REF-06 | 🟡 | After status change, Angular calls `refund-activity/refund-activity-add` to log the event (actor, type, description, metadata); Next.js does not post this activity log — verify if backend handles it or if frontend must send it |
| REF-07 | 🟡 | Status change payload: Angular requires note text but Next.js sends `comment_text` as optional — update validation and payload structure to match Angular exactly |

---

## REPORTS (5 tasks)

| ID | Priority | Summary |
|---|---|---|
| REP-01 | 🟡 | Missing preview modal per row — Angular opens `ReportPreviewModal` passing row data directly and formatting `clicked_on` with moment |
| REP-02 | 🟡 | Missing date range filter on `clicked_on` — Angular has date range search; Next.js only has text search |
| REP-03 | 🟡 | Preview modal should show IP geo data (`ip_info.city/country/hostname/ip/loc/postal/region/timezone`) — confirm field names from API |
| REP-04 | 🟠 | Column key mismatch: Angular uses `quater_name` (API typo) — Next.js uses `quarter_name`; verify actual API field name to avoid empty column |
| REP-05 | 🟠 | Column key mismatch: Angular uses `clicked_on` — Next.js uses `clicked_time`; verify actual API field name to avoid empty column |

---

## WEBINARS (7 tasks)

### Form
| ID | Priority | Summary |
|---|---|---|
| W-01 | 🟡 | `"customs"` frequency option label in Angular is `"Customs"` not `"Custom"` — check if API expects `"customs"` and update Next.js label accordingly |
| W-02 | 🟡 | Angular frequency conditional change handler is a stub (empty if/else blocks) — no day/time sub-fields needed |
| W-03 | 🟡 | Verify edit `fetchEndpoint`: add page has `webinar/webinar-single-fetch` — confirm edit page also has it (or update) |
| W-04 | 🟠 | Form `description` and `frequency` are required in Angular but optional in Next.js — add required validation |

### List
| ID | Priority | Summary |
|---|---|---|
| W-05 | 🔴 | List `created_at` column key is wrong — Angular uses `createdon_datetime`; API likely returns `createdon_datetime` not `created_at` |
| W-06 | 🟠 | Missing Preview button — Angular uses `webinar/webinar-preview` action-type button; shows title, description, priority, frequency, createdon_datetime |
| W-07 | 🟡 | List missing search: status select and date range on `createdon_datetime` — Angular has both; Next.js only has title text search |

---

## TESTIMONIALS (6 tasks)

| ID | Priority | Summary |
|---|---|---|
| TES-01 | 🟡 | Requests list: no approve/reject workflow — status toggle is the only mechanism |
| TES-02 | 🟠 | Create testimonial: missing image, audio, video upload fields |
| TES-03 | 🟡 | Request testimonial form: astrologer role shows different fields (no `testimonial_for`, `notes` as textarea) |
| TES-04 | 🔴 | Field name mismatch: Next.js uses `testimonial_content` but Angular sends `notes` — API will not save the feedback content |
| TES-05 | 🟠 | Next.js adds `testimonial_title` field not present in Angular form — verify if API accepts it or if it should be removed |
| TES-06 | 🟡 | Angular marks `requested_to_phone_no` as required; Next.js `.optional()` — add required validation to match backend |

---

## DASHBOARD (12 tasks)

| ID | Priority | Summary |
|---|---|---|
| D-01 | 🔴 | Ingress Charts "Refresh" button calls wrong mutation reset instead of list refetch (see REPO-02) |
| D-02 | 🔴 | Ritual List missing from dashboard entirely (see REPO-03) |
| D-03 | 🟠 | "Sacred Practices" stat card shows same value as Total Rituals — placeholder |
| D-04 | 🔴 | Ingress Charts `nestedPagination: true` — backend needs `condition.limit/skip`, not nested (see REPO-02) |
| D-05 | 🟠 | User list missing `diviner_mystery_percentage` column — Angular explicitly includes it in `tableheaders` |
| D-06 | 🟡 | Role filter values hardcoded from `roleLabel` object — Angular fetches dynamically from `admin/fetch-role-list` (`val: slug, name: role_name`) |
| D-07 | 🔴 | Role/user_type filter sent via `condition` in `handleFilter` — Angular places user_type in `searchcondition`; current filter is ignored by API |
| D-08 | 🟠 | Missing date range filter on `created_at` — Angular has `datesearch` on `created_at` in user list search |
| D-09 | 🟠 | Per-user Notes system completely absent — Angular wires `notes/listnotedata`, `notes/addnotedata`, `notes/editnotedata`, `notes/deletenotedata` per user row |
| D-10 | 🟡 | `TrainingSettingsDialog` opens with `sequentialEnabled: false` hardcoded — must read `sequential_training_enabled` from user row data |
| D-11 | 🟠 | "Assign Package" dropdown item navigates to `/admin/users/assign-package/[id]` — this route does not exist |
| D-12 | 🟡 | "Conference Room" dropdown item navigates to `/admin/conference-room` — this route does not exist |

---

## ASTROLOGER DASHBOARD (14 tasks)

| ID | Priority | Summary |
|---|---|---|
| AS-01 | 🟠 | Profile page immediately redirects to `/admin/account` — needs real astrologer profile/edit page |
| AS-02 | ✅ DONE | Main dashboard stat tiles are API-driven (8 MetricCard components with live count endpoints) |
| AS-03 | 🟡 | Angular Sales / Customers-by-System / Customers-by-Link are themselves stubs with hardcoded data — low-priority but should be removed or built with real endpoints |
| AS-04 | 🟡 | No Tarot Readings sub-section — Angular doesn't have it either; remove placeholder or confirm requirement |
| AS-05 | ✅ DONE | Notes per customer row implemented: `notes/listnotedata`, `addnotedata`, `editnotedata`, `deletenotedata` |
| AS-06 | 🟠 | Conference Room button on each customer row missing — Angular has `Confarence Room` listener button per customer; opens conference room flow |
| AS-07 | ✅ DONE | Shareable links (Profile URL + Referral Signup URL) with clipboard copy implemented |
| AS-08 | 🔴 | Customer list uses `user/user-list` — must be `user/customer-list` (Angular: `datacollection: 'user/customer-list'`) |
| AS-09 | 🔴 | Missing `service_provider` scoping — Angular injects `libdata.basecondition.service_provider = astrologer._id`; Next.js shows ALL customers regardless of astrologer |
| AS-10 | 🟠 | Count endpoint should be `user/customer-list-count` not `user/user-list-count`; count will be wrong (total users, not astrologer's customers) |
| AS-11 | 🟡 | Customer list missing `last_login_time` column — Angular includes it |
| AS-12 | 🟡 | Customer list missing date range filter on `created_at` — Angular has `datesearch` on `created_at` |
| AS-13 | 🟡 | Customer list missing status select filter — Angular has `selectsearch: [{ field: 'status' }]` |
| AS-14 | 🟠 | No Preview button on customer rows — Angular has `user/user-preview` action button showing name, email, phone, state, city, zip, additional_info, package_names |

---

## MYSTERY SCHOOL (9 tasks)

| ID | Priority | Summary |
|---|---|---|
| MS-01 | 🟠 | Zodiac Wheel entirely missing — Angular shows 12 zodiac cards with images, lock/unlock dates, and active/past/upcoming status computed from current date |
| MS-02 | 🟠 | Slot subscription modal missing — Angular opens `SlotSubscriptionModal` per event slot; calls `event/event-subscription` with single/series subscribe/unsubscribe |
| MS-03 | 🟠 | Training progress ring/percentage missing — Angular fetches via route resolver and shows `trainingLessonData.percentage` as a circular progress display |
| MS-04 | 🟠 | Stripe subscription modal completely missing — Angular calls `stripe/create-subscription-mystery-school` then opens Stripe Elements dialog with payment/setup intent flow; also `stripe/unsubscribe-stripe-mystery` for cancellation |
| MS-05 | 🟠 | Event slots list missing — Angular fetches `event/available-event-slot-list` scoped to `user_id` with load-more pagination; Next.js doesn't have this section |
| MS-06 | 🟡 | Content count section missing — Angular calls `content/content-type-counts` and displays content counts by type on dashboard |
| MS-07 | 🟡 | Quarters display missing — Angular shows 4 quarters with zodiac signs and active/past/upcoming badge based on current date |
| MS-08 | 🟡 | Training page is a generic quick-card wrapper — should show actual lesson list filtered/scoped to mystery school curriculum |
| MS-09 | 🔴 | Entire dashboard is wrong concept — Next.js shows training courses; Angular's actual dashboard is a subscription-gated Zodiac Wheel + event slots + Stripe modal hub |

---

## DIVINER (6 tasks)

| ID | Priority | Summary |
|---|---|---|
| DIV-01 | 🔴 | Orders list (both dashboard and `/orders` page) not filtered to current diviner — must add `user_id: loggedInUserId` to payload |
| DIV-02 | 🟠 | Transactions Preview button missing — Angular opens `CommonPreviewModalComponent` with local row data (userName, email, payment_id, amountStr, paymentOn) |
| DIV-03 | 🔴 | Transactions list missing `customer_id` filter — Angular sets `basecondition.customer_id = userId`; Next.js shows ALL transactions from all users |
| DIV-04 | 🟡 | Transactions list missing date range filter on `paymentOn` — Angular has it |
| DIV-05 | 🟡 | Transactions list missing name/email text search — Angular has `textsearch` for userName and email |
| DIV-06 | 🟡 | Training page uses all-courses generic list — Angular diviner dashboard is mostly empty (stub); but training should likely filter to diviner-specific curriculum |

---

## AFFILIATE (10 tasks)

| ID | Priority | Summary |
|---|---|---|
| AFF-01 | ✅ DONE | Metrics API call (`payment/count-transaction-by-affiliate`) implemented |
| AFF-02 | 🟠 | Copy referral links missing — Angular copies `${frontend_url}payment/${affiliate_id}` (Diviner Signup) and `${affiliate_id}` (Affiliate ID); Next.js has no copy buttons |
| AFF-03 | 🟠 | Edit Affiliate User ID modal missing — Angular opens `edituserNameModal` with availability check (`user/search-affiliate-id-exist-or-not`) + update (`user/update-affiliate-id`) |
| AFF-04 | 🟠 | Click Report is a separate page — Angular opens it as a modal dialog (`ClickReportListComponent`) scoped by `searchcondition: { affiliate_id: userId }`; Next.js separate page has no user filter |
| AFF-05 | 🟠 | Conversion Report is a separate page — Angular opens as modal, Next.js separate page has no user filter; endpoint should filter by `affiliate_id` |
| AFF-06 | 🔴 | Referred users list missing `related_affiliate_id` filter — Angular passes `searchcondition: { related_affiliate_id: userId }`; Next.js shows ALL users of all affiliates |
| AFF-07 | 🟡 | Referred users table missing `city`, `zip`, `status` columns — Angular shows all; Next.js has only name, email, phone, state, total_amount_paid, total_commission, created_at |
| AFF-08 | 🟠 | Stats response field mapping inconsistency — Angular reads `response.result`, `response.totalAmount`, `response.numberOfDiviners`, `response.totalCommission`, `response.totalClick`, `response.totalConversion`; Next.js maps `data.results` which may differ |
| AFF-09 | 🟡 | Missing `number_of_diviner` metric card — Angular shows `numberOfDiviners` stat; Next.js has 5 cards but not this one |
| AFF-10 | 🟡 | Referred users list missing date range filter on `created_at` and status select filter — Angular has both |

---

## SYSTEM / BUGS (15 tasks)

| ID | Priority | Summary |
|---|---|---|
| SYS-01 | 🔴 | Decan-videos list: delete uses `event/event-delete` (wrong endpoint) |
| SYS-02 | 🟠 | Assignments: endpoint `admin/lesson-list` vs Angular's `admin/fetch-lesson-list` — verify |
| SYS-03 | 🔴 | Endpoint typos: `fecth`, `terrot`, `wishdom`, `brodcasting`, `aditonal`, `adginment` |
| SYS-04 | 🔴 | Several edit pages missing `fetchEndpoint`: assignments, perennial-content, perennial/members, webinars |
| SYS-05 | 🟠 | `is_visible` shown in products list but not editable in form |
| SYS-06 | 🟡 | Testimonials requests list lacks approve/reject workflow |
| SYS-07 | 🟠 | Astrologer calendar uses internal `api/availability-list` route instead of external API |
| SYS-08 | 🟠 | Training notifications: zero search or filter fields |
| SYS-09 | 🟠 | Products management list: zero filter fields (no status, no is_visible filter) |
| SYS-10 | 🟡 | Class config list: delete/update endpoints point to `social-advo/` module (wrong) |
| SYS-11 | 🔴 | **GLOBAL**: GenericFormPage sends `{ id }` to fetchEndpoint and `{ ...values, id }` to editEndpoint — every API confirmed to expect `{ _id }`. Edit pre-population AND updates silently fail on ALL pages using GenericFormPage |
| SYS-12 | 🔴 | **GLOBAL**: GenericListPage puts filterField values into `condition` object in payload — all APIs expect filters in `searchcondition`. Status/type filters ignored on every list page |
| SYS-13 | 🔴 | `ManageRoleDialog` (`user-list-table.tsx`) sends `{ id: user.id }` to `user/user-role-update` — same `id` vs `_id` bug as SYS-11 but in a bespoke component; role updates likely fail |
| SYS-14 | 🔴 | Multiple role-specific pages (Astrologer customer list, Diviner orders, Diviner transactions, Affiliate referred users) fetch without user-ID scoping — each returns data for ALL users instead of scoping to the logged-in user via `service_provider`/`customer_id`/`related_affiliate_id` |
| SYS-15 | 🟠 | Dashboard Ingress Charts `is_social_advo` toggle sends `{ _id, is_social_advo }` to `ingress-charts/update-social-advo-flag` — verify this endpoint exists and accepts these fields (not documented in Angular source) |

---

## TASK COUNT SUMMARY

| Source | Tasks |
|---|---|
| Existing repo task files | 5 |
| Users | 6 (1 done) |
| Roles | 8 |
| Packages | 17 |
| Training | 34 |
| Calendar Events | 17 |
| Blog | 19 |
| Videos | 14 |
| Broadcasting | 9 |
| Tarot | 16 |
| Astrology (wheel signs + decan) | 21 |
| Social Advocacy | 12 |
| Ritual Invocation | 5 |
| Perennial Content | 10 |
| Perennial Mandalism | 21 |
| General Content | 9 |
| Spiritual Wisdom | 5 |
| Quarters | 7 |
| Class Configuration | 2 |
| Payments | 4 |
| Refunds | 7 |
| Reports | 5 |
| Webinars | 7 |
| Testimonials | 6 |
| Dashboard | 12 |
| Astrologer Dashboard | 14 (3 done) |
| Mystery School | 9 |
| Diviner | 6 |
| Affiliate | 10 (1 done) |
| System / Bugs | 15 |
| **TOTAL** | **335** |
| Already completed | -5 (U-03, AS-02, AS-05, AS-07, AFF-01) |
| **OPEN** | **330** |
