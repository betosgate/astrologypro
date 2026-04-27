# Manual QA Checklist — Affiliate Commission v2

**Screen-by-screen manual QA.** A tester walks through every page and ticks
every visible element + every interactive state. Print or copy into your
QA tracker. Sister doc: [09-e2e-test-checklist.md](./09-e2e-test-checklist.md)
(flow-driven engineering acceptance).

If a label/button below has a different name in production than what's
written here, that's a regression — don't tick the box, log it.

---

## Test data prerequisites

Before starting:
- [ ] Admin user logged in (separate browser profile).
- [ ] Diviner A logged in (own profile, agreement accepted, ≥2 services).
- [ ] Diviner B logged in (used for cross-diviner isolation).
- [ ] Affiliate 1 logged in (multi-junction: Diviner A + B).
- [ ] Affiliate 2 logged in (Diviner A only).
- [ ] Customer logged in (for booking).
- [ ] Unclaimed-affiliate invite token (NOT yet accepted).
- [ ] Blocked affiliate fixture.
- [ ] Test inbox where SES emails land.
- [ ] At least 5 historical conversions, 2 rate-history rows, 1 reversed conversion.

---

# SECTION A — PUBLIC PAGES

## A.1 Diviner landing — `/<diviner_username>`

**Role:** anonymous visitor.

Visible elements:
- [ ] Page title (browser tab) shows the diviner's display name.
- [ ] Diviner display name + avatar render in hero.
- [ ] Bio / about copy renders.
- [ ] Service cards each link to `/<username>/services/<slug>`.
- [ ] Page renders in <2.5 s LCP on cold load.

Affiliate context:
- [ ] Visit `/<username>?ref=<active_campaign_code>` → page renders
      identically (no UI changes), `ref_code` is preserved through to
      the booking CTA.
- [ ] Visit `/<username>?ref=<archived_code>` → page still renders;
      gate is at `/r/<code>`, not here.

## A.2 Service page — `/<username>/services/<slug>`

- [ ] Service title, description, price visible.
- [ ] "Book" CTA visible.
- [ ] CTA preserves `?ref=<code>` query string into the booking flow.

## A.3 Click resolver — `/r/<campaign_code>`

This route has no UI of its own except the dead-link page.

States:
- [ ] **Active code** → 307 redirect to destination URL with
      `?ref=<code>` appended. Browser address bar lands on destination.
- [ ] **Archived/paused/expired code** → 410 page renders with the
      branded "This link is no longer active" message. No redirect.
- [ ] **Unknown code** → 404.
- [ ] **Rate-limit (101st request from same IP within 1 min)** → 429
      page with `Retry-After` header.

---

# SECTION B — INVITATION ACCEPT FLOW (`/affiliate/accept/[token]`)

## B.1 Accept screen — happy path

For a valid pending invitation:

- [ ] Sparkles icon visible at top of card.
- [ ] Card title: **"Affiliate invitation"**.
- [ ] Description: `"<diviner display name> invited <email> to be an affiliate partner on AstrologyPro."`
- [ ] Commission badge text matches one of:
  - `"<rate>% commission"` (percent type)
  - `"$<amount> per referral"` (flat type)
  - `"See dashboard for details"` (no rate set)
- [ ] Expiration badge: `"Expires <date>"`.
- [ ] If invite has personal_message: quote box labeled **"Personal message"** rendered with the quoted message.

Form (signup mode — invitee has no account):
- [ ] **Email** input rendered, readonly, prefilled.
- [ ] **Your name** input rendered.
- [ ] **Phone (optional)** input rendered (tel type).
- [ ] **Choose a password** input + hint **"At least 8 characters"**.
- [ ] Submit button: **"Create account & accept"** with Loader2 spinner during submission.

Form (signin mode — invitee has account, not signed in):
- [ ] **Email** readonly + prefilled.
- [ ] **Password** input + hint.
- [ ] Submit button: **"Sign in & accept"**.

Form (already-signed-in matching email):
- [ ] No name/password fields.
- [ ] Submit button: **"Accept invitation"**.

Footer text:
- [ ] **"By accepting, you agree to the AstrologyPro affiliate partnership terms."**

After successful submit:
- [ ] Redirected to `/affiliate` portal landing.
- [ ] `affiliate_accounts.user_id` is now linked to the auth user.
- [ ] `diviner_affiliates.status` flips from `pending` to `active`.
- [ ] `accepted_at` timestamp set.

## B.2 InviteNotFoundView

- [ ] Icon: AlertCircle (amber).
- [ ] Heading: **"Invitation not found"**.
- [ ] Body mentions older invites being superseded by newer ones.
- [ ] Button: **"Back to home"**.

## B.3 InviteAlreadyUsedView

- [ ] Icon: CheckCircle2 (emerald).
- [ ] Heading: **"Invitation already accepted"**.
- [ ] Body explains it was already claimed.
- [ ] Button: **"Sign in"** → `/login?next=/affiliate`.

## B.4 InviteRevokedView

- [ ] Icon: Ban (rose).
- [ ] Heading: **"Invitation revoked"**.
- [ ] Body explains the diviner cancelled or replaced the invite.
- [ ] Button: **"Back to home"**.

## B.5 InviteExpiredView

- [ ] Icon: Clock (amber).
- [ ] Heading: **"Invitation expired"**.
- [ ] Body asks to request a new invite.
- [ ] Button: **"Back to home"**.

## B.6 EmailMismatchView

- [ ] Icon: MailWarning (amber).
- [ ] Heading: **"Email does not match"**.
- [ ] Body shows current email + invite email.
- [ ] Button: **"Sign out"**.

---

# SECTION C — AFFILIATE PORTAL (`/affiliate/*`)

## C.0 Portal layout (`_components/affiliate-header.tsx`)

Visible on every authenticated portal page:

Header bar:
- [ ] Handshake icon + **"Affiliate Portal"** text → links to `/affiliate`.
- [ ] Right side: account name + email (right-aligned, leading-tight).
- [ ] Avatar (circle) — image if `avatar_url` set, else initials fallback.
- [ ] Logout button on the far right.

Nav links (in this order, hidden on mobile via `hidden sm:flex`):
- [ ] **Dashboard** (LayoutDashboard icon) → `/affiliate` (exact match)
- [ ] **Partnerships** (Users icon) → `/affiliate/partnerships`
- [ ] **Products** (Package icon) → `/affiliate/products`
- [ ] **Campaigns** (Megaphone icon) → `/affiliate/campaigns`
- [ ] **Earnings** (DollarSign icon) → `/affiliate/earnings`
- [ ] **Rate history** (History icon) → `/affiliate/rate-history`
- [ ] **Notifications** (Bell icon) → `/affiliate/notifications`
- [ ] **Profile** (UserCircle icon) → `/affiliate/profile`

Verify NOT present (deleted in cleanup):
- [ ] No **"Commissions"** entry.
- [ ] No **"Links"** entry.

