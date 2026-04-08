# Diviner Signup UI & Form Creation

- Status: Completed (2026-04-08)
- Completion Notes: Implemented at src/app/diviner-signup/page.tsx — left column with course info + bullets, right column with order summary card and billing form. Phone auto-formats to (XXX) XXX-XXXX. Password regex enforced client-side. Eye toggles on password fields. Country/state dropdown with USA + India backed by inline state lists; other countries fall back to a text field.

## Overview
Replicate the Professional Divination Course signup page UI based on the Master Specification. 

**Route:** `/diviner-signup`  
**Title:** `Checkout - Professional Divination Course | School of Our Divine Infinite Being`
**Dynamic Data:** The course price must be fetched from the `/api/community/settings` endpoint (handled in `02_diviner_signup_api_integration.md`).

## Existing Page Check
- No existing `diviner-signup` page or related code was found in the project. We are creating this module from scratch as a brand new page.

## UI Content Specification

### Header Section
- Logo Area Text:
  - `SCHOOL OF THE DIVINE` (Line 1)
  - `INFINITE BEING` (Line 2)
  - Font: Myriad Pro Bold
- Main Heading: `CHECK OUT` (Centered, Gradient background - Orange to Red)

### Main Content (Left Column)
- Discount Banner: `Get a Flat 10% instant discount on course fees with full payment upfront!`
- Course Focus: `Our full course includes the mastery of 15 Astrology and Tarot products`
- Instructional Text: `Our courses are done through live web casts and student center training videos and sements. You will be able to collaborate live with teachers and go into break out seasons with other students while enjoying full course materials you gain access to for life!`
- Metrics Heading: `Courses Metrics:`
- Metrics List Items (must contain the 6 bullet points regarding curriculum, 100 hours training, live readings, recordings, etc.)

### Sidebar (Right Column)
- Order Summary: 
  - Item Name: `Professional Divination Course`
  - Price: `[Dynamic Price]` (Fetched from API)
  - Details: `Price Details`, `Total Payable: [Dynamic Price]`
  - Button: `Pay in FULL`
- Billing Details Form Fields:
  - First Name, Last Name
  - Phone No (Auto-formats to: `(XXX) XXX-XXXX`)
  - Billing Address: City, Country Dropdown, State Dropdown/TextField, Zip
  - Email
  - Password & Confirm Password (With visibility toggle)
- Action Button: `SUBMIT`

## Technical Logic
- **Form Submission:** Clicking the **SUBMIT** button triggers the registration logic followed by the payment gateway initialization. (Details in `02_diviner_signup_api_integration.md` and `03_diviner_signup_payment_integration.md`).
- Validate Password Regex: `/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,15}$/`
- Phone formatting string manipulation logic: `(XXX) XXX-XXXX`.

## Task Summary
1. Create directory `src/app/diviner-signup/`.
2. Create `page.tsx` and structure the Left Column content and Header.
3. Build the Forms and Data structures in the Right Column.
4. Test the client-side validations (RegEx, toggles).
