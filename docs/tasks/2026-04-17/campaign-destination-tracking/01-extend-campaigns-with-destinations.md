# Task 01 - Extend Campaigns with Destination Columns + Campaign Clicks Table - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Phase: 1 - Data Layer
- Depends On: Landing Page Task 01 (diviner_services.is_enabled column must exist — migration `20260417000001` must run first)
- Blocks: All subsequent campaign tasks
- **MIGRATION ORDER:** This migration (`20260417000010`) MUST run AFTER Landing Page Task 01 migration (`20260417000001`) because the auto-pause trigger references `diviner_services.is_enabled`.

## Goal

Add destination selection columns to `affiliate_campaigns`. Create a `campaign_clicks` table for rich click logging. Extend `tracking_links` to support campaign-specific codes with the `cmp_` prefix format. Add auto-pause trigger when a linked service is disabled.

## Current State

### affiliate_campaigns table (from `20260413000005_affiliate_campaigns.sql`)
```sql
CREATE TABLE affiliate_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','expired')),
  start_date DATE NOT NULL,
  end_date DATE,
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed')),
  commission_value NUMERIC(10,4) DEFAULT 0,
  budget_cap_cents INTEGER,
  spent_cents INTEGER DEFAULT 0,
  target_product_type TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tracking_links table (from `20260331000001_initial_schema.sql`)
```sql
CREATE TABLE tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  source VARCHAR(50),
  campaign VARCHAR(100),
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Problems with current state:**
1. `affiliate_campaigns` has no destination concept — doesn't know WHERE the campaign points to
2. `tracking_links` stores raw `destination_url` (string) — not entity-based, breaks on slug changes
3. No per-click logging — only an atomic `clicks` counter on `tracking_links`
4. No link from `tracking_links` to `affiliate_campaigns`

## Implementation Steps

### Step 1: Create Migration File

**File:** `supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql`

### Step 2: Add Destination Columns to affiliate_campaigns

```sql
-- Destination selection
ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS destination_type TEXT
    CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  ADD COLUMN IF NOT EXISTS destination_profile_id UUID REFERENCES diviners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_diviner_service_id UUID REFERENCES diviner_services(id) ON DELETE SET NULL,

  -- Generated campaign code and URL
  ADD COLUMN IF NOT EXISTS campaign_code VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS share_url TEXT,

  -- Tracking link reference
  ADD COLUMN IF NOT EXISTS tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- Channel/source metadata
  ADD COLUMN IF NOT EXISTS channel TEXT
    CHECK (channel IN ('facebook', 'instagram', 'whatsapp', 'youtube', 'email', 'twitter', 'tiktok', 'linkedin', 'direct', 'other')),
  ADD COLUMN IF NOT EXISTS content_variant TEXT,

  -- Auto-pause tracking
  ADD COLUMN IF NOT EXISTS auto_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_pause_reason TEXT,

  -- Updated by
  ADD COLUMN IF NOT EXISTS updated_by UUID;
```

**Column definitions:**
| Column | Type | Purpose |
|---|---|---|
| destination_type | TEXT | 'PROFILE' or 'SERVICE' — what the campaign points to |
| destination_profile_id | UUID | FK to diviners — set when destination_type = 'PROFILE' |
| destination_service_template_id | UUID | FK to service_templates — set when destination_type = 'SERVICE' |
| destination_diviner_service_id | UUID | FK to diviner_services — the specific enablement record |
| campaign_code | VARCHAR(12) | Unique code like `cmp_8FK29XQ` |
| share_url | TEXT | Full shareable URL: `https://domain.com/r/cmp_8FK29XQ` |
| tracking_link_id | UUID | FK to tracking_links — the generated tracking link record |
| channel | TEXT | Distribution channel (facebook, instagram, etc.) |
| content_variant | TEXT | A/B test variant identifier |
| auto_paused_at | TIMESTAMPTZ | When auto-pause was triggered |
| auto_pause_reason | TEXT | Why auto-paused (e.g., "linked service disabled") |
| updated_by | UUID | Who last modified |

### Step 3: Add Constraints

```sql
-- Ensure destination consistency
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT chk_destination_profile
    CHECK (
      destination_type != 'PROFILE'
      OR (destination_profile_id IS NOT NULL AND destination_service_template_id IS NULL)
    ),
  ADD CONSTRAINT chk_destination_service
    CHECK (
      destination_type != 'SERVICE'
      OR (destination_service_template_id IS NOT NULL AND destination_profile_id IS NULL)
    );
```

**What these enforce:**
- PROFILE destination must have `destination_profile_id` set, `destination_service_template_id` must be NULL
- SERVICE destination must have `destination_service_template_id` set, `destination_profile_id` must be NULL

### Step 4: Create campaign_clicks Table