Active-tab highlighting:
- [ ] On each route, exactly one nav link has the primary background
      (`bg-primary text-primary-foreground`) and `aria-current="page"`.
- [ ] Other links are muted (`text-muted-foreground`), hover lights up.

## C.0.1 AccountGateShell — blocked / unclaimed accounts

When `affiliate_accounts.status !== "active"`:
- [ ] Stripped header: only **"Affiliate Portal"** text, no nav.
- [ ] Card title: **"Affiliate account <status>"** (e.g. "Affiliate account blocked").
- [ ] Body: **"Your affiliate account is currently <strong>blocked</strong>."** (or unclaimed)
- [ ] If blocked: line **"Contact support if you believe this is a mistake."**
- [ ] If unclaimed: **"This account hasn't been claimed yet. Open the invite link you received by email to finish setup."**
- [ ] Verify the **"suspended"** branch is GONE — the destructive migration trimmed that enum value.

## C.1 Dashboard — `/affiliate` and `/affiliate/dashboard`

Heading area:
- [ ] H1: **"Welcome, <account name>"**.
- [ ] Subheading: `"Aggregated across <N> diviner partnership(s)."` —
      pluralization handled (1 partnership vs N partnerships).

KPI tiles (3, grid):
- [ ] **Total Clicks** label, MousePointerClick icon, number value.
- [ ] **Conversions** label, TrendingUp icon, number value.
- [ ] **Total Earned** label, DollarSign icon, USD value, subtitle
      **"across all active conversions"**.

Cards:
- [ ] **"Marketing kit"** card renders (pre-existing — confirm not broken).
- [ ] **"Recent Campaigns"** table with columns **Campaign** | **Code** | **Status**.
- [ ] **"View partnerships"** link with ArrowRight icon → `/affiliate/partnerships`.
- [ ] **"All campaigns"** link → `/affiliate/campaigns`.

Empty states:
- [ ] No partnerships → **"No partnerships yet"** card with prompt to
      open invite link.
- [ ] No campaigns → **"No campaigns yet. Visit your partnerships page and create one."**

## C.2 Partnerships — `/affiliate/partnerships`

- [ ] H1: **"Partnerships"**.
- [ ] Subheading: `"You partner with <N> diviner(s)."`.

For each partnership card (grid `md:grid-cols-2`):
- [ ] CardTitle: diviner display name.
- [ ] CardDescription: status Badge + commission text.
- [ ] Row: **"Joined"** label + date.
- [ ] Row: **"Total earned"** label + formatted cents.
- [ ] Row: **"Reversed"** label + formatted cents (only if > 0).
- [ ] **"View diviner profile"** link if username exists.
- [ ] Status badges: **active** (default), **pending** (outline),
      **suspended** (secondary), **blocked** (destructive).

Empty state:
- [ ] **"No partnerships yet"** + body about waiting for a diviner invite.

## C.3 Products — `/affiliate/products`

- [ ] H1: **"My products"**.
- [ ] Subheading: about products diviners have assigned.

Per assignment card:
- [ ] CardTitle: product name (profile or specific service name).
- [ ] CardDescription: diviner badge + commission rate.
- [ ] Icon + type **"Profile"** or **"Service"** + assigned date.
- [ ] Notes (italic, only if present).
- [ ] **"Create campaign"** button (Plus icon) → 
      `/affiliate/campaigns/new?assignment=<id>`.

Empty states:
- [ ] No partnerships → **"No partnerships yet"** + invite-link prompt.
- [ ] Active partnerships but no assignments → **"No active assignments"** + body about waiting for assignment.

Loading state:
- [ ] Skeleton cards visible during fetch (matches grid).

## C.4 Campaigns list — `/affiliate/campaigns`

- [ ] H1: **"My campaigns"**.
- [ ] Subheading: **"Tracking campaigns you've created. Click any row for KPIs + recent conversions."**

Header buttons:
- [ ] **"My products"** (ExternalLink icon, outline variant) → `/affiliate/products`.
- [ ] **"New campaign"** (Plus icon, primary) → `/affiliate/campaigns/new`.

KPI tiles (3, grid `sm:grid-cols-3`):
- [ ] **Campaigns** label + total count + **"<N> active"** subtitle.
- [ ] **Total clicks** label + sum.
- [ ] **Total earned** label + USD sum.

Table:
- [ ] Column headers: **Campaign** | **Diviner** | **Status** | **Clicks** | **Conversions** | **Earned** | (date column, no header).
- [ ] Each row: campaign name (link), `campaign_code` in monospace below.
- [ ] Diviner column shows display_name.
- [ ] Status Badge variants — active=default, archived/expired=outline,
      else=secondary.
- [ ] Clicks / Conversions right-aligned numbers.
- [ ] Earned column right-aligned, formatted USD, font-medium.
- [ ] Created date right-aligned, muted.
- [ ] Click row's campaign name → navigates to `/affiliate/campaigns/<id>`.

Empty states:
- [ ] No partnerships → **"No partnerships yet"** card.
- [ ] No campaigns → **"No campaigns yet"** + **"See my products"** CTA.

## C.5 Create campaign — `/affiliate/campaigns/new`

- [ ] H1: **"New campaign"**.
- [ ] Subheading: about commission being fixed by diviner.

**Card: "Campaign details"**
- [ ] **Product** Select — placeholder **"Pick a product…"**, options pre-populated from active assignments.
- [ ] If arrived with `?assignment=<id>` and that ID is in options → it's pre-selected.
- [ ] **Campaign name** Input (required, max 120). Placeholder: **"e.g. Spring Tarot Push, Newsletter Q3"**.
- [ ] Hint: **"For your tracking only — never shown to people who click your link."**
- [ ] **Notes (optional)** Textarea (max 1000, rows 3). Placeholder mentioning audience.
- [ ] **Channel (optional)** Input (max 50). Placeholder: **"e.g. instagram, email, podcast"**.

**Card: "UTM tags (optional)"**
- [ ] **utm_source**, **utm_medium**, **utm_campaign** Inputs (max 100 each).

Submit button:
- [ ] **"Create campaign"** with Loader2 spinner when submitting.

Validation toasts:
- [ ] Submit with no product → toast **"Pick a product first."**
- [ ] Submit with empty name → toast **"Give your campaign a name."**
- [ ] API failure → toast with detail/title.
- [ ] Success → toast **"Campaign created"**, redirect to detail page.

Empty state (no active assignments):
- [ ] Card explains nothing to create campaign against; no form rendered.

## C.6 Campaign detail — `/affiliate/campaigns/<id>`

- [ ] Breadcrumb: **"All campaigns"** with ArrowLeft icon → `/affiliate/campaigns`.
- [ ] H1: campaign name (or **"Untitled campaign"** if null).
- [ ] Subheading: **"Campaign on <destination_name>"** + status Badge.
- [ ] **Archive** button (Archive icon) visible only if status is `active` or `paused`.

