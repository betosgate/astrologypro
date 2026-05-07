# Manual End-to-End Test Checklist — 2026-05-05 Sprints

**Scope covers three task folders:**
- `affiliate-carve-out-at-booking-creation` (Phase 1.5 — must test first)
- `affiliate-payouts-phase-2` (Phase 2 — test after Phase 1.5 is live)
- `affiliate-analytics-phase-3` (Phase 3 — test after Phase 2 has 30+ days of data)

> **How to use this checklist:**  
> Every checkbox = one thing you physically do or observe in a browser screen.  
> Numbers in parentheses are the expected values you should see on screen.  
> Stripe Dashboard counts as a UI screen.

---

## TEST ACCOUNTS TO HAVE READY

Before starting, make sure you have these test accounts set up:

| Account | Details |
|---|---|
| Test Affiliate | Active `diviner_affiliate` account, email known |
| Test Diviner | Has Stripe Express connected in test mode |
| Test Customer | Regular user for booking |
| Test Service | Price = **$175**, platform fee = **15%** |
| Per-Diviner Campaign | 20% percent rate, share code e.g. `cmp_pd_test` |
| General Campaign | 20% percent rate, share code e.g. `cmp_gen_test` |

---

---

# PART 1 — PHASE 1.5: AFFILIATE CARVE-OUT AT BOOKING CREATION

---

## TEST 1.1 — Non-Affiliate Booking (Regression — Must Not Change)

**Purpose:** Confirm that a booking made with NO referral code is completely unaffected by Phase 1.5.

### Steps
1. Open a private/incognito browser window
2. Navigate directly to `/<diviner-slug>/services/<service-slug>` — no `?ref=` in the URL
3. Log in as the test customer
4. Select the $175 service and proceed to payment
5. Pay with Stripe test card `4242 4242 4242 4242`
6. Complete the booking

### What to Check on the Booking Confirmation Screen
- [ ] Booking confirmation page loads successfully
- [ ] No error messages
- [ ] Booking shows price = **$175.00**

### What to Check in Stripe Dashboard → Payments → Find this PaymentIntent
- [ ] `Amount` = **$175.00**
- [ ] `Application fee` = **$26.25** (that is 15% of $175 — platform fee only, no affiliate share)
- [ ] Open the PaymentIntent → scroll to **Metadata** section:
  - [ ] `affiliateCommissionCents` = **"0"**
  - [ ] `splitAffiliateRule` = **"no_affiliate_share"**
  - [ ] `applicationFeeCents` = **"2625"**
  - [ ] `divinerNetAmountCents` = **"14875"**

### What to Check in Stripe Dashboard → Connected Accounts → This Diviner → Payouts/Transfers
- [ ] The transfer for this booking = **$148.75** (diviner receives full gross minus 15% platform fee)

### What to Check in Affiliate Earnings UI
- [ ] Log in as the test affiliate
- [ ] Navigate to `/affiliate/earnings` or `/affiliate/reports`
- [ ] Confirm **no new conversion row** appears for this booking (non-affiliate booking = no commission)

---

## TEST 1.2 — Per-Diviner Affiliate Booking — Full Carve-Out

**Purpose:** Verify the money is correctly split when a booking comes through a per-diviner campaign.

**Expected math for $175 at 15% platform + 20% affiliate:**
| Party | Amount |
|---|---|
| Customer pays | $175.00 |
| Platform keeps | $26.25 (15%) |
| Affiliate earns | **$35.00** (20%) |
| Diviner receives | **$113.75** (the rest) |
| Stripe `application_fee_amount` | **$61.25** (platform + affiliate combined) |

### Steps
1. Open a new private/incognito browser window
2. Navigate to `/r/cmp_pd_test` (the per-diviner campaign share link)
3. Confirm you are redirected (307) to the diviner's service or profile page
4. Confirm the URL now contains `?ref=cmp_pd_test` OR a referral cookie is set
5. Log in as the test customer
6. Select the $175 service and proceed to payment
7. Pay with Stripe test card `4242 4242 4242 4242`
8. Complete the booking

### What to Check on the Booking Confirmation Screen
- [ ] Booking confirmation loads with no errors
- [ ] Price shown = **$175.00**

### What to Check in Stripe Dashboard → Payments → Find this PaymentIntent
- [ ] `Amount` = **$175.00**
- [ ] `Application fee` = **$61.25** ← This is the key change. Old behavior was $26.25. Now it includes the affiliate's $35.
- [ ] Open the PaymentIntent → **Metadata** section:
  - [ ] `affiliateCommissionCents` = **"3500"**
  - [ ] `applicationFeeCents` = **"6125"**
  - [ ] `divinerNetAmountCents` = **"11375"**
  - [ ] `splitAffiliateRule` = **"stamped_affiliate_share"**

### What to Check in Stripe Dashboard → Connected Accounts → This Diviner → Balance Transactions
- [ ] Find the transfer for this booking
- [ ] Transfer amount = **$113.75** ← Old behavior was $148.75. Diviner's payout is now reduced by the affiliate's share.

### What to Check in the Affiliate Portal — Earnings Screen
1. Log in as the test affiliate
2. Navigate to `/affiliate/earnings`
- [ ] A new commission row appears for this booking
- [ ] Commission amount shown = **$35.00**
- [ ] Campaign name shows the per-diviner campaign
- [ ] Payout status pill shows **"Holding"** (or "Unpaid") — money is held on platform, Phase 2 will pay it out

### What to Check in Admin Reports (if accessible)
1. Log in as admin
2. Navigate to the finance/ledger report
- [ ] The ledger entry for this booking shows `affiliate_commission` = **$35.00**

---

## TEST 1.3 — General-Product Affiliate Booking

**Purpose:** Same verification as Test 1.2 but via the general campaign (not diviner-specific).

### Steps
1. Open a private/incognito window
2. Navigate to `/r/cmp_gen_test` (the general campaign share link)
3. Confirm redirect to the general service page
4. Book the $175 service as the test customer, complete payment

### What to Check in Stripe Dashboard → This PaymentIntent
- [ ] `Application fee` = **$61.25**
- [ ] Metadata `affiliateCommissionCents` = **"3500"**
- [ ] Metadata `splitAffiliateRule` = **"stamped_affiliate_share"**

### What to Check — Diviner Transfer
- [ ] Transfer = **$113.75** (same reduction as Test 1.2)

### What to Check — Affiliate Earnings Screen
- [ ] New $35.00 commission row appears
- [ ] Status pill = **"Holding"**

