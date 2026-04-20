# Manual Test Checklist - 2026-04-17 Sprint

Use this checklist to manually test the 2026-04-17 sprint work for:

- Diviner service landing page access control
- Diviner landing page builder/dashboard
- Campaign destination selection
- Campaign tracking URLs
- Admin service template and campaign management

Some issues were already found during automated/local verification. They are listed in `docs/tasks/2026-04-18/verification-followups/`. The checklist below tells you what should work now and what is expected to fail until those follow-up tasks are fixed.

---

## 1. Local Setup

### 1.1 Confirm Node Version

Run:

```powershell
node -v
```

Expected:

```text
v22.19.0
```

Notes:

- The project `.nvmrc` requires Node `22.19.0`.
- Node `20.x` may still run some pages, but dependencies such as `@daily-co/daily-js` require Node `>=22.14.0`.

### 1.2 Install Dependencies

Run:

```powershell
npm ci
```

Expected:

- Dependencies install successfully.
- No fatal install errors.

### 1.3 Confirm Environment File Location

Check that this file exists:

```text
.env.local
```

Expected:

- `.env.local` is at the project root, not only inside `src/`.
- The app can read Supabase, Stripe, and app URL variables.

### 1.4 Start Local App

Run:

```powershell
npm run dev
```

Expected:

```text
Local: http://localhost:3000
```

Open:

```text
http://localhost:3000
```

---

## 2. Test Accounts

Use these accounts from `docs/test-users.md`.

### Diviner Account

```text
Email: diviner1@test.astrologypro.com
Password: TestUser123!
Portal: /dashboard
Username: test-diviner-1
```

### Admin Account

```text
Email: admin.test@astrologypro.com
Password: AdminTest2026!
Portal: /admin
```

### Optional Client Account

```text
Email: client1@test.astrologypro.com
Password: TestUser123!
Portal: /portal
```

---

## 3. Diviner Login Test

### Steps

1. Open:

```text
http://localhost:3000/login
```

2. Log in as:

```text
diviner1@test.astrologypro.com
TestUser123!
```

3. Wait for redirect.

### Expected

- User lands on:

```text
/dashboard
```

- Page shows the diviner dashboard.
- Sidebar includes links such as:
  - Overview
  - Calendar
  - Services
  - Landing Pages
  - Campaigns / Marketing

### Pass / Fail

- [ ] Pass - Diviner logs in and reaches `/dashboard`.
- [ ] Fail - Login stays on `/login`.
- [ ] Fail - Login redirects to `/contracts/pending`.
- [ ] Fail - Dashboard shows unauthorized or server error.

---

## 4. Diviner Landing Pages Dashboard

### Steps

1. Log in as the diviner.
2. Open:

```text
http://localhost:3000/dashboard/landing-pages
```

### Expected

- Page loads without redirecting to login.
- Page title/content mentions landing pages.
- Enabled services appear in the list.
- For `diviner1@test.astrologypro.com`, at least these services should be available:
  - Nativity Birth Chart
  - another enabled service if seeded
- Each landing-page row/card should expose actions such as:
  - Builder/Edit
  - Preview/Public URL
  - Analytics
  - Publish/Unpublish where applicable

### Known Issue To Watch

The summary count may be wrong until follow-up task `VF-03` is fixed.

Example known issue:

- API may return enabled rows with `is_published = true`.
- Summary may still show `total_published = 0`.

### Pass / Fail

- [ ] Pass - `/dashboard/landing-pages` loads.
- [ ] Pass - Enabled services are listed.
- [ ] Pass - Builder and analytics links are visible.
- [ ] Known fail - Published summary count is incorrect.
- [ ] Fail - Page redirects to `/login`.
- [ ] Fail - Page shows empty list despite enabled services.
- [ ] Fail - Page shows “Failed to load”.

---

## 5. Landing Page Builder

### Steps

1. From `/dashboard/landing-pages`, open the builder for Nativity Birth Chart.
2. Or open directly:

```text
http://localhost:3000/dashboard/landing-pages/33a43256-7dc2-4ad4-88aa-3def8740ac56/builder
```

### Expected

- Builder page loads.
- Page shows:
  - Section list
  - Add section control
  - Preview/publish controls
  - Existing default/system sections
- You can inspect or edit section content.

### Suggested Manual Actions

- [ ] Open builder.
- [ ] Add a simple text/content section if UI allows.
- [ ] Edit a field.
- [ ] Save/update the section.
- [ ] Reorder a section if drag/drop is available.
- [ ] Toggle a non-required section on/off if available.
- [ ] Publish or leave as draft depending on test intent.

### Expected After Editing

- Changes save without console/server error.
- UI stays on builder.
- Refreshing page preserves saved changes.

