# AstrologyAPI Authentication Error Documentation

- Status: Documentation (no code action)
- Notes: Reference doc — explains AstrologyAPI auth error. Resolution is operational (set ASTRO_API_KEY env var).

## Error Observed
When calling the compute API endpoint:
`https://astrologypro.com/api/admin/astro/compute`

The following error response is received:
```json
{
  "error": "AstrologyAPI error 401: {\"status\":false,\"msg\":\"API authentication failed!\"}"
}
```

## Root Cause
This error is returned by the external third-party service **AstrologyAPI** (`json.astrologyapi.com`). It indicates that the **Basic Authentication** credentials provided in the request header are invalid, expired, or missing.

In the codebase, this request is handled by the `callAstrologyApi` function in `src/lib/astrology-api.ts`. The authentication header is generated using the following environment variables:

1. `ASTROLOGY_API_ACCESS_KEY` (User ID / Access Key)
2. `ASTROLOGY_API_SECRET_KEY` (API Key / Secret Key)

## How to Resolve
To fix this error, ensure that the correct credentials are set in the server environment (e.g., in the `.env` file for local development or in the Vercel/Hosting provider environment variables for production).

### Steps:
1. Log in to your [AstrologyAPI.com](https://astrologyapi.com/) dashboard.
2. Retrieve your **User ID** (Access Key) and **API Key** (Secret Key).
3. Update the following environment variables:
   ```env
   ASTROLOGY_API_ACCESS_KEY=your_user_id
   ASTROLOGY_API_SECRET_KEY=your_api_key
   ```
4. Restart the server/redeploy to apply the changes.

## Technical Context
- **Endpoint**: `https://json.astrologyapi.com/v1/*`
- **Auth Pattern**: Basic Auth (`base64(ACCESS_KEY:SECRET_KEY)`)
- **Location in Code**: `src/lib/astrology-api.ts` -> `getBasicAuthHeader()`
