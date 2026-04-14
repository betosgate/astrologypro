# Task 03: Diviner Dashboard Control Surface

## Goal

Give the diviner a simple, explicit control in their own dashboard to show or hide the public session-count block.

## Why This Is Needed

The user request is explicit that the diviner should control this themselves. The control should not live only in admin.

## Required UX

### 1. Settings location

Place this in an existing profile, marketing, or public-page settings area. Do not hide it in a technical panel.

Recommended labels:

- setting title: `Show public session counts`
- helper text: `Display your total completed sessions plus recent 7-day and 30-day activity on your public page.`

### 2. State handling

The diviner should be able to:

- toggle on
- toggle off

If admin has forced a value, the diviner UI must communicate that clearly.

Example behavior:

- switch is disabled when admin override is active
- helper text explains the admin-managed state

### 3. API ownership

Either extend `src/app/api/dashboard/profile/route.ts` or add a dedicated dashboard settings route if that keeps responsibilities cleaner.

Avoid mixing too many unrelated fields into one overloaded PATCH contract if it harms maintainability.

### 4. Save feedback

Use the standard dashboard pattern:

- optimistic or standard save
- success toast
- clear error state

## Acceptance Criteria

- the diviner can manage the block from their own dashboard
- the dashboard clearly reflects when admin override is in effect
- visibility updates persist and affect the public page deterministically

## Status

Done.

Implemented in `src/app/dashboard/profile/page.tsx` and `src/app/api/dashboard/profile/route.ts` with a diviner-owned toggle, save persistence, and explicit admin-override messaging.