### Known Missing Item

The task specification mentions this API route:

```text
src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts
```

That route was missing during verification. Draft preview behavior should be tested carefully and fixed under `VF-05` if it is not available.

### Pass / Fail

- [ ] Pass - Builder loads.
- [ ] Pass - Existing sections render.
- [ ] Pass - Section edit/save works.
- [ ] Pass - Publish action works.
- [ ] Known fail - Dedicated preview API route is missing.
- [ ] Fail - Builder crashes.
- [ ] Fail - Saving section returns error.
- [ ] Fail - Public page shows draft-only content unexpectedly.

---

## 6. Public Diviner Service Landing Page

### Steps

Open:

```text
http://localhost:3000/test-diviner-1/services/nativity-birth-chart
```

### Expected

- Public page loads.
- Page title references:
  - Nativity Birth Chart
  - Test Diviner 1
- Page shows:
  - Service name
  - Diviner name
  - Price
  - Duration
  - Booking CTA
  - “What’s Included” or equivalent service content

### Access-Control Checks

Try a service that is not enabled for this diviner, if known.

Expected:

- Disabled/not-enabled service should not show as publicly bookable.
- Page should return 404, redirect, or otherwise deny public access.

### Pass / Fail

- [ ] Pass - Enabled service public page loads.
- [ ] Pass - Booking CTA appears.
- [ ] Pass - Disabled service does not load publicly.
- [ ] Fail - Enabled page returns 404.
- [ ] Fail - Disabled service is publicly visible.

---

## 7. Generic Service Directory

### Steps

Open:

```text
http://localhost:3000/services
```

Then open:

```text
http://localhost:3000/services/nativity-birth-chart
```

### Expected

- `/services` loads the service directory.
- `/services/nativity-birth-chart` loads the generic service page.
- Generic service page lets users compare/select diviners.
- Disabled diviners should not appear for a service.

### Pass / Fail

- [ ] Pass - `/services` loads.
- [ ] Pass - Generic service detail page loads.
- [ ] Pass - Service page shows diviner selection/comparison.
- [ ] Fail - Page returns 404.
- [ ] Fail - Disabled diviners appear as available.

---

## 8. Campaign Destination Options

### Steps

1. Log in as diviner.
2. Open:

```text
http://localhost:3000/dashboard/campaigns
```

3. Click create/new campaign.
4. Find the destination picker.

### Expected

Destination options should include:

- Profile destination:

```text
My Profile Page
/test-diviner-1
```

- Enabled service destinations only, for example:

```text
Nativity Birth Chart
/test-diviner-1/services/nativity-birth-chart
```

Disabled services should not be selectable.

### Pass / Fail

- [ ] Pass - Campaign page loads.
- [ ] Pass - Destination picker appears.
- [ ] Pass - Profile destination is available.
- [ ] Pass - Enabled service destinations are available.
- [ ] Pass - Disabled services are hidden.
- [ ] Fail - Destination picker missing.
- [ ] Fail - Disabled service is selectable.

---

## 9. Create Campaign With Service Destination

### Steps

1. Log in as:

```text
diviner1@test.astrologypro.com
```

2. Open:

```text
http://localhost:3000/dashboard/campaigns
```

3. Create a new campaign.
4. Use test data:

```text
Name: Manual QA Service Campaign
Description: Manual QA test campaign
Start Date: today
Commission Type: Percentage
Commission Value: 10
Destination Type: Service
Service: Nativity Birth Chart
Channel: Direct
```

5. Submit/save.

### Expected

- Campaign is created successfully.
- Campaign status is draft unless UI activates it.
- Campaign receives:
  - `campaign_code` in format `cmp_XXXXXXXX`
  - share URL like `/r/cmp_XXXXXXXX`
- Campaign detail/list shows destination badge as service destination.

### Pass / Fail

- [ ] Pass - Campaign saves.
- [ ] Pass - Campaign code starts with `cmp_`.
- [ ] Pass - Share URL is displayed.
- [ ] Pass - Destination badge says service or equivalent.
- [ ] Fail - Save returns validation error for enabled service.
- [ ] Fail - Campaign saves without campaign code.
- [ ] Fail - Share URL missing.

---

## 10. Campaign Disabled-Service Security Test

This checks backend enforcement, not just UI hiding.

### Steps

1. Log in as `diviner1@test.astrologypro.com`.
2. Attempt to create a campaign using a service template that is not enabled for the diviner.
3. If testing through UI is not possible, use browser devtools or API tooling with the authenticated session.

Example disabled service from verification:

```text
Solar Return
```

### Expected

Backend rejects the request.

Expected status:

```text
403
```

