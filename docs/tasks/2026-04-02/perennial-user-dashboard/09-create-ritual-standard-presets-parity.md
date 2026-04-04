# Task 09 - Create Ritual Standard Presets Parity - 2026-04-02

- Status: Todo
- Priority: P1
- Parent Task: `07-master-ritual-parity-task.md`
- Scope: standard ritual options, standard tag mapping, create submit contract, and post-create navigation
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard/09-create-ritual-standard-presets-parity.md`

## Goal

Restore Angular-equivalent standard Create Ritual behavior in Next for the three preset ritual types and the custom-option entry point.

## Verified Angular Ritual Options

1. `Standard Banishing Ritual of the Pentagram`
2. `Standard Invocation Ritual of the Pentagram`
3. `Divine Infinite Being Invocation Ritual of the Pentagram`
4. `Planetary Zodiacal Invocation Ritual of the Pentagram`

## Preset Tag Mapping

```json
{
  "Standard Banishing Ritual of the Pentagram": ["Banishing_Ritual"],
  "Standard Invocation Ritual of the Pentagram": ["Invocation_Ritual"],
  "Divine Infinite Being Invocation Ritual of the Pentagram": ["Core_Invocation_Ritual"]
}
```

## API And Payload

### Add Ritual Configuration

- Endpoint: `ritual-invocation/add-ritual-configuration`
- Method: `POST`
- Payload:

```json
{
  "user_id": "<current_user_id>",
  "ritual_tags": ["...mapped tags..."]
}
```

### Expected Success Shape Used By Angular

```json
{
  "results": {
    "_id": "<config_id>"
  }
}
```

## Required Behavior

1. Show all 4 Angular options.
2. Standard options submit exact Angular tag arrays.
3. Custom option must open the custom configurator, not submit immediately.
4. Success must navigate directly to ritual result using returned config id.
5. Success path must not stop at toast + list refresh only.

## Acceptance Criteria

- all 4 ritual choices are present
- standard tag mapping matches Angular exactly
- create API uses user id plus ritual tags
- success routes to result page for the new config

## Verification Plan

1. Create each preset ritual.
2. Verify payload tags per preset.
3. Confirm returned config id is used for navigation.
4. Confirm custom option transitions to custom-config flow instead of submitting immediately.

## Notion Summary

P1 create-parity task for standard ritual presets. Restore Angular’s preset options, exact tag mappings, and config-id-based post-create navigation.