```sql
CREATE TABLE campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign reference
  campaign_id UUID REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  campaign_code VARCHAR(12),

  -- Diviner + destination
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  destination_id UUID NOT NULL,
  resolved_url TEXT NOT NULL,

  -- Click metadata
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer_url TEXT,
  user_agent TEXT,
  ip_hash VARCHAR(64),

  -- Device (parsed from user-agent at insert time)
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Geo (from Vercel headers)
  country_code VARCHAR(2),
  country_region VARCHAR(10),
  city VARCHAR(100),

  -- Session/visitor
  session_id VARCHAR(64),
  anonymous_visitor_id VARCHAR(64),

  -- Source tracking
  source VARCHAR(100),
  medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_content VARCHAR(100),

  -- Click classification
  is_unique_click BOOLEAN NOT NULL DEFAULT TRUE,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,

  -- Conversion readiness (populated later)
  converted BOOLEAN DEFAULT FALSE,
  conversion_id UUID REFERENCES campaign_conversions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Step 5: Add Indexes to campaign_clicks

```sql
-- Primary query: clicks for a campaign by date
CREATE INDEX idx_campaign_clicks_campaign_date
  ON campaign_clicks(campaign_id, clicked_at DESC);

-- Diviner's click overview
CREATE INDEX idx_campaign_clicks_diviner_date
  ON campaign_clicks(diviner_id, clicked_at DESC);

-- Unique click detection (visitor + campaign within time window)
CREATE INDEX idx_campaign_clicks_unique_check
  ON campaign_clicks(campaign_id, anonymous_visitor_id, clicked_at DESC)
  WHERE anonymous_visitor_id IS NOT NULL;

-- Destination analysis
CREATE INDEX idx_campaign_clicks_destination
  ON campaign_clicks(destination_type, destination_id, clicked_at DESC);

-- Campaign code lookup (for redirect route)
CREATE INDEX idx_campaign_clicks_code
  ON campaign_clicks(campaign_code, clicked_at DESC);

-- Bot filtering
CREATE INDEX idx_campaign_clicks_non_bot
  ON campaign_clicks(campaign_id, clicked_at DESC)
  WHERE is_bot = FALSE;
```

### Step 6: Extend tracking_links Table

```sql
-- Link tracking_links to campaigns
ALTER TABLE tracking_links
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES affiliate_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_type TEXT
    CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  ADD COLUMN IF NOT EXISTS destination_entity_id UUID,
  ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

**Why entity-based destination on tracking_links too:**
The existing `destination_url` stays for backward compatibility with non-campaign tracking links. The new `destination_entity_id` allows entity-based resolution for campaign links. The redirect route checks `destination_entity_id` first; if NULL, falls back to `destination_url`.

### Step 7: Add Indexes to affiliate_campaigns (destination columns)

```sql
-- Campaign code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_code
  ON affiliate_campaigns(campaign_code)
  WHERE campaign_code IS NOT NULL;

-- Destination type queries
CREATE INDEX IF NOT EXISTS idx_campaigns_destination_type
  ON affiliate_campaigns(diviner_id, destination_type, status);

-- Service destination lookup (for auto-pause trigger)
CREATE INDEX IF NOT EXISTS idx_campaigns_service_destination
  ON affiliate_campaigns(destination_service_template_id, status)
  WHERE destination_service_template_id IS NOT NULL;
```

### Step 8: RLS Policies for campaign_clicks

```sql
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;

-- Diviner can read their own clicks
CREATE POLICY campaign_clicks_diviner_read ON campaign_clicks
  FOR SELECT
  USING (
    diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );

-- Admin can read all clicks
CREATE POLICY campaign_clicks_admin_read ON campaign_clicks
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Insert allowed for service role (server-side click logging)
CREATE POLICY campaign_clicks_insert ON campaign_clicks
  FOR INSERT
  WITH CHECK (TRUE);
```

### Step 9: Campaign Code Generation Function

```sql
-- Generate unique cmp_ prefixed code
CREATE OR REPLACE FUNCTION generate_campaign_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  result TEXT := 'cmp_';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Character set:** Excludes ambiguous characters (0/O, 1/l, I) for readability.

### Step 10: Auto-Pause Trigger When Service Disabled

```sql
-- When diviner_services.is_enabled changes to false,
-- auto-pause any active campaigns pointing to that service
CREATE OR REPLACE FUNCTION auto_pause_campaigns_on_service_disable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_enabled = TRUE AND NEW.is_enabled = FALSE THEN
    UPDATE affiliate_campaigns
    SET
      status = 'paused',
      auto_paused_at = now(),
      auto_pause_reason = 'Linked service disabled by admin',
      updated_at = now()
    WHERE
      destination_service_template_id = NEW.template_id
      AND diviner_id = NEW.diviner_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_pause_campaigns
  AFTER UPDATE OF is_enabled ON diviner_services
  FOR EACH ROW
  WHEN (OLD.is_enabled = TRUE AND NEW.is_enabled = FALSE)
  EXECUTE FUNCTION auto_pause_campaigns_on_service_disable();
```

**What this does:** When admin disables a service for a diviner (Task 04 from landing page system), ALL active campaigns pointing to that service are automatically paused. The `auto_paused_at` and `auto_pause_reason` fields record why.

### Step 11: Backfill campaign_code for Existing Campaigns

```sql
-- Generate codes for existing campaigns that don't have one
UPDATE affiliate_campaigns
SET campaign_code = generate_campaign_code()
WHERE campaign_code IS NULL;

