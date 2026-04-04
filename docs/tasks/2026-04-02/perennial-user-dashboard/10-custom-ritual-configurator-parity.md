# Task 10 - Custom Ritual Configurator Parity - 2026-04-02

- Status: Todo
- Priority: P1
- Parent Task: `07-master-ritual-parity-task.md`
- Scope: planetary/zodiacal configurator UI behavior, validation rules, tag generation, and submit contract
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard/10-custom-ritual-configurator-parity.md`

## Goal

Make the custom planetary/zodiacal Create Ritual flow in Next match Angular for available options, validation, generated ritual tags, and submit behavior.

## Verified Angular Configurator Behavior

- ritual mode:
  - `invocation`
  - `banishing`
- selectable planets
- selectable zodiac signs
- in banishing mode:
  - zodiac selection is disabled/cleared

## Validation Rules

1. Banishing requires at least one planet.
2. Invocation requires at least one planet or at least one zodiac.

This means zodiac-only invocation is valid and must work in Next.

## Generated Tag Rules

Always include:

- `Ritual_Opening`
- `Ritual_Closing`

Invocation mode:

- for each selected planet:
  - `${Planet}_Gate_Invocation_Ritual`
  - `${Planet}_Invocation_Ritual`
- for each selected zodiac:
  - `${Zodiac}_Gate_Invocation_Ritual`
  - `${Zodiac}_Invocation_Ritual`

Banishing mode:

- for each selected planet:
  - `${Planet}_Gate_Banishing_Ritual`

De-duplicate before submit.

## API And Payload

### Add Ritual Configuration

- Endpoint: `ritual-invocation/add-ritual-configuration`
- Method: `POST`
- Payload:

```json
{
  "user_id": "<current_user_id>",
  "ritual_tags": ["...generated tags..."]
}
```

Example invocation payload:

```json
{
  "user_id": "<current_user_id>",
  "ritual_tags": [
    "Ritual_Opening",
    "Mars_Gate_Invocation_Ritual",
    "Mars_Invocation_Ritual",
    "Aries_Gate_Invocation_Ritual",
    "Aries_Invocation_Ritual",
    "Ritual_Closing"
  ]
}
```

Example banishing payload:

```json
{
  "user_id": "<current_user_id>",
  "ritual_tags": [
    "Ritual_Opening",
    "Mars_Gate_Banishing_Ritual",
    "Ritual_Closing"
  ]
}
```

## Required Behavior

1. Preserve Angular selectable planets and zodiacs.
2. Preserve Angular mode-switch behavior.
3. Preserve Angular validation rules exactly.
4. Submit generated tags to the same create API.
5. On success, route directly to ritual result using returned config id.

## Acceptance Criteria

- zodiac-only invocation succeeds
- banishing without planet is blocked
- generated tags match Angular rules
- create API contract matches Angular
- custom-create success routes to saved ritual result

## Verification Plan

1. Create a zodiac-only invocation ritual.
2. Create a planet-only invocation ritual.
3. Create a mixed planet + zodiac invocation ritual.
4. Attempt banishing with no planet and verify validation failure.
5. Create a valid banishing ritual and verify payload tags.

## Notion Summary

P1 custom-config parity task for the planetary/zodiacal ritual builder. Restore Angular’s validation rules, tag generation, and create behavior exactly.
