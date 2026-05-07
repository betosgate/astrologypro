# Task 02 - Frontend Community Support Portal

- Status: Planned
- Priority: P1
- Area: Frontend / Community / Support
- Routes:
  - `/community/support`
  - `/community/support/new`
  - `/community/support/[id]`
- Reference Existing UI:
  - `src/app/dashboard/support/page.tsx`
  - `src/app/dashboard/support/new/page.tsx`
  - `src/app/dashboard/support/[id]/page.tsx`
  - `src/app/community/layout.tsx`

---

## Goal

Add Community portal pages for support ticket listing, ticket creation, ticket conversation, close action, and CSAT.

## Required Pages

### `/community/support`

- List the authenticated member's own tickets.
- Show:
  - ticket number
  - subject
  - category
  - status
  - priority
  - created date
- Link each ticket to `/community/support/[id]`.
- Include a `New Ticket` action.
- Use Community layout conventions, not the diviner dashboard shell.

### `/community/support/new`

- Create tickets through `/api/support/tickets`.
- Use Community-specific categories:
  - Account & Login
  - Billing & Plan
  - Family / Household
  - Natal Chart
  - Monthly Transits
  - Relationship Chart
  - Rituals
  - Tarot
  - Events / Broadcasts / Sunday Service
  - Technical Issue
  - Abuse / Safety
  - Other
- Include subject, priority, description, optional subcategory, and optional related record reference.
- Redirect to `/community/support/[id]` after creation.

### `/community/support/[id]`

- Show ticket details and public conversation.
- Allow replies unless closed/cancelled.
- Allow requester close action.
- Show resolution note when available.
- Show CSAT after resolved/closed.
- Never render internal notes.

## Navigation

Add `Support` to the Community nav source in:

```txt
src/app/community/layout.tsx
```

The link must point to:

```txt
/community/support
```

Use a `lucide-react` icon consistent with the existing layout, preferably `LifeBuoy`.

## Acceptance Criteria

- [ ] Desktop Community nav includes `Support`.
- [ ] Mobile Community nav includes `Support`.
- [ ] `/community/support` renders a member's own tickets.
- [ ] Empty state links to `/community/support/new`.
- [ ] `/community/support/new` creates a Community-context ticket.
- [ ] `/community/support/[id]` can display and reply to public messages.
- [ ] Closed/cancelled tickets do not show the reply form.
- [ ] CSAT panel appears after resolved/closed.
- [ ] Existing `/dashboard/support` UI is not changed unless shared components are intentionally extracted.

## Out Of Scope

- No admin ticket UI redesign.
- No new dashboard shell.
- No changes to Community billing, charts, rituals, tarot, or events pages beyond linking users to support where needed.
