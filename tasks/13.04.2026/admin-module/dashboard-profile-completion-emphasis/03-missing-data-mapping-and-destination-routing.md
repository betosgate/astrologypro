# 03 Missing Data Mapping and Destination Routing

## Goal

Map each missing-data scenario to the exact destination the dashboard prompt should open.

## Current Repo Grounding

Relevant destinations already exist:

- `/community/profile`
- `/community/onboarding`
- family member pages and family add or edit flows

The dashboard prompt should reuse those routes rather than creating a separate correction wizard.

## Recommended Mapping

### Personal profile fields missing

Route to:

- `/community/profile`

### Birth details missing

Route to:

- `/community/profile`

and deep-link or highlight the birth-data section if implemented later.

### Onboarding incomplete

Route to:

- `/community/onboarding`

### Household member data blocking family-level features

Route to:

- `/community/family`

or the exact member edit path if the missing profile is known.

## Rule

The dashboard block must explain both:

- what is missing
- where the user is being sent to fix it

## Deliverables

- missing-state to route map
- deep-link recommendations
- family-versus-self correction routing rules

## Status

Done.

The completion system already maps each missing state to an exact corrective destination through `action_url` values in `src/app/api/community/profile-completion/route.ts`, with self-profile issues routed to `/community/profile` and family or chart blockers routed to `/community/family`.
