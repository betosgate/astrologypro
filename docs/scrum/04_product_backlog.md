# Product Backlog — Divine Infinite Being Platform
## Scrum Master Format — Epics → Stories → Tasks

> **Point Scale:** 1 = trivial, 2 = small, 3 = medium, 5 = large, 8 = complex, 13 = very complex
> **Priority:** P1 = Sprint-ready | P2 = Next quarter | P3 = Backlog
> **Codebase:** [ANG] = Angular backoffice | [NXT] = Next.js AstrologyPro | [BOTH] = both

---

## EPIC E1 — Authentication & Role Management

> **Goal:** Seamless, secure login for all 8 user types across both codebases.

---

### Story E1-S1 — Dual-role navigation after login `[ANG]` `P1` `5 pts`

**As a** user who has multiple roles in the platform,
**I want** to be taken to the correct portal automatically based on my primary role,
**so that** I don't have to manually navigate after login.

**Acceptance Criteria:**
- [ ] `AuthGuardService` reads `user_type` from `login_user_details` cookie and routes correctly
- [ ] Admin → `/admin-dashboard`
- [ ] Astrologer/Tarot Reader → `/astrologer-dashboard`
- [ ] Customer/Social Advocate → `/customer-dashboard`
- [ ] Perennial Mandalism Member → `/perennial-mandalism-dashboard` (Stripe guard if lapsed)
- [ ] Mystery School Student → `/mystery-school-dashboard` (Stripe guard if lapsed)
- [ ] Affiliate → `/affiate-dashboard`
- [ ] Diviner → Angular `/diviner` stub (primary portal is AstrologyPro)
- [ ] Wildcard routes show friendly 404 page, not a blank screen

**Tasks:**
- T1: Audit `AuthGuardService` routing logic for all 8 roles
- T2: Confirm Stripe subscription guard fires correctly for Perennial Mandalism and Mystery School
- T3: Replace `WrongPageComponent` with branded 404 page

---

### Story E1-S2 — OTP and password recovery hardening `[ANG]` `P2` `3 pts`

**As a** user who forgets my password or triggers OTP,
**I want** a reliable, clear recovery flow,
**so that** I can regain access without contacting support.

**Acceptance Criteria:**
- [ ] Forgot password email arrives within 60s
- [ ] Reset link expires after 1 hour
- [ ] OTP has a resend option with cooldown timer
- [ ] Success/failure states show clear user-facing messages

**Tasks:**
- T1: Add resend OTP button with 60s cooldown
- T2: Add expiry message on invalid reset link
- T3: Add loading states to all auth forms

---

### Story E1-S3 — Remove duplicate AuthService `[ANG]` `P2` `2 pts`

**As a** developer,
**I want** a single canonical `AuthService`,
**so that** bugs fixed in one place are not re-introduced from a stale copy.

**Acceptance Criteria:**
- [ ] `shared/auth.service.ts` merged into `services/auth.service.ts` or vice versa
- [ ] All imports updated throughout the app
- [ ] No runtime errors in any existing auth flow

**Tasks:**
- T1: Audit all imports of both auth services
- T2: Merge logic; remove redundant file
- T3: Delete commented-out `AuthguardGuard`

---

### Story E1-S4 — Add TypeScript models for all API contracts `[ANG]` `P2` `5 pts`

**As a** developer,
**I want** strongly typed interfaces for every API request and response,
**so that** compilation catches contract mismatches before they hit production.

**Acceptance Criteria:**
- [ ] `models/` folder created with interfaces per domain
- [ ] `ApiservicesService` generics updated: `getHttpData<T>()`, `getHttpDataPost<T>()`
- [ ] `ResolveService` returns typed data to components
- [ ] No `any` type in service layer

**Tasks:**
- T1: Create `models/user.model.ts` (UserInfo, LoginUserDetails cookie shape)
- T2: Create `models/appointment.model.ts` (booking/session shape)
- T3: Create `models/package.model.ts` (service package shape)
- T4: Create `models/training.model.ts` (training category/lesson/quiz shape)
- T5: Create `models/payment.model.ts` (Stripe transaction/subscription shape)
- T6: Update all services to use generics

---

## EPIC E2 — User & Session Management `[ANG]` `[NXT]`

> **Goal:** Complete admin visibility and control over all platform users, sessions, and billing events.

---

### Story E2-S1 — Admin user list with search and filters `[ANG]` `P1` `5 pts`

**As an** admin,
**I want** a fast, filterable user list across all roles,
**so that** I can find any user without scrolling through hundreds of records.

**Acceptance Criteria:**
- [ ] Search by name, email, phone number
- [ ] Filter by role (Admin, Astrologer, Tarot Reader, Customer, Social Advocate, Affiliate, Diviner, Mystery School Student, Community Member)
- [ ] Filter by account status (active / blocked / pending)
- [ ] Server-side pagination (not client-side filtering)
- [ ] Sort by date joined, name, status
- [ ] Page size selector (10, 25, 50)

**Tasks:**
- T1: Add search field with 300ms debounce to `GET /admin/user-list`
- T2: Add role filter dropdown wired to `user_type` field
- T3: Add status filter (active / blocked)
- T4: Wire `condition.limit` and `condition.skip` to paginator
- T5: Add sort header columns

---

### Story E2-S2 — Admin user detail: notes, login history, block/unlock `[ANG]` `P1` `8 pts`

