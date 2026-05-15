# Admin Create/Edit UI Requirements

## Files

Primary files:

```txt
src/app/admin/calendar/new/page.tsx
src/app/admin/calendar/[id]/edit/page.tsx
```

Supporting files may be added if useful:

```txt
src/lib/calendar-events/constants.ts
src/lib/calendar-events/recurrence.ts
src/components/admin/calendar-event-form.tsx
```

Prefer extracting one shared form component used by both create and edit.

## Chunking Requirement For Developers/Agents

Do not rewrite create/edit/list/API together in one pass.

Recommended UI chunks:

1. Build or extract shared form shell with current fields.
2. Add category/audience constants and dropdowns.
3. Add required end validation and better error display.
4. Add recurring checkbox and day controls.
5. Add Weekend/Weekdays/Everyday state behavior.
6. Add occurrence preview.
7. Wire create page.
8. Wire edit page.
9. Polish admin list badges.

After each chunk, run targeted lint for touched files and manually inspect the changed page.

## Form Fields

### Required Fields

- Title
- Category
- Start date/time
- End date/time
- Audience
- Priority
- Active status

### Optional Fields

- Description

### Recurring Config

Add recurring controls directly in the form:

```txt
[ ] Repeat this event
```

When checked, show:

```txt
Repeat on:
[ ] Sunday
[ ] Monday
[ ] Tuesday
[ ] Wednesday
[ ] Thursday
[ ] Friday
[ ] Saturday

Quick select:
[ ] Weekend
[ ] Weekdays
[ ] Everyday

Repeat until:
[ date input ]
```

## Legacy Behavior To Preserve Conceptually

Legacy form behavior:

- Weekend selects Saturday + Sunday.
- Weekdays selects Monday through Friday.
- Everyday selects all seven days.
- If Weekend is selected, Weekdays and Everyday are cleared.
- If Weekdays is selected, Weekend and Everyday are cleared.
- If Everyday is selected, Weekend and Weekdays are cleared.
- Turning recurring off clears/hides recurring days.

Implement this with normal React state, not timeout chains.

## Category Dropdown

Replace free-text category input with dropdown:

```txt
Ritual
Sunday Service
Live Class
Meditation
Other
```

Saved values:

```txt
ritual
sunday_service
live_class
meditation
other
```

## Audience Dropdown

Keep current options but ensure saved values are consistent:

```txt
Public -> public
Members -> members
Students -> students
Members & Guests -> members_and_guests
```

## Date/Time UX

Current form uses `datetime-local`.

Acceptable Phase 1 approach:

- keep `datetime-local`
- make both start and end required
- validate end is after start
- show friendly error inline before submit

Do not allow backend-only validation to be the first user feedback.

## Recurrence Preview

When recurring is checked and valid enough, show a preview panel:

```txt
Occurrences to be created

May 17, 2026 10:00 AM - 11:15 AM
May 24, 2026 10:00 AM - 11:15 AM
May 31, 2026 10:00 AM - 11:15 AM
June 7, 2026 10:00 AM - 11:15 AM
+7 more
```

Also show clear non-cron language:

```txt
Occurrences will be created when this form is saved. No background automation runs in this phase.
```

The preview component/helper should include a short code comment if it shares logic with occurrence generation:

```ts
// Keep this preview calculation aligned with the server-side manual occurrence
// generation. Future cron should use the same recurrence rule semantics.
```

## Error Display

Add better validation and API error display:

- inline required field errors
- top-level form alert for API errors
- disabled submit while saving
- do not navigate away on failure

## Submit Behavior

Create:

```txt
POST /api/admin/calendar
```

Edit:

```txt
PUT /api/admin/calendar/[id]
```

After success:

```txt
router.push("/admin/calendar")
```

## Visual Direction

Use current admin dark theme.

- no landing/hero
- no large decorative treatment
- use compact form sections
- keep controls easy to scan
- badges/chips for recurring preview
- preserve existing admin shell/sidebar

## Acceptance Criteria

- Admin cannot submit missing title/start/end/category/audience.
- Admin cannot submit end before start.
- Category is controlled, not free text.
- Recurring controls appear only when enabled.
- Weekend/Weekdays/Everyday shortcuts work.
- Occurrence preview updates as inputs change.
- Create recurring event produces real rows visible in `/admin/calendar`.
- Recurring generated rows are visible in `/community/events`.
