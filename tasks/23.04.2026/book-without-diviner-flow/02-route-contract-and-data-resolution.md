# 02 Route Contract And Data Resolution

## Goal

Define the new shared booking route and its server-side resolution contract.

## Required Outcome

Create a dedicated route for the `Book Without Choosing a Diviner` branch.

Suggested route shape:
- `/book/template/[slug]`

Required query params:
- `submission=<uuid>`

Alternative route shapes are allowed only if they fit the current app better, but they must remain explicit and stable.

## Required Server Responsibilities

The route must:
1. validate the submission id
2. validate that the submission belongs to the given template slug
3. resolve the canonical base template slug for `general-*` templates
4. load all compatible diviner services that:
   - are tied to the matching template
   - are active
   - belong to active diviners
   - have enabled + published `diviner_services`
   - are publicly sellable
5. compute the route data needed for a shared booking calendar

## Required Data Shape

Claude should define a normalized route data shape similar to:
- template metadata
- submission metadata
- matched diviners
- matched service rows
- booking label / category / duration / price hints

The route must avoid duplicating unrelated booking data contracts.

## Handoff Rule

The shared route is not the final payment page.

Once a diviner is resolved, the user should be sent into the existing route:
- `/{username}/book/{serviceSlug}`

with submission context preserved.

## Acceptance Criteria

- route exists
- invalid submission/template combinations fail safely
- only compatible live service rows are included
- route data is sufficient to render the shared calendar step

