# Task 05 - Campaign Destination Analytics + Admin Reporting - 2026-04-17

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 5 - Campaign Analytics
- Depends On: Tasks 01, 02, 03, 04
- Blocks: None (final task)

## Goal

Build campaign click analytics with destination performance comparison. Diviners see their own campaign analytics. Admins see platform-wide destination performance. Support profile vs service comparison, per-service breakdown, click timeline, traffic sources, device breakdown, and conversion readiness.

## Implementation Steps

### Step 1: Campaign Analytics API (Diviner)

**File to create:** `src/app/api/dashboard/campaigns/[id]/analytics/route.ts`

```
GET /api/dashboard/campaigns/[id]/analytics
- Auth: diviner (must own the campaign)
- Query params:
  - period: '7d' | '30d' | '90d' | 'all' (default: '30d')
  - date_from: ISO date (for custom period)
  - date_to: ISO date (for custom period)
- Returns: {
    campaign: {
      id, name, destination_type, destination_name, campaign_code,
      share_url, status, created_at
    },
    summary: {
      total_clicks: 450,
      unique_clicks: 320,
      bot_clicks: 15,
      human_clicks: 435,         // total - bot
      unique_rate: 71.1,          // (unique / total * 100)
      conversions: 22,            // from campaign_conversions
      conversion_rate: 6.9,       // (conversions / unique * 100)
      total_commission_cents: 8500,
      avg_clicks_per_day: 14.5
    },
    daily: [
      {
        date: "2026-04-17",
        total_clicks: 25,
        unique_clicks: 18,
        conversions: 2
      },
      ...
    ],
    by_device: [
      { device_type: "mobile", clicks: 280, percentage: 64.4 },
      { device_type: "desktop", clicks: 140, percentage: 32.2 },
      { device_type: "tablet", clicks: 15, percentage: 3.4 }
    ],
    by_country: [
      { country_code: "US", country_name: "United States", clicks: 200, percentage: 46.0 },
      { country_code: "GB", country_name: "United Kingdom", clicks: 80, percentage: 18.4 },
      { country_code: "CA", country_name: "Canada", clicks: 50, percentage: 11.5 },
      ...top 10
    ],
    by_browser: [
      { browser: "Chrome 120", clicks: 190, percentage: 43.7 },
      { browser: "Safari 17", clicks: 120, percentage: 27.6 },
      { browser: "Firefox 121", clicks: 45, percentage: 10.3 },
      ...top 10
    ],
    by_source: [
      { source: "instagram", clicks: 150, percentage: 34.5 },
      { source: "facebook", clicks: 100, percentage: 23.0 },
      { source: "direct", clicks: 85, percentage: 19.5 },
      ...
    ],
    top_referrers: [
      { domain: "instagram.com", clicks: 145 },
      { domain: "facebook.com", clicks: 98 },
      { domain: "t.co", clicks: 42 },
      ...top 10
    ],
    hourly_heatmap: [
      { hour: 0, clicks: 5 },
      { hour: 1, clicks: 3 },
      ...24 entries showing click distribution by hour of day
    ]
  }

- Query logic:
  SELECT from campaign_clicks
  WHERE campaign_id = X
    AND is_bot = FALSE (exclude bots from human metrics)
    AND clicked_at within date range
  GROUP BY various dimensions
```

### Step 2: Campaign Click List API

**File to create:** `src/app/api/dashboard/campaigns/[id]/clicks/route.ts`

```
GET /api/dashboard/campaigns/[id]/clicks
- Auth: diviner
- Query params:
  - limit: 50 (default)
  - cursor: UUID (pagination)
  - device_type: filter
  - country_code: filter
  - is_unique: boolean filter
  - is_bot: boolean filter (default: false — hide bots)
- Returns: {
    clicks: [
      {
        id: "uuid",
        clicked_at: "2026-04-17T14:30:00Z",
        device_type: "mobile",
        browser: "Chrome 120",
        os: "Android 14",
        country_code: "US",
        city: "New York",
        referrer_url: "https://instagram.com/luna",
        is_unique_click: true,
        is_bot: false,
        resolved_url: "/debasis/services/nativity-birth-chart",
        source: "instagram",
        medium: "social"
      },
      ...
    ],
    next_cursor: "uuid" | null,
    total_count: 450
  }
```