**As an** admin,
**I want** to view a user's full activity history and manage their account from a single panel,
**so that** I can support, investigate, or action any user without needing database access.

**Acceptance Criteria:**
- [ ] User detail panel shows: profile info, role, status, join date
- [ ] Notes tab: add/edit/delete notes with author + timestamp (via `notes/*` API)
- [ ] Login history tab: last 20 logins with timestamp, IP address, browser, location
- [ ] Block/Unblock user with reason field (reason saved to notes automatically)
- [ ] Blocked users cannot log in; see clear "account suspended" message
- [ ] Admin can view and copy user's last login token details for debugging

**Tasks:**
- T1: Add login event logging to auth flow: IP, user agent, timestamp, location (via ipinfo)
- T2: Create `user_login_history` collection/table (user_id, ip, browser, location, logged_at)
- T3: `GET /admin/user-login-history/:id` — return last 20 login events
- T4: Build login history tab UI in user detail modal
- T5: Add block/unblock toggle with reason field; auto-create note on block
- T6: Verify `notes/add-note`, `notes/update-note`, `notes/delete-note` work in admin context

---

### Story E2-S3 — Lead no-show auto-refund webhook `[NXT]` `P1` `8 pts`

**As a** platform operator,
**I want** refunds to process automatically based on attendance,
**so that** diviners and clients don't need to manually request or approve refunds.

**Acceptance Criteria:**
- [ ] If diviner doesn't join room within 5 min of start → 100% refund issued via Stripe
- [ ] If client doesn't show (diviner attended) → 50% refund, 50% retained
- [ ] Platform keeps its 20% cut of the retained 50%
- [ ] Client receives email notification of refund amount
- [ ] Diviner receives email notification of no-show event
- [ ] Admin dashboard shows all auto-refund events with reason

**Tasks:**
- T1: Detect session participants via room/session presence API
- T2: Create `POST /api/sessions/check-attendance` cron (runs at `start_time + 10 min`)
- T3: Implement diviner no-show refund path in Stripe
- T4: Implement client no-show partial-refund path
- T5: Send `sendDivinerNoShow` email to diviner
- T6: Send `sendClientNoShowRefund` email to client
- T7: Log event to `auto_refunds` table

---

### Story E2-S4 — Card-on-file billing 24h after session `[NXT]` `P1` `8 pts`

**As a** diviner,
**I want** clients to be billed automatically 24h after a confirmed session,
**so that** I don't need to manually charge each client.

**Acceptance Criteria:**
- [ ] Session marked "confirmed" when both parties are detected in room
- [ ] 24h cron charges client's saved payment method via Stripe
- [ ] If charge fails → email sent to client with retry link
- [ ] Diviner receives payout notification
- [ ] Admin sees billing status per session

**Tasks:**
- T1: Create `confirmed_at` timestamp on bookings table
- T2: Build attendance detection (Twilio room events or webhook)
- T3: Create cron `POST /api/cron/charge-confirmed-sessions` (runs every hour)
- T4: Implement Stripe charge from `default_payment_method_id`
- T5: Handle charge failure → `sendPaymentFailedClient` email
- T6: Log charge attempt + result to `billing_events` table

---

### Story E2-S5 — Policy acknowledgement at checkout `[NXT]` `P1` `3 pts`

**As a** client booking a session,
**I want** to clearly acknowledge the no-show and refund policy before paying,
**so that** I'm not surprised by charges if I miss an appointment.

**Acceptance Criteria:**
- [ ] Checkbox at checkout: "I understand 50% of my payment is retained if I don't attend"
- [ ] Cannot proceed without checking the box
- [ ] Policy text links to full policy page
- [ ] Acknowledgement timestamp saved on booking record

**Tasks:**
- T1: Add policy checkbox to booking wizard step 3
- T2: Save `policy_acknowledged_at` to bookings table
- T3: Create `/policy` page with full text
- T4: Link from checkout to policy page

---

## EPIC E3 — Training / Certification School `[NXT]` `[ANG admin]`

> **Goal:** Full slide-by-slide video training school with forced comprehension testing, graduation certificate, and post-graduation Tabby consultation booking.

---

### Story E3-S1 — Course module list `[NXT]` `P1` `5 pts`

**As a** trainee,
**I want** to see all ~60 training modules in order with clear status indicators,
**so that** I know exactly where I am and what comes next.

**Acceptance Criteria:**
- [ ] Ordered list of all modules from DB
- [ ] Status per module: `locked` / `available` / `in-progress` / `completed`
- [ ] Module N+1 is locked until module N is 100% complete
- [ ] Clicking an available module opens the video player
- [ ] Overall % progress shown at top of page

**Tasks:**
- T1: Create `training_modules` table (id, title, order, video_url, created_at)
- T2: Create `trainee_module_progress` table (trainee_id, module_id, status, completed_at)
- T3: `GET /api/training/modules` — returns modules with trainee's status
- T4: Build module list UI with status icons and lock overlay
- T5: Build progress bar component

---

### Story E3-S2 — Video player with slide-triggered quiz `[NXT]` `P1` `13 pts`

**As a** trainee watching a training video,
**I want** quiz questions to automatically appear at each slide transition,
**so that** I am tested on every concept as it's presented.

