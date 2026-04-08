# Diviner Signup API & State Management

- Status: Pending
- Completion Notes:

## Overview
Implement the external service integration and API calls needed for the Diviner Signup page form logics.

## Logic Specification

### 1. IP Location & Pricing Fetch
- Fetch user IP from `https://ipinfo.io/json?token=32b3c233366230` on load.
- Determine pricing dynamically based on IP/Country.
- Fetch actual price by calling `POST /wheel_signs/find-divination-certificate-price` with body `{ "place": "India" }` or `{ "place": "USA" }`.

### 2. State & Country Management
- Manage State dropdown dynamically based on Country selection.
- If Country == "USA", use `states.json`.
- If Country == "India", use `IndianState.json`.
- Otherwise, display a simple TextField for state.

### 3. Affiliate Check
- Read `affiliatid` from query parameters.
- Verify affiliate by calling API `user/find-affiliate-id`.

### 4. User Registration API
- On Form Submit, call `POST /user/trainee-signup`.
- Payload: All form fields + `is_diviner: 0`.
- Extract and save `results._id` as `customer_id` for payment processing steps.

## Needs / Assets
- `countries.json`, `states.json`, `IndianState.json`
- Helper script: `cookie.js`

## Task Summary
1. Implement IP detection and dynamic pricing fetch.
2. Implement Country and State dropdown logic dependencies.
3. Implement Affiliate check via query parameters.
4. Submit form data to the User Registration endpoint.