Archive flow:
- [ ] Click **Archive** → browser confirm dialog: **"Archive this campaign? The share link will stop working immediately. Existing earnings stay intact."**
- [ ] Cancel → no action.
- [ ] OK → POST to `/api/affiliate/campaigns/<id>` body `{status:"archived"}`. Loader2 spinner during pending.
- [ ] Success → toast **"Campaign archived"**, route refreshes, status badge flips.
- [ ] Failure → toast with error detail.

**Share URL card:**
- [ ] Code block with full share URL.
- [ ] **"Open"** link (ExternalLink icon) opens in new tab.
- [ ] After archive: visiting the share URL returns 410 page.

KPI tiles (4):
- [ ] **Total clicks** + count.
- [ ] **Conversions** + count.
- [ ] **Earned** + USD.
- [ ] **Reversed** + USD (muted).

**Recent conversions table:**
- [ ] Columns: **Date** | **Booking** (booking_id, monospace, first 8 chars) | **Order** | **Rate** | **Commission** | **Status**.
- [ ] Status badge: **earned** (default) or **reversed** (outline) — reversed includes reversed_reason snippet.

Empty state:
- [ ] **"No conversions yet. Share your link to start tracking."**

Loading state (Delivery 2 fix):
- [ ] `loading.tsx` skeleton renders 3 KPI tiles + table skeleton during data fetch.

## C.7 Earnings — `/affiliate/earnings`

- [ ] H1: **"Earnings"**.
- [ ] Subheading mentioning N partnerships.

KPI tiles (2):
- [ ] **Total Earned** (TrendingUp icon) + USD + subtitle **"Payouts will arrive once Stripe auto-split is enabled."**
- [ ] **Reversed** (Clock icon) + USD + subtitle **"refunds + disputes"**.

**"Recent commissions" card:**
- [ ] Columns: **Date** | **Booking** | **Order amount** | **Rate** | **Commission** | **Status**.

Empty states:
- [ ] No partnerships → "no partnerships yet" copy.
- [ ] Has partnerships, no commissions → **"No commissions yet."**

Verify deleted concepts NOT present:
- [ ] No "Total Paid" row.
- [ ] No "Pending Balance" row.
- [ ] No payout history table.
- [ ] No "Record Payout" button anywhere.

## C.8 Rate history — `/affiliate/rate-history`

- [ ] H1: **"Rate history"**.
- [ ] Subheading describing the audit.

Table:
- [ ] Columns: **When** | **Product** | **From** | **To** | **Reason**.
- [ ] Product cell shows name + **"with <diviner>"** subtext.

Empty states:
- [ ] No partnerships → empty card.
- [ ] No rate edits → **"No rate changes yet"** card.

Loading state (Delivery 2 fix):
- [ ] `loading.tsx` skeleton renders during fetch.

## C.9 Notifications inbox — `/affiliate/notifications`

- [ ] H1: **"Notifications"**.
- [ ] Subheading branches:
  - 0 rows → **"Nothing yet — new commission events and account updates land here."**
  - unread > 0 → **"<X> unread, <Y> read."**
  - all read → **"<X> total."**
- [ ] **"Preferences"** button (Settings icon) → `/affiliate/notifications/preferences`.

Per notification card:
- [ ] CardTitle = notification title.
- [ ] CardContent = body (or empty).
- [ ] Badge **"New"** + primary border accent if `is_read=false`.
- [ ] Timestamp:
  - <1h → **"<X>m ago"**
  - <24h → **"<X>h ago"**
  - else full localized date+time.
- [ ] If `action_url` set → entire card is a Link with that href; aria-label = title.
- [ ] If no action_url → card is non-clickable.

Auto-mark-read behavior (Delivery 2):
- [ ] On mount with unread > 0, single POST to
      `/api/affiliate/notifications/mark-read` (verify in Network tab).
- [ ] Response 200 → page refreshes (router.refresh()), "New" badges
      disappear after the next paint.
- [ ] On mount with 0 unread → no POST fires.

Empty state:
- [ ] **"Inbox is empty"** + body copy.

## C.10 Notification preferences — `/affiliate/notifications/preferences`

- [ ] H1: **"Notification preferences"**.
- [ ] Subheading: **"Pick which notification channels you want for each event. Everything is on by default."**

For each of these 7 cards (in this order):
- [ ] **"New assignment"** + description about diviner assigning a new product.
- [ ] **"Commission rate changed"** + description.
- [ ] **"Assignment revoked"** + description.
- [ ] **"Commission earned"** + description **"Email arrives as a daily digest; in-app appears immediately."**
- [ ] **"Commission reversed"** + description.
- [ ] **"Admin revoked your assignment"** + description **"Rare. Only used for incident response."**
- [ ] **"Admin archived your campaign"** + description **"Rare. Only used for incident response."**

Each card has:
- [ ] Switch labeled **"In-app inbox"** (clickable label, toggles state).
- [ ] Switch labeled **"Email"**.
- [ ] Both default ON for any kind not yet stored in prefs.

Sticky save area:
- [ ] **"Save preferences"** button at bottom (sticky), disabled until dirty.
- [ ] Loader2 spinner appears while saving.
- [ ] Success → toast **"Preferences saved"**, dirty flag clears (button disables again).
- [ ] Failure → toast with detail/title.
- [ ] Reload page → toggles match what was saved.

## C.11 Profile — `/affiliate/profile`

- [ ] H1: **"Profile"**.
- [ ] Subheading mentions canonical identity across N partnerships.

**Account card:**
- [ ] CardTitle: **"Account"**.
- [ ] CardDescription: status Badge + **"Tax: <tax_form_status>"** Badge.
- [ ] **Email** Input (disabled, readonly) + hint **"Email changes require support — contact us."**
- [ ] **Name** Input.
- [ ] **Phone** Input (tel).
- [ ] **Timezone** Input. Placeholder **"America/New_York"**.
- [ ] **Avatar URL** Input (url). Placeholder **"https://…"**.

**Payout card:**
- [ ] CardTitle: **"Payout"**.
- [ ] CardDescription about per-diviner payouts.
- [ ] **Preferred method** Select with options: **"Not set"** | **"Bank transfer"** | **"PayPal"** | **"Check"** | **"Other"**.

Save:
- [ ] **"Save changes"** button (Save icon) bottom-right. Loader2 during save.
- [ ] Empty name → toast **"Name is required"**.
- [ ] Success → toast **"Profile saved"**.

Loading state:
- [ ] Two skeleton placeholders (h-24, h-80) on initial load.

Error state:
- [ ] Failed load → **"Could not load your profile. Try reloading the page."**

---

# SECTION D — DIVINER DASHBOARD (`/dashboard/*`)

## D.0 Diviner sidebar (`src/components/dashboard/sidebar.tsx`)

Verify nav entries in **People** group:
- [ ] **Users**, **Diviners**, **Affiliates** (`/dashboard/affiliates`),
      **Campaigns** (`/dashboard/campaigns`), **Campaign Analytics**,
      **Roles**, etc.

