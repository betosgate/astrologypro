# Task: API Keys & Config Management (Google & Microsoft)

- Status: Completed (2026-04-09)
- Completion Notes:
  - This task was duplicated as `tasks/09.04.2026/calendar-module/
    11-api-keys-config.md` and executed there. Implementation delivered
    in commit `de8e7d5` pushed to `origin/master`:
      - Migration `20260409000117_calendar_provider_credentials` creates
        `google_api_keys` and `microsoft_api_keys` (key/value/
        description/is_active), service-role-only RLS, partial indexes
        on `lower(key)`, `moddatetime` trigger where available. Applied
        live via the Supabase Management API (HTTP 201).
      - Admin CRUD API under `/api/admin/calendar-config/{google,
        microsoft}` + `[id]` with `getAdminUser()` gate, masked values
        by default on list, raw value on explicit single-row GET.
      - Admin UI at `/admin/calendar-config` with two provider cards,
        reveal/edit/delete per row, create/edit dialog with masked
        password input, well-known keys datalist (client_id,
        client_secret, redirect_uri, tenant_id for MS), warning banner
        listing missing keys.
      - Sidebar entry "Calendar Config" added under CONFIG group.
      - Runtime wire-in: `src/lib/calendar/provider-credentials.ts`
        resolves credentials via DB → env var → default with 60s TTL
        cache. `google-calendar.ts`, `microsoft-calendar.ts`, and the
        Google webhook route now all call `getGoogleCredentials()` /
        `getMicrosoftCredentials()` at request time instead of reading
        `process.env.*` directly.
  - Runtime silently falls back to existing env vars when a key row is
    absent — no breakage at deploy time. Admins populate the tables
    from `/admin/calendar-config` to take over.

## Objective
Enable **Administrators** to manage the configurations for Google and Microsoft Calendar integrations directly from the Admin Dashboard. These configurations must be stored securely in separate Supabase database tables utilizing a key-value structure with full CRUD (Create, Read, Update, Delete) functionality.

## Requirements

### 1. Database Updates (Supabase)
- [ ] Create a specific secure table for Google credentials (e.g., `google_api_keys`).
- [ ] Create a specific secure table for Microsoft credentials (e.g., `microsoft_api_keys`).
- [ ] Both tables should follow a generic Key-Value structure (e.g., columns for `id`, `key`, `value`, `description`) to allow flexible reading and editing.
- [ ] Implement appropriate RLS (Row Level Security) policies ensuring only Super Admins can query or modify these records.

### 2. Admin UI (Dashboard -> CONFIG -> Calendar Config)
- [ ] Create the UI page component to manage these configurations.
- [ ] Implement full CRUD functionality (Create, Read, Update, Delete) for both the Google and Microsoft tables from the Admin Dashboard.
- [ ] Administrators should be able to view a list of keys, add new keys, edit existing keys/values, and delete them.
- [ ] Input fields for sensitive values (like secrets) must use masking mechanisms (e.g., `type="password"`) to prevent casual exposure.

### 3. API Routes
- [ ] Create API endpoints to handle the CRUD operations against the new `google_api_keys` table.
- [ ] Create API endpoints to handle the CRUD operations against the new `microsoft_api_keys` table.
- [ ] Enforce rigid backend authentication and authorization on these API routes to ensure strictly Admin-level access.