### Step 3: Diviner Campaign Summary Analytics API

**File to modify:** `src/app/api/dashboard/campaigns/reports/route.ts`

**Extend the existing reports endpoint with destination performance comparison:**

```
GET /api/dashboard/campaigns/reports
- Auth: diviner
- Query params: period (30d/90d/1y/all)
- Returns (extend existing response with):
  {
    // ... existing fields (campaigns, monthly breakdown, etc.)

    // NEW: Destination performance comparison
    destination_comparison: {
      profile: {
        campaign_count: 3,
        total_clicks: 500,
        unique_clicks: 380,
        conversions: 15,
        conversion_rate: 3.9,
        avg_clicks_per_campaign: 167
      },
      service: {
        campaign_count: 8,
        total_clicks: 1200,
        unique_clicks: 850,
        conversions: 55,
        conversion_rate: 6.5,
        avg_clicks_per_campaign: 150
      }
    },

    // NEW: Top performing services
    top_services: [
      {
        template_id: "uuid",
        template_name: "Nativity Birth Chart",
        campaign_count: 3,
        total_clicks: 450,
        unique_clicks: 320,
        conversions: 22,
        conversion_rate: 6.9
      },
      ...top 5
    ],

    // NEW: Channel performance
    channel_performance: [
      {
        channel: "instagram",
        campaign_count: 4,
        total_clicks: 600,
        unique_clicks: 420,
        conversions: 28,
        conversion_rate: 6.7
      },
      ...
    ]
  }
```

### Step 4: Admin Analytics APIs

#### Platform-Wide Destination Performance

**File to create:** `src/app/api/admin/campaigns/analytics/route.ts`

```
GET /api/admin/campaigns/analytics
- Auth: admin only
- Query params:
  - period: '30d' | '90d' | '1y' | 'all'
  - diviner_id: filter by specific diviner
  - destination_type: 'PROFILE' | 'SERVICE' | 'all'
  - template_id: filter by specific service template
- Returns: {
    overview: {
      total_campaigns: 150,
      active_campaigns: 85,
      total_clicks: 45000,
      unique_clicks: 32000,
      total_conversions: 850,
      avg_conversion_rate: 2.66,
      auto_paused_campaigns: 3
    },

    destination_comparison: {
      profile: {
        campaign_count: 45,
        total_clicks: 12000,
        unique_clicks: 8500,
        conversions: 180,
        conversion_rate: 2.12,
        top_diviner: { username: "luna", clicks: 3200 }
      },
      service: {
        campaign_count: 105,
        total_clicks: 33000,
        unique_clicks: 23500,
        conversions: 670,
        conversion_rate: 2.85,
        top_service: { name: "Nativity Birth Chart", clicks: 8500 }
      }
    },

    by_service_template: [
      {
        template_id: "uuid",
        template_name: "Nativity Birth Chart",
        category: "astrology",
        campaign_count: 25,
        diviners_using: 12,
        total_clicks: 8500,
        unique_clicks: 6200,
        conversions: 180,
        conversion_rate: 2.90
      },
      ...all service templates with campaigns, sorted by clicks desc
    ],

    by_diviner: [
      {
        diviner_id: "uuid",
        display_name: "Luna Star",
        username: "luna",
        campaign_count: 12,
        total_clicks: 5200,
        unique_clicks: 3800,
        conversions: 95,
        conversion_rate: 2.50,
        top_destination: "Nativity Birth Chart"
      },
      ...top 20 diviners
    ],

    by_channel: [
      {
        channel: "instagram",
        campaign_count: 45,
        total_clicks: 15000,
        conversions: 320,
        conversion_rate: 2.13
      },
      ...
    ],

    trend: [
      { date: "2026-04-01", clicks: 1200, conversions: 25 },
      { date: "2026-04-02", clicks: 1350, conversions: 30 },
      ...daily trend for selected period
    ]
  }
```

### Step 5: Diviner Campaign Analytics UI

**File to create:** `src/app/dashboard/campaigns/[id]/analytics/page.tsx`

**Layout:**