Verify the **Notifications** entry was added (Delivery 3):
- [ ] **Notifications** (Bell icon) → `/dashboard/notifications`,
      placed BEFORE Profile in the bottom group.

Mobile nav (`mobile-nav.tsx`):
- [ ] **Notifications** entry present in the More menu, before Profile.

## D.1 Affiliates list — `/dashboard/affiliates`

- [ ] H1: **"Affiliates"**.
- [ ] Subheading: **"Manage your affiliate partners and track commissions."**

Top-right buttons:
- [ ] **"Assign affiliate"** (Plus icon, outline) → `/dashboard/affiliates/new`.
- [ ] **"Invite Affiliate"** (Send icon, primary). Disabled with hover-title
      **"Sign the affiliate partnership agreement to enable invitations"** when agreement not signed.

Agreement gate banner (if !agreementSigned):
- [ ] Alert with AlertTriangle icon (amber).
- [ ] AlertTitle: **"Sign the affiliate partnership agreement"**.
- [ ] Body about needing to accept terms.
- [ ] Button **"Review & Sign Agreement"** → `/dashboard/account/affiliate-agreement`.

KPI cards (4, grid):
- [ ] **Total Affiliates** (Users icon) + count + **"<N> active"** subtitle.
- [ ] **Commissions Earned** (DollarSign icon) + USD.
- [ ] **Total Paid** (DollarSign icon) + USD.
- [ ] **Pending Balance** (Wallet icon) + USD (text-amber-600) + **"Owed to affiliates"** subtitle.

Invite dialog (opened from "Invite Affiliate"):
- [ ] Title: **"Invite Affiliate Partner"**.
- [ ] Description: **"Send an invitation email. They'll receive a link that expires in 14 days."**
- [ ] **Name** Input (required), placeholder **"Jane Smith"**, autocomplete=name.
- [ ] **Email** Input (email, required), placeholder **"jane@example.com"**.
- [ ] **Personal message (optional)** Textarea (rows 3).
- [ ] Collapsible: **"Commission (optional)"** with **"Hide"** / **"Customize"** toggle.
- [ ] Inside collapsible:
  - [ ] **Type** Select with **"Percentage"** | **"Fixed amount"**.
  - [ ] Value Input labeled **"%"** or **"Amount (cents)"** depending on type.
  - [ ] Hint about being editable later from detail page.
- [ ] Submit button: **"Send Invitation"** (Send icon) with loading **"Sending…"** state.

Validation toasts:
- [ ] Empty name/email → **"Name and email are required"**.
- [ ] SES send failed → warning **"Invitation saved but email delivery failed. You can resend from the affiliate's row."**
- [ ] Success → **"Invitation sent to <email>. They have 14 days to accept."**

Affiliates table:
- [ ] Columns: **Name** | **Email** | **Commission** | **Status** | **Created** (no actions column header text per Delivery 4.5 cleanup, BUT pre-cleanup the Eye/More menu lived here — verify the column labeled "Actions" is GONE after cleanup).

Wait — verify cleanup did NOT remove the dropdown action column on this page. The cleanup only removed the per-row "View" button (deleted the broken /admin/affiliates/[id]). The diviner-side row dropdown for resend/revoke is separate; it should still be there.

Re-check: this is the DIVINER's affiliates page. The cleanup was to ADMIN's. So:
- [ ] Diviner's table HAS an **Actions** column (View icon button + More dropdown). The View button → `/dashboard/affiliates/<id>` (still works).
- [ ] More dropdown on pending row: **"Resend invitation"** | **"Resend (fresh token)"** (if expired) | **"Revoke invitation"** (destructive).
- [ ] More dropdown on active row: **"Open detail page"**.
- [ ] Lock icon next to status badge if `account_status="blocked"`.

Status badges (DerivedStatus):
- [ ] **Active** (default), **Pending** (outline), **Expired** (outline),
      **Suspended** (secondary), **Blocked** (destructive),
      **Blocked (account)** (destructive).

Empty state:
- [ ] **"No affiliates yet"** + **"Send an invitation to start tracking referrals."** + button **"Invite Your First Affiliate"** (Send icon).

Loading state:
- [ ] 4 skeleton KPI cards + 3 skeleton rows visible during fetch.

## D.2 Assign affiliate — `/dashboard/affiliates/new`

- [ ] Back arrow (ghost icon button) → `/dashboard/affiliates`.
- [ ] H1: **"Assign affiliate"**.
- [ ] Subheading mentions PROFILE vs SERVICE scope.

**Card: "Partnership"**
- [ ] CardDescription: **"Active diviner-affiliate partnerships are listed below."**
- [ ] **Affiliate** Select — placeholder **"Pick an affiliate…"**.
- [ ] Active partnerships only — pending/blocked are filtered out.

**Card: "Destination"**
- [ ] **Scope** Select with **"PROFILE (whole profile)"** | **"SERVICE (one service)"**.
- [ ] If SERVICE → **Service** Select. Placeholder **"Pick a service…"** or **"No active services"** if empty.

**Card: "Commission"**
- [ ] CardDescription explains rate stamps onto NEW bookings only.
- [ ] **Type** Select: **"Percent"** | **"Flat (cents)"**.
- [ ] Value Input — label **"Percent (%)"** for percent OR **"Cents"** for flat. Type=number, min=0, step="0.01" / "1".

**Card: "Notes (optional)"**
- [ ] Textarea (max 1000), placeholder **"Internal note for your records."**

Footer:
- [ ] **"Cancel"** button (outline) → back to list.
- [ ] **"Assign"** button (primary). Loader2 during submit.

Validation toasts:
- [ ] No affiliate → **"Pick an affiliate first."**
- [ ] SERVICE scope no service → **"Pick a service for SERVICE-scoped assignments."**
- [ ] Negative value → **"Commission must be a non-negative number."**
- [ ] Percent > 100 → **"Percent commission can't exceed 100."**
- [ ] Success → **"Affiliate assigned"**, redirect to `/dashboard/affiliates/<junctionId>`.

Empty state (no active partnerships):
- [ ] Card with **"No active affiliates yet"** + body + button **"Invite an affiliate"** → `/dashboard/affiliates`.

## D.3 Per-affiliate detail — `/dashboard/affiliates/<id>`

- [ ] Back arrow → `/dashboard/affiliates`.
- [ ] H1: affiliate name.
- [ ] Subheading: email + phone (when present).

Top-right:
- [ ] Status Badge.
- [ ] Period Select: **"Last 30 days"** | **"Last 90 days"** | **"Last year"** | **"All time"** (default 90d).

**Identity card:**
- [ ] Avatar (image or initials).
- [ ] CardTitle = name.
- [ ] CardDescription with Mail icon + email.
- [ ] **"Claimed"** Badge if `user_id` set, else **"Unclaimed"**.
- [ ] **"Blocked platform-wide"** with Lock icon if `account_status="blocked"`.
- [ ] If `partnership_count > 0`: pill **"Also partners with <N> other diviner(s)"** with hover title.