**Acceptance Criteria:**
- [ ] Video plays with standard controls
- [ ] At each slide transition timestamp, video pauses and a quiz lightbox appears
- [ ] Lightbox shows 2 multiple-choice questions per slide
- [ ] Correct answer → green checkmark → proceed to next question (then resume video)
- [ ] Wrong answer → red feedback → "Rewatch this section" button appears
- [ ] Rewatch replays from slide start timestamp back to the quiz point
- [ ] After rewatching, quiz reappears with same questions
- [ ] All questions answered correctly → video resumes automatically
- [ ] Module marked complete when all slides + questions pass

**Tasks:**
- T1: Create `training_slides` table (module_id, slide_number, timestamp_seconds, title)
- T2: Create `training_questions` table (slide_id, question_text, options JSON, correct_option)
- T3: Create `trainee_slide_progress` table (trainee_id, slide_id, passed_at)
- T4: Build video player wrapper with timestamp event hooks
- T5: Build quiz lightbox component (2 MCQs, pass/fail states)
- T6: Implement "Rewatch section" — seek video to slide start timestamp
- T7: `POST /api/training/slide-complete` — record pass for slide
- T8: `POST /api/training/module-complete` — called when all slides pass
- T9: Add loading/saving state to prevent double-submissions

---

### Story E3-S3 — AI question generation pipeline `[ANG admin]` `P1` `8 pts`

**As an** admin,
**I want** to upload a PowerPoint and have Claude automatically generate 2 MCQs per slide,
**so that** we can populate the question bank for 60 modules without manual authoring.

**Acceptance Criteria:**
- [ ] Admin uploads `.pptx` file in video management area
- [ ] System extracts slide content (text + notes)
- [ ] API call to Claude generates 2 MCQs per slide (question, 4 options, 1 correct)
- [ ] Generated questions shown for admin review before saving
- [ ] Admin can edit any question/option/answer before confirming
- [ ] Confirmed questions saved to `training_questions` table

**Tasks:**
- T1: Add PPTX upload field to admin Video Management
- T2: `POST /api/admin/training/generate-questions` — parse PPTX, call Claude API, return question draft
- T3: Build "Question Review" UI in admin (edit inline, approve/reject per question)
- T4: `POST /api/admin/training/save-questions` — bulk save approved questions
- T5: Handle API rate limits / chunk large decks

---

### Story E3-S4 — Graduation certificate `[NXT]` `P1` `5 pts`

**As a** trainee who completes all modules,
**I want** to receive a printable PDF certificate,
**so that** I have proof of my certification to display or share.

**Acceptance Criteria:**
- [ ] Certificate generated immediately on final module completion
- [ ] Certificate states: name, date, "School of the Divine Infinite Being"
- [ ] Certificate states: "Trained and tested in X categories of Astrology and Y categories of Tarot"
- [ ] Certificate is printable (A4 landscape, high resolution)
- [ ] PDF downloadable from trainee portal
- [ ] Certificate accessible again at any future time (stored, not generated on-demand)

**Tasks:**
- T1: Count astrology vs tarot category totals from `training_modules`
- T2: Generate PDF using a server-side library (e.g., `pdf-lib` or Puppeteer)
- T3: Store generated PDF URL in `trainee_certificates` table
- T4: `GET /api/training/certificate` — return PDF URL for trainee
- T5: Add "Download Certificate" button in trainee portal
- T6: Design certificate HTML template (branded, printable)

---

### Story E3-S5 — Post-graduation Tabby consultation booking `[NXT]` `P1` `5 pts`

**As a** newly graduated trainee,
**I want** to easily book my 2-hour consultation with Tabby,
**so that** I can complete my certification process and get personalized support.

**Acceptance Criteria:**
- [ ] After graduation, a prominent booking CTA appears: "Book your graduation consultation"
- [ ] Embedded Google Calendar scheduling for Tabby's 2-hour slots
- [ ] Booked slot confirmed via email to trainee + Tabby
- [ ] If not booked within 3 days → reminder email sent
- [ ] If not booked within 7 days → second reminder sent
- [ ] Booking status visible in admin dashboard (booked / pending / completed)

**Tasks:**
- T1: Tabby's calendar connected (Google Calendar API or Calendly alternative)
- T2: `GET /api/training/tabby-slots` — fetch available 2h slots
- T3: `POST /api/training/book-tabby` — create booking, notify both parties
- T4: Cron: 3-day and 7-day reminders via `sendTabbyBookingReminder` email
- T5: Add Tabby booking status column to admin users page

---

### Story E3-S6 — Admin: course content management `[ANG]` `P1` `5 pts`

**As an** admin,
**I want** to manage all training modules and their videos from the backoffice,
**so that** I can add, reorder, update, and retire content without developer help.

