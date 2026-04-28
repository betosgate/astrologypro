# Task 02 - Add Relationship Save Link Endpoint

- Status: Planned
- Priority: P0
- Area: API / Saved Relationship Reports
- Route To Add: `POST /api/community/saved-reports/relationship/link`

---

## Goal

Add the minimal authenticated server endpoint needed by the toolkit/community wrapper to save and link generated relationship reports.

Do not create a new persistence model. This endpoint must call the existing helper `saveAndLinkRelationshipReport(...)`.

## Request Body

```json
{
  "personAId": "uuid",
  "personBId": "uuid",
  "reportType": "romantic | friendship | partnership",
  "payload": {
    "toolname": "romantic_forecast_report_tropical_v2 | friendship_report_tropical_v2 | business_partner_v2"
  }
}
```

## Required Validation

- Auth required.
- User must have an active `perennial_mandalism` community membership.
- Both `personAId` and `personBId` must belong to the authenticated member's household.
- `personAId` and `personBId` cannot be the same.
- `reportType` must be one of:
  - `romantic`
  - `friendship`
  - `partnership`
- `payload.toolname` must match the report type:
  - `romantic` → `romantic_forecast_report_tropical_v2`
  - `friendship` → `friendship_report_tropical_v2`
  - `partnership` → `business_partner_v2`

## Save Behavior

- Call `saveAndLinkRelationshipReport(...)`.
- Let helper sort pair ids canonically.
- Return:

```json
{
  "reportId": "uuid",
  "domainLinked": true,
  "status": "generated"
}
```

## Failure Behavior

- If auth/membership fails: 401/403.
- If household validation fails: 404 or 403 without leaking foreign ids.
- If payload validation fails: 400.
- If artifact saves but domain link fails: return 500 with `reportId` and `domainLinked: false`.

## Acceptance Criteria

- [ ] Endpoint calls `saveAndLinkRelationshipReport(...)`.
- [ ] Endpoint never trusts client ownership.
- [ ] Endpoint rejects mismatched `reportType` and `toolname`.
- [ ] Same pair/type updates only its own `community_relationship_reports` row.