**Pending invitation card** (only if junction status="pending"):
- [ ] Amber border + bg.
- [ ] Title: **"Pending invitation"** with Clock icon.
- [ ] Subtitle: **"Invited <date> · expires <date> · resent <N>×"** + **"Expired"** marker if past expiry.
- [ ] **"Resend invitation"** or **"Send first invite"** button (RefreshCw icon).
- [ ] **"Revoke"** button (XCircle icon, destructive) — only if `latest_invite.id` exists.
- [ ] Resend disabled if `account_status="blocked"`.

KPI tiles (4):
- [ ] **Clicks** (TrendingUp icon).
- [ ] **Conversions** (TrendingUp icon).
- [ ] **Earned** (DollarSign icon).
- [ ] **Reversed** (DollarSign icon, muted).

**Assignments card** (Delivery 3):
- [ ] CardTitle: **"Assignments"**.
- [ ] CardDescription with **"Manage assignments"** link button (Pencil icon) → `/dashboard/affiliates/assignments`.
- [ ] Table columns: **Destination** | **Current rate** | **Assigned** | **Status** (Badge).
- [ ] Empty: **"No products assigned to this affiliate yet."**

**Rate history card** (Delivery 3):
- [ ] CardTitle: **"Rate history"** with History icon.
- [ ] CardDescription about reverse-chronological + stamp semantics.
- [ ] Columns: **When** | **From** | **To** | **Reason**.
- [ ] Empty: **"No rate edits yet."**

**Recent conversions card** (Delivery 3):
- [ ] CardDescription: **"Newest first. Showing your slice only — conversions through other diviners stay hidden."**
- [ ] Columns: **Date** | **Order amount** | **Rate used** | **Commission** | **Status** Badge.
- [ ] Reversed badge includes `reversed_reason` if present.
- [ ] Empty: **"No conversions yet."**

Verify deleted UI is GONE:
- [ ] No **"Referral Links"** card.
- [ ] No **"Generate Link"** dialog.
- [ ] No **"Commission Ledger"** card.
- [ ] No **"Payout History"** card.
- [ ] No **"Record Payout"** button.
- [ ] No **"Export CSV"** button.

## D.4 Assignments list — `/dashboard/affiliates/assignments`

- [ ] Back arrow → `/dashboard/affiliates`.
- [ ] H1: **"Affiliate Assignments"**.
- [ ] Subtitle about PROFILE/SERVICE assignments + commission lock.

Top-right:
- [ ] **"New Assignment"** button (Plus icon).

Grouping controls:
- [ ] Button group: **"By Affiliate"** | **"By Destination"**.
- [ ] Checkbox: **"Show revoked"**.

New Assignment Dialog:
- [ ] Title: **"New Affiliate Assignment"**.
- [ ] Description: **"Assign an affiliate to your profile or a specific service, with a pre-defined commission."**
- [ ] Scope toggle buttons: **"Profile"** (User icon) / **"Service"** (BookOpen icon).
- [ ] Service Select shown only if Service selected. Placeholder **"— pick a service —"**.
- [ ] Affiliate search Input (Search icon), placeholder **"Search by name or email…"**.
- [ ] Loading: **"Searching…"** below input.
- [ ] No results: **"No affiliates found."**
- [ ] Result rows: name + email + Badge (**"Affiliate"** or **"Advocate"**) + **"Already assigned"** Badge if applicable.
- [ ] Selected affiliate: chip with Name + email + role badge.
- [ ] Commission Type buttons: **"Percent"** / **"Flat"**.
- [ ] Commission value Input (number, min 0, step 0.01).
- [ ] Notes Textarea: placeholder **"Optional — not shown to the affiliate."**
- [ ] Footer: **"Create Assignment"** button (Loader2 spinner during submit).

Grouped cards (one per group):
- [ ] CardTitle: group name + icon.
- [ ] CardDescription: **"<N> assignment(s)"**.
- [ ] Table columns vary by grouping:
  - By Affiliate: **Scope** | **Commission** | **Clicks (30d)** | **Conv. (30d)** | **Commission (30d)** | **Assigned** | **Status** | **Actions**.
  - By Destination: **Affiliate** | **Commission** | **Clicks (30d)** | **Conv. (30d)** | **Commission (30d)** | **Assigned** | **Status** | **Actions**.
- [ ] Status Badge variants for assignment.
- [ ] Row action **"Revoke"** (Ban icon, destructive) only if `is_active`.

Empty state:
- [ ] **"No assignments yet"** + body about needing assignments to drive traffic.

Loading state:
- [ ] **"Loading assignments…"** centered.

## D.5 Assignment detail — `/dashboard/affiliates/assignments/<id>`

- [ ] Back arrow → `/dashboard/affiliates/assignments`.
- [ ] H1: affiliate name.
- [ ] Subtitle: Affiliate/Advocate badge + status Badge (**Active** / **Revoked**).
- [ ] Metadata line: **"Profile"** or **"Service: <name>"** + **"Commission: <rate>"**.

Period selector:
- [ ] Buttons: **"7d"** | **"30d"** | **"90d"** | **"All"**.

Top-right:
- [ ] **"Revoke"** button (Ban icon, destructive) only if active.

KPI tiles (4):
- [ ] **Clicks** (MousePointerClick icon).
- [ ] **Unique Clicks** (Users icon).
- [ ] **Conversions** (TrendingUp icon).
- [ ] **Commission** (DollarSign icon, USD).

**"Activity Over Time" card:**
- [ ] Bar chart per day; hover tooltip **"<date>: <N> clicks, <N> conv"**.
- [ ] Empty: **"No activity for this period"**.

**"Campaigns from This Assignment" card:**
- [ ] Columns: **Campaign** | **Code** | **Status** | **Clicks** | **Conv.** | **Commission**.
- [ ] Empty: **"This affiliate hasn't created any campaigns for this assignment yet."**

**"Conversion Log (<period>)" card:**
- [ ] Columns: **Date** | **Booking** | **Order** | **Commission** | **Status** Badge (**Reversed** / **Credited**).
- [ ] Empty: **"No conversions in this period."**

Loading state:
- [ ] **"Loading…"** centered.

## D.6 Diviner reports — `/dashboard/affiliates/reports`

- [ ] Renders without crashing under v2 (uses `/api/dashboard/affiliates/reports`).
- [ ] Period selector + monthly chart + affiliate performance table render.
- [ ] No System A references in displayed data.

(Exact element list per current implementation — verify visually.)

## D.7 Campaigns list — `/dashboard/campaigns`

- [ ] Header has Campaigns + Analytics tabs.
- [ ] Diviner-owned campaigns only — verify Diviner B's campaigns invisible.
- [ ] Form fields for new campaign include `target_product_type`,
      `utm_*`, `destination_type`, `channel` (verify each label).
