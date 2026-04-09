# Task: API Keys & Config Management (Google & Microsoft)

- Status: Pending
- Completion Notes: 

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
