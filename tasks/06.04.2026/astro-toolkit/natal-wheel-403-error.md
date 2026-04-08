# FreeAstrologyAPI 403 Forbidden Error Documentation

- Status: Documentation (no code action)
- Notes: Reference doc — explains FreeAstrologyAPI 403 error. Resolution is operational (verify API key + IP allowlist).

## Error Observed
When calling the natal wheel API endpoint:
`api/admin/astro/natal-wheel`

The following error response is received:
```json
{
  "error": "FreeAstrologyAPI error 403: {\"message\":\"Forbidden\"}"
}
```

## Root Cause
This error is returned by the external service **FreeAstrologyAPI** (`json.freeastrologyapi.com`). An HTTP **403 Forbidden** status indicates that the server understood the request but refuses to authorize it. The specific JSON body `{"message":"Forbidden"}` is a standard response from API Gateways (like AWS) when a request is blocked before reaching the application logic, usually due to authentication issues.

In the context of this API, the error occurs during the `fetch` call to `https://json.freeastrologyapi.com/western/natal-wheel-chart`.

### Specific Technical Reasons:
1. **Invalid API Key**: The key provided in the `x-api-key` header is not recognized by FreeAstrologyAPI.
2. **Expired/Inactive Key**: The API key has been deactivated or has expired.
3. **Usage Limits Exceeded**: The account associated with the API key has reached its daily or monthly limit for requests.
4. **Restricted Endpoint**: The "Natal Wheel Chart" endpoint may be restricted to a specific paid tier that the current API key does not belong to.
5. **Missing API Key**: If the `FREEASTROLOGY_API_KEYS` environment variable is empty or improperly configured, the request is sent without an `x-api-key` header, which lead to a 403 response.

## Location in Code
The logic resides in `src/app/api/admin/astro/natal-wheel/route.ts`:
- **Keys retrieval**: `const FREE_ASTRO_KEYS = (process.env.FREEASTROLOGY_API_KEYS ?? "").split(",");`
- **Key selection**: `const apiKey = pickKey();`
- **Request execution**:
  ```typescript
  if (apiKey) headers["x-api-key"] = apiKey;
  const res = await fetch(FREE_ASTRO_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({...}),
  });
  ```

## How to Resolve
To resolve this issue, verify the configuration of the FreeAstrologyAPI keys:

### 1. Check Environment Variables
Ensure the `.env` file (or the production environment) contains a valid list of comma-separated keys:
```env
FREEASTROLOGY_API_KEYS=key1,key2,key3
```

### 2. Verify on Provider Dashboard
1. Log in to your [FreeAstrologyAPI Dashboard](https://freeastrologyapi.com/).
2. Verify that your API keys are "Active".
3. Check the **Usage Statistics** to see if you have hit a rate limit.
4. Confirm that your current subscription plan supports the `western/natal-wheel-chart` endpoint.

### 3. Debugging Tip
If multiple keys are used, one specific key might be faulty while others work (since they are picked randomly). If the error is intermittent, it confirms one or more keys in the list are invalid or capped.
