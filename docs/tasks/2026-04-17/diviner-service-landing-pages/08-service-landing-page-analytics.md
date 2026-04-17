# Task 08 - Service Landing Page Analytics - 2026-04-17

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 6 - Analytics
- Depends On: Tasks 01, 02, 05, 07
- Blocks: None (final task)

## Goal

Implement full per-service, per-diviner analytics for landing pages. Track views, unique visitors, CTA clicks, lead form submissions, bookings initiated, bookings completed, and conversion rates. Provide both diviner and admin analytics views.

## Current State

- `diviner_analytics.ts` exists at `src/lib/diviner-analytics.ts` — tracks general diviner activity events
- `diviner_activity_events` table exists — stores page views with attribution (organic, affiliate, etc.)
- `page-tracker.tsx` exists at `src/components/landing/page-tracker.tsx` — tracks page views on diviner landing pages
- Booking data exists in `bookings` table
- No service-level analytics breakdown exists
- No CTA click or form submission tracking exists

## Implementation Steps

### Step 1: Extend Activity Events Schema

**Migration file:** `supabase/migrations/20260417000007_service_analytics.sql`

```sql
-- Add service-level tracking columns to diviner_activity_events
ALTER TABLE diviner_activity_events
  ADD COLUMN IF NOT EXISTS service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'page_view'
    CHECK (event_type IN (
      'page_view',
      'cta_click',
      'cta_secondary_click',
      'lead_form_open',
      'lead_form_submit',
      'booking_initiated',
      'booking_completed',
      'booking_cancelled',
      'link_shared',
      'page_scroll_25',
      'page_scroll_50',
      'page_scroll_75',
      'page_scroll_100',
      'time_on_page_30s',
      'time_on_page_60s',
      'time_on_page_120s'
    ));

-- Index for service-level analytics queries
CREATE INDEX IF NOT EXISTS idx_activity_service_template
  ON diviner_activity_events(diviner_id, service_template_id, event_type, created_at DESC)
  WHERE service_template_id IS NOT NULL;

-- Index for date-range queries
CREATE INDEX IF NOT EXISTS idx_activity_date_range
  ON diviner_activity_events(diviner_id, created_at DESC, event_type);

-- Materialized view for daily aggregates (optional but recommended for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS service_landing_daily_stats AS
SELECT
  diviner_id,
  service_template_id,
  DATE(created_at) AS stat_date,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT visitor_hash) AS unique_count
FROM diviner_activity_events
WHERE service_template_id IS NOT NULL
GROUP BY diviner_id, service_template_id, DATE(created_at), event_type;

-- Index on the materialized view
CREATE UNIQUE INDEX idx_daily_stats_lookup
  ON service_landing_daily_stats(diviner_id, service_template_id, stat_date, event_type);

-- Refresh function (call via cron or on-demand)
-- Note: materialized view needs periodic refresh. Set up a Supabase Edge Function
-- or pg_cron job to refresh every hour:
-- SELECT cron.schedule('refresh_landing_stats', '0 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY service_landing_daily_stats');
```

### Step 2: Frontend Event Tracking Library

**File to create:** `src/lib/landing-page-events.ts`

```typescript
/**
 * Client-side event tracker for landing page interactions.
 * Sends events to /api/analytics/landing-page-event
 *
 * Usage in landing page components:
 *   trackLandingEvent('cta_click', { divinerId, templateId, serviceSlug })
 */

export type LandingPageEventType =
  | 'page_view'
  | 'cta_click'
  | 'cta_secondary_click'
  | 'lead_form_open'
  | 'lead_form_submit'
  | 'booking_initiated'
  | 'booking_completed'
  | 'link_shared'
  | 'page_scroll_25'
  | 'page_scroll_50'
  | 'page_scroll_75'
  | 'page_scroll_100'
  | 'time_on_page_30s'
  | 'time_on_page_60s'
  | 'time_on_page_120s';

export interface LandingPageEventPayload {
  diviner_id: string;
  service_template_id: string;
  service_slug: string;
  event_type: LandingPageEventType;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * Track a landing page event. Fire-and-forget — does not block UI.
 * Uses navigator.sendBeacon for reliability on page unload.
 */
export function trackLandingEvent(payload: LandingPageEventPayload): void {
  // Use sendBeacon or fetch with keepalive
  // POST to /api/analytics/landing-page-event
  // Include: payload + visitor fingerprint (hashed IP from server) + timestamp
}

/**
 * Track scroll depth on a landing page.
 * Uses IntersectionObserver to detect scroll milestones.
 * Fire each milestone only once per page load.
 */
export function trackScrollDepth(
  divinerId: string,
  templateId: string,
  serviceSlug: string
): () => void {
  // Returns cleanup function
  // Set up IntersectionObserver on sentinel elements at 25%, 50%, 75%, 100%
  // Fire trackLandingEvent for each milestone
}

/**
 * Track time spent on a landing page.
 * Fire events at 30s, 60s, 120s intervals.
 */
export function trackTimeOnPage(
  divinerId: string,
  templateId: string,
  serviceSlug: string
): () => void {
  // Returns cleanup function
  // Use setInterval, fire events at thresholds
  // Pause when page is hidden (visibilitychange event)
}
```

