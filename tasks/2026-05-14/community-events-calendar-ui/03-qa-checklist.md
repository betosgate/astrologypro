# QA Checklist

## Visual

- Desktop layout matches the approved direction.
- Sidebar remains unchanged.
- Calendar grid does not overflow horizontally.
- Right agenda panel is readable and useful.
- Event cards do not overlap text or controls.
- Category colors are visible in dark mode.

## Interaction

- Previous month works.
- Next month works.
- Clicking a date selects and unselects it.
- Filter chips work.
- Search works.
- RSVP buttons still update state.
- `My RSVPs` only shows events with `going` or `maybe`.

## States

- Loading state is clear.
- Empty month state is clear.
- Day with no events is clear.
- Multiple events on one day render cleanly.
- Past dates do not confuse upcoming agenda behavior.

## Responsive

- Mobile layout stacks cleanly.
- Agenda panel appears below calendar on narrow screens.
- Buttons remain tappable.
- Text does not overflow cards.

## Non-Regression

- No `/community/sessions` file changes in this task.
- No cron changes in this task.
- No admin calendar changes in this task.
- No join-session action appears on `/community/events`.

