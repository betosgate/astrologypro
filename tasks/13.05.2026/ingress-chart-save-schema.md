# Ingress Chart Save Schema

## Collection / Table Name

- Current storage: Supabase PostgreSQL table
- Collection-equivalent name: `ingress_charts`
- Source migration: `supabase/migrations/20260404000011_ingress_charts.sql`
- Admin create API: `POST /api/admin/ingress-charts`
- Admin edit API: `PATCH /api/admin/ingress-charts/:id`
- Community read API: `GET /api/community/ingress-charts` and `GET /api/community/ingress-charts/:id`

Note: this project currently stores Ingress Charts in PostgreSQL via Supabase, not in a MongoDB collection. The migration says it was ported from the legacy NestJS `IngressChart` MongoDB schema.

## Database Schema

| Column | Type | Default / Constraint | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique chart id |
| `title` | `text` | `NOT NULL` | Required chart title |
| `ingress_type` | `text` | nullable | Example: `Aries Ingress`, `Cancer Ingress`, `Libra Ingress`, `Capricorn Ingress` |
| `importance` | `text` | `DEFAULT 'High Impact'` | UI commonly uses `High Impact`, `Medium Impact`, `Low Impact` |
| `short_description` | `text` | nullable | Short public/admin summary |
| `effective_time_period` | `text` | nullable | Display period, e.g. `Mar-Jun 2026` |
| `event_time_period` | `text` | nullable | Event period label, e.g. `Spring 2026` |
| `event_timestamp` | `timestamptz` | nullable | Exact ingress event timestamp |
| `validity_start` | `date` | nullable | Start date for chart validity/filtering |
| `validity_end` | `date` | nullable | End date for chart validity/filtering |
| `location_name` | `text` | nullable | Location used to cast the ingress chart |
| `location_lat` | `numeric` | nullable | Latitude |
| `location_lon` | `numeric` | nullable | Longitude. The frontend sends `location_lng`, and the API maps it into `location_lon` |
| `location_timezone` | `text` | nullable | IANA timezone such as `America/New_York` |
| `system_interpretation` | `jsonb` | nullable | Main structured interpretation content |
| `chart_data` | `jsonb` | nullable | Chart calculation data, intended for planets/houses/aspects |
| `sector_analysis` | `jsonb` | nullable | Sector-specific mundane analysis |
| `tags` | `text[]` | `DEFAULT '{}'` | Search/filter tags |
| `sector_focus` | `text[]` | `DEFAULT '{}'` | Selected mundane sectors |
| `is_social_advo` | `boolean` | `DEFAULT false` | Social advocacy flag |
| `is_published` | `boolean` | `DEFAULT false` | Published charts are visible to active community members |
| `author_name` | `text` | nullable | Author/admin display name |
| `author_email` | `text` | nullable | Author/admin email |
| `created_at` | `timestamptz` | `DEFAULT now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Update timestamp |

## Insert Payload Mapping

The create page at `src/app/admin/ingress-charts/new/page.tsx` builds this payload and sends it to `POST /api/admin/ingress-charts`:

```ts
{
  title,
  ingress_type,
  importance,
  short_description,
  event_timestamp,
  effective_time_period,
  event_time_period,
  validity_start,
  validity_end,
  location_name,
  location_lat,
  location_lng,
  location_timezone,
  sector_focus,
  tags,
  author_name,
  author_email,
  system_interpretation,
  is_published,
  is_social_advo
}
```

The API route at `src/app/api/admin/ingress-charts/route.ts` inserts into `ingress_charts` and applies these defaults/fallbacks:

- `title` is required.
- `importance` defaults to `High Impact`.
- `tags` defaults to `[]`.
- `sector_focus` defaults to `[]`.
- `is_social_advo` defaults to `false`.
- `is_published` defaults to `false`.
- `location_lng` or legacy `location_lon` is saved into the database column `location_lon`.

## JSON Field Shape

### `system_interpretation`

Current create/edit UI writes:

```json
{
  "intro": "Opening interpretation text",
  "body": ["Paragraph 1", "Paragraph 2"],
  "chartRuler": [
    {
      "icon": "Mars",
      "text": "Chart ruler interpretation"
    }
  ],
  "challengesAndStrengths": [
    {
      "type": "challenge",
      "text": "Challenge text"
    },
    {
      "type": "strength",
      "text": "Strength text"
    }
  ]
}
```

The community detail page also supports legacy fields inside `system_interpretation`:

```json
{
  "title": "Interpretation title",
  "shortDescription": "Short interpretation summary",
  "htmlContent": "<p>Legacy rich content</p>",
  "primaryChallenge": "Legacy challenge text",
  "primaryStrength": "Legacy strength text"
}
```

### `chart_data`

The migration describes this as a flexible chart object:

```json
{
  "planets": [],
  "houses": [],
  "aspects": []
}
```

### `sector_analysis`

Flexible JSON object for sector-specific interpretation. No strict runtime shape is enforced in the current API.

## Sector Values Used By Admin UI

`sector_focus` can contain these values:

- `governmentAndLeadership`
- `socialClimateAndPublicMood`
- `weatherAndAgriculture`
- `potentialConflictsAndAlliances`
- `publicHealthAndWorkforce`
- `communicationsAndTransportation`
- `justiceLawAndForeignTrade`
- `naturalDisasters`

## Access Rules

- Row Level Security is enabled on `ingress_charts`.
- Published charts can be selected by community users through the policy condition `is_published = true`.
- Admin CRUD uses the Supabase service role through `createAdminClient()`.

## Save Flow Summary

1. Admin opens `/admin/ingress-charts/new`.
2. Form state is converted into a JSON payload.
3. Frontend calls `POST /api/admin/ingress-charts`.
4. The API validates `title`.
5. The API inserts the row into `ingress_charts`.
6. Published rows are available to active community members under `/community/ingress-charts`.
