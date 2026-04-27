# Task 02 - Define Unified Report Identity And Schema

- Status: Planned
- Priority: P0
- Area: Data Model / Saved Report Lifecycle

---

## Goal

Define one report identity model for saved PM/community chart reports.

The identity must be deterministic enough to prevent accidental reuse of the wrong report and explicit enough to support regeneration.

## Report Types

### Natal / Nativity

Tool slug:

```txt
western_horoscope_v2
```

Identity should include:

- `family_member_id`
- birth date
- birth time
- birth place coordinates or normalized place
- input hash or source version
- tool slug

### Monthly Transit Full Report

Tool slug:

```txt
tropical_transits_monthly_v3
```

Identity should include:

- target month
- self/family member identity, depending product decision
- birth data input hash
- tool slug

### Relationship Reports

Tool slugs depend on selected relationship type.

Identity should include:

- `person_a_id`
- `person_b_id`
- canonical sorted pair key
- relationship type: `friendship`, `romantic`, `partnership`
- both birth-data input hashes
- tool slug

## Proposed Schema Additions

Finalize exact names during implementation, but likely fields:

```sql
ALTER TABLE community_family_members
  ADD COLUMN natal_report_id UUID NULL REFERENCES astro_ai_responses(id),
  ADD COLUMN natal_report_generated_at TIMESTAMPTZ NULL,
  ADD COLUMN natal_report_status TEXT NULL;

ALTER TABLE monthly_transits
  ADD COLUMN full_report_id UUID NULL REFERENCES astro_ai_responses(id),
  ADD COLUMN full_report_generated_at TIMESTAMPTZ NULL,
  ADD COLUMN full_report_status TEXT NULL;

ALTER TABLE relationship_charts
  ADD COLUMN report_id UUID NULL REFERENCES astro_ai_responses(id),
  ADD COLUMN report_type TEXT NULL,
  ADD COLUMN report_generated_at TIMESTAMPTZ NULL,
  ADD COLUMN report_status TEXT NULL;
```

If multiple relationship report types can exist for the same pair, consider a new child table instead of one `report_id` column:

```txt
community_relationship_reports
```

with:

- `member_id`
- `person_a_id`
- `person_b_id`
- `report_type`
- `astro_ai_response_id`
- lifecycle fields

## Artifact Metadata

`astro_ai_responses.condition` or structured metadata should include:

- community member id
- family member id or pair ids
- report type
- tool slug
- target month if monthly
- input hash
- schema version
- generator source

## Acceptance Criteria

- [ ] Natal report identity is defined.
- [ ] Monthly full-report identity is defined.
- [ ] Relationship report identity is defined per relationship type.
- [ ] Domain-to-artifact linkage schema is chosen.
- [ ] Stale detection strategy is defined.
- [ ] Multiple report types for the same relationship pair are supported.
