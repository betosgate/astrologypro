# Ingress Chart Creation Logic (`admin/ingress-charts/new`)

## Overview
This document details the frontend and backend logic, database schema, and APIs involved in creating a new Ingress Chart via the `admin/ingress-charts/new` route.

## Frontend Logic (`src/app/admin/ingress-charts/new/page.tsx`)
The frontend route renders a Next.js Client Component (`"use client"`) with a React form to capture various astrological, locational, and interpretative details about a mundane astrology ingress chart.

### Components
- **Main Form**: Managed with multiple React state variables capturing Basic Info, Location, Sector Focus, Tags, Author Info, and System Interpretation.
- **TagInput**: A custom sub-component that manages the addition and removal of string-based tags array.

### Data Structure and State Management
The UI uses `useState` hooks to manage:
- **Basic Info**: `title`, `ingressType`, `importance`, `shortDescription`, timestamps (`eventTimestamp`, `effectiveTimePeriod`, `eventTimePeriod`), and validity ranges (`validityStart`, `validityEnd`).
- **Location**: `locationName`, `locationLat`, `locationLng`, `locationTimezone`.
- **Sectors & Tags**: `sectorFocus` (array), `tags` (array).
- **Author**: `authorName`, `authorEmail`.
- **System Interpretation**: `intro` (string), `bodyParagraphs` (array), `chartRulerItems` (array of objects), `challengesStrengths` (array of objects).
- **Sidebar Options**: `isPublished`, `isSocialAdvo`.

### API Invocation
On form submission (`handleSubmit`), the component constructs a JSON payload combining all the state variables and maps the interpretation blocks into a nested `system_interpretation` property. It then makes a `POST` request to the backend API:
```typescript
fetch("/api/admin/ingress-charts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
```
If successful, the user is redirected back to `/admin/ingress-charts`.

---

## Backend API Logic (`src/app/api/admin/ingress-charts/route.ts`)

### API Route
**Endpoint**: `POST /api/admin/ingress-charts`

### Logic Workflow
1. **Authentication**: Uses `getAdminUser()` to ensure the user making the request is an authorized admin. If not, returns `401 Unauthorized`.
2. **Payload Extraction**: Extracts all submitted fields from `req.json()`. Validates that the `title` property is provided (returns `400 Bad Request` if missing).
3. **Database Client**: Initializes the Supabase Admin client (`createAdminClient()`) to bypass RLS (Row Level Security) ensuring that administrative inserts succeed regardless of the current session's claims.
4. **Data Insertion**: Inserts the new record into the `ingress_charts` table. It specifically maps the frontend's `location_lng` to the database schema's `location_lon`. It also falls back to default values for specific fields (e.g., `importance` defaults to `"High Impact"` and `tags`/`sector_focus` default to empty arrays).
5. **Response**: Returns `201 Created` with the newly inserted data, or `500 Internal Server Error` if there's a database constraint or server issue.

---

## Database Configuration

### Database and Table
- **Database**: PostgreSQL (via Supabase)
- **Table Name**: `ingress_charts`
- **Total Columns**: 25 columns
- **RLS Policies**: Row Level Security is enabled on this table.
  - Community members can read records (via `SELECT`) where `is_published = true`.
  - Admins (via service role) have full bypass access for CRUD operations.

### Column Definitions
| Column Name | Data Type | Default / Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique identifier |
| `title` | `text` | `NOT NULL` | Chart title |
| `ingress_type` | `text` | | Type of ingress (e.g., 'Aries Ingress') |
| `importance` | `text` | `DEFAULT 'High Impact'` | Priority or impact level |
| `short_description` | `text` | | Brief summary |
| `effective_time_period` | `text` | | e.g. "Mar–Jun 2026" |
| `event_time_period` | `text` | | e.g. "Summer 2026" |
| `event_timestamp` | `timestamptz` | | Exact timestamp of the ingress event |
| `validity_start` | `date` | | Start date for dashboard visibility |
| `validity_end` | `date` | | End date for dashboard visibility |
| `location_name` | `text` | | City/Country name |
| `location_lat` | `numeric` | | Latitude |
| `location_lon` | `numeric` | | Longitude (API maps `location_lng` to this) |
| `location_timezone` | `text` | | Timezone identifier e.g., "America/New_York" |
| `system_interpretation` | `jsonb` | | Nested JSON for system interpretations (intro, body, rulers, challenges) |
| `chart_data` | `jsonb` | | Nested JSON for planets, houses, aspects data structure |
| `sector_analysis` | `jsonb` | | Analysis mappings for specific mundane sectors |
| `tags` | `text[]` | `DEFAULT '{}'` | Array of custom string tags |
| `sector_focus` | `text[]` | `DEFAULT '{}'` | Array of applicable sectors |
| `is_social_advo` | `boolean` | `DEFAULT false` | Social advocacy flag |
| `is_published` | `boolean` | `DEFAULT false` | Visibility flag for community viewing |
| `author_name` | `text` | | Name of the author/admin |
| `author_email` | `text` | | Email of the author/admin |
| `created_at` | `timestamptz` | `DEFAULT now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Last update timestamp |

---

## Additional Context & Data Types
- **Sectors Configuration**: Defined in the frontend as constants available for selection: 
  - "Government & Leadership"
  - "Social Climate & Public Mood"
  - "Weather & Agriculture"
  - "Potential Conflicts & Alliances"
  - "Public Health & Workforce"
  - "Communications & Transportation"
  - "Justice, Law & Foreign Trade"
  - "Natural Disasters"
- **Dynamic Array Inputs**: The frontend allows dynamic insertion and removal of body paragraphs, chart ruler items, and challenge/strength inputs. These are compiled into a singular, highly structured `system_interpretation` JSON object during payload construction, allowing for highly flexible UI representations of the astrological interpretations.

---

## Automated Generation Status
Currently, there is **no automated logic or AI integration** in the project to automatically generate an Ingress Chart by taking the "start date," "end date," "sectors," and "city." 

- The `admin/ingress-charts/new` form is **100% manual data entry**. Administrators must manually type the astrological interpretations, chart rulers, and select sectors and locations themselves.
- The platform does have a background cron job (`/api/cron/generate-astro-events`) which automatically tracks general planetary ingresses (e.g., "Mars enters Aries"), but this only populates generic mundane calendar events (`mundane_astro_events`), it does not construct comprehensive, location-based Ingress Chart reports with sectors and interpretations.
- While the platform utilizes AI (`callAI`) elsewhere (e.g., in the Horoscope Toolkit and Searched Toolkit modules), this AI capability has **not** been applied to automate the Ingress Charts generation workflow yet.