---

## TEST 1.4 — Flat-Rate Stamp (e.g. $25 flat per booking)

**Purpose:** Flat-rate campaigns calculate correctly, not percent-based.

**Expected math for $175 with $25 flat rate:**
| Party | Amount |
|---|---|
| Platform | $26.25 (15%) |
| Affiliate | **$25.00** (flat) |
| Diviner | **$123.75** |
| `application_fee_amount` | **$51.25** |

### Steps
1. Use a campaign with `rate_type = flat` and `rate_value = 25`
2. Navigate to that campaign's share link, book the $175 service, complete payment

### What to Check in Stripe Dashboard → This PaymentIntent
- [ ] `Application fee` = **$51.25**
- [ ] Metadata `affiliateCommissionCents` = **"2500"**

### What to Check — Diviner Transfer
- [ ] Transfer = **$123.75**

### What to Check — Affiliate Earnings Screen
- [ ] Commission row shows **$25.00**

---

## TEST 1.5 — Member Discount Booking With Affiliate Stamp

**Purpose:** Verify discount reduces platform fee but affiliate commission is still on full gross.

**Expected math for $175 with member discount (10% platform) + 20% affiliate:**
| Party | Amount |
|---|---|
| Platform | $17.50 (10% after discount) |
| Affiliate | **$35.00** (20% of full $175 gross) |
| Diviner | **$122.50** |

### Steps
1. Log in as a member-tier customer
2. Navigate via the referral link `/r/cmp_pd_test`
3. Book the $175 service, complete payment

### What to Check in Stripe Dashboard → This PaymentIntent
- [ ] `Application fee` = **$52.50** ($17.50 + $35.00)
- [ ] Metadata `affiliateCommissionCents` = **"3500"** (commission is percent of gross, not of discounted price)

### What to Check — Diviner Transfer
- [ ] Transfer = **$122.50**

---

## TEST 1.6 — Free Booking (No Payment Required)

**Purpose:** Free slots with a referral code produce no PaymentIntent; the booking completes fine.

### Steps
1. Use a service slot that is free (price = $0)
2. Navigate via the referral link (include `?ref=cmp_pd_test`)
3. Complete the booking — there should be no payment step

### What to Check on the Booking Screen
- [ ] No Stripe payment form appears
- [ ] Booking completes with "Booking confirmed" or similar message

### What to Check in Stripe Dashboard
- [ ] Search for this booking ID in Stripe → **no PaymentIntent exists**

### What to Check in Affiliate Earnings Screen
- [ ] A commission row appears with **$0.00** commission (free booking, no money to carve)

---

## TEST 1.7 — Refund Flow Via Diviner/Customer UI (Shared Pipeline)

**Purpose:** When a booking is refunded, the affiliate's commission is reversed and the money flow is correct.

**Use the booking from Test 1.2** (per-diviner, $175, $35 affiliate commission, application_fee = $61.25)

### Steps
1. Log in as the diviner (or customer, depending on your UI)
2. Find the booking from Test 1.2
3. Click "Cancel" or "Refund" and confirm the refund

### What to Check — Customer's Payment
- [ ] In Stripe Dashboard → Payments → Find the PaymentIntent
- [ ] A refund appears for **$175.00** (full amount returned to customer)
- [ ] The refund does NOT show `application_fee_refunded: true` ← this is important