### Step 3: Analytics Event API Endpoint

**File to create:** `src/app/api/analytics/landing-page-event/route.ts`

```
POST /api/analytics/landing-page-event
- Auth: none (public endpoint — these are fired from public landing pages)
- Rate limit: 100 events per IP per minute (prevent abuse)
- Body: {
    diviner_id: "uuid",
    service_template_id: "uuid",
    service_slug: "string",
    event_type: "page_view" | "cta_click" | etc.,
    referrer: "string",
    utm_source: "string",
    utm_medium: "string",
    utm_campaign: "string"
  }
- Action:
  1. Validate diviner_id and service_template_id exist
  2. Validate event_type is in allowed list
  3. Generate visitor_hash from IP (hash, no PII stored)
  4. Insert into diviner_activity_events
  5. Do NOT track if ?preview=true was in the referrer (preview mode)
- Returns: { ok: true } (204 No Content is also acceptable)
- Performance: this endpoint must be fast (<50ms). No heavy joins.
```

### Step 4: Update Existing Page Tracker Component

**File to modify:** `src/components/landing/page-tracker.tsx`

**Current behavior:** Tracks general page views
**Required change:**
- Accept `serviceTemplateId` and `serviceSlug` props
- Include these in the tracking event
- Add scroll depth tracking
- Add time-on-page tracking

```tsx
// Updated props
interface PageTrackerProps {
  divinerId: string;
  serviceTemplateId?: string;   // NEW
  serviceSlug?: string;         // NEW
  attributionSource?: string;
}
```

### Step 5: Add CTA Click Tracking to Landing Page Components

**Files to modify:**
- `src/app/[username]/services/[slug]/page.tsx` — service detail page
- `src/app/[username]/book/[serviceSlug]/page.tsx` — booking page

Add `onClick` handlers to CTA buttons:

```
- "Book Now" button: trackLandingEvent({ event_type: 'cta_click', ... })
- "Learn More" button: trackLandingEvent({ event_type: 'cta_secondary_click', ... })
- Booking form submission: trackLandingEvent({ event_type: 'booking_initiated', ... })
- Booking confirmation: trackLandingEvent({ event_type: 'booking_completed', ... })
```

### Step 6: Diviner Analytics API

**File to create:** `src/app/api/dashboard/landing-pages/[templateId]/analytics/route.ts`

```
GET /api/dashboard/landing-pages/{templateId}/analytics
- Auth: diviner
- Query params:
  - period: '7d' | '30d' | '90d' | 'custom'
  - date_from: ISO date (for custom period)
  - date_to: ISO date (for custom period)
- Returns: {
    summary: {
      total_views: 1200,
      unique_visitors: 890,
      cta_clicks: 145,
      cta_click_rate: 12.1,        // (clicks/views * 100)
      lead_form_submissions: 45,
      bookings_initiated: 30,
      bookings_completed: 22,
      booking_conversion_rate: 1.83, // (completed/views * 100)
      avg_time_on_page: 45,         // seconds (estimated from time events)
      avg_scroll_depth: 62          // percentage
    },
    daily: [
      {
        date: "2026-04-17",
        views: 45,
        unique_visitors: 32,
        cta_clicks: 5,
        bookings_initiated: 2,
        bookings_completed: 1
      },
      ...
    ],
    traffic_sources: [
      { source: "organic_search", views: 500, percentage: 41.7 },
      { source: "direct", views: 300, percentage: 25.0 },
      { source: "social", views: 200, percentage: 16.7 },
      { source: "referral", views: 120, percentage: 10.0 },
      { source: "affiliate", views: 80, percentage: 6.7 }
    ],
    top_referrers: [
      { domain: "google.com", views: 400 },
      { domain: "instagram.com", views: 150 },
      { domain: "facebook.com", views: 50 }
    ],
    funnel: {
      views: 1200,
      cta_clicks: 145,
      bookings_initiated: 30,
      bookings_completed: 22,
      drop_off_rates: {
        view_to_click: 87.9,    // % that left without clicking
        click_to_initiate: 79.3,
        initiate_to_complete: 26.7
      }
    }
  }
```

