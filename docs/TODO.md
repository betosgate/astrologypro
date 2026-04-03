# AstrologyPro — What's Left To Do

**Last Updated**: 2026-04-02  
**Status**: Platform is feature-complete. All think tank audit items implemented. Remaining work is infrastructure only.

---

## ✅ COMPLETED IN FINAL SESSION (2026-04-02)

All think tank items (T1–T8, M1–M8, A4, A6, A8) were implemented this session:

| # | Feature | Notes |
|---|---------|-------|
| T1 | Gift certificate dashboard | Diviners can view/manage all certs sold at `/dashboard/gift-certificates` |
| T2 | Recording playback route | `/session/[shareId]/recording` page built; clients can watch sessions |
| T3 | Discount/loyalty code management UI | Full discount rules UI in dashboard settings |
| T4 | Follow-up automation dashboard | Configurable follow-up sequences at `/dashboard/follow-ups` |
| T5 | Intake form builder | Custom questionnaire builder per service at `/dashboard/intake-forms` |
| T6 | Refund UI | "Issue Refund" button added to booking detail in bookings dashboard |
| T7 | Pagination on bookings/testimonials | Added pagination to prevent perf degradation |
| T8 | Testimonial review bug fix | Fixed: now checks booking ID, not service type |
| ~~T9~~ | ~~intake_forms RLS too permissive~~ | ~~Fixed earlier~~ |
| M1 | Email capture on landing page | Lead magnet / email capture section added to homepage |
| M2 | Dedicated `/pricing` page | Full pricing page built; header link active |
| M3 | Revenue calculator moved up | Now appears in hero section above the fold |
| M4 | Aggregate social proof stats | Session count, diviner count, avg rating shown in hero |
| M5 | Onboarding email for new diviners | Welcome email sequence triggered on account creation |
| M6 | 30-day guarantee badge | Prominently placed in hero section |
| M7 | Sticky "Book Now" on public profile | Sticky CTA + urgency signals added to diviner profile pages |
| M8 | Blog / content landing page | `/blog` page built with content marketing strategy |
| A4 | "What to Expect" per service | Template shown per service type on public profile |
| A6 | Self-serve rescheduling in portal | Clients can reschedule pending bookings from `/portal` |
| A8 | Credentials/verified field on profiles | Credential + verified badge fields added to profile |
| — | `/instructions` page | Comprehensive feature guide for diviners and clients |

---

## 🔴 CRITICAL — Blocking Launch

### 1. Stripe Integration (Real Keys)
The entire payment system uses placeholder keys. Nothing can be charged until this is fixed.

**What's needed:**
- Create Stripe account (or use existing)
- Get live publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Get live secret key → `STRIPE_SECRET_KEY`
- Set up webhook endpoint → `STRIPE_WEBHOOK_SECRET`
- Create 6 price IDs:
  - `STRIPE_PRICE_TAROT_MONTHLY` ($97/mo)
  - `STRIPE_PRICE_TAROT_SETUP` ($197 one-time)
  - `STRIPE_PRICE_ASTROLOGY_MONTHLY` ($97/mo)
  - `STRIPE_PRICE_ASTROLOGY_SETUP` ($197 one-time)
  - `STRIPE_PRICE_ORACLE_MONTHLY` ($147/mo)
  - `STRIPE_PRICE_ORACLE_SETUP` ($297 one-time)
- Configure Stripe Connect for diviner payouts (platform takes 20%)
- Set up webhook handler for: `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.*`

**Files to update:** `.env.local`, Vercel env vars, `src/app/api/stripe/` routes

---

### 2. Twilio 10DLC Registration
The `TWILIO_PHONE_NUMBER` (+17622516895) needs 10DLC registration to send SMS commercially in the US, or messages will fail delivery.

**What's needed:**
- Register brand in Twilio console
- Register campaign (use case: appointment reminders)
- Link number to campaign
- Timeline: ~2-4 weeks for approval

---