```
+------------------------------------------------------------------+
| Campaign Analytics: April Tarot Push                              |
| Destination: Nativity Birth Chart (Service)                       |
| Status: Active | Code: cmp_8FK29XQ                                |
| Period: [7d] [30d] [90d] [All]                                    |
+------------------------------------------------------------------+
|                                                                   |
| SUMMARY CARDS                                                     |
| +--------+ +--------+ +--------+ +--------+ +--------+           |
| | Clicks | | Unique | | Conv.  | | Conv%  | | Earned |           |
| | 450    | | 320    | | 22     | | 6.9%   | | $85.00 |           |
| | +18%   | | +12%   | | +3     | | +0.5%  | | +$15   |           |
| +--------+ +--------+ +--------+ +--------+ +--------+           |
|                                                                   |
| CLICKS OVER TIME                                                  |
| [Line chart: daily clicks + conversions overlay]                  |
|                                                                   |
| TRAFFIC BREAKDOWN                                    DEVICES      |
| [Horizontal bar chart]              [Donut chart]                 |
| Instagram: 34.5% ███████████        Mobile: 64%                  |
| Facebook:  23.0% ███████            Desktop: 32%                 |
| Direct:    19.5% ██████             Tablet: 4%                   |
| Email:     12.0% ████                                             |
| Other:     11.0% ███                                              |
|                                                                   |
| TOP COUNTRIES               TOP REFERRERS                         |
| 1. US     46%                1. instagram.com                     |
| 2. UK     18%                2. facebook.com                      |
| 3. Canada 12%                3. t.co                              |
| 4. India   8%                4. linkedin.com                      |
|                                                                   |
| HOURLY HEATMAP                                                    |
| [24-cell heatmap showing click intensity by hour]                 |
|                                                                   |
| RECENT CLICKS                              [View All Clicks →]   |
| Time       | Device  | Location  | Source  | Unique              |
| 2:30 PM    | Mobile  | New York  | IG      | Yes                 |
| 2:15 PM    | Desktop | London    | Direct  | Yes                 |
| 1:45 PM    | Mobile  | Toronto   | FB      | No (repeat)         |
| ...                                                               |
+------------------------------------------------------------------+
```

### Step 6: Campaign Reports Page Update

**File to modify:** `src/app/dashboard/campaigns/page.tsx` (reports tab)

Add destination performance comparison section:

```
+------------------------------------------------------------------+
| Campaign Reports                                                  |
| Period: [30 days v]                                               |
+------------------------------------------------------------------+
|                                                                   |
| DESTINATION PERFORMANCE COMPARISON                                |
| +---------------------------+---------------------------+         |
| | Profile Campaigns         | Service Campaigns         |         |
| | 3 campaigns               | 8 campaigns               |         |
| | 500 clicks / 380 unique   | 1,200 clicks / 850 unique |         |
| | 15 conversions             | 55 conversions             |         |
| | 3.9% conversion rate       | 6.5% conversion rate       |         |
| +---------------------------+---------------------------+         |
|                                                                   |
| → Service landing pages convert 67% better than profile pages    |
|                                                                   |
| TOP PERFORMING SERVICES                                           |
| 1. Nativity Birth Chart  | 450 clicks | 6.9% conv | 3 campaigns|
| 2. 3 Card Basic Question | 280 clicks | 9.2% conv | 2 campaigns|
| 3. Solar Return          | 180 clicks | 4.1% conv | 1 campaign |
|                                                                   |
| CHANNEL PERFORMANCE                                               |
| Channel    | Campaigns | Clicks | Conversions | Conv%             |
| Instagram  | 4         | 600    | 28          | 6.7%              |
| Facebook   | 3         | 400    | 15          | 5.2%              |
| Email      | 2         | 200    | 12          | 8.0%              |
| WhatsApp   | 2         | 150    | 8           | 7.5%              |
|                                                                   |
| [Existing monthly breakdown sections...]                          |
+------------------------------------------------------------------+
```

### Step 7: Admin Analytics UI

**File to create:** `src/app/admin/campaigns/analytics/page.tsx`

**Layout:**

