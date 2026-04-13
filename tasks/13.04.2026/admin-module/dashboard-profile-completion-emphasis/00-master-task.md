# Dashboard Profile Completion Emphasis Pack

## Objective

Define a high-visibility dashboard block that pushes users to complete their profile when required data is still missing.

This applies especially to the Perennial Mandalism user dashboard, but the pattern should be reusable across role dashboards where incomplete profile state blocks value delivery.

The block must:

- appear prominently on the dashboard when profile completion is below the required threshold
- clearly explain what is missing
- drive the user to the correct profile or onboarding destination
- disappear or downgrade once profile completion reaches the expected state

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing completion work

There is already a profile completion task:

- `tasks/13.04.2026/sign-up/05-build-profile-completion-indicator.md`

That task focuses on:

- completion percentage
- missing field list
- profile-page indicators

It does not define a dashboard-priority emphasis block.

### Existing community dashboard signals

The community dashboard already renders profile and chart progress concepts in:

- `src/app/community/page.tsx`
- `src/components/community/profile-progress-section.tsx`
- `src/components/community/profile-completion-card.tsx`
- `src/app/api/community/profile-completion/route.ts`

This means the repo already has the right ingredients, but not yet the explicit product rule for a high-emphasis dashboard intervention.

## Product Direction

The dashboard should not passively show completion as a low-priority metric.

If profile completion is incomplete in a way that prevents chart generation, onboarding quality, or meaningful personalization, the dashboard should elevate that state into a primary action block.

## Workstreams

1. `01-thresholds-and-visibility-rules.md`
2. `02-dashboard-block-priority-copy-and-cta.md`
3. `03-missing-data-mapping-and-destination-routing.md`
4. `04-dismissal-persistence-and-reappearance-rules.md`
5. `05-admin-observability-and-support-alignment.md`

## Acceptance Standard

This feature set is complete only when:

- incomplete users see a prominent completion block on the dashboard
- the block uses real completion data rather than duplicate logic
- CTAs route to the exact place needed to resolve the missing data
- the block steps down or disappears once completion reaches the required threshold
- admin and support can understand why a user is still being prompted
