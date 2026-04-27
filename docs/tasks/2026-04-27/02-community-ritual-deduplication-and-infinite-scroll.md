# Task 02 - Community Ritual Deduplication And Infinite Scroll - 2026-04-27

- Status: Planned
- Priority: P1
- Area: `community rituals`, `ritual creation`, `ritual list`
- Scope: prevent duplicate ritual creation for static and custom rituals, and add paginated infinite scrolling to `/community/rituals`
- Requested By: user

## Goal

Improve the community rituals flow in two places:

1. `Create Ritual`
   Do not create duplicate ritual records if the same ritual already exists for the current user.
2. `My Rituals`
   Show rituals in batches of `10` and load the next `10` when the user scrolls to the bottom.

## Product Requirements

### A. Static Ritual Deduplication

For the first three ritual cards on `/community/rituals/new`:

1. `Standard Banishing Ritual of the Pentagram`
2. `Standard Invocation Ritual of the Pentagram`
3. `Divine Infinite Being Invocation Ritual of the Pentagram`

Behavior:

1. When the user clicks the card, first check the database for an existing ritual for the current user with the same logical ritual definition.
2. If that ritual already exists, do not create a new record.
3. Navigate directly to the existing ritual detail page:

```text
/community/rituals/<existing_ritual_id>
```

4. If no existing ritual is found, create it and then navigate to the new detail page.

Important:

- Deduplication must be based on ritual identity, not just UI click state.
- This must work even after page refreshes or across multiple sessions.

### B. Custom Planetary/Zodiacal Ritual Deduplication

For the `Planetary Zodiacal Invocation Ritual of the Pentagram` configurator:

1. After the user chooses ritual mode, planets, and zodiacs, compute the final normalized ritual tag set.
2. Before creating a new ritual, check whether the same combination already exists for the current user.
3. If the same combination already exists:
   - do not create a new ritual
   - navigate to the existing ritual detail page
4. If the combination does not exist:
   - create the ritual
   - navigate to the new ritual detail page

Important:

- Combination comparison must be based on normalized ritual identity, not order of user clicks.
- If two users select the same combination, deduplication should still be user-scoped unless product requirements change.
- The custom ritual must compare against the final generated tags after canonical sorting and deduplication.

### C. Ritual List Infinite Scrolling

On `/community/rituals`:

1. Initial page load should fetch the first `10` rituals.
2. When the user scrolls to the bottom, fetch the next `10`.
3. Continue until all rituals are loaded.
4. Preserve current sort order.
5. Avoid duplicate rows when fetching next pages.
6. Show a loading state while the next page is being requested.
7. Stop requesting once there are no more results.

## Why This Task Exists

Current problems to solve:

1. Clicking ritual cards can create duplicate ritual rows for the same ritual.
2. The custom configurator can create multiple duplicate records for the same planet/zodiac combination.
3. `/community/rituals` will become hard to use if the user has many rituals and everything renders in one load.

## Functional Deduplication Rules

### Static Ritual Identity

These should be treated as logically unique per user.

Suggested identity rules:

- `Standard Banishing Ritual of the Pentagram`
  Identify by canonical preset tag set:
  - `Ritual_Opening`
  - `Pentagram_Gate_Banishing_Ritual`
  - `Pentagram_Banishing_Ritual`
  - `Ritual_Closing`

- `Standard Invocation Ritual of the Pentagram`
  Identify by canonical preset tag set:
  - `Ritual_Opening`
  - `Pentagram_Gate_Invocation_Ritual`
  - `Pentagram_Invocation_Ritual`
  - `Ritual_Closing`

- `Divine Infinite Being Invocation Ritual of the Pentagram`
  Identify by canonical preset tag set:
  - `Ritual_Opening`
  - `DIB_Gate_Invocation_Ritual`
  - `DIB_Invocation_Ritual`
  - `Ritual_Closing`

### Custom Ritual Identity

Custom ritual identity must be based on:

1. `ritual_name`
   likely still `Planetary Zodiacal Invocation Ritual of the Pentagram`