Expected message:

```text
This service is not enabled for your account.
```

### Pass / Fail

- [ ] Pass - Disabled service campaign creation is rejected by backend.
- [ ] Fail - Disabled service campaign is created.

---

## 11. Campaign Tracking Link Test

### Steps

1. Create a campaign with a service destination.
2. **IMPORTANT:** New campaigns start in `draft` status. Draft campaigns are
   considered inactive and `/r/cmp_...` will NOT route to the selected
   service destination — it falls back to the diviner profile by design.
   Activate the campaign first via the "Activate" control in the campaign
   detail page (or `POST /api/dashboard/campaigns/[id]/activate`).
3. Copy the generated share URL:

```text
http://localhost:3000/r/cmp_XXXXXXXX
```

4. Open the share URL in a logged-out/incognito browser.

### Expected

- URL redirects to the selected destination *after activation*.
- For service destination:

```text
/test-diviner-1/services/nativity-birth-chart
```

- Redirect URL may include attribution params such as:

```text
ref=cmp_XXXXXXXX
```

- While the campaign is `draft`/`paused`/`expired`, the campaign URL display
  in the dashboard shows an "inactive" warning and the Copy/Open buttons are
  disabled. Share URLs should not be distributed until the campaign is
  active.

### Pass / Fail

- [ ] Pass - `/r/cmp_...` redirects to the correct destination once the
      campaign is active.
- [ ] Pass - Click does not crash the app.
- [ ] Pass - Click tracking is recorded if analytics tables are available.
- [ ] Pass - Dashboard UI shows draft/inactive state when campaign is not
      yet active (copy + open buttons disabled, warning shown).
- [ ] Fail - Redirect goes to `/` while the campaign is active.
- [ ] Fail - Redirect goes to wrong service.
- [ ] Fail - Redirect exposes disabled service.

---

## 12. Campaign Delete Cleanup Test

### Important Known Issue

This failed during verification. Follow-up task `VF-02` was created.

### Steps

1. Create a draft campaign with service destination.
2. Note the campaign code:

```text
cmp_XXXXXXXX
```

3. Delete the draft campaign.
4. Try opening:

```text
http://localhost:3000/r/cmp_XXXXXXXX
```

### Expected After Fix

- Deleted campaign URL should no longer be active.
- It should redirect to `/` or return an inactive behavior.
- No active orphaned `tracking_links` row should remain.

### Current Known Behavior

During verification, deleting a draft campaign left:

```text
tracking_links.campaign_id = null
tracking_links.is_active = true
```

That means the tracking URL could still behave like a legacy active link.

### Pass / Fail

- [ ] Pass after fix - Deleted campaign tracking URL is inactive.
- [ ] Known fail before fix - Deleted campaign tracking URL remains active.

---

## 13. Admin Login Test

### Steps

Open:

```text
http://localhost:3000/login
```

Log in as:

```text
admin.test@astrologypro.com
AdminTest2026!
```

### Expected

- User lands on:

```text
/admin
```

- Admin sidebar appears.
- Platform overview cards load.

### Pass / Fail

- [ ] Pass - Admin logs in and reaches `/admin`.
- [ ] Fail - Redirects to non-admin portal.
- [ ] Fail - Shows unauthorized.

---

## 14. Admin Service Templates

### Steps

Open:

```text
http://localhost:3000/admin/service-templates
```

### Expected

- Service templates list loads.
- There are 19 seeded service templates.
- Page shows columns or details like:
  - Name
  - Category
  - Duration
  - Price
  - Active status
  - Diviner count
  - Actions

### Optional Create/Edit Test

Only do this if you are comfortable modifying test data.

- Create a temporary service template.
- Edit the template.
- Deactivate or delete the template if delete is supported.

### Pass / Fail

- [ ] Pass - Templates page loads.
- [ ] Pass - 19 templates are visible or returned by API.
- [ ] Pass - Add Template button appears.
- [ ] Pass - Edit page opens for a template.
- [ ] Fail - Page shows unauthorized.
- [ ] Fail - Template list is empty.

---

## 15. Admin Diviner Service Assignment

### Steps

1. Open:

```text
http://localhost:3000/admin/diviners
```

2. Open a diviner detail page.
3. Look for service assignment controls.

### Expected

- Diviner list loads.
- Diviner detail page loads.
- Service assignment section appears.
- Admin can see enabled/disabled services.
- Admin can toggle service enablement and publishing.
- Audit log should update when service assignment changes.

### Suggested Manual Test

Use a test diviner only.

1. Disable a service.
2. Confirm it disappears from diviner destination options.
3. Confirm public page is blocked.
4. Re-enable the service.
5. Confirm it reappears.

