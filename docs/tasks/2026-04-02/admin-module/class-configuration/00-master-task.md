# Master Task - Class Configuration Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Class Configuration
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/class-configuration`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/class-configuration`
- Primary Next Routes:
  - `/admin/training/classes`
  - `/admin/training/classes/add`
  - `/admin/training/classes/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Class Configuration module, focusing on list discoverability and the dependent form behavior that controls valid session selection.

## Current Product Truth

- The current Next module already supports the base CRUD flow for class configuration.
- The remaining verified gaps are:
  - list text search parity across four fields
  - list preview
  - schedule-driven session option behavior
  - edit hydration for dependent session choices and labels

## Child Tasks

1. `01-close-class-configuration-list-search-and-preview-parity.md`
2. `02-close-class-configuration-dependent-session-parity.md`
3. `03-align-class-configuration-edit-hydration-and-submit-semantics.md`

## Done Definition

- `/admin/training/classes` supports the same practical search dimensions Angular admins use.
- `/admin/training/classes` supports preview from the list.
- add and edit forms constrain session choices by schedule and show the expected schedule-specific labels.
- edit mode rehydrates the correct dependent session options before save.
- existing create, update, quarter dropdown, and admin dropdown flows continue to work.

## Verification Gate

1. Validate list search works for admin, quarter, schedule, and session text.
2. Validate preview works from the list.
3. Validate schedule choice changes the available session options correctly.
4. Validate edit mode loads the current session choice with the correct option set.
5. Validate add and edit save the expected payload without regressing existing flows.

## Notion Ready Summary

Title: Class Configuration parity

Summary:
The Next Class Configuration module already supports the base CRUD path, but it still misses the list search/preview experience and the dependent session-selection behavior Angular admins use today. The most important parity work is making session choices depend on the selected schedule and ensuring edit mode hydrates those dependent options correctly.