2. `ritual_tags`
   after:
   - canonical sorting
   - duplicate removal
   - consistent mode-specific generation

The normalized tag array should be treated as the true signature of the ritual combination.

## Recommended Technical Approach

### Step 1 - Introduce Shared Normalization Helpers

Create or extend a shared helper module, for example:

```text
src/lib/community/ritual-identity.ts
```

Suggested responsibilities:

- normalize ritual tags into canonical stable order
- generate a stable identity string for lookup
- expose helpers for preset ritual identities

Suggested exports:

- `normalizeRitualTags(tags: string[]): string[]`
- `buildRitualIdentityKey(tags: string[]): string`
- `isSameRitualDefinition(leftTags: string[], rightTags: string[]): boolean`

### Step 2 - Add Backend Support For Deduplication

Current create flow likely posts to:

```text
/api/community/rituals
```

Enhance the flow so the backend can:

1. search existing user rituals by normalized identity
2. return the existing record if found
3. create only when missing

Two acceptable patterns:

#### Option A - Make `POST /api/community/rituals` idempotent

Behavior:

- request contains ritual name + ritual tags
- server normalizes tags
- server checks current user's existing rituals
- if found, return existing ritual instead of inserting
- if not found, create new ritual

Suggested response shape:

```json
{
  "ritual": { "...": "..." },
  "created": false
}
```

or

```json
{
  "ritual": { "...": "..." },
  "created": true
}
```

#### Option B - Add a dedicated lookup endpoint

Example:

```text
/api/community/rituals/find-or-create
```

Recommended preference:

- `Option A`

Reason:

- simpler UI contract
- creation becomes safely repeatable
- easier to reuse from both preset and custom flows

### Step 3 - Ensure Comparison Is Order-Insensitive

The lookup must not depend on the raw order in which the UI happened to send tags.

Example:

If user selected planets/zodiacs in a different click order but the generated canonical ritual is the same, it must resolve to the same existing ritual.

This means:

- compare normalized canonical tags
- do not compare unsorted raw arrays

### Step 4 - Update Create Ritual UI

File likely involved:

```text
src/app/community/rituals/new/page.tsx
```

Required changes:

1. For the first three static ritual cards:
   - continue using the create flow
   - but rely on the API to return existing ritual if already created
2. For custom planetary/zodiacal submit:
   - continue generating canonical tags
   - submit to the same API
   - if API returns existing ritual, navigate there
   - if API creates a new ritual, navigate there

Important:

- UI should not need to know whether result was existing or newly created unless product wants a toast.
- Navigation logic should be identical in both cases.

### Step 5 - Add Ritual List Pagination Contract

Enhance:

```text
/api/community/rituals
```

Add pagination query params such as:

- `limit`
- `offset`

or

- cursor-based pagination if preferred

Recommended MVP:

- offset pagination

Suggested request examples:

```text
/api/community/rituals?limit=10&offset=0
/api/community/rituals?limit=10&offset=10
/api/community/rituals?limit=10&offset=20
```

Suggested response shape:

```json
{
  "rituals": [],
  "count": 37,
  "nextOffset": 10,
  "hasMore": true
}
```

### Step 6 - Update `/community/rituals` Page For Infinite Scroll

Likely file:

```text
src/app/community/rituals/page.tsx
```

Required behavior:

1. fetch first `10`
2. render list
3. observe bottom sentinel using `IntersectionObserver`
4. when sentinel enters viewport and `hasMore === true`, fetch next page
5. append results
6. prevent concurrent duplicate fetches

Recommended local state:

- `rituals`
- `loadingInitial`
- `loadingMore`
- `offset`
- `hasMore`
- `totalCount`

### Step 7 - Loading, Empty, And End States

Add clear states:

- initial loading spinner or skeletons
- empty state when no rituals exist
- bottom loading indicator during pagination
- end-of-list indicator when no more results remain

## Suggested API Rules

### Deduplication Query Scope

Deduplication must be scoped to:

- current authenticated user

This means:

- user A and user B can each have their own version of the same ritual
- user A should not navigate to user B's ritual

