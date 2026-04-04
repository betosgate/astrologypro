# Module Inventory
## Component-by-component, route-by-route breakdown
## `divine-infinite-being-angular-ui`

> Every component, every route, every API call documented.

---

## MODULE 1 — Admin Dashboard (`/admin-dashboard`)

**Module file:** `admin-dashboard.module.ts`
**Routing file:** `admin-dashboard-routing.module.ts`
**Auth:** `user_type === 'is_admin'`

---

### 1.1 Dashboard (default route)

| Field | Value |
|---|---|
| Component | `DashboardComponent` |
| Route | `/admin-dashboard` (empty path) |
| UI | User list table — all system users |

**Table columns:** Name, Role, Email, Phone, Created On, Last Login Time, Diviner % / Mystery %, Status

**API calls:**
- `POST user/user-list` — paginated user list
- `POST user/user-list-count` — total count
- `GET admin/fetch-role-list` — all roles for filter dropdown
- `POST user/user-preview` — open preview modal
- `POST user/mundane-astrlogy-read-write-access` — grant mundane astrology access

**User actions:**
- Add User button → navigates to `/admin-dashboard/add-user`
- Edit (per row) → navigates to `/admin-dashboard/edit-user/:_id`
- Preview (per row) → dialog: name, email, phone, state, city, zip, additional_info, training percentages
- Mundane Astrology toggle → dialog with Read / Write Access buttons
- Status toggle → inline status change

---

### 1.2 User List

| Field | Value |
|---|---|
| Component | `UserListComponent` |
| Route | `/admin-dashboard/user-list` |
| UI | Enhanced searchable/filterable user list |

**API calls:**
- `POST user/user-list`
- `POST user/user-list-count`
- `GET admin/fetch-role-list`

**Search fields:** Name (text), Email (text), User Type/Role (select), Status (select), Created On (date range)

---

### 1.3 Add / Edit User

| Field | Value |
|---|---|
| Component | `AddUserComponent` |
| Route (create) | `/admin-dashboard/add-user` |
| Route (edit) | `/admin-dashboard/edit-user/:_id` |
| UI | Full user registration / edit form |

**Form fields:** First Name, Last Name, Email (disabled in edit), Phone, State (select), City, Zip, Gender (Male/Female/Others), Password (hidden in edit), Confirm Password (hidden in edit), User Type (select), More about yourself (textarea), Active (checkbox)

**Validation:** Email regex; Password min 8 chars + uppercase + lowercase + number

**API calls:**
- `GET user/states` — state dropdown
- `GET admin/fetch-role-list` — role dropdown
- `POST user/signup` — create
- `POST user/update-user` — edit

---

### 1.4 Assignment Notification

| Field | Value |
|---|---|
| Component | `AssignmentNotificationComponent` |
| Route | `/admin-dashboard/assignment-notification` |
| UI | List of training lesson assignments |

**Table columns:** Added By, Lesson Name, Created Date

**API calls:**
- `POST training-centre/assignment-notification-list`
- `POST training-centre/assignment-notification-list-count`
- `GET admin/lesson-name-autocomplete-with-assignment` — autocomplete

**Search fields:** Lesson Name (autocomplete), Added By Name (text), Added By Email (text), Created On (date range)

**User actions:** Preview modal (full assignment data)

---

### 1.5 Role Management

**Module:** `RoleModule` → `RoleAddModuleModule` (lazy)
**Base route:** `/admin-dashboard/role`

#### 1.5.1 Role List

| Field | Value |
|---|---|
| Component | `RoleListComponent` |
| Route | `/admin-dashboard/role` |
| UI | Table of system roles |

**Table columns:** Role Name, Description, Priority, Status, Joined On, Updated On

**API calls:**
- `POST admin/role-list`
- `POST admin/role-list-count`
- `POST admin/role-status-change`
- `POST admin/role-delete`

**Search fields:** Role Name (text), Joined On (date range), Updated On (date range), Status (select)

**User actions:** Edit, Delete, Status toggle

#### 1.5.2 Add / Edit Role

| Field | Value |
|---|---|
| Component | `AddRoleComponent` |
| Route (create) | `/admin-dashboard/role/add-role` |
| Route (edit) | `/admin-dashboard/role/edit-role/:id` |

**Form fields:** Role Name, Slug, Priority, Description (textarea), Active (checkbox)

**API calls:**
- `POST admin/role-update` — save / update
- `GET admin/role-single-fecth` — fetch for edit

---

### 1.6 Training Management

**Module:** `TrainingModule`
**Base route:** `/admin-dashboard/training`

#### 1.6.1 Training Category List

| Field | Value |
|---|---|
| Component | `TrainingCategoryComponent` |
| Route | `/admin-dashboard/training/training-category` |
| UI | List of training categories |

**Table columns:** Name, Package Name, Priority, Status, Created On

**API calls:**
- `POST admin/training-list`
- `POST admin/training-list-count`
- `POST admin/training-status-change`
- `POST admin/training-category-delete`

**Search fields:** Category Name (text), Updated On (date range), Status (select)

#### 1.6.2 Add / Edit Training Category

| Field | Value |
|---|---|
| Component | `AddEditTrainingCategoryComponent` |
| Route (create) | `/admin-dashboard/training/add-edit-training-category` |
| Route (edit) | `/admin-dashboard/training/add-edit-training-category/:_id` |

**Form fields:** Category Name, Package (select), Priority, Description (CKEditor), For Role (select), Active

**API calls:**
- `GET package/fetch-all-package` — package dropdown
- `GET admin/fetch-role-list` — role dropdown
- `POST admin/training-category-add-update`
- `GET admin/training-category-single-fetch` — fetch for edit

#### 1.6.3 Lesson List

| Field | Value |
|---|---|
| Component | `LessonComponent` |
| Route | `/admin-dashboard/training/lesson` |
| UI | List of training lessons |

**Table columns:** Name, Category, Pre-requisite, Status, Created On

**API calls:**
- `POST admin/lesson-list`
- `POST admin/lesson-list-count`
- `POST admin/lesson-status-change`
- `POST admin/lesson-delete`
- `POST admin/lesson-fetch` — preview modal

**Search fields:** Lesson Name (text), Updated On (date range), Status (select)

#### 1.6.4 Add / Edit Lesson

| Field | Value |
|---|---|
| Component | `AddEditLessonComponent` |
| Route (create) | `/admin-dashboard/training/add-edit-lesson` |
| Route (edit) | `/admin-dashboard/training/add-edit-lesson/:_id` |

**Form fields:** Lesson Name, Category (select), Pre-requisite Lesson (select), Description (CKEditor), Accuracy (number), Active

**API calls:**
- `GET admin/training-category-list`
- `GET admin/lesson-prerequisite-list`
- `POST admin/lesson-add-update`
- `GET admin/lesson-single-fetch`

#### 1.6.5 Quiz List

| Field | Value |
|---|---|
| Component | `QuizMainComponent` |
| Route | `/admin-dashboard/training/quiz` |
| UI | List of quiz questions |

**Table columns:** Question, Lesson, Accuracy, Priority, Status, Created On

**API calls:**
- `POST admin/quiz-list`
- `POST admin/quiz-list-count`
- `POST admin/quiz-status-change`
- `POST admin/quiz-delete`

#### 1.6.6 Add / Edit Quiz

| Field | Value |
|---|---|
| Component | `QuizAddEditMainComponent` |
| Route (create) | `/admin-dashboard/training/quiz/add-quiz` |
| Route (edit) | `/admin-dashboard/training/quiz/edit-quiz/:id` |

**Form fields:** Question, Lesson (select), Options A/B/C/D, Correct Answer, Accuracy, Priority, Active

**API calls:**
- `GET admin/lesson-list`
- `POST admin/quiz-add-update`
- `GET admin/quiz-single-fetch`

#### 1.6.7 Assignment List

| Field | Value |
|---|---|
| Component | `AssignmentListComponent` |
| Route | `/admin-dashboard/training/assignment` |
| UI | List of lesson assignments |

**Table columns:** Title, Lesson Name, Pre-requisite, Status, Created On

**API calls:**
- `POST training-centre/assignment-list`
- `POST training-centre/assignment-list-count`
- `POST training-centre/assignment-status-change`
- `POST training-centre/assignment-delete`
- `GET admin/lesson-name-autocomplete-with-assignment`

**Access:** Admin + Astrologer