- [ ] Status Badge accepts trimmed enum: **active** / **paused** / **archived** / **expired**.
- [ ] Try changing status to `draft` or `completed` via API → 422
      (those values were trimmed in 01b).

## D.8 Campaign detail — `/dashboard/campaigns/<id>`

- [ ] Shows destination, UTM params, conversion ledger, budget progress.
- [ ] Edit form works (PATCH endpoint).
- [ ] Comment in source notes "affiliate enrollment moved to assignments" — verify NO affiliate-management UI on this page.

## D.9 Campaign analytics — `/dashboard/campaigns/<id>/analytics`

- [ ] Daily clicks bar chart.
- [ ] By-device, by-country, by-browser, by-source, by-referrer
      breakdowns rendered.
- [ ] Hourly heatmap.
- [ ] Bot-vs-human counters.

## D.10 Diviner notifications — `/dashboard/notifications` (Delivery 3)

- [ ] H1: **"Notifications"**.
- [ ] Subheading branches identical to affiliate inbox.
- [ ] Per-notification card same shape (CardTitle, body, "New" badge,
      relative time, optional action_url link).
- [ ] Auto-mark-read fires on mount via
      `/api/dashboard/notifications/mark-read` (Network tab).
- [ ] Empty state: **"Inbox is empty"** + body about admin overrides + affiliate activity + billing events.
- [ ] No "Preferences" button visible (per-kind diviner prefs deferred).

---

# SECTION E — ADMIN

## E.0 Admin sidebar (`src/components/admin/admin-sidebar.tsx`)

People group:
- [ ] **Affiliates** (Users icon) → `/admin/affiliates` (still works).

Reports group:
- [ ] **Reports** → `/admin/reports`.
- [ ] **Activity Log**, **Revenue**, **Bookings**, **Provider Costs**,
      **Operations Health**, **Payouts**, **Finance Ops**,
      **Vercel Deployments**, **Funnel**, **Diviner Traffic**,
      **Readings**, **Affiliates** (`/admin/reports/affiliates`),
      **Campaigns** (`/admin/campaigns/reports`).

Verify NOT present (deleted in cleanup):
- [ ] No nav entry for `/admin/affiliates/<id>` (the detail page is gone).
- [ ] No "Disputes" / "Manual Payouts" entries.

## E.1 Admin affiliates list — `/admin/affiliates`

- [ ] H1: **"Affiliates"**.
- [ ] Subheading: **"All affiliate partners across all diviners."**

Top-right:
- [ ] **"Add Affiliate"** button (Plus icon) → opens Sheet.

Add Affiliate Sheet:
- [ ] SheetTitle: **"Add Affiliate"**.
- [ ] SheetDescription: **"Create an affiliate and assign them to a diviner."**
- [ ] **Diviner** Select (required).
- [ ] **Name** Input.
- [ ] **Email** Input (email).
- [ ] **Phone (optional)** Input (tel).
- [ ] **Commission type** Select: **"Percentage"** | **"Fixed amount"**.
- [ ] Commission value Input — label varies by type.
- [ ] **"Create Affiliate"** button (Loader2 spinner).

Verify the **"Commission applies to"** Select is GONE (deleted in cleanup).

KPI card:
- [ ] **Total Affiliates** (Users icon) + count + **"<N> active"** subtitle.

Filters:
- [ ] Search Input (w-56), placeholder **"Search name or email…"**.
- [ ] Status Select: **"All statuses"** | **"Active"** | **"Pending"** | **"Suspended"** | **"Blocked"**.
- [ ] Diviner Select: **"All diviners"** + diviner options.

Table:
- [ ] Columns: **Name** | **Email** | **Diviner** | **Status** | **Commission** | **Created**.
- [ ] **No "Actions" column** (deleted in cleanup — verify ABSENT).

Pagination:
- [ ] **"Page <N>"** label.
- [ ] **"Prev"** button (disabled on first page).
- [ ] **"Next"** button (disabled when no more).

Toasts:
- [ ] Empty fields → **"Diviner, name, and email are required"**.
- [ ] API error → toast with title.
- [ ] Success → **"Affiliate created"**.

Empty state:
- [ ] **"No affiliates found."**

Loading state:
- [ ] Loader2 spinner centered.

## E.2 Admin reports overview — `/admin/reports/affiliates`

- [ ] H1: **"Affiliate & Social Advocate Report"**.
- [ ] Subheading: **"Combined metrics for social advocates and diviner affiliate programs. Drill into commission-v2 detail via the tabs below."**
- [ ] **ReportsTabs** rendered immediately under the header (see E.3).

Period selector:
- [ ] Buttons: **"30 Days"** | **"90 Days"** | **"1 Year"** | **"All Time"**.
- [ ] Active period = filled primary; others outline.

KPI cards (4):
- [ ] **Total Earned** (DollarSign icon) + USD + subtitle **"Both affiliate systems combined"**.
- [ ] **Total Paid** (Wallet icon) + USD.
- [ ] **Pending** (TrendingUp icon) + USD (amber if > 0).
- [ ] **Active Partners** (Users icon) + count + subtitle.

Tab selector inside the page (System A advocate vs affiliate vs combined):
- [ ] **"Social Advocates"** tab — renders mini cards + advocate table.
- [ ] **"Diviner Affiliates"** tab — renders mini cards + by-diviner + top-affiliate tables.
- [ ] **"Combined"** tab — Monthly Breakdown stacked bar chart with legend (emerald + blue).

EmergencyOverridesPanel renders below the chart (see E.9).

## E.3 ReportsTabs

Visible on every page under `/admin/reports/affiliates*`:
- [ ] **"Overview"** → `/admin/reports/affiliates`.
- [ ] **"By diviner"** → `/admin/reports/affiliates/by-diviner`.
- [ ] **"By affiliate"** → `/admin/reports/affiliates/by-affiliate`.
- [ ] **"Clicks"** → `/admin/reports/affiliates/clicks`.
- [ ] **"Conversions"** → `/admin/reports/affiliates/conversions`.
- [ ] **"Rate history"** → `/admin/reports/affiliates/rate-history`.
- [ ] Active tab has bottom border + `aria-current="page"`.
- [ ] Other tabs muted-foreground, hover state lights them.

## E.4 By-diviner — `/admin/reports/affiliates/by-diviner`

- [ ] H1: **"Affiliate revenue by diviner"**.
- [ ] Subheading.
- [ ] ReportsTabs at top.
- [ ] PeriodSelect (right-aligned).
- [ ] Card title: **"By diviner"**.
- [ ] Table columns: **Diviner** | **Clicks** | **Conversions** | **Earned** | **Reversed**.
- [ ] Diviner cell: display_name + monospace `@username` subtext.
- [ ] Sorted by `earned_cents` DESC.
- [ ] Empty state: **"No affiliate activity in this period."**
- [ ] Loading: Loader2 spinner inside the card.

## E.5 By-affiliate — `/admin/reports/affiliates/by-affiliate`

