# Task: Professional Email Template Enhancement

## Objective
Enhance the existing email templates to be more professional ("Google-like") and ensure they provide all necessary information and management links.

## Requirements
- [ ] **Template Designs**: Styling improvements to `src/lib/email.ts` and `src/lib/email-base.ts` to feel more like premium service emails (e.g., Airbnb, Stripe).
- [ ] **New Template Functions**:
    - `sendRescheduleConfirmation()`
    - `sendCancellationConfirmation()`
- [ ] **Dynamic Management Links**: Ensure every transactional email related to a booking includes:
    - **View/Manage Booking Link** (Unique Page)
    - **Join Link** (if confirmed)
    - **Reschedule Link** (unique identifier)
    - **Cancel Link** (unique identifier)
- [ ] **Metadata Display**: Include relevant booking details (notes, timezone reference) in the body.

## Technical Details
- Use `buildEmailHtml` for consistent branding.
- Ensure cross-client compatibility (Gmail, Outlook, Apple Mail).
- All links should be absolute URLs using `APP_URL`.