#### 1.6.8 Add / Edit Assignment

| Field | Value |
|---|---|
| Component | `AddEditAssignmentComponent` |
| Route (create) | `/admin-dashboard/training/assignment/add-assignment` |
| Route (edit) | `/admin-dashboard/training/assignment/edit-assignment/:id` |

**Form fields:** Assignment Title, Lesson (select), Pre-requisite, Description, Active

**API calls:**
- `GET admin/lesson-list`
- `POST training-centre/assignment-add-update`
- `GET training-centre/assignment-single-fetch`

---

### 1.7 Package Management

**Module:** `PackageModule` → `PackageAddModule` (lazy)
**Base route:** `/admin-dashboard/package`

#### 1.7.1 Package List

| Field | Value |
|---|---|
| Component | `PackageListComponent` |
| Route | `/admin-dashboard/package` |

**Table columns:** Name, Purchase Type, Priority, Status, Created On

**API calls:**
- `POST package/package-list`
- `POST package/package-list-count`
- `POST package/change-status`
- `POST package/delete-package`

**Access:** Admin + Astrologer (Astrologer sees only own packages via `added_by` filter)

#### 1.7.2 Add / Edit Package

| Field | Value |
|---|---|
| Component | `AddPackageComponent` |
| Route (create) | `/admin-dashboard/package/add-package` |
| Route (edit) | `/admin-dashboard/package/edit-package/:id` |

**Form fields:** Name, Description, Purchase Type (Single/Multiple/Subscription), Subscription Period (conditional: Daily/Monthly/Quarterly/Yearly), Price, Package Type (Astrology/Tarot/Combo/Customer — admin only), Active

**API calls:**
- `POST package/package-add-update`
- `GET package/package-single-fetch`
- `GET webinar/fetch-all-webinar`

---

### 1.8 Payment Management

| Field | Value |
|---|---|
| Component | `PaymentListingComponent` |
| Route | `/admin-dashboard/payment` |
| UI | Payment transaction list |

**Table columns:** User Name, Amount, Payment On, Quarter, Schedule

**API calls:**
- `POST payment/payment-list`
- `POST payment/payment-list-count`

**Search fields:** User Name (text), Amount (text), Payment On (date range)

**User actions:** Preview, Refund

---

### 1.9 Webinar Management

**Module:** `WebinerModule`
**Base route:** `/admin-dashboard/webiner`

#### 1.9.1 Webinar List

| Field | Value |
|---|---|
| Component | `WebinerListComponent` |
| Route | `/admin-dashboard/webiner` |

**Table columns:** Title, Priority, Status, Created On

**API calls:**
- `POST webinar/webinar-list`
- `POST webinar/webinar-list-count`
- `POST webinar/webinar-status-change`
- `POST webinar/webinar-delete`

#### 1.9.2 Add / Edit Webinar

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route (create) | `/admin-dashboard/webiner/add-webiner` |
| Route (edit) | `/admin-dashboard/webiner/edit-webiner/:id` |

**Form fields:** Title, Description, Priority, Active

**API calls:**
- `POST webinar/webinar-add-update`
- `GET webinar/webinar-single-fetch`

---

### 1.10 Social Advocacy Management

**Module:** `SocialAdvoModule` → `SocialAdvoAddModule` (lazy)
**Base route:** `/admin-dashboard/social-advo`

#### 1.10.1 Social Advo List

| Field | Value |
|---|---|
| Component | `SocialAdvoListComponent` |
| Route | `/admin-dashboard/social-advo` |

**Table columns:** Title, Frequency, Status, Audio, Created On, Updated On

**API calls:**
- `POST social-advo/social-advo-list`
- `POST social-advo/social-advo-list-count`
- `POST social-advo/social-advo-status-change`
- `POST social-advo/social-advo-deletemany`

**Search fields:** Title (text), Created On / Updated On (date ranges), Status (select)

#### 1.10.2 Add / Edit Social Advo

| Field | Value |
|---|---|
| Component | `AddSocialAdvoComponent` |
| Route (create) | `/admin-dashboard/social-advo/add-social-advo` |
| Route (edit) | `/admin-dashboard/social-advo/edit-social-advo/:id` |

**Form fields:** Title, Frequency (Daily/Weekly/Monthly/Custom), Link (URL), Image (upload), Audio (upload), Active

**API calls:**
- `POST social-advo/social-advo-add-update`
- `GET social-advo/social-advo-single-fetch`

---

### 1.11 Tarot Spreads Management

**Module:** `TarotSpreadsModule` → `TarotSpreadAddModule`, `TarotcardModule` (lazy)
**Base route:** `/admin-dashboard/tarot-spreads`

#### 1.11.1 Tarot Spreads List

| Field | Value |
|---|---|
| Component | `TarotSpreadsListComponent` |
| Route | `/admin-dashboard/tarot-spreads` |

**Table columns:** Spread Name, Description, Priority, Status, Created On, Updated On

**API calls:**
- `POST tarot-spreads/spread-list`
- `POST tarot-spreads/spread-list-count`
- `POST tarot-spreads/spread-status-change`
- `POST tarot-spreads/spread-deletemany`

#### 1.11.2 Add / Edit Tarot Spread

| Field | Value |
|---|---|
| Component | `AddTarotSpreadComponent` |
| Route (create) | `/admin-dashboard/tarot-spreads/add-tarot-spreads` |
| Route (edit) | `/admin-dashboard/tarot-spreads/edit-tarot-spreads/:id` |

**Form fields:** Spread Name, Description, Priority, Thumbnail (image), Active

**API calls:**
- `POST tarot-spreads/spread-add-update`
- `GET tarot-spreads/spread-single-fetch`

#### 1.11.3 Tarot Card List

| Field | Value |
|---|---|
| Component | `TarotcardListComponent` |
| Route | `/admin-dashboard/tarot-spreads/tarot-card/tarotcard-list` |

**API calls:**
- `POST tarot-spreads/tarotcard-list`
- `POST tarot-spreads/tarotcard-delete`

#### 1.11.4 Add / Edit Tarot Card

| Field | Value |
|---|---|
| Component | `TarotcardAddEditComponent` |
| Route (create) | `/admin-dashboard/tarot-spreads/tarot-card/tarotcard-add` |
| Route (edit) | `/admin-dashboard/tarot-spreads/tarot-card/tarotcard-edit/:id` |

**Form fields:** Card Name, Description, Image (upload), Active

**API calls:**
- `POST tarot-spreads/tarotcard-add-update`
- `GET tarot-spreads/tarotcard-single-fetch`

---

### 1.12 Ritual Invocation Management

**Module:** `RitualInvocationModule`
**Base route:** `/admin-dashboard/ritual-invocation`

#### 1.12.1 Ritual Invocation List

| Field | Value |
|---|---|
| Component | `RitualInvocationListComponent` |
| Route | `/admin-dashboard/ritual-invocation` |

**Table columns:** Name, Description, Priority, Status, Created On, Updated On

**API calls:**
- `POST ritual-invocation/ritual-invocation-list`
- `POST ritual-invocation/ritual-invocation-list-count`
- `POST ritual-invocation/ritual-invocation-delete`
- `POST ritual-invocation/ritual-invocation-status-change`

**Search fields:** Ritual Invocation Name (text), Updated On (date range), Status (select)

#### 1.12.2 Add / Edit Ritual Invocation

| Field | Value |
|---|---|
| Component | `RitualInvocationAddComponent` |
| Route (create) | `/admin-dashboard/ritual-invocation/add-ritual-invocation` |
| Route (edit) | `/admin-dashboard/ritual-invocation/edit-ritual-invocation/:id` |

**Form fields:** Name, Description, Instructions, Priority, Active

**API calls:**
- `POST ritual-invocation/ritual-invocation-add-update`
- `GET ritual-invocation/ritual-invocation-single-fetch`

---

### 1.13 Wheel Sign Management

**Module:** `WheelSignModule`
**Base route:** `/admin-dashboard/wheel-sign`

#### 1.13.1 Wheel Sign List

| Field | Value |
|---|---|
| Component | `WheelSignComponent` |
| Route | `/admin-dashboard/wheel-sign` |

**Table columns:** Title, Start Date, End Date, Created Date, Updated Date, Priority

**API calls:**
- `POST wheel_signs/wheel-sign-list`
- `POST wheel_signs/wheel-sign-list-count`
- `GET wheel_signs/wheel-sign-autocomplete` — autocomplete

