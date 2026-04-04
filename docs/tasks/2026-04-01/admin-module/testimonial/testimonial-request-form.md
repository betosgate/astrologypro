# Task: Testimonial Request Form

**Date:** 2026-04-01
**Status:** Done

## Objective
Implement or verify the "Request Testimonial" form as per the provided mock-up and payload.

## Request Details

### API Endpoint
`https://d36fwfwo4vnk9h.cloudfront.net/testimonial/testimonial-add`

### Payload Structure
```json
{
  "requested_by_id": "64b65f06d604ceb16647a710",
  "added_by": "64b65f06d604ceb16647a710",
  "testimonial_for": "64c75698f388ffb426f9d161",
  "requested_to_name": "Souradip Pramanick",
  "requested_to_email": "souradip.happens@gmail.com",
  "requested_to_phone_no": "07501372102",
  "notes": "Test"
}
```

## Form UI Specification (based on screenshot)
- **Title:** REQUEST TESTIMONIAL
- **Fields:**
  - **Customer Name:** `requested_to_name`
  - **Customer Email:** `requested_to_email`
  - **Phone:** `requested_to_phone_no` (with masking)
  - **Select Astrologer:** `testimonial_for` (Dropdown)
  - **Notes:** `notes` (Textarea)

## Current Code Analysis
- Existing form at `src/app/(admin)/admin/testimonials/create/page.tsx`.
- Discrepancy: Current code uses `testimonial_content` while payload expects `notes`.
- Discrepancy: Current code title is "Create Testimonial" while screenshot shows "REQUEST TESTIMONIAL".
- Discrepancy: Current code includes `testimonial_title` which is not in the requested payload.

## Action Items
- [ ] Align `src/app/(admin)/admin/testimonials/create/page.tsx` with this specific "Request" flow.
- [ ] Rename fields and labels to match the screenshot and payload.
- [ ] Ensure the phone number field supports the requested masking/format.
