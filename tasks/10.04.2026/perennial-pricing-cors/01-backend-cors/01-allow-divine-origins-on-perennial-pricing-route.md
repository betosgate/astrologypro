# Task 01 - Allow Divine Origins On Perennial Pricing Route

## Summary
Update the Astrology Pro API route `GET /api/pricing/perennial_mandalism_community` so the Divine frontend can call it directly from the browser.

## Problem
The route currently returns pricing JSON correctly, but browser requests from the Divine frontend fail because the response does not include the required CORS headers. As a result, the frontend had to use a temporary same-origin proxy during integration.

## Required Work
1. Identify the handler/middleware serving `GET /api/pricing/perennial_mandalism_community`.
2. Add an allowlist-based CORS check for approved Divine origins.
3. Return `Access-Control-Allow-Origin` for approved origins.
4. Return `Vary: Origin` so caching behaves correctly across origins.
5. Support `OPTIONS` for this route with the required allow headers.
6. Keep the existing JSON payload exactly as it is.

## Minimum Header Expectations
For approved origins, the route should return headers equivalent to:

```http
Access-Control-Allow-Origin: https://www.divineinfinitebeing.com
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

## Origin Allowlist
Use a narrow allowlist, not `*`.

Required production origins:
1. `https://www.divineinfinitebeing.com`
2. `https://divineinfinitebeing.com`

Only add non-production origins if specifically requested.

## Verification Steps
1. Test `GET` with an `Origin: https://www.divineinfinitebeing.com` header and confirm `Access-Control-Allow-Origin` is present.
2. Test `OPTIONS` with:
   - `Origin: https://www.divineinfinitebeing.com`
   - `Access-Control-Request-Method: GET`
3. Confirm the browser can fetch the route directly from the Divine frontend without using a proxy.
4. Confirm a non-allowed origin does not receive broad open CORS.

## Notes
- This change should be route-specific or limited to the pricing API surface.
- Do not change the response schema.
- Do not introduce wildcard CORS for all routes just to solve this one integration.
- The Divine frontend is already prepared to consume the existing pricing payload.