### Pass / Fail

- [ ] Pass - Diviner list loads.
- [ ] Pass - Service assignment section appears.
- [ ] Pass - Enable/disable toggle works.
- [ ] Pass - Public access changes immediately.
- [ ] Pass - Campaign destination options update.
- [ ] Fail - Toggle does not save.
- [ ] Fail - Disabled service remains public/selectable.

---

## 16. Admin Campaigns

### Steps

Open:

```text
http://localhost:3000/admin/campaigns
```

### Expected

- Campaign list loads.
- Existing campaigns are visible.
- Destination columns/badges appear where destination data exists.
- Campaign codes appear where available.

### Pass / Fail

- [ ] Pass - Admin campaigns page loads.
- [ ] Pass - Campaign list appears.
- [ ] Pass - Campaign code/destination columns are visible.
- [ ] Fail - Page shows unauthorized.
- [ ] Fail - Campaign list fails to load.

---

## 17. Admin Analytics - Known Broken Until Follow-Up Fixes

These are expected to fail until `VF-01` is fixed.

### Landing Page Analytics

Open:

```text
http://localhost:3000/admin/analytics/landing-pages
```

Current known behavior:

```text
Failed to load analytics
```

API currently returns:

```text
403 Forbidden
```

### Campaign Analytics

Open:

```text
http://localhost:3000/admin/campaigns/analytics
```

Current known API behavior:

```text
403 Not an admin
```

### Expected After Fix

- Both pages load analytics data or empty-state cards.
- Both APIs return `200` for `admin.test@astrologypro.com`.

### Pass / Fail

- [ ] Known fail before fix - Landing page analytics returns 403.
- [ ] Known fail before fix - Campaign analytics returns 403.
- [ ] Pass after fix - Both admin analytics APIs return 200.

---

## 18. Client Smoke Test

### Steps

Log in as:

```text
client1@test.astrologypro.com
TestUser123!
```

Open:

```text
http://localhost:3000/portal
```

### Expected

- Client portal loads.
- Client can see bookings/orders/profile areas.
- No regression from landing-page or campaign changes.

### Pass / Fail

- [ ] Pass - Client logs in and reaches `/portal`.
- [ ] Fail - Client is redirected incorrectly.
- [ ] Fail - Portal crashes.

---

## 19. Build and Lint Checks

### Build

Run:

```powershell
npm run build
```

Expected:

- Build completes successfully.

Known warning:

- `eslint` key in `next.config.ts` is invalid for Next 16.

### Lint

Run:

```powershell
npm run lint
```

Current known behavior:

- Fails with many React lint/compiler errors.

Expected after follow-up task `VF-04`:

- Lint passes, or remaining failures are intentionally documented and scoped.

### Pass / Fail

- [ ] Pass - Build completes.
- [ ] Known fail - Lint fails before `VF-04`.
- [ ] Pass after fix - Lint passes.

---

## 20. Final Manual QA Sign-Off

Use this final checklist after testing.

### Diviner

- [ ] Diviner login works.
- [ ] `/dashboard` loads.
- [ ] `/dashboard/landing-pages` loads.
- [ ] Landing page builder loads.
- [ ] Public diviner service page loads.
- [ ] Campaign page loads.
- [ ] Destination picker shows profile and enabled services.
- [ ] Disabled service cannot be selected or submitted.
- [ ] Service-destination campaign can be created.
- [ ] Campaign share URL redirects correctly.
- [ ] Draft campaign delete cleans up tracking link after `VF-02`.

### Admin

- [ ] Admin login works.
- [ ] `/admin` loads.
- [ ] `/admin/service-templates` loads.
- [ ] `/admin/diviners` loads.
- [ ] Service assignment controls work.
- [ ] `/admin/campaigns` loads.
- [ ] Admin landing-page analytics works after `VF-01`.
- [ ] Admin campaign analytics works after `VF-01`.

### Public

- [ ] `/services` loads.
- [ ] `/services/nativity-birth-chart` loads.
- [ ] Enabled diviner service page loads.
- [ ] Disabled service page is blocked.

### Technical

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes after `VF-04`.
- [ ] No unexpected browser console errors on tested pages.
- [ ] No unauthorized API errors for valid users.

---

## Known Issues From Verification

Track these in:

```text
docs/tasks/2026-04-18/verification-followups/
```

Known issues:

1. Admin analytics APIs use wrong admin checks and return `403`.
2. Deleting draft campaigns leaves active orphaned tracking links.
3. Landing-page summary published counts can be wrong.
4. `npm run lint` fails.
5. Some originally specified builder files/routes are missing or consolidated.
6. Local setup must use Node `22.19.0` and root `.env.local`.