**Search fields:** Sign Name (autocomplete), Start Date (date range)

**User actions:** Edit, View, Status toggle

#### 1.13.2 Add / Edit Wheel Sign

| Field | Value |
|---|---|
| Component | `WheelSignAddComponent` |
| Route (create) | `/admin-dashboard/wheel-sign/add-wheel-sign` |
| Route (edit) | `/admin-dashboard/wheel-sign/edit-wheel-sign/:id` |

**Form fields:** Title, Start Date, End Date, Theme Image, Icon Image, Assets, Priority, Active

**API calls:**
- `POST wheel_signs/wheel-sign-add-update`
- `GET wheel_signs/wheel-sign-single-fetch`

---

### 1.14 Astro Terrot Decan Info

**Base route:** `/admin-dashboard/astro-terrot-decan-info`

#### 1.14.1 Decan Info List

| Field | Value |
|---|---|
| Component | `AstroTerrotDecanInfoComponent` |
| Route | `/admin-dashboard/astro-terrot-decan-info` |

**Table columns:** Sign, Planet, Tarot Name, Greek Daemon, Decan, Created On

**API calls:**
- `POST wheel_signs/astro-decan-info-list`
- `POST wheel_signs/astro-decan-info-list-count`
- `GET wheel_signs/sign-autocomplete-search-title`
- `GET wheel_signs/demon-autocomplete-search`

#### 1.14.2 Add / Edit Decan Info

| Field | Value |
|---|---|
| Component | `AstroTerrotDecanInfoAddComponent` |
| Route (create) | `/admin-dashboard/astro-terrot-decan-info-add` |
| Route (edit) | `/admin-dashboard/astro-terrot-decan-info-add/:_id` |

**Form fields:** Sign, Planet, Tarot Name, Greek Daemon, Decan, Description, Active

**API calls:**
- `POST wheel_signs/astro-decan-info-add-update`
- `GET wheel_signs/single-event-fetch`

#### 1.14.3 Astro Decan Video/PDF List

| Field | Value |
|---|---|
| Component | `AstroDecanVideoPronuncementListComponent` |
| Route | `/admin-dashboard/astro-decan-video-and-pronuncement-list` |

**Table columns:** Sign, Decan, Title, Added By, Created On

**API calls:**
- `POST wheel_signs/astro-decan-video-pronumcement-list`
- `POST wheel_signs/astro-decan-video-pronumcement-list-count`

#### 1.14.4 Add / Edit Decan Video/PDF

| Field | Value |
|---|---|
| Component | `AddAstroDecanVideosPdfsComponent` |
| Route (create) | `/admin-dashboard/add-astro-decan-videos-pdfs` |
| Route (edit) | `/admin-dashboard/add-astro-decan-videos-pdfs/:_id` |

**Form fields:** Sign, Decan, Title, Video URL, PDF (upload), Description, Active

**API calls:**
- `POST wheel_signs/astro-decan-video-pronuncement-add-update`
- `GET wheel_signs/single-video-pronuncement-fetch`

---

### 1.15 General Content (Journal)

**Base route:** `/admin-dashboard/gernal-info-list`

#### 1.15.1 General Content List

| Field | Value |
|---|---|
| Component | `GernalContentListComponent` |
| Route | `/admin-dashboard/gernal-info-list` |

**Table columns:** Sign, Decan, Title, Description, Added By, Created On

**API calls:**
- `POST wheel_signs/journal-list`
- `POST wheel_signs/journal-list-count`
- `GET wheel_signs/sign-autocomplete-search-title`
- `GET wheel_signs/decan-autocomplete-search`
- `GET wheel_signs/journal-auto-complete-addedBy`

**User actions:** Edit, Delete, Preview

#### 1.15.2 Add / Edit General Content

| Field | Value |
|---|---|
| Component | `GernalContentAddEditComponent` |
| Route (create) | `/admin-dashboard/gernal-content-add-edit` |
| Route (edit) | `/admin-dashboard/gernal-content-add-edit/:_id` |

**Form fields:** Sign, Decan, Title, Description, Content (rich text), Active

**API calls:**
- `POST wheel_signs/journal-add-update`
- `GET wheel_signs/journal-single-fetch`

---

### 1.16 Spiritual Wisdom

**Module:** `SpiritualWisdomModule`
**Base route:** `/admin-dashboard/spiritual-wisdom`

#### 1.16.1 Spiritual Wisdom List

| Field | Value |
|---|---|
| Component | `SpiritualListComponent` |
| Route | `/admin-dashboard/spiritual-wisdom` |

**Table columns:** Title, Descriptive Title, Priority, Status, Created On

**API calls:**
- `POST spiritual-wishdom/spiritual-wisdom-list`
- `POST spiritual-wishdom/spiritual-wisdom-list-count`
- `POST social-advo/social-advo-status-change`
- `POST social-advo/social-advo-deletemany`

**Search fields:** Title (text), Created On (date range), Status (select)

#### 1.16.2 Add / Edit Spiritual Wisdom (Text/Document)

| Field | Value |
|---|---|
| Component | `SpiritualFormComponent` |
| Route (create) | `/admin-dashboard/spiritual-wisdom/add-spiritual` |
| Route (edit) | `/admin-dashboard/spiritual-wisdom/edit-spiritual/:id` |

**Form fields:** Title, Descriptive Title, Content (CKEditor), Image, Priority, Active

**API calls:**
- `POST spiritual-wishdom/spiritual-wisdom-add-update`
- `GET spiritual-wishdom/spiritual-wisdom-single-fetch`

#### 1.16.3 Add / Edit Spiritual Wisdom (YouTube)

| Field | Value |
|---|---|
| Component | `SpiritualYoutubeFormComponent` |
| Route (create) | `/admin-dashboard/spiritual-wisdom/add-youtube` |
| Route (edit) | `/admin-dashboard/spiritual-wisdom/edit-youtube/:id` |

**Form fields:** Title, YouTube URL, Description, Priority, Active

**API calls:**
- `POST spiritual-wishdom/spiritual-youtube-add-update`
- `GET spiritual-wishdom/spiritual-youtube-single-fetch`

---

### 1.17 Content Management (Perennial Mandalism Content)

**Module:** `ContentManagementModule`
**Base route:** `/admin-dashboard/perrenial-mandalism`

#### 1.17.1 Content List

| Field | Value |
|---|---|
| Component | `ContentListComponent` |
| Route | `/admin-dashboard/perrenial-mandalism` |

**Table columns:** Content Type, Title, Description, Access Control, Priority, Status, Added On

**Content types:** Live Stream, Video Library, Document, YouTube Video, Announcement

**Access control values:** Free, Members

**API calls:**
- `POST content/content-list`
- `POST content/content-list-count`
- `POST content/content-update`
- `POST content/content-delete`

**Search fields:** Title (text), Display Dates (date range), Status (select), Access Control (select), Content Type (select)

#### 1.17.2 Add / Edit Content

| Field | Value |
|---|---|
| Component | `AddEditContentComponent` |
| Route (create) | `/admin-dashboard/perrenial-mandalism/add-content` |
| Route (edit) | `/admin-dashboard/perrenial-mandalism/edit-content/:id` |

**Form fields (conditional per type):**
- Live Stream: Title, Stream URL, Start Date/Time, End Date/Time
- Video Library: Title, Video URL
- Document: Title, PDF (upload)
- YouTube: Title, YouTube URL
- Announcement: Title, Content (CKEditor)
- All types: Access Control, Priority, Status (Publish/Not Publish)

**API calls:**
- `POST content/content-add-update`
- `GET content/content-single-fetch`

---

### 1.18 Calendar of Events

**Module:** `CalenderOfEventsModule`
**Base route:** `/admin-dashboard/calender-of-events`

#### 1.18.1 Event List

| Field | Value |
|---|---|
| Component | `CalenderOfEventsComponent` |
| Route | `/admin-dashboard/calender-of-events` |

**Table columns:** Event Name, Description, Category, Start Date/Time, End Date/Time, Display For, Priority, Status, Created On

**Display For options:** Public, Members-Only, Students-Only, Members and Guests

**API calls:**
- `POST event/event-list`
- `POST event/event-list-count`
- `POST event/event-update`
- `POST event/event-delete`
- `GET event/event-autocomplete-search-title`
- `GET event/event-autocomplete-search-category`

