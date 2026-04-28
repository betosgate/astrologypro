# Task 04 - Ritual Configurations Gap Analysis Post DB Migration - 2026-04-27

- Status: Planned
- Priority: P1
- Area: `admin dashboard`, `ritual configurations`, `ritual admin UX`, `runtime integration`
- Scope: identify and implement the remaining work after database migration so `Ritual Configurations` becomes a separate admin system from ritual lists
- Requested By: user

## Goal

The database migration is already completed.

This task exists to define the remaining implementation gap between:

1. the intended `Ritual Configurations` admin system
2. the currently implemented `/admin/rituals` pages

Important product clarification:

- `Ritual Configurations` list page must be a separate admin configuration system
- `Rituals` list and user ritual instances are different things
- admin configuration pages must not behave like the old ritual invocation CRUD

## Current Situation

### What Is Already Applied

The following appears to be partially applied already:

1. admin sidebar label changed to `Ritual Configurations`
2. `/admin/rituals` page heading says `Ritual Configurations`
3. some back links and labels were renamed
4. database migration is already completed by the user

### What Is Still Wrong

The current `/admin/rituals` area is still acting like the old ritual CRUD:

1. `/admin/rituals/new` still shows the old `New Ritual Invocation` form
2. the form still uses old fields like:
   - `name`
   - `description`
   - `instructions`
   - `priority`
   - `is_active`
   - `video_url`
3. the admin list still behaves like a direct ritual table listing instead of a configuration management screen
4. the route naming is reused, but the actual UX is not yet converted to configuration management
5. runtime community pages are not yet reading from the new admin-managed configuration model

## Product Distinction To Preserve

### A. Ritual Configurations

This is an admin-only configuration system.

It should manage:

1. ritual definitions
2. asset library
3. mapping rules
4. final override videos
5. publishing
6. visibility
7. playback policy

### B. Ritual Lists

This is separate and should remain separate.

Examples:

1. community ritual list
   `/community/rituals`
2. user-created ritual instances
3. playback history and progress
4. completion state

These are not the same as admin ritual configurations.

## Required Gap Fix

## 1. Admin Route Intent Must Match The New System

The current admin route path can remain `/admin/rituals` if desired, but the page purpose must be:

- `Ritual Configurations`

not:

- old ritual invocation entry form

If route path remains `/admin/rituals`, then all page titles, forms, actions, and API assumptions must fully reflect configuration management.

## 2. Replace Old New Ritual Form

Current problem:

- `/admin/rituals/new` still behaves like old ritual CRUD

Required replacement:

`/admin/rituals/new` should become:

- `New Ritual Configuration`

The new page must not use the old ritual invocation form.

It should instead create a ritual definition/configuration with sections like:

1. basic information
2. display settings
3. playback settings
4. asset source strategy
5. final override settings
6. publishing and visibility

## 3. Separate Configuration List From Runtime Ritual Records

Current problem:

- admin configuration list is still conceptually mixed with ritual records

Required behavior:

The admin configuration index should list configuration objects, not runtime ritual executions or community ritual rows.

Each configuration row should show:

1. configuration title
2. key/slug
3. ritual type
4. playback mode
   - generated playlist
   - final override
5. published state
6. visibility
7. asset readiness
8. updated at

It should not primarily show:

1. raw `video_url`
2. old `priority`
3. old invocation-only fields unless they are intentionally repurposed

## 4. Build The Missing Admin Screens

The database is already migrated, so the remaining work is mostly UI and wiring.

Important admin navigation clarification:

- admin sidebar/tools should keep only one entry: `Ritual Configurations`
- the `Ritual Configurations` page/module should contain all configuration areas:
  1. `Ritual Configurations`
  2. `Video Assets`
  3. `Tag Mappings`
- do not add separate admin sidebar/tool entries for `Video Assets` or `Tag Mappings`

The following screens/areas are still needed:

### A. Ritual Configurations Index

Required:

1. list all ritual configurations
2. search
3. filter by:
   - published
   - visible
   - static/dynamic
   - override enabled
4. create button
5. edit button
6. publish/unpublish
7. archive/hide

### B. New Ritual Configuration

Required:

1. create ritual definition
2. choose ritual kind
3. choose visibility
4. choose playback mode
5. choose whether final override is enabled
6. save as draft or publish

### C. Edit Ritual Configuration

Required:

1. update metadata
2. update display text
3. update playback policy
4. assign or remove final override
5. open mapping section
6. open linked assets

### D. Video Assets Area

Required:

1. upload video
2. paste video URL
3. preview video
4. active/inactive
5. published/draft
6. usage indicator
7. available inside the `Ritual Configurations` page/module, not as a separate admin sidebar/tool item

### E. Tag Mappings Area

Required:

1. map opening/gate/closing assets
2. map non-planet/zodiac tags
3. show effective source
4. edit label override
5. available inside the `Ritual Configurations` page/module, not as a separate admin sidebar/tool item

