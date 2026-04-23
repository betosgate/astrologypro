# 01 System Map And Gap Analysis

## Goal

Claude must audit the current implementation before changing anything.

## Required Audit Areas

### A. Intake Entry Point

Trace:
- `src/components/services/template-intake-form.tsx`
- post-submit success dialog actions
- submission persistence API:
  - `src/app/api/services/[slug]/intake/route.ts`

Claude must answer:
- where submission id is created
- what submission fields are persisted
- how template slug and toolkit metadata are derived
- where `next_url` is currently used

### B. Discover Flow

Trace:
- `src/app/discover/page.tsx`
- `src/app/discover/discover-filters.tsx`

Claude must answer:
- how template-compatible diviners are currently resolved
- how service rows are matched to template ids
- how card CTA URLs are built
- how `submission` is preserved

### C. Existing Diviner Booking Flow

Trace:
- `src/app/[username]/book/[serviceSlug]/page.tsx`
- `src/components/booking/booking-wizard.tsx`

Claude must answer:
- what data the booking page needs before it can render
- how service visibility is enforced
- how availability is loaded
- whether submission/intake data can already be passed via query params or requires new handling

### D. Availability Source Of Truth

Trace all relevant routes and client calls, especially:
- availability APIs used by `BookingWizard`
- availability APIs used by other public booking/calendar previews

Claude must answer:
- which API already returns available dates
- which API already returns slots for a selected date
- whether those APIs can support a multi-diviner shared view directly
- if not, what adapter route is needed

### E. Access Control And Template Matching

Trace:
- `src/lib/diviner-service-access.ts`
- `src/lib/service-landings.ts`

Claude must answer:
- how to ensure only enabled + published + publicly sellable diviner services are considered
- how general template slug maps back to canonical base template slug

## Output Requirement

Before coding, Claude must produce a concise implementation note covering:
- reuse points
- missing contracts
- required new route(s)
- risks to avoid

