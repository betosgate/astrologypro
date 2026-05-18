# Task 04 - Join Window Rules

- Status: Proposed
- Priority: P2
- Owner: Full Stack
- Area: Session access / bookings UI
- Created: 2026-05-18

## Objective

Define and implement the future production rule for Join button availability.

Current QA behavior keeps Join enabled, matching trainee testing behavior.
Production should eventually allow joining only close to the scheduled session
time.

## Proposed Rule

```text
Join enabled when:
now >= scheduled_at - 15 minutes
and booking status is not cancelled/no_show
and join_href exists
```

Before the window:

```text
Join disabled
Text: Available 15 minutes before session
```

After the session:

```text
Prefer Details/Recording when available.
Disable Join unless the session system intentionally supports re-entry.
```

## Recommended Work

- Create a shared helper for join availability so trainee and Community can use the same rule later.
- Apply first to Community My Readings only if QA is ready for this behavior.
- Otherwise implement helper and leave current Join enabled until final production toggle.
- Keep Details drawer always available.

## Acceptance Criteria

- Join-window logic is centralized.
- Details remains available outside the join window.
- Disabled Join has clear user-facing copy.
- Existing QA flow is not blocked unless the team intentionally enables the rule.
