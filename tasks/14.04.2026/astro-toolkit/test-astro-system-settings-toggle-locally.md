# Test Astro System Settings Toggle Locally

## Endpoint

`POST /api/admin/astro-system-settings/toggle`

## Payload

```json
{
  "secret_value": "742ab7a3fa64cbd96f790cdd1597220239a6306e"
}
```

## Before You Start

1. Make sure your local `.env` has valid Supabase values:
   `NEXT_PUBLIC_SUPABASE_URL`
   `SUPABASE_SERVICE_ROLE_KEY`
2. Start the app locally:

```bash
npm run dev
```

3. Open the app in the browser and log in as an admin user.

This API uses `getAdminUser()`, so calling it without an authenticated admin session will return `401 Unauthorized`.

## Test In Browser Session With curl

If you already have an admin session in your browser, copy the session cookie from DevTools and use:

```bash
curl -X POST "http://localhost:3000/api/admin/astro-system-settings/toggle" \
  -H "Content-Type: application/json" \
  -H "Cookie: your_cookie_here" \
  -d '{"secret_value":"742ab7a3fa64cbd96f790cdd1597220239a6306e"}'
```

## Test With Postman Or Insomnia

1. Create a `POST` request to:
   `http://localhost:3000/api/admin/astro-system-settings/toggle`
2. Set header:
   `Content-Type: application/json`
3. Add your admin auth cookie/session.
4. Use this body:

```json
{
  "secret_value": "742ab7a3fa64cbd96f790cdd1597220239a6306e"
}
```

## Expected Success Response

```json
{
  "success": true,
  "message": "Status changed to inactive",
  "data": {
    "id": "...",
    "type": "ASTROLOGY_API",
    "key_name": "...",
    "key_value": "...",
    "secret_value": "742ab7a3fa64cbd96f790cdd1597220239a6306e",
    "status": "inactive",
    "updated_at": "..."
  }
}
```

If you call it again with the same `secret_value`, it should flip back from `inactive` to `active`.

## Expected Error Cases

- `401 Unauthorized`
  You are not logged in as an admin.
- `400 secret_value is required`
  The request body is missing `secret_value`.
- `404 No astro system setting found...`
  No row matches that `secret_value`.
- `500`
  Supabase query/update failed.

## Quick Verification In Database

Check the `astro_system_settings` table for the matching row:

- first request: `active -> inactive`
- second request: `inactive -> active`

The `updated_at` field should also change on each successful toggle.