### What to Check — Diviner's Connected Account
- Open Stripe Dashboard → Connected Accounts → This Diviner → Balance Transactions
- [ ] A **debit** appears for **$113.75** (the diviner's net — NOT $175 and NOT $148.75)
- [ ] The debit is proportional to what the diviner received, not the full gross

### What to Check — Affiliate Earnings Screen
1. Log in as the test affiliate
2. Navigate to `/affiliate/earnings`
- [ ] The $35.00 commission row for this booking now shows status **"Reversed"** (red pill)
- [ ] The commission is **no longer counted** in the "Total Earned" card (the number went back down)

### What to Check — Money Balance (All Four Parties)
| Account | Expected result after refund | Screen to check |
|---|---|---|
| Customer | Got $175 back | Stripe Dashboard refund |
| Diviner | Net $0 (received $113.75, returned $113.75) | Connected account balance |
| Platform | Net $0 (held $61.25, paid $175 back, recovered $113.75 from diviner) | Stripe Dashboard |
| Affiliate | $0 earned (commission reversed) | Affiliate earnings screen |

- [ ] All four parties show the correct expected state

---

## TEST 1.8 — Refund Flow Via Admin Route

**Purpose:** Confirm the admin refund route also reverses the affiliate commission.

### Steps
1. Create a **new** affiliate-stamped booking and confirm payment (do not reuse Test 1.2)
2. Log in as admin
3. Navigate to the admin panel → find this booking
4. Use the admin "Refund" or "Issue Refund" action
5. Confirm the refund

### What to Check in Stripe Dashboard
- [ ] Refund = **$175.00** to customer
- [ ] Diviner debit = **$113.75** only (not full $175)

### What to Check — Affiliate Earnings Screen
- [ ] The commission row shows **"Reversed"**
- [ ] Total Earned on the affiliate dashboard decreased by $35.00

---

## TEST 1.9 — Refund Flow Via No-Show Cron

**Purpose:** The automated no-show cron also reverses the affiliate commission when it issues a refund.

### Steps
1. Create a new affiliate-stamped booking
2. Mark it as a no-show (use admin tools or set the booking status manually via admin UI)
3. Wait for the no-show cron to fire (it runs every ~10 minutes), OR trigger it via admin if there's a manual trigger button

### What to Check in Stripe Dashboard
- [ ] A refund appears for this booking (the no-show refund percentage × $175)

### What to Check — Affiliate Earnings Screen
- [ ] The commission row for this booking shows **"Reversed"**

---

## TEST 1.10 — Refund a Non-Affiliate Booking (No Noise)

**Purpose:** Refunding a booking that had no affiliate referral should work cleanly with no errors.

### Steps
1. Create a regular booking with NO referral code (like Test 1.1)
2. Refund it via the UI

### What to Check
- [ ] Refund succeeds with no error messages
- [ ] Customer gets their $175 back (Stripe Dashboard)
- [ ] Affiliate earnings screen shows **no change** (no phantom entries)

---

---

# PART 2 — PHASE 2: AFFILIATE PAYOUTS

> **Before starting Phase 2 tests, confirm Phase 1.5 is live**  
> (you can verify by checking: does the Stripe PaymentIntent for a test affiliate booking show `application_fee = $61.25`? If yes, Phase 1.5 is live.)

---

## TEST 2.1 — Affiliate Dashboard — Not Connected State

**Purpose:** An affiliate who has never connected Stripe sees the correct CTA.

### Steps
1. Log in as the test affiliate (make sure this account has `stripe_account_id` not yet set)
2. Navigate to `/affiliate/dashboard`

### What to See on Screen
- [ ] A prominent **"Connect Stripe"** button is visible — full-width or primary CTA
- [ ] No green "Connected" badge anywhere
- [ ] Earnings summary cards show either zeros or are not visible
- [ ] No payout history section (or an empty state)

### What to See on the Create Campaign Page
1. Navigate to `/affiliate/campaigns/create` (or click "Create Campaign")
- [ ] Instead of the create form, you see a gating screen saying something like **"Connect Stripe to create new campaigns"**
- [ ] The screen explains that existing campaigns continue to work — only new ones are blocked
- [ ] A **"Connect Stripe →"** button is shown

---

## TEST 2.2 — Stripe Express Onboarding — First Time Connect

**Purpose:** Clicking "Connect Stripe" takes the affiliate through Stripe Express onboarding and comes back with payouts enabled.

### Steps
1. On the affiliate dashboard, click **"Connect Stripe"**
2. Verify a Stripe-hosted onboarding page opens (URL should be `connect.stripe.com/...`)
3. Complete the onboarding using Stripe test data:
   - Business type: Individual
   - SSN last 4: `0000`
   - Phone: any test US number
   - Bank account routing: `110000000`, account: `000123456789`
   - Accept terms
4. Stripe redirects you back to `/affiliate/dashboard?stripe=complete`

### What to See After Returning to Dashboard
- [ ] The dashboard shows a **green "Connected — payouts enabled"** badge or panel
- [ ] "Last synced X seconds ago" text visible
- [ ] The **"Connect Stripe"** button is **gone**
- [ ] Earnings summary cards are now visible
- [ ] The "Create Campaign" page now shows the normal campaign creation form (no gating screen)

### What to Verify in Stripe Dashboard
- Open Stripe Dashboard → Connect → Accounts
- [ ] A new Express account appears (created moments ago)
- [ ] Account metadata shows `role: "affiliate"` (visible in account details)
- [ ] Account capabilities show `transfers: active`

---

## TEST 2.3 — Resume Incomplete Onboarding

**Purpose:** An affiliate who started but did not finish onboarding sees a "Resume" prompt.

### Setup
- Use a test affiliate who clicked Connect and got an account created in Stripe, but abandoned the onboarding mid-way (so `stripe_payouts_enabled = false` and `stripe_details_submitted = false`)

### What to See on Dashboard
- [ ] An **amber/yellow banner** saying "Resume Stripe onboarding" (or similar)
- [ ] A "Resume" button is shown (not "Connect" — different wording)
- [ ] Clicking the button opens the Stripe onboarding page again (fresh link, same account)

---

## TEST 2.4 — Verification Pending State

**Purpose:** An affiliate who finished onboarding but is waiting for Stripe's approval sees the correct message.

### Setup
- Use a test affiliate with `stripe_details_submitted = true` but `stripe_payouts_enabled = false`
  (This can happen with certain Stripe test accounts that need manual review)

### What to See on Dashboard
- [ ] An **amber/yellow banner** saying "Stripe is verifying your account" (or similar)
- [ ] Message says "We'll enable payouts when verification completes"
- [ ] No "Resume" or "Connect" button (they've done their part)

---

## TEST 2.5 — Account Disconnected (Deauthorized)

**Purpose:** If an affiliate revokes Stripe access from their Stripe dashboard, their affiliate dashboard reflects this and prompts re-onboarding.

### Steps
1. (Use Stripe CLI or Stripe Dashboard to revoke access for the test affiliate's Express account)
2. Reload the affiliate dashboard

### What to See
- [ ] The **"Connect Stripe"** CTA reappears (same as Test 2.1 state)
- [ ] The green "Connected" badge is gone
- [ ] The affiliate can click Connect again to re-onboard

---

## TEST 2.6 — Non-US Affiliate Sees Friendly Error

**Purpose:** An affiliate outside the US gets a clear "US only" message, not a confusing Stripe error.

### Setup
- Use a test affiliate account where the profile indicates a non-US country (e.g. UK)

### Steps
1. Log in as this non-US test affiliate
2. Click "Connect Stripe" on the dashboard

### What to See
- [ ] An error message appears saying something like:
  **"Affiliate payouts are currently US-only. Your account is registered in GB; we'll notify you when international support launches."**
- [ ] You are NOT redirected to Stripe
- [ ] No Stripe account was created (Stripe Dashboard shows no new account)

---

## TEST 2.7 — Campaign Creation Gate — All Four CTA Variants

**Purpose:** The correct call-to-action appears based on the affiliate's Stripe status.

### Test 2.7.A — No Stripe Connected → "connect" CTA
- Use affiliate with no `stripe_account_id`
- Try to create a campaign via the UI
- [ ] UI shows "Connect Stripe to create new campaigns" gating screen
- [ ] Button says **"Connect Stripe"**

### Test 2.7.B — Account Exists, Details Not Submitted → "resume" CTA
- Use affiliate with account started but not submitted
- Try to create a campaign
- [ ] Button says **"Resume Stripe onboarding"**

### Test 2.7.C — Details Submitted, Not Yet Approved → "verify" CTA
- Use affiliate with details submitted but `payouts_enabled = false`
- Try to create a campaign
- [ ] Message says something like **"Stripe verification is pending"** or **"Complete Stripe verification"**

### Test 2.7.D — Fully Connected → Campaign Form Works
- Use the fully connected affiliate from Test 2.2
- Navigate to campaign create
- [ ] Normal campaign creation form appears — no gating
- [ ] Fill in the form and submit → campaign is created successfully
- [ ] New campaign appears in the campaigns list

---

## TEST 2.8 — Grandfathered Campaigns Still Work

**Purpose:** Existing campaigns created before Phase 2 must keep working — no disruption.

### Setup
- Identify a campaign that existed before Phase 2 was deployed

### Tests

**2.8.A — Share link still redirects**
1. Open the campaign's share link `/r/<old-campaign-code>`
- [ ] Redirects correctly to the destination
- [ ] No error page, no 403

**2.8.B — Booking via grandfathered campaign still creates a conversion**
1. Complete a booking via the old campaign link
- [ ] Affiliate earnings screen shows a new commission row for this booking
- [ ] No errors during the booking

**2.8.C — Campaign still appears in the list**
1. Log in as the affiliate
2. Navigate to `/affiliate/campaigns` or `/affiliate/dashboard`
- [ ] The old campaign appears in the list
- [ ] No "blocked" or "inactive" label due to missing Stripe

---

## TEST 2.9 — Payout — Dry Run Mode (Kill-Switch OFF)

**Purpose:** With the kill-switch OFF, the cron simulates payouts but transfers no real money.

### Setup
- Confirm `platform_settings.affiliate_payouts_enabled = FALSE` (ask admin to verify this setting is OFF)
- The test affiliate from Test 2.2 (Stripe connected) has at least one ripe conversion
  > To make a conversion ripe for testing: ask admin to move its `ripeness_at` to 25 hours ago via the admin panel, OR wait 24+ hours after the session ends

### Steps
1. Have admin trigger the no-show-refunds cron (via admin panel or scheduled tick)
2. After the cron runs, check the admin payouts report

### What to See in Admin Payouts Report (`/admin/reports/affiliate-payouts`)
- [ ] A new payout row appears for the test affiliate
- [ ] Status = **"Preview"** or **"Dry Run"** (grey pill)
- [ ] Net transfer amount shows the correct expected amount (e.g. $35.00)
- [ ] **No Stripe transfer ID** in the row (blank/dash in that column)

### What to Verify in Stripe Dashboard
- Open Stripe Dashboard → Connect → Transfers
- [ ] **No new transfer** appears for the test affiliate's account (no money moved)

### What to See in Affiliate Portal
1. Log in as the test affiliate
2. Navigate to `/affiliate/earnings`
- [ ] The `dry_run` payout row does **NOT appear** in the affiliate's payout history (filtered out from affiliate view)
- [ ] The conversion still shows in **"Pending"** or **"Ready to pay"** state — not yet paid

---

## TEST 2.10 — Payout — Live Mode (Kill-Switch ON)

**Purpose:** After flipping the kill-switch ON, the cron actually transfers money.

### Steps
1. Have admin flip `affiliate_payouts_enabled = TRUE` in admin settings
2. Trigger the cron again (next scheduled tick, or admin manual trigger)
3. Wait ~10-30 seconds for processing

### What to See in Admin Payouts Report
- [ ] A new payout row appears with status = **"Completed"** (green pill)
- [ ] `Net Transfer` column shows the correct dollar amount (e.g. **$35.00**)
- [ ] `Stripe Transfer` column shows a real transfer ID like `tr_1AbC...`
- [ ] `Date` column shows today's date/time

### What to Verify in Stripe Dashboard
- Open Stripe Dashboard → Connect → Transfers
- [ ] A transfer appears for the test affiliate's connected account
- [ ] Transfer amount = **$35.00**
- [ ] Transfer destination = the affiliate's `acct_xxx`

- Open the affiliate's connected account → Balance
- [ ] **+$35.00** appears in the balance transactions

### What to See in Affiliate Portal — Payout History
1. Log in as the test affiliate
2. Navigate to `/affiliate/earnings`
- [ ] The payout appears in the **Payout History** table
- [ ] Status pill = **"Paid"** (green)
- [ ] Net Transfer = **$35.00**
- [ ] A Stripe Transfer ID is shown

### What to See in Affiliate Portal — Earnings Summary Cards
- [ ] **"Total Paid"** card shows **$35.00** (increased from $0)
- [ ] **"Pending"** card shows **$0** (that conversion is no longer pending)

### What to See in Affiliate Portal — Conversions List
- [ ] The conversion row for this booking now shows payout status pill = **"Paid"**
- [ ] Hovering/clicking shows "Paid X minutes ago"

---

## TEST 2.11 — Payout — With Balance Offset

**Purpose:** If an affiliate has a prior refund offset, the next payout is reduced by that amount.

### Setup
- Have admin set `balance_offset_cents = 2000` ($20.00) for the test affiliate via admin panel
- The test affiliate has a ripe conversion worth $35.00

**Expected math:**
- Ripe total = $35.00
- Offset = $20.00
- **Net transfer = $15.00**

### Steps
1. Trigger the cron with kill-switch ON

### What to See in Admin Payouts Report
- [ ] Payout row shows:
  - `Ripe Total` = **$35.00**
  - `Offset Applied` = **$20.00**
  - `Net Transfer` = **$15.00**
- [ ] Status = "Completed"

### What to See in Stripe Dashboard
- [ ] Transfer amount = **$15.00** (not $35.00)

### What to See in Affiliate Portal
- [ ] Payout history shows $15.00 paid
- [ ] Offset column in the payout row shows **$20.00** was offset

### After the Payout — Offset Should Be Cleared
- Reload the affiliate dashboard
- [ ] If the affiliate had $20.00 offset and it was fully consumed, the **Offset Banner is now gone**
- [ ] "Next Cycle Estimate" card shows $0.00 offset deduction

---

## TEST 2.12 — Payout — Fully Offset (Net = $0, No Transfer)

**Purpose:** When the offset is larger than the ripe amount, the affiliate receives nothing this cycle.

### Setup
- Set `balance_offset_cents = 5000` ($50.00) for the test affiliate
- The affiliate has a ripe conversion worth $35.00

**Expected:**
- Ripe total = $35.00
- Offset consumed = $35.00 (offset partially used)
- Net transfer = **$0.00**
- Remaining offset = $15.00 (rolls to next cycle)

### Steps
1. Trigger the cron with kill-switch ON

### What to See in Admin Payouts Report
- [ ] Payout status = "Completed" (or "Offset Applied")
- [ ] `Net Transfer` = **$0.00**
- [ ] `Offset Applied` = **$35.00**
- [ ] Notes/detail shows something like "offset fully consumed"

### What to Verify in Stripe Dashboard
- [ ] **No new transfer** for this affiliate (net = $0, no Stripe call was made)

### What to See in Affiliate Portal
- [ ] Payout shows status **"Offset"** (amber pill)
- [ ] **Offset Banner is still showing** (remaining $15.00 offset still active)
- [ ] "Next Cycle Estimate" shows $0.00 or negative (offset still larger than current ripe)

---

## TEST 2.13 — Payout — Failed Transfer (Stripe Account Restricted)

**Purpose:** A failed transfer is recorded with the reason and the conversion is queued for retry.

### Setup
- Use a Stripe test Express account that is blocked/restricted
  (In Stripe test mode, close or restrict the account from Stripe Dashboard)

### Steps
1. Trigger the cron with kill-switch ON

### What to See in Admin Payouts Report
- [ ] Payout row status = **"Failed"** (red pill)
- [ ] `Failure Reason` column shows a readable error (e.g. "The Stripe account does not support transfers")
- [ ] No transfer amount shown

### What to See in Next Cron Run
- After fixing the Stripe account restriction and running the cron again:
- [ ] The same ripe conversion is picked up again (it was put back in the queue)
- [ ] A NEW payout row is created (not the same one retried)

---

## TEST 2.14 — Refund After Payout — Balance Offset Applied

**Purpose:** Refunding a booking AFTER the affiliate has been paid puts the amount in an offset (no Stripe clawback).

### Setup
- Use the completed payout from Test 2.10 (conversion is in "Paid" state, affiliate received $35.00)

### Steps
1. As admin or diviner, issue a refund for the booking from Test 2.10
2. Wait for the refund to process

### What to Check — Affiliate Earnings Screen
1. Log in as the test affiliate
2. Navigate to `/affiliate/earnings` → conversions list
- [ ] The conversion row for the refunded booking now shows **"Offset (refunded)"** pill (amber)
- [ ] The status is NOT "Reversed" — it's "Offset" because the affiliate was already paid
- [ ] The commission amount is still shown (historical record) but marked as offset

### What to Check — Affiliate Dashboard
- [ ] The **Offset Banner** appears:
  - Text says approximately: **"$35.00 will be deducted from your next payout"**
  - (or the exact amount of the commission that was paid)
- [ ] "Next Cycle Estimate" card shows the upcoming payout amount reduced by $35.00

### What to Check — Stripe Dashboard
- [ ] The **customer received a $175.00 refund** (check the refund in Stripe)
- [ ] The affiliate's Stripe connected account shows **NO new debit/reversal** — the money stays in the affiliate's bank. Recovery happens via next payout reduction only.

---

## TEST 2.15 — Refund BEFORE Payout — Conversion is Reversed (Not Offset)

**Purpose:** Refunding a booking that hasn't been paid out yet should REVERSE the conversion (not create an offset).

### Setup
- Create a fresh affiliate-stamped booking, confirm payment
- Do NOT make the conversion ripe, do NOT run the cron — the conversion is in "Holding" state

### Steps
1. Immediately refund this booking via the UI (before any payout)
2. Navigate to affiliate earnings screen

### What to See — Affiliate Earnings Screen
- [ ] The conversion shows status **"Reversed"** (red pill) — NOT "Offset"
- [ ] The commission row is struck through or excluded from total earned

### What to See — Affiliate Dashboard
- [ ] **No Offset Banner appears** (no offset was created — the money never left the platform)
- [ ] Total Earned went back down (the reversed commission is excluded)

---

## TEST 2.16 — Affiliate Dashboard — All Earnings Cards Accuracy

**Purpose:** The numbers on the affiliate dashboard match what actually happened.

### Setup
Using the test affiliate who has completed multiple tests above, you should now have:
- Some paid commissions
- Some reversed commissions
- Some still pending (holding/ripe)
- Possibly an active offset

### Steps
1. Log in as the test affiliate
2. Navigate to `/affiliate/dashboard`

### What to Verify on Screen
- [ ] **"Total Earned"** card = sum of all non-reversed commissions (add up the commission rows on your earnings list and verify it matches)
- [ ] **"Total Paid"** card = sum of completed payout amounts (add up your "Paid" payout rows and verify it matches)
- [ ] **"Pending (Ready)"** card = commissions in ripe state (conversions with "Ready to pay" pill)
- [ ] **"Next Cycle Estimate"** card = Pending minus current offset balance

Manually add up the numbers on screen and confirm each card total is consistent with the individual rows showing on the earnings page.

---

## TEST 2.17 — Payout History Table — All Status Pills

Navigate to `/affiliate/earnings` → Payout History section:

- [ ] **"Paid"** (green pill) — appears for a completed transfer
- [ ] **"Offset"** (amber pill) — appears for a payout where net = $0 due to full offset
- [ ] **"Processing"** (blue pill) — appears briefly if you catch a payout in-flight (rare in testing)
- [ ] **"Failed"** (red pill) — appears for Test 2.13's failed payout
- [ ] **No "Preview/Dry Run" rows visible** — dry run rows must be hidden from the affiliate view

---

## TEST 2.18 — Payout Drilldown (Line Items)

### Steps
1. In the Payout History table, click "View details" on a completed payout
2. A drilldown page opens

### What to Verify on the Drilldown Page
- [ ] A table of individual bookings/conversions included in this payout appears
- [ ] Each row shows: booking date, campaign name, gross commission, amount applied, offset applied
- [ ] **The amounts add up** to the total shown in the payout header
  (Add up all the "Amount Applied" values — should equal the "Net Transfer" amount from the payout row)

---

## TEST 2.19 — Per-Row Payout Status Pills on Conversions List

Navigate to the conversions list on the affiliate earnings page:

- [ ] A **"Payout status"** column is visible in the conversions table
- [ ] A conversion that is waiting (not yet 24h after session end) shows **"Holding"** pill
  - Hovering shows countdown: "Available in X hours"
- [ ] A ripe (ready) conversion shows **"Ready to pay"** pill
- [ ] A paid conversion shows **"Paid"** pill
  - Hovering shows "Paid X hours ago"
- [ ] A reversed conversion shows **"Reversed"** pill (red)
- [ ] An offset-applied conversion shows **"Offset (refunded)"** pill (amber)

---

## TEST 2.20 — Tax Info Link

### Steps
1. Log in as the fully connected affiliate (Test 2.2)
2. Find the "View tax documents (Stripe)" button on the dashboard or sidebar

- [ ] Button is visible
- [ ] Clicking it opens a new browser tab/window to the Stripe Express hosted page
- [ ] The Stripe Express page loads (no "page not found" error)
- [ ] From that Stripe page, tax documents / 1099-NEC forms are accessible (in a real production scenario)

### For an Affiliate Without Stripe Connected
- [ ] Instead of the button, text reads: **"Connect Stripe to access tax documents"**
- [ ] No clickable link

---

## TEST 2.21 — Admin Payouts Report — List Page

Navigate to `/admin/reports/affiliate-payouts` as admin:

- [ ] Page loads without errors
- [ ] A list of ALL payouts across all affiliates is shown
- [ ] Each row shows: Affiliate name/email, Status, Net Transfer, Offset Applied, Ripe Total, Date, Stripe Transfer ID
- [ ] **"Dry Run"** status rows ARE visible to admins (unlike affiliate view)
- [ ] Status filter works — select "Failed" → only failed rows appear; select "Completed" → only completed rows appear
- [ ] Affiliate search/filter works — type the test affiliate's name → list narrows to their payouts only
- [ ] Date-range filter works — set range to the last 7 days → only recent payouts appear

### Kill-Switch Banner (top of the payouts list page)
- [ ] A banner shows the current kill-switch state — either **"Payouts: ENABLED"** (green) or **"Payouts: DISABLED (Dry Run)"** (amber/red)
- [ ] The banner matches the actual setting (confirm with admin that the toggle position is correct)
- [ ] Clicking the toggle/button prompts a confirmation modal before changing the state
- [ ] After confirming, the banner immediately reflects the new state
- [ ] An audit entry is created in the admin action log (check the detail page or log)

### Stats Cards on the Payouts Page
After running multiple test payouts, verify these 4 summary cards:
- [ ] **"Total Paid This Month"** — shows the correct dollar total of all "Completed" payouts this calendar month
- [ ] **"Total Pending"** — shows total ripe commissions not yet paid out (should match ripe conversions)
- [ ] **"Total Blocked"** — shows total blocked conversion amounts (reversed or offset-applied rows)
- [ ] **"Total Dry-Run"** — shows total of dry_run payout rows (from kill-switch-off runs)

Mentally add up the numbers from your test payouts and confirm each card is in the right ballpark.

### Manual Trigger Button (per failed row)
1. Locate a payout row with status = **"Failed"** (from Test 2.13)
2. Confirm there is a **"Trigger Payout"** or **"Retry"** button on that row (only on failed/blocked rows)
3. Click the button (make sure the test Stripe account is no longer restricted)
- [ ] The button triggers a new payout run for that specific affiliate only
- [ ] A new payout row appears in the list (the old failed row remains for history)
- [ ] The new row shows the correct status (Completed or still Failed if the issue persists)

### Manual Write-Off Test
1. Find an affiliate with an active offset balance (visible in the admin view)
2. Click the "Write off offset" or similar admin action
3. Provide a reason text in the confirmation dialog
4. Confirm the write-off
- [ ] After write-off: the affiliate's offset balance in the admin view shows **$0.00**
- [ ] An audit/action log entry is created (check admin action log if visible)
- [ ] If the affiliate was logged in, their Offset Banner disappears on refresh

---

## TEST 2.22 — Admin Payout Detail Page

### Steps
1. From the admin payouts list, click a **completed** payout row to open its detail page

### What to See on the Detail Page
- [ ] A status pill + Stripe Transfer ID (e.g. `tr_1AbC...`) is shown at the top
- [ ] A clickable link from the Stripe Transfer ID opens the Stripe Dashboard for that transfer
- [ ] Timestamps: created_at and transferred_at are both shown
- [ ] A **line items table** shows individual conversions included in this payout:
  - Each row: booking date, campaign name, gross commission amount, amount applied to this payout, offset applied
  - The amounts add up to the total net transfer shown in the header
- [ ] The affiliate's current balance state is shown: offset balance, ripe total, total paid

### Mark Disputed Action
1. On the detail page, find the **"Mark Disputed"** button
2. Click it — a text input appears asking for a note/reason
3. Enter a note of at least 10 characters (e.g. "Customer disputed this charge via email")
4. Confirm
- [ ] The payout status pill changes to **"Disputed"** (red/orange pill)
- [ ] The note text is displayed below the status
- [ ] The payout does **NOT** generate any new Stripe activity (no reversal/refund in Stripe Dashboard)

### Action Log on Detail Page
- [ ] A section titled "Action Log" (or similar) is visible at the bottom of the detail page
- [ ] It shows at minimum the "Payout created" event with a timestamp
- [ ] If you just clicked "Mark Disputed," the dispute action appears in the log with: admin user, timestamp, note text

---

## TEST 2.23 — Admin Affiliates Page — New Metric Cards

Navigate to `/admin/reports/affiliates` (the existing affiliate management page):

- [ ] Page loads normally (no regression from Phase 2 changes)
- [ ] **4 new metric summary cards** are visible at the top of the page:
  - [ ] **"Total Earned"** — platform-wide total of all commission credited across all affiliates
  - [ ] **"Total Paid"** — platform-wide total of all completed payout transfers
  - [ ] **"Held (Ripe)"** — total ripe commissions not yet paid out
  - [ ] **"Active Offsets"** — total balance_offset_cents across all affiliates with offset > 0
- [ ] Each card shows a non-zero dollar amount (given you have test data from prior tests)
- [ ] The numbers are consistent — "Total Paid" ≤ "Total Earned"; "Active Offsets" reflects what you know about offset state from Tests 2.11–2.14

---

## TEST 2.24 — Notifications — All 5 Affiliate Notification Types

**Purpose:** Verify that the affiliate receives the correct in-app notification (and email if applicable) for each key event.

> To check notifications: log in as the test affiliate and look for a notification bell icon or notification inbox on the dashboard. Each event below should produce a new notification entry.

### 2.24.A — Payout Completed Notification
1. Ensure a successful payout just occurred (from Test 2.10 or Test 2.21's manual trigger)
2. Log in as the test affiliate immediately after
3. Check the notification inbox / bell icon
- [ ] A notification appears with content like: **"Your payout of $35.00 was sent to your bank"** (or similar)
- [ ] Clicking the notification navigates to the payout detail page
- [ ] The notification is marked as read after viewing

### 2.24.B — Payout Failed Notification
1. Ensure a failed payout occurred (from Test 2.13 — restricted Stripe account)
2. Log in as the test affiliate
3. Check the notification inbox
- [ ] A notification appears saying something like: **"Your payout could not be processed"** with a reason
- [ ] The notification links to the affiliate dashboard or payout history

### 2.24.C — Offset Applied Notification
1. Use the setup from Test 2.14: refund a booking AFTER the affiliate was paid
2. Log in as the test affiliate
3. Check the notification inbox
- [ ] A notification appears saying something like: **"$35.00 will be deducted from your next payout"** (due to a booking refund)
- [ ] The notification links to the earnings page showing the offset state

### 2.24.D — Stripe Disconnected Notification
1. Use the setup from Test 2.5: revoke Stripe access from the affiliate's Express account
2. Log in as the test affiliate
3. Check the notification inbox
- [ ] A notification appears saying something like: **"Your Stripe account was disconnected"** or **"Payout connection removed"**
- [ ] The notification prompts the affiliate to reconnect (links to the Connect Stripe flow)

### 2.24.E — Stripe Verification Needed Notification
1. Use the setup from Test 2.4: affiliate with details submitted but payouts not yet enabled
2. Simulate Stripe sending a verification_fields_needed update (can be done via Stripe CLI in test mode)
3. Log in as the test affiliate
4. Check the notification inbox
- [ ] A notification appears saying something like: **"Stripe needs more information to enable your payouts"**
- [ ] The notification links back to the Stripe onboarding resume flow

---

---

# PART 3 — PHASE 3: AFFILIATE ANALYTICS

> **Do not start Phase 3 testing until:**
> - Phase 2 has been live in production for **at least 30 days**
> - There are meaningful numbers of clicks, conversions, and payouts in the system
> - Phase 2 Task 10 milestone tracking (first_conversion_at, first_payout_at) has been collecting data

---

## TEST 3.1 — Affiliate Performance Dashboard

Navigate to `/affiliate/performance` as the test affiliate:

### Metric Cards (9 cards — verify all exist and show non-zero values)
- [ ] **Clicks** — shows total click count
- [ ] **Unique Clicks** — shows unique session/visitor count (should be ≤ Clicks)
- [ ] **Conversion Rate** — shows a percentage (conversions ÷ clicks × 100)
- [ ] **Conversions** — count of non-reversed conversions
- [ ] **AOV (Average Order Value)** — average gross order dollar amount
- [ ] **Avg Commission** — average commission per conversion in dollars
- [ ] **Effective Rate** — total commission ÷ total gross (%)
- [ ] **Reversal Rate** — % of conversions that were reversed
- [ ] **Avg Days to Payout** — average days from conversion to payout

### Period Filter Test
1. Click the **"30d"** filter button
- [ ] All 9 metric numbers change (should be smaller than "all time")
2. Click **"90d"**
- [ ] Numbers are larger than 30d (wider window)
3. Click **"365d"** and **"all"**
- [ ] Numbers continue to grow as the window widens

### Earnings Trend Chart — Two Series
- [ ] Chart is visible (not blank, not error)
- [ ] X-axis shows dates; Y-axis shows dollar amounts
- [ ] **Two lines are visible** on the chart:
  - [ ] A **solid line** labeled **"Earned"** (commission credited, including unpaid)
  - [ ] A **dashed line** labeled **"Paid"** (amounts actually transferred out)
  - [ ] The dashed "Paid" line should be equal to or below the solid "Earned" line at all points
- [ ] Hovering on a data point shows a tooltip with both the Earned and Paid values for that period
- [ ] Changing the period filter changes the chart range and both lines update

### Top-10 Campaigns by Commission
- [ ] A table lists campaigns, **sorted highest commission first**
- [ ] The table has these specific columns: **Campaign**, **Conversions** (count), **Total Order** ($), **Commission** ($), **$/Conv** (commission per conversion)
- [ ] The `$/Conv` column = Commission ÷ Conversions — spot-check one row: multiply Conversions × $/Conv and confirm it roughly equals the Commission amount
- [ ] The top campaign name and dollar amounts look correct based on your test data

### Geographic Breakdown
- [ ] A list or chart shows countries and click counts
- [ ] "United States" likely appears at the top

### Own-Cohort Retention Chart
- [ ] Shows percentages at 30, 60, 90, 180 days
- [ ] All values are between 0% and 100%

---

## TEST 3.2 — Diviner Affiliate-Mix Breakdown

Navigate to `/dashboard/finance` as the test diviner:

- [ ] **"Affiliate-Driven Gross vs Direct Gross"** card or chart is visible
- [ ] Shows a donut chart or percentage breakdown (e.g. "40% of bookings came via affiliates")
- [ ] **"Top-5 Affiliates Driving Bookings to Me"** table shows affiliate names + booking counts
- [ ] **"Total Commission Outflow"** shows the total dollars paid out from this diviner's portion to affiliates

Cross-check the "Total Commission Outflow" value:
- It should equal the sum of all `affiliate_commission_amount_cents` on this diviner's bookings (converted to dollars)
- Mentally verify this roughly matches what you know about the test data

---

## TEST 3.3 — Admin Analytics Consolidated Page

Navigate to `/admin/reports/affiliate-analytics`:

### 9 Platform Metrics — All Must Be Visible and Non-Zero
- [ ] **Paid Total** — total dollars transferred to affiliates
- [ ] **Outstanding** — dollars in ripe/pending state not yet paid
- [ ] **Median Time-to-Payout** — shown in days (e.g. "1.2 days")
- [ ] **Average Payout Amount** — average payout size in dollars
- [ ] **Payout Success Rate** — percentage (e.g. "98%")
- [ ] **Reversal Rate** — percentage of conversions reversed
- [ ] **Refund-After-Payout Rate** — percentage of paid conversions that later got refunded
- [ ] **Commission % of GMV** — affiliate cost as a % of total booking volume
- [ ] **Active Affiliates** — count of affiliates with at least 1 conversion in period

### Charts and Tables
- [ ] **Payout Velocity Histogram** — a bar chart showing distribution of payout sizes
- [ ] **Campaign ROI Table** — lists campaigns with commission paid and revenue driven
- [ ] **Risk Signals Panel** — flags any affiliates with reversal rate > 25%
- [ ] **Onboarding Funnel** — 5-step funnel showing: invited → registered → first conversion → connected Stripe → first payout (each step should have a count and drop-off %)
- [ ] **Referred-Client Retention Cohort** — 30/60/90/180-day rebook percentages for referred clients (platform-wide)
- [ ] **Click-Through Funnel** — shows clicks → conversions → paid as a funnel
- [ ] **UTM Source Attribution** — table of top UTM sources with commission earned (only visible if UTM tracking data exists)
- [ ] **Cron Health Pill** — shows last cron tick time and "0 consecutive failures" (green)
- [ ] **International-Demand Widget** — shows count of rejected non-US onboarding attempts

### Page Performance
- [ ] Page loads within a reasonable time (aim for under 2.5 seconds for the above-fold content)
- [ ] No spinner that hangs forever
- [ ] Changing the period filter (`30d`, `90d`, `365d`, `all`) updates the numbers

---

## TEST 3.4 — Admin Finance-Ops Page — New Widgets

Navigate to `/admin/reports/finance-ops`:

### 1099-NEC Threshold Tracker
- [ ] Widget is visible
- [ ] Shows a table of affiliates with YTD paid amounts
- [ ] There are **three distinct buckets** / sections visible:
  - [ ] **"Issued ($600+)"** bucket — affiliates paid $600 or more YTD (red/alert indicator, needs 1099)
  - [ ] **"Approaching ($540+)"** bucket — affiliates paid $540–$599 YTD (amber indicator, 90% of threshold)
  - [ ] **"At Risk"** bucket — affiliates who ARE in the Issued bucket but have **incomplete Stripe tax requirements** (e.g. missing SSN, W-9 not submitted) — shown with a critical/urgent indicator
- [ ] For each affiliate in the "At Risk" bucket:
  - [ ] The specific missing Stripe requirement is listed (e.g. "SSN required", "W-9 pending", "Identity verification incomplete")
  - [ ] A link or button to view their Stripe account is provided
- [ ] **Year filter** is present on the widget — defaults to the current calendar year (2026)
  - [ ] Changing the year updates all bucket counts and dollar amounts
- [ ] Dollar amounts are based on `paid_at` date (payout transfer date), NOT `converted_at` date — meaning only completed payouts count toward the threshold
- [ ] Cross-check: the YTD paid amount shown for the test affiliate matches the total of their "Completed" payout rows in `/admin/reports/affiliate-payouts`

### Failed-Payout Widget
- [ ] Shows a count of failed payouts in the last 7 days
- [ ] Clicking it shows the list of failures with reasons (matches what you see in Test 2.13)

### Stale-Offset Widget
- [ ] Shows affiliates where the offset hasn't changed in 90+ days
- [ ] Admin can click "Write off" from this widget (same as Test 2.21 write-off action)

---

## TEST 3.5 — Milestone Stamps (first_conversion_at / first_payout_at)

**Purpose:** Phase 3 analytics needs these two timestamp milestones to compute funnel metrics (time-to-first-conversion, time-to-first-payout). Verify they are populated by Phase 2 code.

### first_conversion_at Stamp
1. Use a test affiliate who just had their **first ever** conversion recorded (or reset the test account state so there is no prior conversion)
2. Complete the affiliate-stamped booking (as in Test 1.2)
3. Log in as admin, navigate to the affiliate's detail page (or `/admin/reports/affiliates` → click the affiliate)
- [ ] The affiliate profile/detail page shows **"First Conversion"** with a timestamp matching the booking you just completed
- [ ] The timestamp is not blank/null

4. Now complete a **second** affiliate booking for the same affiliate
- [ ] The "First Conversion" timestamp did **NOT change** — it still shows the first booking's timestamp (idempotent: only writes once)

### first_payout_at Stamp
1. Run a successful payout for the test affiliate (kill-switch ON, from Test 2.10 or 2.21)
2. Navigate to the affiliate's admin detail page
- [ ] The profile shows **"First Payout"** with a timestamp matching the payout just run
- [ ] The timestamp is not blank/null

3. Run a second successful payout cycle for the same affiliate
- [ ] The "First Payout" timestamp did **NOT change** — still shows the first payout's time (idempotent)

---

---

# PRE-PRODUCTION SIGN-OFF CHECKLIST (Phase 2 Go-Live)

**Complete all items below before flipping the kill-switch in production for the first time.**

- [ ] **7 consecutive clean dry-run days**: Run the cron with kill-switch OFF for 7 full days. Each day check `/admin/reports/affiliate-payouts` — the dry-run rows should show correct amounts with no errors or "Failed" dry-run rows. Only flip to live after 7 clean days.
- [ ] **Affiliate communication sent**: All 14 existing affiliates were notified (via email or platform notification) that they can now connect Stripe to start receiving payouts. The message explains the Connect Stripe flow and that existing campaigns continue working during setup.
- [ ] **Kill-switch test**: Confirmed that toggling the kill-switch OFF mid-run stops live transfers and reverts to dry-run on the next cron tick (no partial-run money in limbo).
- [ ] **First live payout verified**: After flipping to live, confirm the first real Stripe transfer appears in Stripe Dashboard and the affiliate's Payout History shows "Paid" with a real Transfer ID.
- [ ] **Backfill SQL reviewed**: Decided whether to run the optional `first_conversion_at` backfill for existing 14 affiliates (fills historical null values from `MIN(converted_at)`). Decision documented in deploy log.

---

---

# PART 4 — REGRESSION CHECKS (After All Phases)

These are final checks to confirm nothing was broken:

## 4.1 — Normal Booking Still Works
1. Complete a fresh non-affiliate booking end-to-end (no referral code)
- [ ] Booking succeeds
- [ ] Customer payment processes normally
- [ ] Diviner receives their payment
- [ ] No affiliate-related entries appear anywhere

## 4.2 — Diviner Stripe Connect Flow — Not Broken
1. Go through the diviner Stripe Connect onboarding flow (if there's a test diviner without Stripe connected)
- [ ] Diviner onboarding works exactly as before
- [ ] Diviner's `charges_enabled` and `payouts_enabled` update correctly in the diviner profile
- [ ] The affiliate Connect changes did not interfere with the diviner flow in any way

## 4.3 — Affiliate Earnings Page — No Broken Layout
1. Log in as the test affiliate (who now has data from all the above tests)
2. Open `/affiliate/earnings`
- [ ] Page loads without JavaScript errors (check browser console)
- [ ] Conversions list renders correctly with all status pills
- [ ] Payout history section renders below the conversions
- [ ] No overlapping or broken layout elements

## 4.4 — Admin Reports — No Broken Pages
1. As admin, open each of these pages and confirm they load without error:
- [ ] `/admin/reports/affiliate-payouts`
- [ ] `/admin/reports/affiliate-analytics` (Phase 3)
- [ ] `/admin/reports/finance-ops`

## 4.5 — Security — Affiliate Cannot See Other Affiliate's Payouts
1. Log in as a **different** test affiliate (not the primary test affiliate)
2. Try to navigate to a payout URL that belongs to the first affiliate, e.g. `/affiliate/payouts/<payout-id-from-test-2.10>`
- [ ] You see a **"Not Found"** or **"Forbidden"** page (not the payout details)
- [ ] You cannot see another affiliate's earnings or commission data

---

*Checklist created: 2026-05-07. Based on task specs in docs/tasks/2026-05-05/*