- [ ] H1: **"By affiliate (account roll-up)"**.
- [ ] Subheading mentions multi-junction roll-up.
- [ ] ReportsTabs + PeriodSelect.
- [ ] Card title: **"By affiliate"**.
- [ ] Table columns: **Affiliate** | **Account status** | **Partnerships** | **Clicks** | **Conversions** | **Earned** | **Reversed**.
- [ ] Affiliate cell: name + email subtext.
- [ ] Status Badge: active=default, blocked=destructive, else=outline.
- [ ] Empty state: **"No affiliate activity in this period."**

## E.6 Clicks — `/admin/reports/affiliates/clicks`

- [ ] H1: **"Clicks"**.
- [ ] Subheading mentions filter dimensions.
- [ ] ReportsTabs at top.

Filter card:
- [ ] CardTitle: **"Filters"**.
- [ ] **Country** Input (max 2 chars, placeholder **"US"**, uppercase normalization).
- [ ] **Diviner ID** Input (UUID).
- [ ] **Affiliate ID (junction)** Input (UUID).
- [ ] **Bot vs human** Select: **"All"** | **"Humans only"** | **"Bots only"**.
- [ ] **From** Input (date).
- [ ] **To** Input (date).
- [ ] **"Apply filters"** button.

Click log card:
- [ ] CardTitle: **"Click log"**.
- [ ] Columns: **When** | **Campaign** (campaign_code or first 8 of id) | **Country** | **Affiliate** | **Bot?** | **Unique?**.
- [ ] **Bot?** column: **"bot"** Badge (outline) or muted **"human"**.
- [ ] **Unique?** column: **"unique"** Badge (default) or muted **"repeat"**.

Pagination:
- [ ] **"Load more"** button below table when `hasMore=true`. Loader2 during fetch. Hides when no more.

Empty state:
- [ ] **"No clicks match your filters."**

## E.7 Conversions — `/admin/reports/affiliates/conversions`

- [ ] H1: **"Conversions"**.
- [ ] Subheading.

Filter card (same shape as Clicks):
- [ ] **Diviner ID**, **Affiliate ID (junction)**, **Status** (Select with **"All"** | **"Earned only"** | **"Reversed only"**), **From**, **To**, **"Apply filters"** button.

Conversion log table:
- [ ] Columns: **When** | **Campaign** | **Order** | **Rate used** | **Commission** | **Status** | **Action** (right-aligned).
- [ ] Campaign cell: name + first-8-chars id.
- [ ] Status Badge: **"earned"** (default) or **"reversed · <reason snippet>"** (outline).

Reverse button (only on rows where `reversed_at IS NULL`):
- [ ] Button text: **"Reverse"**, Undo2 icon, outline variant, sm size.
- [ ] Click → opens OverrideActionButton modal (see E.10).
- [ ] On reversed rows: NO Reverse button.

Pagination + Empty + Loading per the standard pattern.

## E.8 Rate history — `/admin/reports/affiliates/rate-history`

- [ ] H1: **"Rate history"**.
- [ ] Subheading mentions stamp semantics.

Filters:
- [ ] **Diviner ID**, **Affiliate ID (junction)**, **From**, **To**.

Table:
- [ ] Columns: **When** | **Assignment scope** | **From** | **To** | **Reason**.
- [ ] Assignment scope cell: monospace `<destination_type>: <destination_id snippet>` if destination_id, else just destination_type.
- [ ] Reverse-chronological order.
- [ ] Empty: **"No rate edits match your filters."**

## E.9 Emergency overrides panel (on Overview)

- [ ] Card with destructive border tint.
- [ ] CardTitle: **"Emergency overrides"** with ShieldAlert icon (destructive).
- [ ] CardDescription mentions admin_action_log + dual notifications + "Use sparingly."

Left column:
- [ ] **Assignment ID** Label.
- [ ] Input (font-mono text-xs), placeholder **"diviner_service_affiliates.id"**.
- [ ] **"Revoke assignment"** button (XCircle icon, destructive). Disabled until input is a valid UUID.
- [ ] Validation hint **"Not a valid UUID."** appears below button if input is set but invalid.

Right column:
- [ ] **Campaign ID** Label.
- [ ] Input (font-mono text-xs), placeholder **"affiliate_campaigns.id"**.
- [ ] **"Archive campaign"** button (Archive icon, destructive). Disabled until valid UUID.
- [ ] Validation hint same as above.

## E.10 OverrideActionButton modal

When opened from a Reverse / Revoke / Archive button:

- [ ] Dialog title varies per action ("Reverse this conversion" / "Force-revoke this assignment" / "Force-archive this campaign").
- [ ] Description matches the action.
- [ ] **Reason** Label.
- [ ] Textarea (id `override-reason`, max 500, min 5, rows 4) with placeholder **"Why are you taking this action? (5-500 characters, recorded in admin_action_log)"**.
- [ ] Character counter below: **"<N>/500 — minimum 5 characters."**

Footer buttons:
- [ ] **"Cancel"** (ghost) — disabled while submitting.
- [ ] Confirm button (destructive variant) with label per action ("Reverse" / "Revoke" / "Archive"). Disabled until `5 ≤ trim length ≤ 500`. Loader2 + label while submitting.

States:
- [ ] Type 4 chars → confirm disabled.
- [ ] Type 5 chars → confirm enabled.
- [ ] maxLength=500 prevents typing past 500.
- [ ] Click outside / Cancel while NOT submitting → modal closes, reason resets.
- [ ] Click outside while submitting → modal stays open (locked).

After successful POST/PATCH:
- [ ] Toast with success message ("Conversion reversed" / "Assignment revoked" / "Campaign archived").
- [ ] `router.refresh()` re-fetches data; table updates.
- [ ] Reason input cleared.

After failed POST:
- [ ] Toast with detail/title from problem+json error.
- [ ] Modal stays open; reason preserved.

After 409 (already reversed/archived):
- [ ] Toast shows the conflict message.

---

# SECTION F — DELETED ROUTES MUST 404

Verify these all return 404 in production (deleted in cleanup commits
`5f8c4f20` and `dd191244`):

Pages:
- [ ] `/admin/affiliates/<any-existing-id>` → 404 (page deleted).
- [ ] `/affiliate/commissions` → 404 (page deleted).
- [ ] `/affiliate/links` → 404 (page deleted).

API routes:
- [ ] `GET /api/admin/affiliates/<id>/disputes` → 404.
- [ ] `PATCH /api/admin/affiliates/<id>/disputes` → 404.
- [ ] `PATCH /api/admin/affiliates/disputes/<disputeId>` → 404.
- [ ] `GET /api/admin/affiliates/<id>/payouts` → 404.
- [ ] `POST /api/admin/affiliates/<id>/payouts` → 404.
- [ ] `GET /api/affiliate/commissions` → 404.
- [ ] `GET /api/affiliate/links` → 404.

