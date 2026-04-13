# 01 Package Capability Model for Astro and Tarot

## Goal

Define a canonical package capability layer for service categories.

## Required Package Set

- `both`
- `astrology_only`
- `tarot_only`

## Core Rule

The package should answer:

- may this role offer astrology services
- may this role offer tarot services

That should not be inferred ad hoc from UI labels.

## Recommended Capability Fields

- `package_code`
- `display_name`
- `allows_astrology`
- `allows_tarot`
- `is_default_for_role`
- `is_active`

## Deliverables

- package capability matrix
- DB and config ownership rules
- naming and admin-governance standard

## Status

Done.
