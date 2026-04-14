# 06 Support Ticket Escalation for Chart Issues

## Goal

Reuse the existing support ticket system for astrology generation problems after self-service correction limits are exhausted.

## Current Repo Grounding

The repo already has:

- `support_tickets`
- user ticket APIs
- admin ticket management pages
- queue and SLA support

This is the correct foundation for chart issue escalation.

## When a Ticket Is Required

Users should be pushed into a ticket flow when:

- natal chart generation fails repeatedly
- the `3` correction attempts are exhausted
- source birth data is disputed
- a family dynamic or relationship result appears inconsistent
- a monthly transit did not generate as expected

## Recommended Ticket Type Model

Use either a dedicated ticket type or subcategory such as:

- `astro_chart_issue`
- `monthly_transit_issue`
- `family_relationship_chart_issue`

## Required Linkage

Each ticket should be able to reference:

- affected `community_member`
- affected `community_family_member`
- related `relationship_chart`
- related `monthly_transit`

The existing support ticket schema already has generic entity-linking fields, so this should reuse those rather than bolt on a custom chart-support table.

## Recommended User Flow

1. self-service regeneration unavailable or failed
2. user clicks `Create support ticket`
3. ticket is prefilled with chart context
4. admin or ops team reviews
5. staff can decide whether to:
   - correct data
   - reset retry allowance
   - force regeneration
   - explain expected output

## Operational Recommendation

Chart support should route to a dedicated queue if volume justifies it.

Otherwise:

- reuse the existing support queue model with a chart-specific type

## Deliverables

- chart-support escalation rules
- ticket type and entity-linking plan
- admin resolution actions
- SLA expectations for chart problems

---

## Implementation — 2026-04-13

### API update
`src/app/api/support/tickets/route.ts`

**Changes:**
- Extended `allowedEntityTypes` to include: `natal_chart`, `monthly_transit`, `relationship_chart`
- Added `chart_family_member_id` and `chart_member_id` optional body fields for chart escalation pre-fill
- When `category` is a chart-specific type (`natal_chart_issue`, `monthly_transit_issue`, `family_relationship_chart_issue`), `type` is auto-set to `'chart_support'` so it can be filtered to a dedicated queue
- Chart-specific entity IDs are embedded as `tags` (e.g. `family_member:uuid`) for admin filtering without new columns

### Escalation flow (from generate-natal API)
When `natal_status = 'locked_for_review'`, the generate-natal API returns:
```json
{
  "error": "Correction retry limit reached. Please open a support ticket for this profile.",
  "natal_status": "locked_for_review",
  "retries_used": 3,
  "retries_allowed": 3
}
```
The frontend should show a "Create support ticket" CTA that pre-fills:
- `category: "natal_chart_issue"`
- `related_entity_type: "natal_chart"`
- `related_entity_id: <family_member_id>`
- `chart_family_member_id: <family_member_id>`

### Admin resolution actions (via DB or future admin UI)
- Reset retry: `UPDATE community_family_members SET natal_retry_count = 0, natal_status = 'generated', natal_lock_reason = NULL WHERE id = ?`
- Force regeneration: call generate-natal as service_role after resetting retry count
- Raise limit: `UPDATE community_family_members SET natal_max_retries = 5 WHERE id = ?`