**Search fields:** Event Name (autocomplete), Event Category (autocomplete), Event Start Date (date range), Status (select), Display For (select)

#### 1.18.2 Add / Edit Event

| Field | Value |
|---|---|
| Component | `AddEditCalendarOfEventsComponent` |
| Route (create) | `/admin-dashboard/calender-of-events/add-calendar-of-events` |
| Route (edit) | `/admin-dashboard/calender-of-events/edit-calendar-of-events/:_id` |

**Form fields:** Event Name, Description, Category, Start Date, Start Time, End Date, End Time, Event Displayed For (select), Priority, Status, Active

**API calls:**
- `POST event/event-add-update`
- `GET event/event-single-fetch`

---

### 1.19 Refund Request Management

**Module:** `RefundRequestModule`
**Base route:** `/admin-dashboard/refund`

#### 1.19.1 Refund Request List

| Field | Value |
|---|---|
| Component | `RefundRequestComponent` |
| Route | `/admin-dashboard/refund` |

**Table columns:** Product(s), Customer Name, Status, Type, Request ID, Date Submitted

**API calls:**
- `POST refund-processing/refund-processing-list`
- `POST refund-processing/refund-processing-list-count`
- `GET refund-processing/user-name-autocomplete-search`

**Search fields:** Customer Name (autocomplete), Request Number (text), Submitted Date (date range)

**User actions:** View Details, Approve/Reject, Add Comments

#### 1.19.2 Refund Preview Modal

- `RefundRequestPreviewComponent` — shows refund details, product info, customer info, status history

#### 1.19.3 Refund Comment Section

- `RefundRequestCommentSectionAdminComponent`
- `POST refund-processing/add-comment`
- `GET refund-processing/get-comments/:request_id`

#### 1.19.4 Process Refund (Approve / Reject)

- `RefundUserComponent`
- `POST refund-processing/approve-refund`
- `POST refund-processing/reject-refund`

---

### 1.20 Orders

| Field | Value |
|---|---|
| Component | `AdminOrderListComponent` |
| Route | `/admin-dashboard/orders` |

**API calls (via ResolveService):**
- `POST order/order-list`

---

### 1.21 Class Configuration

**Module:** `ClassConfigurationModule`
**Base route:** `/admin-dashboard/class_configure`

#### 1.21.1 Class List

| Field | Value |
|---|---|
| Component | `ConfiguredClassListComponent` |
| Route | `/admin-dashboard/class_configure` |

**API calls:**
- `POST quatermanagement/class_list`
- `POST quatermanagement/class_delete`

#### 1.21.2 Add / Edit Class

| Field | Value |
|---|---|
| Component | `AddClassComponent` |
| Route (create) | `/admin-dashboard/class_configure/add-class-configure` |
| Route (edit) | `/admin-dashboard/class_configure/edit-class-configure/:id` |

**Form fields:** Class Name, Quarter (select), Admin User (select), Session List (dynamic), Active

**API calls:**
- `GET quatermanagement/quater_dropdown`
- `GET user/admin_autocomplete`
- `POST quatermanagement/class_add_update`
- `GET quatermanagement/edit_class_data/:id`

---

### 1.22 Report

| Field | Value |
|---|---|
| Component | `ReportComponent` |
| Route | `/admin-dashboard/report` |
| UI | Report list — Quarter, Schedule, Click Time |

**API calls:**
- `POST report/report-list`
- `POST report/report-list-count`

**Search fields:** Quarter name (text), Clicked On (date range)

**User actions:** Preview modal (clicked time data)

---

## MODULE 2 — Astrologer Dashboard (`/astrologer-dashboard`)

**Module file:** `astrologer-dashboard.module.ts`
**Auth:** `user_type === 'is_astrologer' | 'is_tarotreader' | 'is_astrologer_tarotreader'`

---

### 2.1 Dashboard (Main)

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/astrologer-dashboard` |
| UI | 8 card-based KPI sections, switchable views |

**Views available (toggle flags):**
- customersFlag → CustomerList
- salesFlag → SalesList
- new_customersFlag → NewCustomers
- appointmentsFlag → Appointments
- systemFlag → CustomersBySystem
- customers_linkFlag → CustomersByLink
- amountFlag → TotalAmountOfSale
- libraryFlag → VideoLibrary

**API calls:**
- `POST user/customer-list` (via ResolveService)
- `POST user/customer-list-count`
- `GET package/fetch-all-package?added_by={userinfo._id}`
- `POST user/user-preview` — preview modal
- `POST user/update-user` — Assign Advo / Assign Customer

**User actions:**
- Assign Advo button → opens AssignAdvoModal → `POST user/update-user`
- Assign Customer button → opens AssignAdvoModal → `POST user/update-user`
- Preview → `POST user/user-preview` → dialog
- Conference Room → opens `ParticipantListComponent` dialog
- Copy signup link (clipboard)
- Copy profile link (clipboard)

---

### 2.2 Customers Component

| Field | Value |
|---|---|
| Component | `CustomersComponent` |
| Route | Part of `/astrologer-dashboard` |

**API calls:**
- `POST user/customer-list-count`
- `GET package/fetch-all-package?added_by={id}`
- `POST user/status-change`
- `POST user/delete-user`
- `POST user/user-preview`

**Notes (per customer):**
- `POST notes/listnotedata`
- `POST notes/addnotedata`
- `POST notes/editnotedata`
- `DELETE notes/deletenotedata`

---

### 2.3 Appointments

| Field | Value |
|---|---|
| Component | `AppointmentsComponent` |
| Route | Part of `/astrologer-dashboard` |

**API calls:**
- `POST videogallery/list-count`
- `POST videogallery/video-status-change`
- `POST videogallery/video-delete`

---

### 2.4 Calendar Management

**Module:** `CalendarModule`
**Base route:** `/astrologer-dashboard/calendar-management`

| Sub-route | Component | Purpose |
|---|---|---|
| `/create-event` | `CreateEventComponent` | Create availability slot |
| `/available-slots` | `AvailableSlotsComponent` | View open slots |
| `/booked-slots` | `BookedSlottComponent` | View booked sessions |
| `/event-list` | `EvemtListComponent` | All events list |
| `/editEvent/:_id` | `CreateEventComponent` | Edit existing event |

**API calls (external AWS Lambda — calendar):**
- `POST https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/googleapi/fetch-event-slots` — available slots
- `POST https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/api/availability-list-count` — event count
- `POST https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/googleapi/fetch-booked-slots-count` — booked count
- `DELETE googleapi/delete-event` — delete event

---

### 2.5 Training Center

**Module:** `TrainingCenterModule`
**Base route:** `/astrologer-dashboard/training-center`

| Sub-route | Component |
|---|---|
| `` (empty) | `TrainingMainComponent` |
| `/:training_id` | `TrainingMainComponent` |
| `/:training_id/:lesson_id` | `TrainingMainComponent` |

**API calls (via ResolveService):**
- `GET training-centre/training-centre-list`

---

### 2.6 Profile

**Module:** `ProfileModule`
**Base route:** `/astrologer-dashboard/profile`

| Sub-route | Component |
|---|---|
| `/view/:_id` | `MainComponent` (view) |
| `/edit/:_id` | `EditComponent` (edit) |

**API calls (via ResolveService):**
- `GET user-profile/fetch-profile`

---

### 2.7 Testimonial

**Module:** `TestimonialModule`
**Base route:** `/astrologer-dashboard/testimonial`

| Sub-route | Module |
|---|---|
| `/request-testimonial` | `RequestTestimonialModule` (lazy) |
| `/create-testimonial` | `CreateTestimonialModule` (lazy) |
| `/edit-testimonial` | `CreateTestimonialModule` (lazy) |

---

### 2.8 Package (Astrologer-side)

**Module:** Shared `PackageModule`
**Base route:** `/astrologer-dashboard/package`

Same as admin package list but filtered by `added_by = userinfo._id`

---

## MODULE 3 — Customer Dashboard (`/customer-dashboard`)

**Module file:** `customerdashboard.module.ts`
**Auth:** `user_type === 'is_customer' | 'is_social_advo' | 'is_customer_socialadvo'`

---

### 3.1 Customer Package List (Default)

| Field | Value |
|---|---|
| Component | `CustomerListComponent` |
| Route | `/customer-dashboard` |
| UI | Table of purchased packages |

**Table columns:** Package Name, Package Price, Webinars, Joined On, End Date

**API calls (via ResolveService):**
- `POST package/fetch-purchased-packages`

**Search fields:** Package Name (text), Webinars (text), Joined On (date range)

---

### 3.2 Social Advocacy (Customer)

**Module:** `SocialAdvoModule`
**Route:** `/customer-dashboard/social-advo`

---

### 3.3 Profile (Customer)

**Module:** Shared `ProfileModule`
**Route:** `/customer-dashboard/profile`

---

## MODULE 4 — Mystery School Dashboard (`/mystery-school-dashboard`)

**Module file:** `mystery-school.module.ts`
**Auth:** Cookie flag `userinfo.is_mystery_school === 1` AND `userinfo.mystery_school_status === 'subscription running'`
**Guard:** Opens `MysteryStripeModal` if subscription not active → `POST stripe/create-subscription-mystery-school`

---

### 4.1 Mystery School Dashboard

| Field | Value |
|---|---|
| Component | `MysterySchoolDashboardComponent` |
| Route | `/mystery-school-dashboard` |
| UI | 12 Zodiac Cards (Aries–Pisces) with locked/unlocked states; training stats |

**API calls (via ResolveService):**
- `POST training-centre/training-report-percentage` with `{ role: 'is_mystery_school' }`

---

### 4.2 Mystery Training Center

| Field | Value |
|---|---|
| Component | `MysteryTrainingCenterComponent` |
| Route | `/mystery-school-dashboard/training-center` |

---

### 4.3 Mystery Training Lessons

| Field | Value |
|---|---|
| Component | `MysteryTrainingLessonsComponent` |
| Route | `/mystery-school-dashboard/training-lessons/:_id` |

---

## MODULE 5 — Perennial Mandalism Dashboard (`/perennial-mandalism-dashboard`)

**Module file:** `perennial-mandalism.module.ts`
**Auth:** Cookie flag `userinfo.is_perennial_mandalism === 1` OR `user_type === 'is_Perennial_Mandalism'`
**Subscription check:** `userinfo.perennial_mandalism_status === 'subscription running'`
**Guard:** Opens `PerennialStripeModal` if not active → `POST cart_management/subscription-payment`

---

### 5.1 Perennial Mandalism Dashboard

| Field | Value |
|---|---|
| Component | `PerennialMandalismDashboardComponent` |
| Route | `/perennial-mandalism-dashboard` |

**API calls (via ResolveService):**
- `POST user/fetch-membership-details`

---

### 5.2 Product Detail

| Field | Value |
|---|---|
| Component | `PerennialMandalismProductComponent` |
| Route | `/perennial-mandalism-dashboard/product/:_id` |

---

### 5.3 Ritual Result

| Field | Value |
|---|---|
| Component | `RitualResultComponent` |
| Route | `/perennial-mandalism-dashboard/ritual-result/:_id` |

**API calls (via ResolveService):**
- `POST /ritual-invocation/get-ritual-configuration-of-user`

---

### 5.4 My Rituals

| Field | Value |
|---|---|
| Component | `RitualListComponent` |
| Route | `/perennial-mandalism-dashboard/my-rituals` |

**API calls (via ResolveService):**
- `POST ritual-invocation/ritual-list` with `{ searchcondition: { user_id: '' } }`

---

### 5.5 Additional Member

| Field | Value |
|---|---|
| Component | `AdditionalMemberComponent` |
| Route | `/perennial-mandalism-dashboard/additional_member` |
| UI | Add new family member |

---

### 5.6 Edit Member

| Field | Value |
|---|---|
| Component | `EditPerenialMemberComponent` |
| Route (add) | `/perennial-mandalism-dashboard/add-member` |
| Route (edit) | `/perennial-mandalism-dashboard/add-member/:_id` |

---

### 5.7 Accordion / Relationship Details

| Field | Value |
|---|---|
| Component | `AccordionDetailsComponent` |
| Route | `/perennial-mandalism-dashboard/relationship-details` |

---

## MODULE 6 — Affiliate Dashboard (`/affiate-dashboard`)

**Auth:** `is_affiliate` role

---

### 6.1 Affiliate Main

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/affiate-dashboard` |

