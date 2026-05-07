# Task 03 - Regression And QA Checklist

- Status: Planned
- Priority: P1
- Area: QA / Community / Support
- Depends On:
  - `01-backend-support-ticket-context.md`
  - `02-frontend-community-support-portal.md`

---

## Goal

Verify the Perennial Community support portal works end to end and does not regress existing diviner dashboard or admin ticket behavior.

## Test Users

Use three separate authenticated roles:

- Active Perennial Mandalism community member.
- Existing diviner dashboard user.
- Admin user.

## Community Checks

- [ ] Log in as an active Perennial Mandalism member.
- [ ] Confirm `Support` appears in desktop Community navigation.
- [ ] Confirm `Support` appears in mobile Community navigation.
- [ ] Open `/community/support`.
- [ ] Confirm the empty state renders if no tickets exist.
- [ ] Create a `Billing & Plan` ticket.
- [ ] Create a `Natal Chart` or `Monthly Transits` ticket with a related record reference.
- [ ] Confirm new tickets appear in `/community/support`.
- [ ] Open a ticket detail page.
- [ ] Add a requester reply.
- [ ] Close the ticket.
- [ ] Submit CSAT after closure.

## Admin Checks

- [ ] Confirm Community-created tickets appear in `/admin/tickets`.
- [ ] Confirm Community tickets carry visible portal context through role, category, or tags.
- [ ] Add an internal note as admin.
- [ ] Confirm the Community member cannot see the internal note.
- [ ] Add a public reply as admin.
- [ ] Confirm the Community member can see the public reply.
- [ ] Set status to `waiting_requester`.
- [ ] Confirm Community requester reply reopens the ticket to `open`.

## Regression Checks

- [ ] `/dashboard/support` still lists diviner tickets.
- [ ] Diviner ticket creation still works.
- [ ] Diviner ticket detail/reply/close/CSAT still works.
- [ ] Admin ticket detail still shows public and internal messages correctly.
- [ ] Ticket ownership prevents Community users from opening another user's ticket URL.

## Responsive Checks

Verify Community support pages at:

- 375px mobile
- 768px tablet
- 1440px desktop

Confirm:

- no text overlap
- forms fit on mobile
- action buttons wrap cleanly
- tables/cards remain readable

## Commands

Run relevant checks after implementation:

```txt
npx eslint <changed-files>
npx tsc --noEmit --pretty false
```

If full TypeScript fails because of existing unrelated errors, document whether any failures point to changed files.

## Acceptance Criteria

- [ ] Community support flow is verified end to end.
- [ ] Admin handling is verified.
- [ ] Existing diviner dashboard support is verified.
- [ ] Responsive layouts are checked.
- [ ] Any existing unrelated test/type failures are documented.
