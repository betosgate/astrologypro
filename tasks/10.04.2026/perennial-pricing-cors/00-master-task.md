# Perennial Pricing Route CORS Allowlist - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Allow the Divine frontend project to directly fetch the Perennial pricing API from the Astrology Pro backend by configuring precise CORS rules on the pricing route.

## Canonical Folder
- Repo path: `tasks/10.04.2026/perennial-pricing-cors`

## Why This Pack Exists
The Divine frontend currently needs pricing data from the Astrology Pro API route `GET /api/pricing/perennial_mandalism_community`. Because this route is served from a different origin, the browser blocks direct requests when the response does not include the required CORS headers. A temporary proxy is being used for testing, but the intended long-term fix is to allow only the required Divine frontend origins on this route.

## Requested Change Set
1. Add route-level CORS handling for `GET /api/pricing/perennial_mandalism_community`.
2. Allow only the required Divine frontend origins instead of using a wildcard.
3. Ensure both the actual `GET` response and the `OPTIONS` preflight response include the correct CORS headers.
4. Verify the route works from the Divine frontend origin without browser CORS failure.
5. Keep the response payload unchanged.

## Expected Allowed Origins
1. `https://www.divineinfinitebeing.com`
2. `https://divineinfinitebeing.com`
3. Add staging/dev origins only if they are actively needed.

## Execution Order
1. `01-backend-cors/01-allow-divine-origins-on-perennial-pricing-route.md`

## Done Definition
- Browser requests from the approved Divine frontend origins to `GET /api/pricing/perennial_mandalism_community` succeed without CORS errors.
- The route returns `Access-Control-Allow-Origin` for approved origins.
- The route handles `OPTIONS` cleanly when applicable.
- Disallowed origins are not broadly opened.
- The API response body remains unchanged.