## 🟡 HIGH — Important for Diviner Experience

### 3. Google Calendar OAuth — Enable Calendar API
The OAuth credentials are created but the Google Calendar API may not be enabled on the project.

**Check:** Go to Google Cloud Console → AstrologyPro project → APIs & Services → Enable APIs → enable "Google Calendar API"

**Also needed:** Publish the OAuth app (currently in "Testing" mode) or add test users. In testing mode, only users added as test users can complete OAuth. For production, submit for verification OR add diviner emails as test users temporarily.

### 4. Follow-Up Email System End-to-End Test
The follow-up automation dashboard is built. Verify the actual email sending works end-to-end.

**What's needed:**
- Verify `/api/cron/follow-ups` route sends actual Resend emails
- Test each of 3 email types: recording_ready, reflection, rebooking
- Add email templates if missing

### 5. Gift Certificate Fulfillment E2E Test
Dashboard is built. Verify the full flow works.

**Check:** `/[username]/gift` page, `/gift/[code]` redemption page — verify they work end-to-end

---

## 🟢 MEDIUM — Nice to Have

### 6. Phone System End-to-End Test
Phone queue system was built. Needs real-device testing:
- Test browser widget receiving an inbound call
- Test mobile forwarding to `phone_mobile`
- Test `phone_answer_mode` switching
- Verify billing records in `phone_sessions` table

### 7. Seed Data for Screenshots
For marketing and demo purposes, need real-looking seed data:
- 1 fully fleshed-out diviner profile (avatar, bio, specialties, services)
- 5-10 sample bookings
- 3-5 testimonials
- 6 months of mock revenue data
- A few clients with birth data

### 8. Discover Page Content
`/discover` exists but may be limited without seed data. This is how new clients find diviners.

**What's needed:** Verify it shows all active diviners with proper filtering

### 9. Analytics Dashboard Population
`/dashboard/analytics` page exists. Verify it shows real page view data and that the tracking pixel fires correctly on public pages.

### 10. Affiliate System Testing
`/dashboard/affiliates` and `/affiliate/[code]` pages exist. Test full referral flow:
- Create affiliate → get referral link → client books → commission tracked

### 11. Recording Share Page
`/session/[shareId]/recording` — verify session recordings are accessible and the share flow works after a Daily.co session ends.

### 12. Client Portal Completeness
`/portal` — verify clients can:
- View past and upcoming bookings
- Leave testimonials
- Reschedule bookings (self-serve)
- View/download recording

---

## 🔵 FUTURE — Post-Launch Enhancements

### 13. Birth Chart Display
Show a visual birth chart on the client profile page in the diviner dashboard. Would require an astrology calculation library (swiss-ephemeris or similar).

### 14. Transit Alerts
Notify diviners when a client has a major transit coming up (Saturn return, etc.) — great upsell trigger.

### 15. Package Booking
Let clients book multiple sessions as a bundle at a discount. Discount rules exist in DB.

### 16. Diviner-to-Client Messaging
Direct messaging between diviner and client after a booking would increase retention. No current implementation.

### 17. Mobile App
Current web app is responsive but a native mobile app (React Native or PWA) would improve diviner experience significantly.

### 18. Waitlist / Booking Deposits
Allow diviners to take deposits or require full pre-payment. Some service types warrant it.

### 19. Referral Rewards for Clients
Allow clients to refer friends and get credit toward future readings.

---

## Infrastructure Checklist

- [ ] Stripe live keys + price IDs
- [ ] Twilio 10DLC registered
- [ ] Google Calendar API enabled + OAuth app published
- [ ] Verify all Vercel env vars are set for Production environment
- [ ] Set up Stripe webhook endpoint in Stripe dashboard pointing to `https://astrologypro.com/api/stripe/webhook`
- [ ] Verify cron jobs are running (check Vercel cron dashboard)
- [ ] Run load test on video session infrastructure (Daily.co limits)
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Set up uptime monitoring (Better Uptime or similar)