### Step 7: Admin Analytics Overview API

**File to create:** `src/app/api/admin/analytics/landing-pages/route.ts`

```
GET /api/admin/analytics/landing-pages
- Auth: admin only
- Query params: ?period=30d&diviner_id=&template_id=&sort_by=views&sort_dir=desc
- Returns: {
    overview: {
      total_views: 45000,
      total_bookings: 850,
      total_revenue_estimate: 125000,
      avg_conversion_rate: 1.89,
      top_performing_service: "Nativity Birth Chart",
      top_performing_diviner: "luna"
    },
    by_service: [
      {
        template_id: "uuid",
        template_name: "Nativity Birth Chart",
        total_views: 8500,
        total_bookings: 180,
        active_diviners: 12,
        avg_conversion: 2.12,
        total_revenue_estimate: 31500
      },
      ...sorted by the requested field
    ],
    by_diviner: [
      {
        diviner_id: "uuid",
        diviner_name: "Luna Star",
        username: "luna",
        total_views: 3200,
        total_bookings: 65,
        enabled_services: 8,
        avg_conversion: 2.03,
        total_revenue_estimate: 9750
      },
      ...
    ]
  }
```

### Step 8: Diviner Analytics UI Page

**File to create:** `src/app/dashboard/landing-pages/[templateId]/analytics/page.tsx`

**Layout:**

```
+------------------------------------------------------------------+
| Analytics: Nativity Birth Chart                                   |
| Period: [7 days v] [30 days] [90 days] [Custom]                  |
+------------------------------------------------------------------+
|                                                                   |
| SUMMARY CARDS                                                     |
| +--------+ +--------+ +--------+ +--------+ +--------+           |
| | Views  | | Unique | | CTA    | | Book   | | Conv.  |           |
| | 1,200  | | 890    | | 145    | | 22     | | 1.83%  |           |
| | +12%   | | +8%    | | +15%   | | +5%    | | +0.2%  |           |
| +--------+ +--------+ +--------+ +--------+ +--------+           |
|                                                                   |
| VIEWS OVER TIME                                                   |
| [Line chart: daily views for selected period]                     |
| [Optional: overlay bookings on same chart]                        |
|                                                                   |
| CONVERSION FUNNEL                                                 |
| Views (1,200) → CTA Clicks (145) → Bookings Started (30) → Done (22)|
| [Visual funnel diagram with drop-off percentages]                 |
|                                                                   |
| TRAFFIC SOURCES                                                   |
| [Pie/donut chart]          | Top Referrers:                      |
| Organic: 41.7%             | 1. google.com (400)                 |
| Direct: 25.0%              | 2. instagram.com (150)              |
| Social: 16.7%              | 3. facebook.com (50)                |
| Referral: 10.0%            |                                     |
| Affiliate: 6.7%            |                                     |
|                                                                   |
| ENGAGEMENT                                                        |
| Avg. Scroll Depth: 62%     | Avg. Time on Page: 45s              |
| [Bar chart: scroll depth distribution]                            |
|                                                                   |
+------------------------------------------------------------------+
```

**Chart library:** Use an existing chart library already in the project. Check `package.json` for recharts, chart.js, or similar. If none exists, recommend `recharts` (lightweight, React-native).

### Step 9: Admin Analytics UI Page

**File to create:** `src/app/admin/analytics/landing-pages/page.tsx`

**Layout:**

