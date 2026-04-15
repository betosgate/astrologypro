# AstrologyPro — All API Keys & Credentials

**CONFIDENTIAL — Do not commit to git. Store securely.**  
Last updated: 2026-04-02

---

## Supabase

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wyluvclvtvwptsvvtgkv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODI1NDksImV4cCI6MjA5MDU1ODU0OX0.31o21FBWej-jMbLNSWO06dpGEj_5DqNGc837swL_T7w` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM` |

- **Project ID**: `wyluvclvtvwptsvvtgkv`
- **Dashboard**: https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv
- **Region**: East US

---

## Stripe

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` ← **REPLACE WITH REAL KEY** |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` ← **REPLACE WITH REAL KEY** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` ← **REPLACE WITH REAL KEY** |

**Still needed**: 6 price IDs (see TODO.md)

---

## Twilio (SMS + Voice)

| Variable | Value |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | `ACfcd2d89141cb1e998ba48e8fe472a1a4` |
| `TWILIO_AUTH_TOKEN` | `3bb03b00574f969a5a955896217d4789` |
| `TWILIO_PHONE_NUMBER` | `+17622516895` |
| `TWILIO_API_KEY_SID` | `SK1fb32c6caebb9b417bd99eeaf5e5fc94` |
| `TWILIO_API_KEY_SECRET` | `X7a6P7fdlmvXLwPrWnEesoLavlYIFsXH` |

- `TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET` are used for the **Twilio Voice JS SDK** (browser widget)
- These are API Key credentials, NOT the account auth token

---

## Daily.co (Video)

| Variable | Value |
|----------|-------|
| `DAILY_API_KEY` | `0775aba8a86fdb09d058f846f268e7898454610f0772acded189d88889c3d808` |

- SIP dial-in is enabled on rooms (per-room `sip_mode: "dial-in"`)

---

## Anthropic (AI Content)

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `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` |

- Used for mundane astrology content generation (claude-haiku-4-5 model)

---

## Resend (Email)

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | `re_BqJxzLFc_D42WLmueDHZxHEVtF2tUtJ22` |

---

## Google Cloud (Calendar OAuth)

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | `318346779756-0ggtj4dichr3jo7fod5tl97riekaok54.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `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` |
| `GOOGLE_REDIRECT_URI` | `https://astrologypro.com/api/calendar/callback` |

- Google Cloud project: **AstrologyPro**
- OAuth type: External, Web application
- Consent screen: configured (app name: AstrologyPro)

---

## App Config

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://astrologypro.com` |
| `CRON_SECRET` | `1f6088dbf7eb5569335d6ce172fc9f502e685110e90c7ee8aad0aee6b0f359ee` |

---

## Vercel Project

- **Project ID**: `prj_VWvXg9C4qKNmcDAyVZi4RfLeZz4j`
- **Team/Org ID**: `team_5HTrZX6cOPZ2FK88t8QQ0Hsh`
- **Team slug**: `betosgatess-projects`
- **Project name**: `app`
- **Dashboard**: https://vercel.com/betosgatess-projects/app

---

## Status of Env Vars in Vercel (as of 2026-04-02)

| Variable | Vercel? | .env.local? |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ |
| `DAILY_API_KEY` | ✅ | ✅ |
| `RESEND_API_KEY` | ✅ | ✅ |
| `ANTHROPIC_API_KEY` | ✅ | ✅ |
| `CRON_SECRET` | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ |
| `TWILIO_ACCOUNT_SID` | ✅ | ✅ |
| `TWILIO_AUTH_TOKEN` | ✅ | ✅ |
| `TWILIO_PHONE_NUMBER` | ✅ | ✅ |
| `TWILIO_API_KEY_SID` | ✅ | ✅ |
| `TWILIO_API_KEY_SECRET` | ✅ | ✅ |
| `GOOGLE_CLIENT_ID` | ✅ | ✅ |
| `GOOGLE_CLIENT_SECRET` | ✅ | ✅ |
| `GOOGLE_REDIRECT_URI` | ✅ | ✅ |
| `STRIPE_SECRET_KEY` | ⚠️ placeholder | ⚠️ placeholder |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ placeholder | ⚠️ placeholder |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ placeholder | ⚠️ placeholder |
| `AWS_CHIME_ACCESS_KEY_ID` | ✅ | ✅ |
| `AWS_CHIME_SECRET_ACCESS_KEY` | ✅ | ✅ |
| `CHIME_SMA_ID` | ✅ | ✅ |
| `NEXT_PUBLIC_CHIME_ENABLED` | ✅ | ✅ |
| `AWS_CHIME_REGION` | ✅ | ✅ |
| `AWS_ACCOUNT_ID` | ✅ | ✅ |
| `CHIME_RECORDING_BUCKET` | ✅ | ✅ |