```
+------------------------------------------------------------------+
| Campaign Analytics (Admin)                                        |
| Period: [30d v]  Diviner: [All v]  Destination: [All v]          |
+------------------------------------------------------------------+
|                                                                   |
| OVERVIEW                                                          |
| +----------+ +----------+ +----------+ +----------+              |
| | Campaigns| | Clicks   | | Conv.    | | Conv%    |              |
| | 150      | | 45,000   | | 850      | | 2.66%    |              |
| +----------+ +----------+ +----------+ +----------+              |
|                                                                   |
| PROFILE vs SERVICE (side-by-side comparison)                      |
| [Grouped bar chart: clicks, conversions by type]                  |
|                                                                   |
| BY SERVICE TEMPLATE (table, sortable)                             |
| Service          | Campaigns | Diviners | Clicks | Conv | Conv% |
| Natal Chart      | 25        | 12       | 8,500  | 180  | 2.90% |
| 3 Card Basic     | 20        | 15       | 6,200  | 250  | 4.03% |
| Solar Return     | 15        | 8        | 4,100  | 80   | 1.95% |
| ...                                                               |
|                                                                   |
| BY DIVINER (table, sortable)                                     |
| Diviner    | Campaigns | Clicks | Conv. | Conv% | Top Dest.     |
| Luna Star  | 12        | 5,200  | 95    | 2.50% | Natal Chart   |
| Solar Mike | 8         | 3,800  | 68    | 2.31% | Solar Return  |
| ...                                                               |
|                                                                   |
| TREND (line chart: daily clicks + conversions)                    |
| [Chart spanning selected period]                                  |
|                                                                   |
| AUTO-PAUSED CAMPAIGNS (3)                                         |
| Campaign      | Diviner  | Reason                 | Paused At    |
| Spring Tarot  | luna     | Service disabled       | Apr 15       |
| ...                                                               |
+------------------------------------------------------------------+
```

### Step 8: Chart Library Integration

Check `package.json` for existing chart library. If none exists:

```bash
npm install recharts
```

**Chart components needed:**
- Line chart: clicks over time (daily)
- Donut chart: device type breakdown
- Horizontal bar chart: source/channel breakdown
- Grouped bar chart: profile vs service comparison
- Heatmap: hourly click distribution (24 cells)

**All charts must:**
- Be responsive (resize on window change)
- Show tooltips on hover
- Support empty state ("No data for this period")
- Use consistent color palette from design system

### Step 9: Add Navigation Links

**Admin navigation:** Add "Campaign Analytics" as a sub-item under "Campaigns" in admin sidebar.

**Diviner campaign detail:** Add "Analytics" tab/button to each campaign card in the list.

## Query Performance Notes

1. **campaign_clicks table will grow fast.** Use the indexes created in Task 01.
2. **Aggregate queries:** For summary stats, consider:
   - Caching results for 5 minutes (ISR or in-memory)
   - Using COUNT DISTINCT with `anonymous_visitor_id` for unique counts
   - Limiting date ranges to prevent full-table scans
3. **Admin analytics:** Add `LIMIT` to all group-by queries (top 20 diviners, top 10 countries, etc.)
4. **Materialized view (optional):** If campaign_clicks exceeds 1M rows, create a daily aggregate materialized view similar to the one in landing page analytics Task 08.

## Verification Plan

1. Campaign with 50+ clicks → all analytics cards show correct numbers
2. Period filter changes data correctly (7d vs 30d vs 90d)
3. Device breakdown matches actual click data
4. Country breakdown matches geo data from clicks
5. Source/channel breakdown matches campaign channel settings
6. Line chart shows daily trend with correct data points
7. Click list shows recent clicks with correct detail
8. Click list pagination works
9. Click list filters work (device, country, unique-only)
10. Diviner reports show destination comparison (profile vs service)
11. Admin analytics shows platform-wide data
12. Admin can filter by diviner, destination type, service template
13. Auto-paused campaigns section shows in admin view
14. Empty state shown when no clicks exist
15. Bot clicks excluded from human metrics but visible in "total with bots" count

## Edge Cases

- Campaign with zero clicks: show "No clicks yet. Share your campaign URL to start tracking." with the URL and copy button
- Campaign with only bot clicks: show "X bot clicks detected, no human traffic yet"
- Very high click volume (1K+ in a day): charts scale correctly, numbers use K/M suffixes
- Campaign created today: "7d" period still works, shows partial data
- Admin views campaign from deactivated diviner: still shows historical data
- Multiple campaigns point to same service: each campaign has its own analytics, admin service-level view aggregates across campaigns
- Timezone: all dates displayed in diviner's timezone (from `diviners.timezone` field), stored in UTC