```
+------------------------------------------------------------------+
| Landing Page Analytics (Admin)                                    |
| Period: [30 days v]  Diviner: [All v]  Service: [All v]          |
+------------------------------------------------------------------+
|                                                                   |
| OVERVIEW CARDS                                                    |
| +----------+ +----------+ +-----------+ +----------+             |
| | Views    | | Bookings | | Revenue   | | Avg Conv |             |
| | 45,000   | | 850      | | $125,000  | | 1.89%    |             |
| +----------+ +----------+ +-----------+ +----------+             |
|                                                                   |
| BY SERVICE (sortable table)                                       |
| Service Name          | Views | Bookings | Diviners | Conv. | Rev|
| Nativity Birth Chart  | 8,500 |    180   |    12    | 2.12% | $31k|
| 3 Card Basic Question | 6,200 |    250   |    15    | 4.03% | $8k |
| Solar Return          | 4,100 |     80   |     8    | 1.95% | $10k|
| ...                                                               |
|                                                                   |
| BY DIVINER (sortable table)                                       |
| Diviner    | Views | Bookings | Services | Conv. | Est Revenue    |
| Luna Star  | 3,200 |    65    |    8     | 2.03% | $9,750         |
| Solar Mike | 2,800 |    45    |    6     | 1.61% | $5,400         |
| ...                                                               |
|                                                                   |
+------------------------------------------------------------------+
```

### Step 10: Booking Event Integration

**How to find the booking completion handler:**
1. Search for booking-related API routes: `grep -r "booking" src/app/api/` — look for status update endpoints
2. Check `src/app/api/dashboard/bookings/` for booking CRUD
3. Check for Stripe webhook handlers that confirm payment — search for `stripe`, `webhook`, `checkout.session.completed`
4. The booking completion event should be a SERVER-SIDE insert into `diviner_activity_events`, not a client-side `sendBeacon`, because bookings are confirmed via Stripe webhooks or API calls, not by the visitor's browser.

**Add to the booking completion handler (server-side):**
```typescript
// After booking status is set to 'completed' or payment is confirmed:
await supabase.from('diviner_activity_events').insert({
  diviner_id: booking.diviner_id,
  activity_type: 'booking_completed',
  service_template_id: service.template_id,  // new column from this task's migration
  service_slug: service.slug,                // new column from this task's migration
  event_type: 'booking_completed',           // new column from this task's migration
  path: `/${diviner.username}/services/${service.slug}`,
  traffic_source: 'direct',
  created_at: new Date().toISOString(),
});
```

Similarly, add `booking_initiated` event in the booking checkout start handler (search for checkout session creation).

## Performance Considerations

1. **Materialized view:** `service_landing_daily_stats` pre-aggregates data. Refresh hourly or on-demand.
2. **Event ingestion:** The analytics endpoint must be fast. Consider:
   - Batch inserts if high traffic
   - Queue-based processing for non-critical events
3. **Dashboard queries:** Use the materialized view for dashboard stats, not raw event table
4. **Retention:** Consider archiving events older than 1 year to a separate table

## Verification Plan

1. Visit a published landing page → page_view event recorded with correct service_template_id
2. Click "Book Now" CTA → cta_click event recorded
3. Initiate booking → booking_initiated event recorded
4. Complete booking → booking_completed event recorded
5. Diviner dashboard shows correct stats for each landing page
6. Admin analytics shows correct aggregates across all diviners
7. Date range filter works correctly (7d, 30d, 90d, custom)
8. Traffic sources breakdown is accurate
9. Funnel visualization shows correct drop-off rates
10. Preview mode does NOT record analytics events
11. Rate limiting prevents event spam from single IP
12. Materialized view refreshes correctly

## Edge Cases

- High-traffic landing page (10K+ views/day): materialized view handles aggregation, raw queries would be too slow
- Diviner views their own page: should this count? Recommendation: exclude by checking if the visitor is the page owner (compare auth user to diviner user_id). Add an `is_own_view` flag.
- Bot traffic: filter common bot user-agents server-side before recording events
- Ad blockers: sendBeacon may be blocked. Accept data loss from ad-blocker users — this is standard for analytics
- Timezone handling: store all events in UTC. Convert to diviner's timezone for display.
- Zero data state: show "Start sharing your landing page to see analytics" instead of empty charts
