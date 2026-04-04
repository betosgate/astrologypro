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

---

## Engineering Quality Standards (Hard Laws)

These apply to every project, every feature, every PR. Non-negotiable.

### 1 — Consistency Is a Hard Law
- One design system, one token system, one interaction pattern library. Zero special-case components without a documented product reason.
- APIs must have an OpenAPI contract as the source of truth. Schemas must be explicit.
- Error responses must follow a single standard shape (RFC 9457 / Problem Details). No inventing a new error shape per endpoint.

### 2 — Accessibility and Performance Are Release Criteria
- UI must meet WCAG 2.2 from the start — not after QA complains.
- Performance is measured with real-user budgets. Core Web Vitals — **LCP, INP, CLS** — must be within budget before a page is considered done.
- A page that is beautiful but slow, jumpy, or broken on keyboard/mobile is not shippable.

### 3 — Security and Authorization Are Designed In, Not Bolted On
- Every endpoint is a possible breach point. Enforce authentication, tenant scoping, object-level authorization, field-level exposure control, rate limits, and secure session handling by default.
- OWASP API Security Top 10 #1 is Broken Object Level Authorization. If the UI hides an action but the API still allows it, it is not secure.
- Use OWASP ASVS as the baseline for verifying security controls.

### 4 — Instrument Everything — See Truth, Not Guesses
- Every user-facing flow must be traceable end-to-end with correlated logs, metrics, and traces (OpenTelemetry standard).
- Monitor the four golden signals: **latency, traffic, errors, saturation**.
- Set SLOs for what users actually feel — response time, success rate, availability.
- If you cannot identify what broke, who is affected, and where latency started within minutes, the architecture is not mature.

### 5 — Every Change Must Be Testable, Reversible, and Measurable
- Keep API changes backward-compatible when possible.
- Database migrations must be additive first — never destructive without a rollback plan.
- Every release must have a kill-switch or rollback path.
- Measure delivery quality (DORA: change failure rate, MTTR) — not just speed.
- Fast shipping that repeatedly breaks production is not senior engineering.

### 6 — Testing Discipline
- Every feature requires unit + integration + contract tests. Critical user flows require E2E coverage.
- No merging code that drops test coverage on touched paths.
- Contract tests between services must catch breaking changes before they reach production.

### 7 — Data and Migration Discipline
- Schema changes must be backward-safe — additive first, never destructive in the same deploy.
- No direct DB changes in production without a migration script and rollback plan.
- All data mutations must be auditable — who changed what, when, and why.

### 8 — CI/CD and Release Discipline
- Branch protection on main/master — no direct pushes, mandatory PR review.
- Every PR must deploy to a preview environment before merge.
- Every release must have a documented rollback plan and feature flag where applicable.
- Broken CI blocks merge — no bypassing checks.

### 9 — Documentation Discipline
- Architectural decisions must be recorded in ADRs (Architecture Decision Records).
- Every API must have up-to-date OpenAPI/Swagger docs.
- Every production system must have a runbook and setup doc.
- Every module must have a declared owner.

### 10 — Cost and Dependency Discipline
- Track infrastructure cost per service — no surprise bills.
- Audit package dependencies regularly — no abandoned or high-risk packages without justification.
- Assess third-party risk before adding any new external dependency.
- Maintain an upgrade cadence — no dependency more than 2 major versions behind without a documented reason.
