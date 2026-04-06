# Task: Testimonial Request Form

**Date:** 2026-04-01
**Status:** Done

## Objective
Implement or verify the "Request Testimonial" form as per the provided mock-up and payload.

## Request Details

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
