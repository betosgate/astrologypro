# Backend Task - Fix Community Plan Add Member Payload Contract

- Status: Planned
- Priority: P0
- Area: Backend
- Endpoint: `POST /api/community/plan/members`
- Page Route: `/community/plan?tab=members`

---

## Problem

Adding a member from the Community plan Members tab fails with:

```txt
422 Unprocessable Entity
```

Response:

```json
{
  "error": "full_name and date_of_birth are required"
}
```

The request currently reaches the backend with camelCase fields:

```json
{
  "fullName": "Doris D. Villicana",
  "dateOfBirth": "1997-10-14",
  "birthTime": "18:19",
  "birthCity": "Florida",
  "birthCountry": "USA",
  "relationship": "spouse",
  "notes": ""
}
```

But the backend route currently expects snake_case:

```txt
full_name
date_of_birth
birth_time
birth_city
birth_country
```

Because of this mismatch, `full_name` and `date_of_birth` are `undefined`, so backend validation rejects a valid user submission.

## File

```txt
src/app/api/community/plan/members/route.ts
```

## Required Backend Fix

Update the backend request parsing so it explicitly accepts the current frontend payload and maps it into the existing database insert shape.

The backend should normalize known fields only:

```txt
full_name       <- body.full_name       ?? body.fullName
date_of_birth   <- body.date_of_birth   ?? body.dateOfBirth
birth_time      <- body.birth_time      ?? body.birthTime
birth_city      <- body.birth_city      ?? body.birthCity
birth_country   <- body.birth_country   ?? body.birthCountry
relationship    <- body.relationship
notes           <- body.notes
```

Keep the existing required validation:

```txt
full_name and date_of_birth are required
```

## Constraints

- Do not remove required validation.
- Do not accept arbitrary unknown fields.
- Do not change billing/member-count logic.
- Do not change Stripe extra-seat reconciliation.
- Do not change frontend code in this task.

## Acceptance Criteria

- [ ] Backend accepts the current camelCase Add Member payload.
- [ ] Backend still accepts the existing snake_case payload if already used elsewhere.
- [ ] Valid Add Member request no longer returns `422`.
- [ ] Missing full name still returns a validation error.
- [ ] Missing date of birth still returns a validation error.
- [ ] Member insert still writes snake_case database columns correctly.

## QA Checklist

- [ ] Log in as a Perennial Mandalism user with access to `/community/plan`.
- [ ] Open `/community/plan?tab=members`.
- [ ] Click `Add Member`.
- [ ] Submit a valid member using the current UI fields:

```json
{
  "fullName": "Doris D. Villicana",
  "dateOfBirth": "1997-10-14",
  "birthTime": "18:19",
  "birthCity": "Florida",
  "birthCountry": "USA",
  "relationship": "spouse",
  "notes": ""
}
```

- [ ] Confirm `POST /api/community/plan/members` does not return `422`.
- [ ] Confirm the member appears in the Members tab after submission or page refresh.
- [ ] Confirm the saved record contains the expected name, birth date, birth time, birth city, birth country, relationship, and notes.
- [ ] Submit once with missing full name and confirm validation still blocks it.
- [ ] Submit once with missing date of birth and confirm validation still blocks it.
- [ ] Confirm there is no regression in plan pricing, included seat count, paid extra seat count, or Stripe extra-seat reconciliation behavior.