### Existing Record Selection Rule

If multiple duplicate rituals already exist because of older behavior:

1. prefer the oldest existing ritual for navigation, or
2. prefer the newest existing ritual consistently

Recommended:

- prefer the oldest existing ritual

Reason:

- preserves the user's original ritual record
- avoids creating yet another duplicate

This rule should be stated explicitly in implementation.

## Optional Database Improvement

If needed, add a derived identity field for user ritual configurations such as:

```text
ritual_identity_key
```

Where:

- value is built from normalized tags
- scoped by user

Potential benefits:

- simpler query
- future uniqueness constraint opportunity

Potential follow-up:

- backfill existing rows
- optionally add partial unique index on `(user_id, ritual_identity_key)`

This is optional for MVP if app-layer lookup is enough.

## Acceptance Criteria

### Static Ritual Deduplication

1. Clicking `Standard Banishing Ritual of the Pentagram` does not create duplicates for the same user.
2. If the ritual already exists, the user is navigated to the existing `/community/rituals/[id]` page.
3. If it does not exist, it is created once and then opened.
4. Same behavior applies to:
   - `Standard Invocation Ritual of the Pentagram`
   - `Divine Infinite Being Invocation Ritual of the Pentagram`

### Custom Ritual Deduplication

5. If the same planetary/zodiacal combination already exists for the same user, no duplicate ritual is created.
6. Existing ritual is opened directly.
7. If the combination is new, it is created once and then opened.
8. Different click order leading to the same normalized ritual combination still resolves to the same existing ritual.

### Infinite Scroll

9. `/community/rituals` initially loads `10` rituals.
10. Scrolling to the end loads the next `10`.
11. Additional pages append correctly without duplicates.
12. Requests stop once there are no more rituals.
13. Loading-more UI is shown during pagination.

## Verification Plan

### Static Ritual Checks

1. Click `Standard Banishing Ritual of the Pentagram` once.
2. Confirm ritual is created and opened.
3. Return to create page and click the same card again.
4. Confirm no new database row is created.
5. Confirm navigation goes to the same ritual id.

Repeat for:

- `Standard Invocation Ritual of the Pentagram`
- `Divine Infinite Being Invocation Ritual of the Pentagram`

### Custom Ritual Checks

1. Create a custom invocation ritual with:
   - `Jupiter`
   - `Mercury`
   - `Aquarius`
2. Confirm ritual is created once.
3. Repeat the exact same combination.
4. Confirm navigation goes to the same existing ritual id.
5. Try selecting in a different click order but with the same final combination.
6. Confirm same ritual id is reused.
7. Change one selection and confirm a new ritual is created.

### Infinite Scroll Checks

1. Seed or use an account with more than `20` rituals.
2. Open `/community/rituals`.
3. Confirm only first `10` render initially.
4. Scroll to bottom and confirm next `10` append.
5. Continue until all rituals are loaded.
6. Confirm no duplicate rows appear.
7. Confirm no extra requests after `hasMore` becomes false.

## Risks And Open Questions

1. Existing duplicates in the database may cause ambiguity unless a deterministic existing-record selection rule is applied.
2. If tag generation rules evolve again, identity comparison must stay aligned with the canonical generator.
3. Offset-based pagination is simplest, but cursor-based pagination may be more robust long-term if records are added frequently during browsing.
4. If the list is server-rendered today, infinite scroll may require moving part of the page into a client component.

## Recommended Implementation Order

1. Add shared ritual identity normalization helper.
2. Make create ritual API idempotent.
3. Update create ritual UI to rely on idempotent create.
4. Add paginated `GET /api/community/rituals`.
5. Update `/community/rituals` UI for infinite scrolling.
6. QA static presets, custom combinations, and long lists.

## Notion Summary

P1 task for community rituals. Prevent duplicate ritual creation by making static presets and custom planetary/zodiacal combinations resolve to an existing ritual when one already exists for the current user. Also update `/community/rituals` to load `10` rituals initially and fetch the next `10` on scroll using infinite pagination.