## 5. Final Override UI Is Still Missing

The task already defines final override behavior, but the current implementation has not exposed it in admin UI.

Still needed:

1. override enabled toggle
2. select asset from uploaded assets
3. or select asset backed by external URL
4. preview current override
5. remove override
6. clearly show:
   - `Generated playlist mode`
   - `Final override mode`

## 6. Runtime Resolver Still Needs Wiring

Because DB migration is done, the next gap is runtime integration.

Still needed:

1. shared resolver that reads ritual configuration
2. final override resolution first
3. mapping resolution second
4. fallback behavior only during migration period

Pages still needing wiring:

1. `/community/rituals/new`
2. `/community/rituals/[id]`
3. `/community/rituals/[id]/playback`

## 7. API Layer Still Needs Conversion

Current admin APIs likely still reflect the old ritual CRUD model.

Remaining work:

1. ensure admin pages use configuration-oriented endpoints
2. ensure payloads match migrated DB schema
3. stop relying on old single-form ritual fields when those are no longer the primary model

Required API areas:

1. ritual configurations
2. ritual assets
3. ritual mappings
4. publish/visibility actions
5. final override assignment/removal

## 8. Old Field Model Must Be Removed Or Explicitly Repurposed

If the migrated database no longer uses the old ritual invocation schema as the main admin model, then the old form fields must be removed from the new configuration flow.

Do not keep the old form just because the route path still works.

The admin should not see a form centered on:

1. `instructions`
2. single raw `video_url`
3. old generic priority-only control

unless these fields are intentionally mapped into the new configuration design.

## Recommended UI Structure

### Admin Sidebar

1. `Ritual Configurations`

The admin sidebar/tools navigation must keep a single ritual admin entry only.

### Ritual Configurations Page Areas

1. `Ritual Configurations`
2. `Video Assets`
3. `Tag Mappings`

### Ritual Configuration Detail Tabs

1. `Overview`
2. `Display`
3. `Playback`
4. `Mappings`
5. `Assets`
6. `Publish`

## Step-By-Step Implementation Plan

### Step 1 - Audit Existing `/admin/rituals`

1. inspect current list page
2. inspect current create page
3. inspect current edit page
4. inspect current API contracts
5. compare them to migrated DB schema

### Step 2 - Define The Post-Migration UI Contract

1. determine exact configuration fields from migrated schema
2. determine which old fields are obsolete
3. determine what belongs in:
   - ritual definitions
   - assets
   - mappings
   - override settings

### Step 3 - Replace Admin Index Page

1. make list page configuration-focused
2. remove old ritual record assumptions
3. add filters and statuses relevant to configuration

### Step 4 - Replace New Configuration Page

1. rename page title to `New Ritual Configuration`
2. replace old form with sectioned configuration editor
3. wire save/publish/draft actions to migrated schema

### Step 5 - Replace Edit Configuration Page

1. load migrated configuration record
2. expose metadata, playback, display, and publish sections
3. expose final override controls
4. expose links into assets and mappings

### Step 6 - Build Or Complete Asset Management

1. asset list area inside the `Ritual Configurations` page/module
2. upload flow
3. URL flow
4. preview and publish state

### Step 7 - Build Or Complete Mapping Management

1. mapping list/editor area inside the `Ritual Configurations` page/module
2. tag key to asset assignment
3. global vs per-definition scope

### Step 8 - Wire Community Runtime To Configurations

1. create shared resolver
2. use final override first
3. use mappings second
4. keep controlled fallback only if needed

### Step 9 - Clean Up Old Copy And Labels

1. remove `New Ritual Invocation`
2. remove old ritual CRUD language
3. ensure all admin pages consistently say `Ritual Configuration`

### Step 10 - Regression Test

1. admin can create configuration
2. admin can upload/select override video
3. admin can assign tag mappings
4. community ritual create page reads admin config
5. playback reads override or mapping correctly

## Acceptance Criteria

1. `/admin/rituals` behaves as a true `Ritual Configurations` admin page.
2. `/admin/rituals/new` no longer shows the old ritual invocation form.
3. `Ritual Configurations` and runtime ritual lists are clearly separate concepts in both UI and code.
4. Admin can manage configuration metadata without touching runtime ritual records.
5. Admin can manage final override settings from the configuration editor.
6. Admin can manage uploaded or URL-based video assets from dedicated admin tooling.
7. Community runtime reads the migrated configuration model instead of the old admin ritual CRUD shape.

## Verification Plan

1. Open `/admin/rituals` and confirm the page lists configuration objects, not old ritual CRUD rows.
2. Open `/admin/rituals/new` and confirm the title and form are configuration-based.
3. Open an existing config edit page and confirm it exposes playback, mapping, and publish sections.
4. Confirm admin can navigate within `Ritual Configurations` to configuration list, video assets, and tag mappings.
5. Create a configuration and verify it appears correctly in the admin configuration list.
6. Confirm community ritual pages resolve runtime behavior from the configuration system.
