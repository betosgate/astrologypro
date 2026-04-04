# Task: Tarot Spread Add/Edit Form

**Date:** 2026-04-01
**Status:** Done

## Target Details
- **Add Route:** `/admin/tarot/spreads/add`
- **Edit Route:** `/admin/tarot/spreads/edit/:id`
- **File:** `src/app/(admin)/admin/tarot/spreads/add/page.tsx` (Handles both add/edit)

## Objective
Align the Tarot Spread Add/Edit form with the Angular implementation, adding missing fields and image upload functionality.

## Form Details

### API Endpoints
- **Add:** `tarot-spreads/tarot-spread-add`
- **Update:** `tarot-spreads/spread-update`
- **Fetch Single:** `tarot-spreads/tarot-spread-preview`

### Sample Payload (Add/Update)
```json
{
  "spread_name": "Celtic Cross",
  "priority": 10,
  "description": "A classic ten-card spread.",
  "status": 1,
  "thumbnail": "https://bucket.s3.amazonaws.com/uploads/spread-thumb.jpg"
}
```

### Fields Specification
- **Spread Name:** `spread_name` (Text, Required)
- **Priority:** `priority` (Number, Required)
- **Description:** `description` (Textarea, Required)
- **Status:** `status` (Switch/Checkbox, 1=Active, 0=Inactive)
- **Thumbnail:** `thumbnail` (File Upload, Multiple: false)
  - **Bucket:** `all-frontend-assets`
  - **Path:** `divine-infinity-being/tarot-spread-image/`

## Discrepancy Analysis
- Next.js is missing the `thumbnail` image upload field.
- Ensure the `priority` field is correctly mapped to the backend payload.

## Action Items
- [ ] Implement `thumbnail` image upload in `src/app/(admin)/admin/tarot/spreads/add/page.tsx`.
- [ ] Verify that the form correctly handles both create and edit modes using the specified endpoints.