-- Note: this may generate duplicates in theory.
-- If collision occurs, re-run. The UNIQUE index prevents silent duplicates.
-- For production, use a loop with conflict retry.
```

## TypeScript Types

**File to create:** `src/types/campaign-destination.ts`

```typescript
export type CampaignDestinationType = 'PROFILE' | 'SERVICE';

export type CampaignChannel =
  | 'facebook' | 'instagram' | 'whatsapp' | 'youtube'
  | 'email' | 'twitter' | 'tiktok' | 'linkedin'
  | 'direct' | 'other';

export interface CampaignDestination {
  destination_type: CampaignDestinationType;
  destination_profile_id: string | null;
  destination_service_template_id: string | null;
  destination_diviner_service_id: string | null;
}

export interface CampaignWithDestination {
  id: string;
  diviner_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  destination_type: CampaignDestinationType | null;
  destination_profile_id: string | null;
  destination_service_template_id: string | null;
  destination_diviner_service_id: string | null;
  campaign_code: string | null;
  share_url: string | null;
  tracking_link_id: string | null;
  channel: CampaignChannel | null;
  content_variant: string | null;
  start_date: string;
  end_date: string | null;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  auto_paused_at: string | null;
  auto_pause_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignClick {
  id: string;
  campaign_id: string | null;
  tracking_link_id: string | null;
  campaign_code: string | null;
  diviner_id: string;
  destination_type: CampaignDestinationType;
  destination_id: string;
  resolved_url: string;
  clicked_at: string;
  referrer_url: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' | null;
  browser: string | null;
  os: string | null;
  country_code: string | null;
  country_region: string | null;
  city: string | null;
  session_id: string | null;
  anonymous_visitor_id: string | null;
  source: string | null;
  medium: string | null;
  is_unique_click: boolean;
  is_bot: boolean;
  converted: boolean;
  conversion_id: string | null;
  created_at: string;
}
```

## Backward Compatibility

**Critical:** All new columns are nullable or have defaults. Existing campaigns continue to work:
- `destination_type` is nullable — existing campaigns without a destination still function as affiliate campaigns
- `campaign_code` is nullable — existing campaigns keep their current behavior
- `tracking_link_id` is nullable — not required
- The existing campaign CRUD APIs, UI, and affiliate/advocate flows are UNAFFECTED

## Verification Plan

1. Run migration: `supabase migration up`
2. Verify `affiliate_campaigns` has all new columns
3. Verify `campaign_clicks` table exists with correct schema
4. Verify `tracking_links` has new columns
5. Verify constraints: try PROFILE with `destination_service_template_id` set → must fail
6. Verify constraints: try SERVICE with `destination_profile_id` set → must fail
7. Verify `generate_campaign_code()` returns `cmp_` + 8 chars
8. Verify auto-pause trigger: disable a diviner_service → linked active campaigns pause
9. Verify RLS: diviner can only read their own campaign_clicks
10. Verify existing campaigns still load in dashboard (backward compatibility)
11. Verify existing campaign CRUD APIs still work unchanged

## Rollback Plan

```sql
-- Remove new columns from affiliate_campaigns
ALTER TABLE affiliate_campaigns
  DROP COLUMN IF EXISTS destination_type,
  DROP COLUMN IF EXISTS destination_profile_id,
  DROP COLUMN IF EXISTS destination_service_template_id,
  DROP COLUMN IF EXISTS destination_diviner_service_id,
  DROP COLUMN IF EXISTS campaign_code,
  DROP COLUMN IF EXISTS share_url,
  DROP COLUMN IF EXISTS tracking_link_id,
  DROP COLUMN IF EXISTS channel,
  DROP COLUMN IF EXISTS content_variant,
  DROP COLUMN IF EXISTS auto_paused_at,
  DROP COLUMN IF EXISTS auto_pause_reason,
  DROP COLUMN IF EXISTS updated_by;

-- Remove new columns from tracking_links
ALTER TABLE tracking_links
  DROP COLUMN IF EXISTS campaign_id,
  DROP COLUMN IF EXISTS destination_type,
  DROP COLUMN IF EXISTS destination_entity_id,
  DROP COLUMN IF EXISTS unique_clicks,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS updated_at;

-- Drop new tables
DROP TABLE IF EXISTS campaign_clicks;
DROP FUNCTION IF EXISTS generate_campaign_code();
DROP FUNCTION IF EXISTS auto_pause_campaigns_on_service_disable();
```

## Edge Cases

- Existing campaigns without destination_type: continue to work as before. The UI shows "No destination set" and allows adding one via edit.
- Campaign code collision: `generate_campaign_code()` could theoretically collide. The UNIQUE index prevents silent duplicates. The API layer must catch the unique violation and retry with a new code (max 3 retries).
- Auto-pause trigger fires but campaign already paused: no-op — the WHERE clause filters `status = 'active'` only.
- Service template deleted after campaign created: `ON DELETE SET NULL` clears the FK. Campaign should be auto-paused (handle in Task 02 API layer).