**Table columns:** Name, Email, Phone, State, City, Zip, Total Amount Paid, Total Commission, Status, Created On

**KPI cards:** No. of Sales, Total Amount, No. of Diviners, Total Commission, No. of Clicks, No. of Conversions

**API calls (via ResolveService):**
- `POST user/user-fetch-by-affiliate_id`

**Search autocomplete:**
- `GET user/diviner-name-autocomplete-search`
- `GET user/diviner-email-autocomplete-search`

---

## MODULE 7 — Diviner (`/diviner`)

**Auth:** Cookie flag `userinfo.is_diviner === 1`

---

### 7.1 Diviner Dashboard

| Field | Value |
|---|---|
| Component | `DivinerDashboardComponent` |
| Route | `/diviner/dashboard` |

---

### 7.2 Diviner Transactions

| Field | Value |
|---|---|
| Component | `DivinerTransactionsComponent` |
| Route | `/diviner/transactions` |

**API calls (via ResolveService):**
- `POST stripe/transaction-list-fetch`

---

## MODULE 8 — Recorded Session (`/recorded-session`)

**Auth:** AuthGuardService

---

### 8.1 Recorded Session Video UI

| Field | Value |
|---|---|
| Component | `RecordedSessionVideoUiComponent` |
| Route | `/recorded-session` |
| UI | Video player for recorded sessions; password-protected |

**API calls (via ResolveService):**
- `POST conference-room/meeting-recording-token-verification`

**Dialog:** `MeetingPassward` — password entry form

**Actions:**
- `GET user/logout/{username}` — logout
- Enter password to unlock session

---

## MODULE 9 — Conference Room (`/confarence-room`)

---

### 9.1 Conference List

| Field | Value |
|---|---|
| Component | `ConfarenceListComponent` |
| Route | `/confarence-room` |
| UI | Table of all meeting sessions |

**Table columns:** Meeting Title, Start/End Time, Duration, Product Name, Participant Names, Created On

**API calls (via ResolveService):**
- `POST conference-room/meeting-details-list`
- `POST conference-room/attendee-autocomplete-search`

**Custom actions:** "Play session" button

---

## MODULE 10 — Shop (`/shop`)

**Auth:** Public (no guard)

---

### 10.1 Tarot Card Books

| Field | Value |
|---|---|
| Component | `TarrotCardBooksComponent` |
| Route | `/shop/tarrot-card-books` |
| UI | Product cards — 10 tarot books, priced $9.99–$49.99 |

**User actions:** Click card → opens `CardsBooksPosterDetailsComponent` modal

---

### 10.2 Cart

| Field | Value |
|---|---|
| Component | `CartComponent` |
| Route | `/shop/cart` |

---

### 10.3 Posters

| Field | Value |
|---|---|
| Component | `PostersComponent` |
| Route | `/shop/posters` |

---

## MODULE 11 — Product (`/product`)

---

### 11.1 Product Category List

| Field | Value |
|---|---|
| Component | `ProductCategoryListComponent` |
| Route | `/product/category` |

**Table columns:** Image, Title, Description, Status, Priority, Created On, Updated On

**API calls (via ResolveService):**
- `POST product-category/product-category-list`
- `DELETE product-category/product-category-delete`
- `PATCH product-category/product-category-update`

**Search fields:** Title (text), Created On / Updated On (date ranges), Status (select)

### 11.2 Add / Edit Product Category

| Field | Value |
|---|---|
| Component | `ProductCategoryAddEditComponent` |
| Route (add) | `/product/category-add` |
| Route (edit) | `/product/product-category_edit/:_id` |

**API calls (via ResolveService):**
- `POST product-category/product-category-fetch`

### 11.3 Product Management List

| Field | Value |
|---|---|
| Component | `ManagementListComponent` |
| Route | `/product/management` |

**API calls (via ResolveService):**
- `POST product-management/product-management-list`
- `DELETE product-management/product-management-delete`
- `PATCH product-management/product-management-update`

### 11.4 Add / Edit Product Management

| Field | Value |
|---|---|
| Component | `ManagementAddEditComponent` |
| Route (add) | `/product/management-add` |
| Route (edit) | `/product/product-management_edit/:_id` |

