# Task: Tarot Card Add/Edit Form

**Date:** 2026-04-01
**Status:** Done

## Target Details
- **Add Route:** `/admin/tarot/cards/add`
- **Edit Route:** `/admin/tarot/cards/edit/:id`
- **File:** `src/app/(admin)/admin/tarot/cards/add/page.tsx` (Handles both add/edit)

## Objective
Align the Tarot Card Add/Edit form with the Angular implementation, adding missing fields and image upload functionality.

## Form Details

### API Endpoints
- **Add:** `tarot-card/tarot-card-add`
- **Update:** `tarot-card/card-update`
- **Fetch Single:** `tarot-card/tarot-card-edit`

### Sample Payload (Add/Update)
```json
{
  "card_name": "The Fool",
  "related_spreads": ["653e...", "653f..."],
  "priority": 1,
  "description": "New beginnings and adventures.",
  "status": 1,
  "card_image": "https://bucket.s3.amazonaws.com/uploads/fool.jpg"
}
```

### Fields Specification
- **Card Name:** `card_name` (Text, Required)
- **Related Spreads:** `related_spreads` (Multi-select, Required)
  - Fetches options from `tarot-spreads/spread-list`.
- **Priority:** `priority` (Number, Required)
- **Description:** `description` (Textarea)
- **Status:** `status` (Switch/Checkbox, 1=Active, 0=Inactive)
- **Card Image:** `card_image` (File Upload, Multiple: false)
  - **Bucket:** `all-frontend-assets`
  - **Path:** `divine-infinity-profile-images/`

## Discrepancy Analysis
- Next.js currently has `card_number`, `suit`, and `keywords` which are NOT in the Angular form.
- Next.js is missing `related_spreads`, `priority`, and the image upload component.

## Action Items
- [ ] Add `related_spreads` field (multi-select) to `src/app/(admin)/admin/tarot/cards/add/page.tsx`.
- [ ] Add `priority` field.
- [ ] Implement `card_image` file upload using the standard admin upload component.
- [ ] Ensure the payload structure matches the expected backend structure (especially image object format).