**Acceptance Criteria:**
- [ ] Admin can create a module (title, description, category: astrology/tarot, order)
- [ ] Admin can upload video URL or embed external video
- [ ] Admin can reorder modules via drag-and-drop
- [ ] Admin can archive a module (hides from trainees, doesn't delete data)
- [ ] Admin can view per-module stats: % of students completed, avg quiz pass rate

**Tasks:**
- T1: Add "Training Modules" section to admin Video Management
- T2: `GET/POST/PATCH /api/admin/training/modules` endpoints
- T3: Build module CRUD form
- T4: Add drag-and-drop reorder (CDK DragDrop)
- T5: Add module analytics card (completion %, avg quiz score)

---

## EPIC E4 — Community Membership Portal `[NXT]`

> **Goal:** Full-featured community back office for individual and family members with natal charts, relationship charts, monthly transits, and content access.

---

### Story E4-S1 — Community signup & subscription checkout `[NXT]` `P1` `8 pts`

**As a** visitor interested in astrology,
**I want** to join the community with a simple checkout,
**so that** I get immediate access to my charts and resources.

**Acceptance Criteria:**
- [ ] `/join/community` page shows individual ($9.97/month) and family ($19.97/month) options
- [ ] Stripe Checkout initiated on selection
- [ ] On payment success → `community_members` row created, `membership_type` set
- [ ] Welcome email sent with portal link
- [ ] Magic-link login sent automatically (no password needed)
- [ ] Failed payment → clear error message, no account created

**Tasks:**
- T1: Create `community_plans` Stripe products ($9.97 individual, $19.97 family)
- T2: `POST /api/community/subscribe` — create checkout session
- T3: Stripe webhook `payment_intent.succeeded` → provision community member
- T4: Send `sendCommunityWelcome` email
- T5: Add family vs individual selector on `/join/community` page

---

### Story E4-S2 — Family unit management `[NXT]` `P1` `8 pts`

**As a** community member,
**I want** to add family members with their birth data,
**so that** everyone in my family gets their own natal chart.

**Acceptance Criteria:**
- [ ] Community member can add up to 5 family members (family plan)
- [ ] Each person: name, date of birth, time of birth (optional), city/country
- [ ] If time-of-birth omitted → soft prompt: "Add for greater accuracy"
- [ ] Each family member gets an individual natal chart
- [ ] Charts are age-appropriate: < 14 = simplified (planets only); ≥ 14 = full
- [ ] Member can edit a family member's details (regenerates chart)

**Tasks:**
- T1: Create `community_family_members` table (member_id, name, dob, birth_time, city, country, age_group)
- T2: `GET/POST/PATCH/DELETE /api/community/family` CRUD
- T3: Build "My Family" management UI
- T4: Add birth time optional field with accuracy prompt
- T5: Age-group detection logic (< 14 = child, ≥ 14 = adult)

---

### Story E4-S3 — Natal chart generation and display `[NXT]` `P1` `13 pts`

**As a** community member,
**I want** to view my natal chart and those of my family members,
**so that** I understand our individual astrological profiles.

**Acceptance Criteria:**
- [ ] Natal chart generated via Astrology API (`https://json.astrologyapi.com/v1/`)
- [ ] Generated once and stored — not re-fetched on every page load
- [ ] Adult chart: all planets, houses, aspects, ascendant, nodes
- [ ] Child chart (< 14): planets only, no house/aspect details
- [ ] Chart displayed as visual wheel (SVG) AND as text interpretation
- [ ] "Add birth time" prompt shown if time was skipped
- [ ] If birth data changes → chart regenerated on save

**Tasks:**
- T1: Create `natal_charts` table (family_member_id, chart_data JSON, generated_at)
- T2: Integrate `astrologyapi.com` natal chart endpoint
- T3: Build natal chart wheel SVG component
- T4: Build text interpretation display
- T5: `POST /api/community/generate-natal` — fetch + store chart
- T6: Handle child vs adult content rules
- T7: Cache-invalidation on birth data edit

---

### Story E4-S4 — Relationship charts `[NXT]` `P1` `8 pts`

**As a** community member with family,
**I want** to view relationship (synastry) charts between any two family members,
**so that** I understand our astrological compatibility.

**Acceptance Criteria:**
- [ ] All pairings within family unit listed (e.g., Mom↔Dad, Mom↔Child1, Dad↔Child1)
- [ ] Each pair has a synastry chart
- [ ] Generated once on family setup; regenerated only when birth data changes
- [ ] Chart shown as text interpretation (visual optional)
- [ ] Works for any 2 members including primary + family

**Tasks:**
- T1: Create `relationship_charts` table (person_a_id, person_b_id, chart_data JSON, generated_at)
- T2: Auto-generate all pairings when family member is added
- T3: Integrate `astrologyapi.com` synastry endpoint
- T4: Build "Relationship Charts" section with pairing selector
- T5: `POST /api/community/generate-relationship` — fetch + store chart

---

### Story E4-S5 — Monthly transits auto-generation `[NXT]` `P1` `8 pts`

**As a** community member,
**I want** to see my monthly transits each month automatically,
**so that** I have timely astrological guidance without any action on my part.

**Acceptance Criteria:**
- [ ] Cron runs on the 1st of each month for all adult community members (≥ 14)
- [ ] Transits fetched from Astrology API and stored in DB
- [ ] Members log in to view current month's transits
- [ ] Previous month's transits accessible in history
- [ ] "Book a reading" CTA shown below transits (5% member discount applied)
- [ ] If generation fails → admin notified; retry logic

**Tasks:**
- T1: Create `monthly_transits` table (member_id, year, month, transit_data JSON, generated_at)
- T2: `POST /api/cron/generate-monthly-transits` — cron endpoint (secured)
- T3: Integrate Astrology API transits endpoint
- T4: Build transits display page in community portal
- T5: Add month navigation (current/previous)
- T6: Add "Book a Reading" CTA with 5% discount logic
- T7: `GET /api/community/transits?month=2026-05` — fetch stored transits

---

### Story E4-S6 — Content library (PDFs + links) `[NXT]` `P2` `3 pts`

**As a** community member,
**I want** access to the three holy books and doctrine content,
**so that** I have the spiritual study materials the community is based on.

**Acceptance Criteria:**
- [ ] PDFs available: Bhagavad Gita, Gospel of Thomas, Tao Te Ching
- [ ] Links to Central Doctrine (website + YouTube)
- [ ] Link to Five-fold Creed video
- [ ] "Become a Certified Diviner" CTA (links to school info)
- [ ] All PDFs open in a viewer (not downloaded directly)

**Tasks:**
- T1: Upload 3 PDFs to storage (Supabase storage or S3)
- T2: Build "Library" section in community portal
- T3: Integrate `ng2-pdf-viewer` equivalent (or use iframe) in Next.js
- T4: Add Central Doctrine + Five-fold Creed links
- T5: Add diviner CTA card

---

### Story E4-S7 — Sunday Service section `[NXT]` `P2` `3 pts`

**As a** community member,
**I want** access to Beto's weekly Sunday Service recordings,
**so that** I can follow his commentary even if I missed the live session.

**Acceptance Criteria:**
- [ ] Sunday Service archive shows past recordings (video + date)
- [ ] Latest session shown first
- [ ] Admin can add new sessions easily
- [ ] If live stream is active → shows live stream embed at top

**Tasks:**
- T1: Create `sunday_service_sessions` table (title, video_url, recorded_at, is_live)
- T2: `GET /api/community/sunday-service` — list sessions
- T3: Build Sunday Service section UI
- T4: Admin panel entry to add new sessions

---

## EPIC E5 — Mystery School `[NXT]`

> **Goal:** Full Perennial Mandalism Mystery School system: seasonal entry, 12-week foundation, 36-decan year-long practice with journaling and ritual completion tracking.

---

### Story E5-S1 — Enrollment & subscription `[NXT]` `P1` `8 pts`

**As a** community member ready to go deeper,
**I want** to enroll in the Mystery School with a single checkout,
**so that** I can begin my 5-quarter practice journey.

**Acceptance Criteria:**
- [ ] Mystery School available from community portal (upgrade path)
- [ ] Stripe charges $97 one-time entry fee + starts $27/month subscription
- [ ] $9.97 community subscription cancelled / replaced automatically
- [ ] Student selects starting quarter (spring equinox / summer solstice / autumn equinox / winter solstice)
- [ ] Welcome email with start date and first week instructions
- [ ] Foundation 12 weeks unlocked immediately on enrollment

**Tasks:**
- T1: Create Mystery School Stripe products ($97 one-time, $27/month)
- T2: `POST /api/mystery-school/enroll` — charge + provision
- T3: Cancel community subscription; start mystery school subscription
- T4: Create `mystery_school_students` table (user_id, enrolled_at, start_quarter, status)
- T5: Send `sendMysterySchoolWelcome` email with start date
- T6: Unlock foundation content on enrollment

---

### Story E5-S2 — Foundation 12-week training `[NXT]` `P1` `8 pts`

**As a** Mystery School student,
**I want** structured week-by-week content for my first 12 weeks,
**so that** I know exactly what to study and practice each week.

**Acceptance Criteria:**
- [ ] 12 weeks displayed with week number, title, and content
- [ ] Each week has: reading/instruction content + Beto audio clip (with photo)
- [ ] Weeks unlock sequentially (week N+1 after week N marked complete)
- [ ] Student marks week as "done" manually
- [ ] Audio player shows Beto's photo + plays recorded introduction
- [ ] Admin can upload content + audio per week

**Tasks:**
- T1: Create `mystery_school_foundation_weeks` table (week_number, title, content, audio_url)
- T2: Create `student_foundation_progress` table (student_id, week_number, completed_at)
- T3: `GET /api/mystery-school/foundation` — return weeks with student progress
- T4: `POST /api/mystery-school/foundation/complete-week` — mark week done
- T5: Build week-by-week UI with audio player + progress markers
- T6: Admin: upload audio + set content per week

---

### Story E5-S3 — Decan system: calendar & unlock logic `[NXT]` `P1` `13 pts`

**As a** Mystery School student past the foundation quarter,
**I want** the 36 decan sets to unlock at the right times based on my entry season,
**so that** I always know which decan I'm currently working with and when.

**Acceptance Criteria:**
- [ ] 36 decans defined with exact date ranges (astronomical decan calendar)
- [ ] Based on student's start quarter, first decan to work is calculated
- [ ] 1 week before a decan's start → that sign's 3-decan set unlocks (visible, not just accessible)
- [ ] Decan shows: name, date range, planet, sign, ritual content
- [ ] Bold date display: "Perform this ritual between [DATE] and [DATE]"
- [ ] 2-day grace period after decan ends before marking as missed
- [ ] Missed decan → flagged; same decan available again in next year's cycle
- [ ] Progress map shows all 36 decans: locked / upcoming / current / completed / missed

**Tasks:**
- T1: Create `decans` seed table (decan_number, sign, planet, start_month, start_day, end_day, title)
- T2: Create `student_decan_progress` table (student_id, decan_id, status, ritual_done, scry_done, journal_done, completed_at)
- T3: Decan unlock cron — runs daily, unlocks decan sets 7 days before start
- T4: Grace-period enforcement — missed flag set at `end_date + 2 days` if incomplete
- T5: `GET /api/mystery-school/decans` — return calendar with student progress
- T6: Build 36-decan progress map (grid or spiral visual)
- T7: Build individual decan view with date display, ritual, and submission forms

---

### Story E5-S4 — Ritual performer (pre-built per decan) `[NXT]` `P1` `8 pts`

**As a** Mystery School student entering a decan,
**I want** to see and perform the pre-built ritual for that decan,
**so that** I know exactly what to do without having to design anything myself.

**Acceptance Criteria:**
- [ ] Each decan has a pre-built ritual (invocation, gates, sequence)
- [ ] Ritual displayed step-by-step (not a builder — read-only during school)
- [ ] Student progresses through steps with "Done" confirmation per step
- [ ] Completion of all ritual steps marks `ritual_done = true` for that decan
- [ ] Ritual content loaded from admin-seeded data (not user-created)

**Tasks:**
- T1: Create `decan_rituals` table (decan_id, step_order, step_type, content)
- T2: Seed all 36 decan rituals from existing Beto content
- T3: `GET /api/mystery-school/decan/:id/ritual` — return ritual steps
- T4: `POST /api/mystery-school/decan/:id/ritual-complete` — mark ritual done
- T5: Build step-through ritual UI (collapsible steps, "Mark done" per step)

---

### Story E5-S5 — Scrying and journaling submissions `[NXT]` `P1` `5 pts`

**As a** Mystery School student,
**I want** to record my scrying experience and mundane impact journal within each decan,
**so that** my practice is documented and I meet the completion requirements.

**Acceptance Criteria:**
- [ ] Scrying journal: textarea for card description + insights (rich text optional)
- [ ] Mundane impact journal: textarea for relationship/business/perception shifts
- [ ] Both forms saved per decan per student
- [ ] Submitted entries timestamped
- [ ] Submission within grace period counts toward completion
- [ ] Student can view their own past submissions (read-only after submission)
- [ ] Admin can view all student journals (private by default, only admin access)

**Tasks:**
- T1: `scry_journals` table (student_id, decan_id, content, submitted_at)
- T2: `mundane_journals` table (student_id, decan_id, content, submitted_at)
- T3: `POST /api/mystery-school/decan/:id/scry` — submit scrying journal
- T4: `POST /api/mystery-school/decan/:id/journal` — submit mundane journal
- T5: Build journal submission forms in decan view
- T6: Build journal history view per student

---

### Story E5-S6 — Graduation to Priest/Priestess `[NXT]` `P1` `5 pts`

**As a** Mystery School student who completes all 36 decans,
**I want** to be recognized as a graduate and gain access to the full ritual builder,
**so that** I can create my own custom ritual sets.

**Acceptance Criteria:**
- [ ] All 36 decans completed (ritual + scry + journal) → status = `graduated`
- [ ] Graduation email sent with "Priest/Priestess" title
- [ ] Full ritual builder feature unlocked in portal
- [ ] Graduation certificate available to download
- [ ] `$27/month` subscription continues for ongoing portal access
- [ ] Admin dashboard shows graduation list + date

**Tasks:**
- T1: Graduation detection logic — check all 36 decans complete
- T2: `POST /api/mystery-school/check-graduation` — trigger on each decan complete
- T3: Update `mystery_school_students.status = 'graduated'`
- T4: Send `sendMysterySchoolGraduation` email
- T5: Unlock ritual builder feature flag for user
- T6: Generate and store graduation PDF

---

## EPIC E6 — Calendar & Booking System

> **Goal:** Reliable, policy-enforced booking flow with conflict detection, presence confirmation, and Google Calendar sync.

---

### Story E6-S1 — Booking conflict detection `[NXT]` `P1` `3 pts`

**As a** client,
**I want** to only see available time slots when booking,
**so that** I never accidentally double-book a diviner.

**Acceptance Criteria:**
- [ ] Available slots exclude all confirmed bookings for that diviner
- [ ] Slot is marked unavailable as soon as another client starts checkout
- [ ] Stale held slots released after 15 minutes of inactivity
- [ ] Diviner's blocked-off time (vacation etc.) excluded from slots

**Tasks:**
- T1: Add `held_until` timestamp to booking holds table
- T2: Cron to release stale holds every 5 minutes
- T3: Filter slots in `GET /api/availability/:divinerId`

---

### Story E6-S2 — Google Calendar two-way sync `[NXT]` `P1` `5 pts`

**As a** diviner,
**I want** my bookings to appear in my Google Calendar automatically,
**so that** I never miss a session.

**Acceptance Criteria:**
- [ ] Booking confirmed → event created in diviner's Google Calendar
- [ ] Booking cancelled → event removed from Google Calendar
- [ ] Diviner adds block in Google Calendar → that slot closes on AstrologyPro
- [ ] Initial OAuth setup in diviner settings
- [ ] Re-auth prompt if token expires

**Tasks:**
- T1: Fix orphaned `.then()` promise in Stripe webhook (already done)
- T2: Handle Google Calendar API auth token refresh
- T3: `POST /api/calendar/sync-block` — import Google blocks as unavailability
- T4: Webhook: booking cancelled → delete calendar event

---

## EPIC E7 — Contract & Payment Management

> **Goal:** Complete, policy-compliant contract and payment flows with PayPal alongside Stripe.

---

### Story E7-S1 — PayPal Connect for diviners `[NXT]` `P1` `8 pts`

**As a** diviner who uses PayPal instead of Stripe,
**I want** to connect my PayPal business account,
**so that** clients can pay me without needing a credit card.

**Acceptance Criteria:**
- [ ] Settings page shows "Connect PayPal" alongside existing "Connect Stripe"
- [ ] PayPal OAuth flow: connect → approve → redirect back
- [ ] Connected PayPal account displayed with disconnect option
- [ ] Bookings can route to either PayPal or Stripe depending on diviner preference
- [ ] Payout goes directly to diviner's PayPal, platform takes 20% cut via fee

**Tasks:**
- T1: Research PayPal Commerce Platform API (not Classic API)
- T2: `POST /api/stripe/paypal-connect` — initiate OAuth
- T3: `GET /api/stripe/paypal-callback` — handle token + save to `diviners` table
- T4: Add PayPal connect button to settings/profile page
- T5: Payment routing logic (Stripe vs PayPal based on diviner preference)

---

### Story E7-S2 — Affiliate agreement e-sign `[ANG]` `[NXT]` `P1` `5 pts`

**As a** diviner or social advocate who wants to enable the affiliate programme,
**I want** to digitally sign the affiliate policy agreement,
**so that** the platform is protected and I understand my payment responsibilities.

**Acceptance Criteria:**
- [ ] Affiliate toggle in settings is disabled until agreement is signed
- [ ] Clicking "Enable Affiliates" opens the agreement modal with full policy text
- [ ] Checkbox: "I agree I am responsible for paying my own affiliates"
- [ ] Signature (typed name) + timestamp saved to DB
- [ ] Once signed, affiliate toggle is enabled
- [ ] Agreement downloadable as PDF receipt

**Tasks:**
- T1: Create `affiliate_agreements` table (user_id, signed_at, signature_name, ip)
- T2: Build affiliate agreement modal with policy text and e-sign field
- T3: `POST /api/affiliate/sign-agreement` — save signature
- T4: Gate affiliate UI behind `affiliate_agreement IS NOT NULL` check
- T5: Add to both Angular (social advocate / astrologer) and Next.js (diviner) settings

---

### Story E7-S3 — Policy display on diviner profile page `[NXT]` `P1` `3 pts`

**As a** Stripe/PayPal merchant reviewer,
**I want** to see full return, refund, and booking policies on every diviner's public page,
**so that** I can approve the merchant account without requesting extra documentation.

**Acceptance Criteria:**
- [ ] `/[username]` page has a "Policies" section at the bottom
- [ ] Section shows: booking policy, no-show policy, refund policy (from platform defaults)
- [ ] Content is indexable and SEO-safe (not hidden behind JS)
- [ ] Policy text links to the full `/policy` page

**Tasks:**
- T1: Add "Policies" section to diviner profile page component
- T2: Create `platform_policies` table (type, content, updated_at)
- T3: `GET /api/policies` — return current policy texts
- T4: Render policies server-side (SSR, not client-only)

---

## EPIC E8 — Reporting & Analytics `[ANG]`

> **Goal:** Complete, accurate analytics for admin and reps.

---

### Story E8-S1 — Admin analytics dashboard `[ANG]` `P2` `5 pts`

**As an** admin,
**I want** a single dashboard with KPIs across all business dimensions,
**so that** I can make decisions without running manual reports.

**Acceptance Criteria:**
- [ ] KPI cards: total users by role, active community members, mystery school students enrolled, total diviners, certified diviners
- [ ] KPI cards: total platform revenue this month, community MRR, mystery school MRR
- [ ] Chart: monthly revenue trend (6 months)
- [ ] Chart: new signups by role per month (bar chart)
- [ ] Chart: subscription breakdown (community individual / family / mystery school)
- [ ] Table: top 10 diviners by revenue (from AstrologyPro)
- [ ] Filters: date range picker

**Tasks:**
- T1: Wire KPI cards to real API data (user counts, revenue, subscriptions)
- T2: Add date range picker component
- T3: Add monthly revenue trend chart using Chart.js
- T4: Add new signups by role bar chart
- T5: Add subscription breakdown pie chart
- T6: Add top diviners revenue table (cross-reference AstrologyPro Supabase)

---

### Story E8-S2 — Training analytics `[ANG]` `P2` `5 pts`

**As an** admin,
**I want** to see per-module training stats,
**so that** I know which content is confusing or not engaging trainees.

**Acceptance Criteria:**
- [ ] Per-module: completion rate %, average quiz pass rate %, avg time to complete
- [ ] Question difficulty analysis (% wrong per question)
- [ ] Trainee progress table (name, modules done, % total, graduated?)
- [ ] Export to CSV

**Tasks:**
- T1: `GET /api/admin/training/analytics` — aggregate stats from progress tables
- T2: Build per-module stats UI
- T3: Build trainee progress table with search
- T4: Add CSV export button

---

## EPIC E9 — Marketing & Content Tools `[ANG]` `[NXT]`

> **Goal:** Content management, social posting, and campaign tools for growth.

---

### Story E9-S1 — Marketing copy update — AstrologyPro.com `[NXT]` `P1` `3 pts`

**As a** potential diviner visiting AstrologyPro.com,
**I want** the marketing copy to clearly explain why this platform is better than Zoom + standalone tools,
**so that** I immediately understand the value and sign up.

**Acceptance Criteria:**
- [ ] Homepage headline communicates: dialogue-based, easy to share, client-education focused
- [ ] Feature section explicitly lists: session recordings, booking management, payment processing, client portal, marketing tools
- [ ] Social proof section (ready when first diviners onboard)
- [ ] Clear CTAs: "Start Free Trial" / "See Demo"
- [ ] Screenshots of working dashboard UI

**Tasks:**
- T1: Rewrite homepage hero copy (Beto to review)
- T2: Rewrite feature section with correct value props
- T3: Add screenshot carousel of dashboard
- T4: Update meta description and OG tags

---

### Story E9-S2 — Certified badge on discover page `[NXT]` `P1` `3 pts`

**As a** client searching for a diviner,
**I want** to see which diviners are certified by the Divine Infinite Being school,
**so that** I can choose a verified practitioner.

**Acceptance Criteria:**
- [ ] Certified diviners show a "DIB Certified" badge on discover page cards
- [ ] Badge tooltip explains what certification means
- [ ] Subtle CTA inside diviner dashboard: "Get certified — get your badge" (non-intrusive)
- [ ] Badge displayed on diviner's public profile page

**Tasks:**
- T1: Add `is_certified` and `certified_at` columns to `diviners` table
- T2: Trigger: on school graduation in Next.js → set `is_certified = true`
- T3: Add badge component to discover page diviner card
- T4: Add badge to diviner profile page
- T5: Add subtle dashboard banner (dismissible)

---

### Story E9-S3 — Ayrshare social auto-posting `[NXT]` `P2` `2 pts`

**As a** diviner,
**I want** my marketing content published to social media automatically,
**so that** I can grow my audience without leaving the dashboard.

**Acceptance Criteria:**
- [ ] `AYRSHARE_API_KEY` added to Vercel env → feature activates
- [ ] Content drafts in marketing dashboard can be scheduled
- [ ] Post status (sent/failed/scheduled) shown in Content Library

**Tasks:**
- T1: Add `AYRSHARE_API_KEY` to Vercel (manual by Beto/admin)
- T2: Wire Content Library "Publish" button to `/api/social/post`
- T3: Store returned post ID in `scheduled_posts` table
- T4: Show post status badges in Content Library

---

## EPIC E10 — Platform Operations `[BOTH]`

---

### Story E10-S1 — Rotate exposed Twilio keys `[NXT]` `P1` `1 pt`

**As a** security-conscious operator,
**I want** the exposed Twilio API keys rotated immediately,
**so that** unauthorized parties cannot make API calls on our account.

**Acceptance Criteria:**
- [ ] Identify which Twilio keys were exposed in Git
- [ ] Rotate keys in Twilio console
- [ ] Update Vercel environment variables
- [ ] Verify phone readings flow works after rotation

**Tasks:**
- T1: `git log --all --full-history -- *.env*` to find committed secrets
- T2: Rotate in Twilio dashboard
- T3: Update in Vercel
- T4: Test a call end-to-end

---

### Story E10-S2 — SES domain verification `[NXT]` `P1` `1 pt`

**As an** operator,
**I want** AWS SES email sending verified for `divineinfinitebeing.com`,
**so that** all transactional emails are delivered reliably.

**Acceptance Criteria:**
- [ ] DNS TXT/CNAME records confirmed propagated
- [ ] SES sandbox lifted (production sending enabled)
- [ ] Test email sent and received
- [ ] Email open rate trackable

**Tasks:**
- T1: Verify DNS propagation for `divineinfinitebeing.com`
- T2: Request SES production access (if still in sandbox)
- T3: Send test email and confirm delivery

---

### Story E10-S3 — Angular bundle size optimisation `[ANG]` `P3` `5 pts`

**As a** developer,
**I want** the Angular app to load under 3 seconds on a 4G connection,
**so that** astrologers and admin on mobile have a good experience.

**Acceptance Criteria:**
- [ ] Initial bundle < 500KB gzipped (currently ~10MB limit is too generous)
- [ ] All routes lazy-loaded (audit to confirm no eagerly loaded modules)
- [ ] Images lazy-loaded
- [ ] Lighthouse performance score ≥ 80

**Tasks:**
- T1: Run `source-map-explorer` on production build
- T2: Identify and split any eagerly-loaded modules
- T3: Add `loading="lazy"` to all images
- T4: Enable brotli compression on CloudFront
- T5: Move moment.js to date-fns (tree-shakeable)

---

### Story E10-S4 — Stripe Connect webhook registration `[NXT]` `P1` `1 pt`

**As an** operator,
**I want** the `account.updated` Stripe Connect webhook registered,
**so that** diviner account status changes sync automatically.

**Acceptance Criteria:**
- [ ] `account.updated` event registered in Stripe Dashboard
- [ ] Webhook endpoint `/api/stripe/connect-webhook` receives events
- [ ] KYC status changes reflect in diviner's settings page

**Tasks:**
- T1: Go to Stripe Dashboard → Connect → Webhooks → Add endpoint
- T2: Add `account.updated` event
- T3: Test with Stripe CLI: `stripe trigger account.updated`