**API calls (via ResolveService):**
- `POST product-management/product-management-fetch`

---

## MODULE 12 — Public Calendar (`/calender`)

**Auth:** Public (no guard)

---

### 12.1 Event List

| Field | Value |
|---|---|
| Component | `EventListComponent` |
| Route | `/calender` |
| UI | Public event listing |

**Table columns:** Event Title, Schedule, Start Date, End Date, Timespan (minutes), Created On

**API calls (external Lambda):**
- `POST https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/api/availability-list`
- `DELETE googleapi/delete-event`

### 12.2 Create Availability

| Field | Value |
|---|---|
| Component | `CreateEventComponent` |
| Route | `/calender/create-new-availability` |

### 12.3 Available Slots

| Field | Value |
|---|---|
| Component | `AvailableSlotsComponent` |
| Route | `/calender/availebel-slot` |

---

## MODULE 13 — My Account (`/my-account`)

---

### 13.1 Account Info

| Field | Value |
|---|---|
| Component | `AccountInfoComponent` |
| Route | `/my-account/account-info/:_id` |

**API calls (via ResolveService):**
- `POST user/user-single-fecth`

---

## MODULE 14 — Signup (`/signup`)

**Auth:** Public

---

### 14.1 Signup Form

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/signup` |
| UI | Multi-step registration form (4 groups) |

**Form groups:**
- **grp0:** First Name, Last Name
- **grp1:** Email (regex validated), Phone (min 14 chars), Gender (Male/Female), State, City, Zip
- **grp2/grp3/grp4:** Additional fields

**Validation:**
- Email regex: `^(([^<>()\[\]\\.,;:\s@"]+...`
- Password: min 8 chars + uppercase + lowercase + number

---

## MODULE 15 — Verification (`/verification`)

---

### 15.1 OTP Verification

| Field | Value |
|---|---|
| Component | `OtpComponent` |
| Route | `/verification` |
| UI | OTP code entry after signup |

**Form fields:** OTP (text, required)

**API call:**
- `GET user/signup-verification?username={username}&otp={otp}`

**Navigation:** On success → home (`/`)

---

## MODULE 16 — Forget Password (`/forget-password`)

---

### 16.1 Routes

| Sub-route | Component | Purpose |
|---|---|---|
| `` | `MainComponent` | Entry point |
| `/send-mail` | `SendMailComponent` | Request password reset email |
| `/set-password` | `SetPasswordComponent` | Enter OTP + new password |

**API (set-password):**
- `POST user/send-reset-password-otp`

---

## MODULE 17 — Reset Password (`/reset-password`)

---

### 17.1 Reset Password

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/reset-password` |
| UI | New password entry via reset link |

---

## MODULE 18 — User Profile (`/profile/:unique_name`)

**Auth:** Public — no guard required

---

### 18.1 Profile Container

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/profile/:unique_name` and `/profile/:unique_name/:id` |

**API calls:**
- `POST user-profile/fetch-profile-by-unique-name`

### Sub-components

| Component | Purpose |
|---|---|
| `ProfileDetailsComponent` | Name, bio, contact info display |
| `ProfileProductsComponent` | Service offerings list |
| `ProfileImagesComponent` | Photo gallery |
| `ProfileVideosComponent` | Video content |
| `ProfileTestimonialComponent` | Customer testimonials |
| `ProfileLinksComponent` | Social media / website links |
| `AddImageModalComponent` | Image upload modal |
| `AddVideoModalComponent` | Video upload modal |
| `AddSocialMediaModalComponent` | Social link editor modal |

---

## MODULE 19 — Tarot Card (`/tarot-card`)

**Auth:** AuthGuardService

### 9 Card Spread Routes

| Route | Component | Spread |
|---|---|---|
| `/tarot-card/tarotCard1` | `CardSpreadComponent` | 1-card spread |
| `/tarot-card/tarotCard2` | `CardSpread2Component` | 2-card spread |
| `/tarot-card/tarotCard3` | `CardSpread3Component` | 3-card spread (past/present/future) |
| `/tarot-card/tarotCard4` | `CardSpread4Component` | 4-card spread |
| `/tarot-card/tarotCard5` | `CardSpread5Component` | 5-card spread |
| `/tarot-card/tarotCard6` | `CardSpread6Component` | 6-card spread |
| `/tarot-card/tarotCard7` | `CardSpread7Component` | 7-card spread |
| `/tarot-card/tarotCard8` | `CardSpread8Component` | 8-card spread |
| `/tarot-card/tarotCard9` | `CardSpread9Component` | 9-card spread |

**All spread components:**
- Load tarot card images from `https://divineinfinitebeing.influxiq.com/assets/tarot-card-images/`
- `selectRandomImage(position)` — random card selection, removes from pool
- `cardCurrentImage` — stores selected card per position

---

## MODULE 20 — Services

### ApiservicesService

| Method | Purpose | Auth |
|---|---|---|
| `getHttpData(url)` | GET with Bearer token from cookie | Yes |
| `getHttpDatalogin(url)` | GET without auth | No |
| `getHttpDataWithoutBaseUrl(url)` | GET to custom full URL | Yes |
| `getHttpDataPost(url, body)` | POST with auth + 429 retry (5 attempts, 1s delay) | Yes |
| `getHttpDataPostNoLogin(url, body)` | POST without auth | No |
| `getHttpDataPostcalendar(url, body)` | POST to Calendar Lambda (us-east-1) | Separate |
| `getHttpDataPostcalendarADD(url, body)` | POST to Calendar Lambda (us-east-2) | Separate |
| `getHttpDatacalendar(url)` | GET to calendar Lambda | Separate |
| `getHttpDatalocation(url, body)` | POST to PositionStack | No |
| `postFreeAstroapi(url, body)` | POST with random API key rotation | Key-based |
| `getHttpHoroscopePost(url, body)` | POST to astrology API; fallback on auth refresh | Key-based |
| `getHttpNewHoroscopePost(body)` | POST to AI astrology Lambda | Lambda |
| `getRoomIDPost()` | POST to VideoSDK to create conference rooms | SDK token |

### AuthService

| Method | Checks |
|---|---|
| `loggedInNavigation()` | Returns dashboard route by user_type |
| `islogin()` | Any valid user_type present in cookie |
| `isAdminAuthenticated()` | `user_type === 'is_admin'` |
| `isAstrologerAuthenticated()` | `user_type === 'is_astrologer'` |
| `isTarotAuthenticated()` | `user_type === 'is_tarotreader'` |
| `isBothAuthenticated()` | `user_type === 'is_astrologer_tarotreader'` |
| `isSocialAdvoAuthenticated()` | `is_social_advo` or `is_customer` types |
| `isPerrenialAuthenticated()` | `is_Perennial_Mandalism` or `is_perennial_mandalism === 1` |
| `isMysterySchoolAuthenticated()` | `is_mystery_school === 1` |
| `isDivinerAuthenticated()` | `is_diviner === 1` |
| `convertTo12Hour(time24)` | Utility: 24h → 12h |

### AstroService

- `zodiacRanges` — 12 signs × 3 decans each, with date ranges + tarot card associations
- `getCurrentAstroPosition(inputDate?)` — returns `{sign, decan, range, theme}` for given date
- Decans cover 10-day periods; each linked to Minor Arcana (Two–Ten of Wands/Cups/Swords/Pentacles)

### ThreeService

- Creates 3D scene with 3 sphere meshes (planets)
- `addImage(imagePath, x, y, z, name, id)` — S3 texture images
- `addNormalText(text, mesh, id)` — 3D text
- `animationTxt(stringArray, mesh, id, font, x)` — GSAP text cycling
- `scaleObjects()` — responsive at 1150px and 853px breakpoints
- `disposeRenderer()` / `disposeScene()` — cleanup

### IngressIkonService (IconMapService)

- `iconMap` — 20 entries: 10 planets + 10 zodiac signs → inline SVG strings
- Planets: Jupiter, Mars, Mercury, Moon, Neptune, Pluto, Saturn, Sun, Uranus, Venus
- Zodiacs: 12 signs with Fire/Water/Earth/Air elements
- `getMap()` — returns entire iconMap

---

## MODULE 21 — Shared Components

### Layout Headers

| Component | Used by |
|---|---|
| `HeaderComponent` | Default — admin, astrologer |
| `AstroHeaderComponent` | Astrologer dashboard specific header |
| `DivinerHeaderComponent` | Diviner role header |
| `MysterySchoolHeaderComponent` | Mystery school dashboard |
| `MysterySchoolHeaderNavigationComponent` | Mystery school nav |
| `CustomerHeaderComponent` | Customer dashboard |
| `TarotMenuComponent` | Tarot card route; hides on `/diviner` and `/customer` |
| `FooterComponent` | Site-wide footer |

**HeaderComponent key features:**
- `logout()` → `GET user/logout/{username}` → clear cookies
- `dashboardPage()` → routes by user_type
- `changePass()` → `/change-password`
- `myAccount()` → `/my-account/account-info/{id}`
- Cart count: `GET cart/cart_data_count`
- Last login info from cookie

### Common Components

| Component | Purpose | Key API |
|---|---|---|
| `CarouselComponent` | Reusable image/card carousel | None |
| `ZodiacCardComponent` | Single zodiac card display | None |
| `ZodiacCardDetailsComponent` | Zodiac decan details | None |
| `OrderListComponent` | Order history with refund handling | `cart_management/order-list`, `refund-processing/check-refund-request-products-history`, `refund-processing/shopping-refund-request-create` |
| `VideoPlayerComponent` | Advanced playlist player with progress tracking; limits forward seeking | None (local state) |
| `LoginInfoComponent` | User info + last Printify sync | `product-management/fetch-last-printify-sync-time` |
| `DashboardSwitcherComponent` | Role-based dashboard toggle | None |
| `RefundRequestListComponent` | Refund list (shared between admin and customer) | `refund/refund-list`, `refund/refund-update` |

---

## MODULE 22 — Pipes

| Pipe | Selector | Transformation |
|---|---|---|
| `TitelcasePipe` | `titelcase` | Replaces underscores with spaces, Title Cases words |
| `AstroHeaderImagePipe` | `astroHeaderImage` | Maps planet/aspect name → S3 image URL |
| `AstroHeaderModifierPipe` | `astroHeaderModifier` | Generates inline HTML with planet images |
| `BookmarkPipe` | `bookmarkpipe` | Stub — returns null |
| `ClassModiratorPipe` | `classModirator` | Extracts first planet, returns CSS class string |
| `DatatypePipe` | `datatype` | Returns `typeof value` |
| `GlobalHeaderReturnerPipe` | `globalHeaderReturner` | Builds full HTML header with planet images |
| `IngressIconPipePipe` | `ingressIcon` | Replaces planet/zodiac names with SVG icons |
| `IsPositiveValuePipe` | `ispositivevalue` | Returns `value.length > 0` |
| `SafeHtmlPipe` | `safeHtml` | `DomSanitizer.bypassSecurityTrustHtml()` |

---

---

## MODULE 23 — Blog Management (`/blog-manegement`)

**Auth:** Admin, Astrologer, Tarot Reader, Social Advocate

### 23.1 Blog List

| Field | Value |
|---|---|
| Component | `BlogManagemntComponent` |
| Route | `/blog-manegement` |
| UI | Blog list with search, filters, bulk actions |

**Table columns:** Title, Priority, Status, Available for Perennial, Created On

**API calls:**
- `POST blogmanagement/blog-list`
- `POST blogmanagement/blog-list-count`
- `GET blogmanagement/blog-list-title-autocomplete`
- `POST blogmanagement/blog-status-change`
- `POST blogmanagement/blog-management-deletemany`
- `POST blogmanagement/blog-management-delete`

**User actions:** Add Blog, Edit, Preview, Delete, Status toggle, Multi-select delete

### 23.2 Add / Edit Blog

| Field | Value |
|---|---|
| Component | `AddBlogComponent` |
| Route (create) | `/blog-manegement/add-blog` |
| Route (edit) | `/blog-manegement/edit/:_id` |

**Form fields:** Title, Priority, Description (editor), Images, Files, Audios, Videos, Status, Available for Perennial

**API calls:**
- `GET blog/fetch-all-Blog-category-details-data`
- `POST blogmanagement/blog-add`
- `POST blogmanagement/blog-edit`
- `POST user-profile/request-bucket-url` — S3 upload URL
- `POST user-profile/delete-image-from-bucket` — S3 delete

---

## MODULE 24 — Video Management (`/video-management`)

### 24.1 Video List

| Field | Value |
|---|---|
| Component | `VideoListComponent` |
| Route | `/video-management` |
| UI | Video list with search and filters |

**API calls:**
- `POST videomanagement/video-list`
- `POST videomanagement/video-list-count`
- `GET videomanagement/video-title-autocomplete`
- `POST videomanagement/video-status-change`
- `POST videomanagement/video-management-delete`
- `POST videomanagement/video-management-deletemany`

**User actions:** Add Video, Edit, Preview, Delete, Status toggle

### 24.2 Add / Edit Video

| Field | Value |
|---|---|
| Component | `VideoAddComponent` |
| Route (create) | `/video-management/add-video` |
| Route (edit) | `/video-management/edit/:_id` |

**Form fields:** Title, Priority, Description, Video (upload), Status

**API calls:**
- `POST videomanagement/video-add`
- `POST videomanagement/video-edit`
- `POST user-profile/request-bucket-url`
- `POST user-profile/delete-image-from-bucket`

**Sub-components:** VideoUploadModal, VideoPlayModal

---

## MODULE 25 — Broadcasting (`/brod-casting`)

### 25.1 Broadcasting List

| Field | Value |
|---|---|
| Component | `EditBrodcastingComponent` |
| Route | `/brod-casting` |
| UI | Broadcasting list with search |

**API calls:**
- `POST brodcasting/brodcasting-list`
- `POST brodcasting/brodcasting-list-count`
- `GET brodcasting/brodcasting-autocomplete`
- `POST brodcasting/brodcasting-status-change`
- `POST brodcasting/brodcasting-delete`

### 25.2 Add / Edit Broadcast

| Field | Value |
|---|---|
| Component | `AddBrodcastingComponent` |
| Route (create) | `/brod-casting/add-blog` |
| Route (edit) | `/brod-casting/edit/:_id` |

**Form fields:** Title, Short Description, Description (editor), Status

**API calls:**
- `POST brodcasting/brodcasting-data-add`
- `POST brodcasting/brodcasting-edit`

---

## MODULE 26 — Divination Certification Dashboard (`/divination-certification-dashboard`)

**Auth:** `isDivinerAuthenticated()` — `is_diviner === 1`

### 26.1 Certification Dashboard

| Field | Value |
|---|---|
| Component | `DivinationCertificationDashboardComponent` |
| Route | `/divination-certification-dashboard` |
| Route (lesson) | `/divination-certification-dashboard/training/:training_id/lesson/:lesson_id` |
| UI | Training center for diviner certification — categories, lessons, progress |

**API calls:**
- `POST payment/user-signup-payment-details` — payment/access check
- Training categories via ResolveService

### 26.2 Diviner Order List

| Field | Value |
|---|---|
| Component | `DivinerOrderListComponent` |
| Route | Sub-component / modal |
| UI | Order list for divination services |

---

## MODULE 27 — Showcase Spread (`/showcasespread`)

**Auth:** AuthGuardService — Astrologer, Tarot Reader

### 27.1 Showcase Spread

| Field | Value |
|---|---|
| Component | `ShowcaseSpreadComponent` |
| Route | `/showcasespread` |
| UI | Tarot spread showcase — select cards for each position, submit to customer |

**Form fields:** Customer Name (autocomplete), Selected Spread (select), Card selections per position (dynamic, up to 15 positions)

**API calls:**
- `POST tarot-spreads/spread-list` — fetch available spreads
- `GET tarot-card/tarot-card-fetch` — get cards for selected spread
- `POST tarot-readings/addupdate-readings` — save reading to customer
- `GET user/customer-list-autocomplete` — customer search

**Sub-component:** showcaseSpreadModal — card selection dialog per position

---

## MODULE 28 — Share Spread (`/sharespread`)

**Auth:** Public (shared link)

### 28.1 Share Spread View

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/sharespread/:id` |
| UI | View-only shared tarot reading — spread name, selected cards with positions |

**Data:** Populated from route resolver

---

## MODULE 29 — Horoscope (`/horoscope`)

**Auth:** Public — no guard

### 29.1 Horoscope

| Field | Value |
|---|---|
| Module | `HorosceopModule` |
| Route | `/horoscope` and `/horoscope-share` |
| UI | Horoscope readings view |

---

## MODULE 30 — Customer Signup (`/customer-signup`)

**Auth:** Public

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/customer-signup` |
| UI | Customer registration page (functionality in shared `CustomerSignupFormComponent`) |

---

## MODULE 31 — Astrologer / Tarot Signup (`/astrologer-tarot-signup`)

**Auth:** Public

| Field | Value |
|---|---|
| Component | `MainComponent` |
| Route | `/astrologer-tarot-signup` |
| UI | Astrologer/tarot reader signup (functionality in shared `AstroTarotSignupFormComponent`) |

---

## MODULE 32 — Public Testimonials (`/testimonial`)

### 32.1 Create Testimonial

| Field | Value |
|---|---|
| Component | `CreateTestimonialFormComponent` |
| Route | `/testimonial/create-testimonial/:_id` |
| UI | Submit testimonial for an astrologer/session |

**Form fields:** Title, Customer Name, Customer Email, Phone, Astrologer (select), Feedback (editor), Images, Audio, Videos, Status

**API calls:**
- `GET user/fetch-astro-tarot` — fetch astrologer list
- `POST testimonial/testimonial-add`
- `POST testimonial/testimonial-update`
- `POST user-profile/request-bucket-url`
- `POST user-profile/delete-image-from-bucket`

---

## MODULE 33 — Mystery School Signup (`/mysteryschool-signup`)

### 33.1 Mystery School Signup Form

| Field | Value |
|---|---|
| Component | `MysterySchoolSignupComponent` |
| Route | `/mysteryschool-signup` and `/mysteryschool-signup/:_id` |
| UI | Mystery school enrollment form with full personal info |

**Form fields:** First Name, Last Name, Phone, Email, Date of Birth, Time of Birth (24h), State, City, Zip, Gender, More about yourself, Password, Confirm Password, Status

**API calls:**
- `GET user/states`
- `POST mystery-school/add-signup`
- `POST mystery-school/update-signup`

---

## MODULE 34 — Force Password Change (`/force-password-change`)

### 34.1 Force Password Change

| Field | Value |
|---|---|
| Component | `ForcePasswordChangeComponent` |
| Route | `/force-password-change` |
| UI | Mandatory password change on first login; 2-minute session countdown |

**Form fields:** New Password (min 8 chars + upper + lower + number), Confirm Password

**API calls:**
- `GET https://api.ipify.org?format=json` — get user IP
- `GET https://ipinfo.io/{IP}?token=...` — IP geolocation
- `POST user/force-change-password`
- `POST user/login` — auto re-login after password change
- `GET astro_decan_new_infos/get-astro-toolkit` — fetch astro keys

**Access:** All user types on first login

---

## MODULE 35 — Change Password (`/change-password`)

### 35.1 Change Password

| Field | Value |
|---|---|
| Component | `ChangePasswordComponent` |
| Route | `/change-password` |
| UI | Self-service password change |

**Form fields:** Old Password, New Password, Confirm Password

**API calls:**
- `POST user/change-password`

**Auth:** AuthGuardService

---

## MODULE 36 — Success Page

### 36.1 Success

| Field | Value |
|---|---|
| Component | `SuccessComponent` |
| Route | `/success` (also nested under perennial: `/perennial-mandalism-dashboard/success`) |
| UI | Success message with 10-second countdown then auto-logout |

**API calls:**
- `GET user/logout/{username}`

---

## MODULE 37 — Stripe Success Pages

### 37.1 Perennial Subscription Success

| Field | Value |
|---|---|
| Component | `PerennialSubscriptionSuccessComponent` |
| Route | `/perennial-stripe-success-page` |
| UI | Stripe checkout success for Perennial Mandalism subscription |

### 37.2 Mystery School Subscription Success

| Field | Value |
|---|---|
| Component | `MysterySubscriptionSuccessComponent` |
| Route | `/mystery-stripe-success-page` |
| UI | Stripe checkout success for Mystery School subscription |

---

## MODULE 38 — Ingress Charts

### 38.1 Ingress Details

| Field | Value |
|---|---|
| Component | `IngressDetailsComponent` |
| Route | `/ingress-details/:_id` |
| UI | Ingress chart detail view (stub — data from resolver) |

### 38.2 Ingress Charts

| Field | Value |
|---|---|
| Component | `IngresschartsComponent` |
| Route | `/ingresscharts` |
| UI | Ingress chart list/visualization |

### 38.3 Ingress Charts List

| Field | Value |
|---|---|
| Component | `IngressChartsListComponent` |
| Route | `/ingress-charts-list` |
| UI | Paginated ingress chart list |

**API calls:**
- `POST ingress-charts/get-ingress-chart-by_id` — per-chart detail

### 38.4 Ingress Chart Detail

| Field | Value |
|---|---|
| Component | `IngressChartDetailComponent` |
| Route | `/ingress-chart-details/:_id` |
| UI | Single ingress chart view (from resolver) |

---

## MODULE 39 — Astrologer Dashboard Extended Sub-modules

### 39.1 Astro Work

| Field | Value |
|---|---|
| Module | `AstroworkModule` |
| Route | `/astrologer-dashboard/astrowork` |

**Sub-route:** `/astrology` → `AstrologyComponent` (stub)

### 39.2 Customers by Link

| Field | Value |
|---|---|
| Component | `CustomersByLinkComponent` |
| Route | `/astrologer-dashboard/customers-by-link` |
| UI | Customers acquired via astrologer's referral link |

**API calls:**
- `POST videogallery/list`
- `POST videogallery/list-count`
- `GET videogallery/autocomplete-vieo-title`
- `POST videogallery/video-status-change`
- `POST videogallery/video-delete`

### 39.3 Customers by System

| Field | Value |
|---|---|
| Component | `CustomersBySystemComponent` |
| Route | `/astrologer-dashboard/customers-by-system` |
| UI | Customers acquired via system/admin assignment |

**API calls:** Same as CustomersByLinkComponent

### 39.4 New Customers

| Field | Value |
|---|---|
| Component | `NewCustomersComponent` |
| Route | `/astrologer-dashboard/new-customers` |
| UI | Recently joined customers |

**API calls:** Same as CustomersByLinkComponent

### 39.5 Sales

| Field | Value |
|---|---|
| Component | `SalesComponent` |
| Route | `/astrologer-dashboard/sales` |
| UI | Sales dashboard/analytics |

### 39.6 Total Amount of Sale

| Field | Value |
|---|---|
| Component | `TotalAmountOfSaleComponent` |
| Route | `/astrologer-dashboard/total-amount-of-sale` |
| UI | Revenue total report |

### 39.7 Video Library

| Field | Value |
|---|---|
| Component | `VideoLibraryComponent` |
| Route | `/astrologer-dashboard/video-library` |
| UI | Astrologer's session recordings library |

### 39.8 Shared Signup

| Field | Value |
|---|---|
| Module | `SharedSignupModule` |
| Route | `/astrologer-dashboard/shared-signup` |
| UI | Astrologer-shared signup functionality |

---

## MODULE 40 — Affiliate Dashboard Extended

### 40.1 Click Report List

| Field | Value |
|---|---|
| Component | `ClickReportListComponent` |
| Route | Modal dialog within `/affiate-dashboard` |
| UI | Click analytics — IP, date, source per click |

**API calls:**
- `POST user/List-for-click-conversion`

### 40.2 Conversion Report List

| Field | Value |
|---|---|
| Component | `ConvertionReportListComponent` |
| Route | Modal dialog within `/affiate-dashboard` |
| UI | Conversion analytics — customer name, phone, email, date |

**API calls:**
- `POST user/List-for-click-conversion`

**Additional affiliate API calls:**
- `POST payment/count-transaction-by-affiliate` — stats
- `POST user/update-affiliate-id`
- `POST user/search-affiliate-id-exist-or-not`

---

## Summary Statistics



| Type | Count |
|---|---|
| Lazy-loaded modules | 30+ |
| Components (total, estimated) | 130+ |
| Services | 11 core |
| Route paths (total) | 80+ |
| Custom pipes | 10 |
| API endpoint namespaces | 35+ |
| Auth roles / user_type values | 9 |
| MongoDB collections (backend) | 80+ |
| NestJS modules (backend) | 44 |
| External AWS Lambda endpoints | 4 distinct |
| Third-party libraries | 15 |