Already-removed System A endpoints:
- [ ] `GET /api/dashboard/affiliates/<id>/links` → 404.
- [ ] `GET /api/dashboard/affiliates/<id>/commissions` → 404.
- [ ] `GET /api/dashboard/affiliates/<id>/commissions/export` → 404.
- [ ] `GET /api/dashboard/affiliates/<id>/payouts` → 404.
- [ ] `GET /api/dashboard/affiliates/<id>/disputes` → 404.
- [ ] `GET /api/admin/commissions/<commId>` → 404.
- [ ] `POST /api/admin/affiliates/<id>/commission-rules` → 404.

Repointed link verification:
- [ ] User detail page → "Affiliate" overview card → button now reads
      **"View affiliate metrics"** with ExternalLink icon →
      `/admin/reports/affiliates/by-affiliate` (NOT the deleted detail page).

---

# SECTION G — CROSS-ROLE & MULTI-DIVINER ISOLATION

## G.1 Multi-junction affiliate slice isolation

Affiliate 1 is partnered with Diviner A and Diviner B. Verify each
party only sees their own slice:

- [ ] Diviner A on `/dashboard/affiliates/<junction-A-id>` shows
      conversions/campaigns/rate-history scoped to Diviner A only.
      Diviner B's data invisible.
- [ ] Diviner A's `/api/dashboard/affiliate-reports/conversions`
      response only contains conversions on Diviner A's campaigns.
- [ ] Affiliate 1 on `/affiliate/campaigns/<campaign-via-A>` shows that
      campaign only; cannot see Diviner B's campaigns.
- [ ] Direct API: Affiliate 2 with Affiliate 1's `junctionId` in body →
      403 / 404.

## G.2 Cross-role auth gating

- [ ] Customer hitting `/dashboard/*` → 403 / login redirect.
- [ ] Diviner-only user hitting `/admin/*` → 403.
- [ ] Diviner-only user hitting `/affiliate` → "no_affiliate_account" gate.
- [ ] Anonymous hitting `/affiliate/notifications` → login redirect with `next` param.
- [ ] Anonymous hitting `/dashboard/notifications` → login redirect.
- [ ] Anonymous hitting `/admin/reports/affiliates` → admin shell redirect.

## G.3 Notification fan-out (admin actions)

After admin force-revokes Diviner A's assignment to Affiliate 1:
- [ ] Affiliate 1's `/affiliate/notifications` inbox shows
      `admin.override.assignment_revoked` notification.
- [ ] Diviner A's `/dashboard/notifications` inbox shows the same
      notification (delivered via legacy `createNotification`).
- [ ] BOTH email inboxes received the email (per spec §7).

After admin force-archives Affiliate 1's campaign:
- [ ] Affiliate 1's inbox shows `admin.override.campaign_archived`.
- [ ] Diviner A's inbox shows the same.

---

# SECTION H — RESPONSIVE / MOBILE

## H.1 Affiliate portal

- [ ] Header nav hidden on mobile (`hidden sm:flex`); only logo +
      avatar + logout visible.
- [ ] Cards stack vertically on small viewports.
- [ ] Tables horizontally scroll within `overflow-x-auto`.
- [ ] Save button on Preferences sticks at bottom on mobile too.

## H.2 Diviner dashboard

- [ ] Sidebar collapses to mobile hamburger / Sheet.
- [ ] **Notifications** entry visible in mobile More menu.
- [ ] Tables horizontally scroll on small screens.

## H.3 Admin reports

- [ ] ReportsTabs nav wraps to multiple lines on small screens
      (`flex-wrap`).
- [ ] Filter card grid collapses from 6 → 3 → 1 column at breakpoints.
- [ ] Long admin_action_log reasons truncate with ellipsis.

---

# SECTION I — ACCESSIBILITY (manual)

For every page in this checklist, verify:

- [ ] Tab order moves through interactive elements logically.
- [ ] All inputs have associated `<Label htmlFor=...>`.
- [ ] All icon-only buttons have `aria-label` or `title`.
- [ ] Modals trap focus and return focus to the trigger on close.
- [ ] Active nav link has `aria-current="page"`.
- [ ] Status announcements (toasts) are announced by screen reader
      (sonner uses ARIA live regions by default).
- [ ] Color contrast on all status badges meets WCAG AA (≥ 4.5:1 for
      text, ≥ 3:1 for non-text).
- [ ] Skeleton loaders don't trap focus or block keyboard nav.

---

# SECTION J — TOAST INVENTORY

Confirm each of these toasts fires in the right scenario:

| Toast text | Trigger |
|---|---|
| "Pick a product first." | Affiliate campaign new — empty product |
| "Give your campaign a name." | Affiliate campaign new — empty name |
| "Campaign created" | Affiliate campaign new — success |
| "Campaign archived" | Affiliate campaign detail — success |
| "Failed to archive campaign" / `<detail>` | Affiliate archive — failure |
| "Preferences saved" | Affiliate prefs — success |
| "Profile saved" | Affiliate profile — success |
| "Name is required" | Affiliate profile — empty name |
| "Pick an affiliate first." | Diviner /new — empty |
| "Pick a service for SERVICE-scoped assignments." | Diviner /new |
| "Commission must be a non-negative number." | Diviner /new |
| "Percent commission can't exceed 100." | Diviner /new |
| "Affiliate assigned" | Diviner /new — success |
| "Name and email are required" | Diviner invite dialog |
| "Invitation saved but email delivery failed. You can resend from the affiliate's row." | Invite — SES failure |
| "Invitation sent to <email>. They have 14 days to accept." | Invite — success |
| "Invitation resent to <email>." | Resend — success |
| "New invite created, but email delivery failed." | Resend — SES failure |
| "Invitation revoked and affiliate removed from your list." | Revoke — junction deleted |
| "Invitation revoked. Partnership moved to Suspended (had prior commission history)." | Revoke — junction suspended |
| "No active invite to revoke" | Revoke without latest_invite |
| "Conversion reversed" | Admin Reverse — success |
| "Assignment revoked" | Admin Revoke — success |
| "Campaign archived" | Admin Archive — success |
| "Reason must be 5-500 characters" | Override modal — bad reason |
| "Action failed" / `<detail>` | Override modal — failure |
| "Network error" | Any fetch network failure |

---

# SECTION K — BROWSER TAB TITLES

Each route's `<title>` (from layout `metadata` or page-specific):

- [ ] Affiliate portal: **"Affiliate Portal — AstrologyPro"** (set by portal layout `metadata.title`).
- [ ] Diviner dashboard pages: per-page or default dashboard title.
- [ ] Admin pages: per-page admin title.

---

# Sign-off

This sprint can ship to production when:
- [ ] Every section above is ticked.
- [ ] All deletion-confirmation 404s in §F return correctly.
- [ ] No P0/P1 visual regressions vs the spec or this doc.
- [ ] Section I (accessibility) reviewed by someone who tabs through every page.

Tested by: ____________________  Browser/OS: __________  Date: __________
