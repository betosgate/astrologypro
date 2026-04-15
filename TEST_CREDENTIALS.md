# AstrologyPro — Test Account Credentials

> Last updated: 2026-04-15

---

## Login Accounts

| Role | Email | Password | Portal URL |
|---|---|---|---|
| Diviner | diviner.test@astrologypro.com | DivinerTest2026! | /dashboard |
| Trainee | trainee.test@astrologypro.com | TraineeTest2026! | /trainee |
| Admin | admin.test@astrologypro.com | AdminTest2026! | /admin |
| Client | client.test@astrologypro.com | ClientTest2026! | /portal |
| Perennial Mandalism | pm.test@astrologypro.com | PMTest2026! | /community |
| Affiliate | affiliate.test@astrologypro.com | AffiliateTest2026! | /dashboard (diviner-linked) |

---

## Account Details

### Diviner — Cosmic Aura (`diviner.test@astrologypro.com`)
- 6-month revenue history, 38 bookings, 7 active services
- 180 page views + 60 activity events
- 6 testimonials (4 featured)
- Availability: Mon–Sat 9am–6pm
- Clients: James O'Brien (fully seeded — bookings, tarot, charts, toolkit, testimonials)
- Media gallery: 18 items (videos, audio, articles, images, links)
- Affiliate: Alex Affiliate (referral_code: ALEXG1PI, campaign: Spring Solar Return Promo)

### Trainee — Zara Nightsky (`trainee.test@astrologypro.com`)
- Mentor: Cosmic Aura (diviner.test@astrologypro.com)
- 100% lesson completion — 50/50 lessons across 9 programs, 18 categories
- 50 quiz attempts, all passed (avg ~8/10)
- Status: **Graduated** — graduated_at: 2026-04-10
- Certificate code: `CERT-BUKQOM-2026`

### Admin (`admin.test@astrologypro.com`)
- Row in `admin_users` table
- Sees: 5 diviners, 13+ clients, 3 trainees, 8 community members

### Client — Jordan Rivers (`client.test@astrologypro.com`)
- 2 past completed sessions, 2 upcoming confirmed sessions
- Birth data: 1992-08-14, Chicago IL

### Perennial Mandalism (`pm.test@astrologypro.com`)
- Password: `PMTest2026!`
- `community_members` row: membership_type=`perennial_mandalism`, membership_status=`active`
- Also has a `clients` row for booking history

### Affiliate — Alex Affiliate (`affiliate.test@astrologypro.com`)
- Password: `AffiliateTest2026!`
- `affiliates` row: referral_code=`ALEXG1PI`, commission_percent=15%, total_referrals=12
- Linked to Cosmic Aura diviner (diviner_id: c10a225f-51f5-441f-ad0c-1487fe576b43)
- Active campaign: **Spring Solar Return Promo** (Apr–Jun 2026, 15% commission)
- Note: affiliate portal is managed via the Diviner dashboard, not a standalone login

---

## Re-seed

```bash
node scripts/seed-dashboard-data.mjs
node scripts/seed-james-obrien-activity.mjs
node scripts/seed-media.mjs
```
