# Claude Code — Divine Infinite Being Project Rules

> Global workflow rules apply (see ~/.claude/CLAUDE.md). Rules here add project-specific context.

---

## Project Structure

| App | Path | Stack |
|---|---|---|
| Angular backoffice | `divine-infinite-being-angular-ui/` | Angular 16, Material, ngx-cookie-service |
| NestJS API | `divine-infinite-being-nest-api/` | NestJS 10, Fastify, MongoDB/Mongoose, Lambda |
| AstrologyPro (Next.js) | `AstrologyPro/` | Next.js 13, Supabase, Stripe Connect |
| Community/Mystery School | `Divine-infinite-ui-next/` | Next.js |
| Conference Room | `conference-room-angular-v1/` | Next.js 13 (misnamed), VideoSDK |

---

## Auth Context

**Angular cookie:** `login_user_details`
```
{ token, userinfo: { _id, user_type, is_mystery_school, is_perennial_mandalism,
  is_diviner, mystery_school_status, perennial_mandalism_status, ... } }
```

**User types:** `is_admin`, `is_astrologer`, `is_tarotreader`, `is_astrologer_tarotreader`,
`is_customer`, `is_social_advo`, `is_customer_socialadvo`, `is_affiliate`, `is_Perennial_Mandalism`

**Subscription guards:**
- Perennial Mandalism: `perennial_mandalism_status === 'subscription running'`
- Mystery School: `mystery_school_status === 'subscription running'`

---

## API Patterns

**Angular API base URLs (from environments):**
- Local: `http://localhost:3522/`
- Dev: CloudFront CDN URL
- Prod: `https://api.divineinfinitebeing.com/`

**Angular service pattern:**
```typescript
this.apiService.getHttpDataPost('controller/endpoint', payload).subscribe(...)
this.apiService.getHttpData('controller/endpoint').subscribe(...)
```

**Route resolver:** `ResolveService` pre-fetches data before component activates. Add new routes to `ResolveService` if pre-fetching is needed.

**NestJS:** Fastify-based Lambda. Always check `src/` module folder for existing controller before creating a new endpoint.

---

## Database

**MongoDB** via Mongoose — NestJS API
**Supabase (PostgreSQL)** — AstrologyPro (Next.js)

For new DB work:
1. Check existing schema file in `divine-infinite-being-nest-api/src/[module]/schemas/`
2. Run migration via `scripts/run-migration.js` (NestJS)
3. For Supabase: run SQL migration via Supabase CLI (project ref: `wyluvclvtvwptsvvtgkv`)

---

## Before Every Story — Context Checklist

Before planning, always verify:
- [ ] Which portal does this affect? (Angular / Next.js AstrologyPro / Community Next.js)
- [ ] Which role(s) will use this? (check `02_role_feature_map.md`)
- [ ] Does an API endpoint already exist? (check `06_api_reference.md`)
- [ ] Does the Angular module already exist? (check `03_module_inventory.md`)
- [ ] Is there a related sprint story? (check `05_sprint_plan.md`)

---

## Known Technical Debt (do not introduce more)

- `bypassSecurityTrustHtml` used in pipes — XSS risk, do not use for new pipes
- Hardcoded AWS credentials exist in NestJS config — do not add more env values in code
- Typo in route: `/affiate-dashboard` (one `f`) — match this exactly, do not "fix" it in new code without a dedicated refactor story
- Two AuthService files in Angular — do not create a third; story E1-S3 will consolidate
