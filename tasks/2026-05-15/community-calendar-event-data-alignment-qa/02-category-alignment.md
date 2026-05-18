# Category Alignment

## Clean Admin Categories

Admin-created events should use:

```txt
ritual
sunday_service
live_class
meditation
other
```

## Community Labels

Community UI should display:

```txt
Ritual
Sunday Service
Live Class
Meditation
Other
```

## Legacy Category Fallback

Old database rows may still contain legacy categories such as:

```txt
ceremony
workshop
orientation
class
webinar
```

Recommended mapping:

```txt
ceremony -> ritual
workshop -> live_class or other, depending content
orientation -> other
class -> live_class
webinar -> live_class
unknown -> other
```

Keep fallback professional. Avoid showing confusing labels to community users.

## QA Cases

Create or find one event in each clean category:

- Ritual
- Sunday Service
- Live Class
- Meditation
- Other

Verify:

- calendar dot color
- selected-day card category badge
- event detail card category badge
- My Registered Events category display

## Acceptance Criteria

- No raw category slugs are visible to normal community users.
- Unknown category does not break layout.
- Category colors are consistent across calendar grid, side panel, and registered events.

