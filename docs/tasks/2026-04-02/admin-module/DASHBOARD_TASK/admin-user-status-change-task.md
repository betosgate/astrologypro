# Task: User Status Change API Bug

## Overview
Fix an issue where the `/user/status-change` API responds with success but fails to update the user status in the database.

## Details
- **API Endpoint**: `/user/status-change`
- **Method**: POST
- **Reported Bug**: Discrepancy between API response and database state.

## API Endpoints
- **Update API**: `/user/status-change`

## Payload Structure
The following payload was used to reproduce the issue:
```json
{
  "data": "64c756195cf3682b31545933",
  "status": 0
}
```

## Bug Description
- **Current Behavior**: The API returns a success message, however, the user status with ID `64c756195cf3682b31545933` is not updated to `0` in the database.
- **Expected Behavior**: The API should only return success after ensuring the database has been successfully updated with the new status.

## Additional Requirements
- **Verification**: Ensure the database update operation (using the `data` field as the `_id`) correctly performs the update.
- **Error Handling**: If the update fails, the API should return an appropriate error message instead of success.

## Implementation Notes (2026-04-02)

Two-part fix applied across the NestJS API repo (`divine-infinite-being-nest-api`):

**Part 1 — Controller payload parsing (previously fixed, comment already present):**
`user.controller.ts:2607` — The original code assigned `reqBody = data.data` (a plain string) then read `reqBody._id` and `reqBody.status` from it, both returning `undefined`. The fix detects whether `data.data` is a string (single-ID payload `{ data: "<_id>", status: 0 }`), an object with `.ids` (bulk payload), or a regular object with `._id`, and builds `condition` and `updateSet` accordingly.

**Part 2 — Service query (fixed this session):**
`user.service.ts:987` — `statusChangeUser` passed `condition` (an array of ObjectIds) directly as `{ _id: condition }`. MongoDB treats `{ _id: [ObjectId] }` as an equality match against an array-typed `_id`, not a membership test, so `matchedCount` was always 0. Changed to `{ _id: { $in: condition } }` so the query correctly matches documents whose `_id` is one of the provided ObjectIds.

**Status**: Done

---
**Date**: 2026-04-02
**Module**: Admin Dashboard
**Priority**: High
