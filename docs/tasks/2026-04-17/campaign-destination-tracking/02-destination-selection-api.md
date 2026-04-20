# Task 02 - Destination Selection API + Campaign Validation - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Phase: 2 - Destination Selection API + Validation
- Depends On: Task 01, Landing Page Tasks 01-02
- Blocks: Tasks 03, 04, 05

## Goal

Build the API that returns allowed campaign destinations for a diviner (profile + enabled services). Modify existing campaign creation/update APIs to validate destination selection against `diviner_services.is_enabled`. Generate campaign codes and tracking links on creation.

## Implementation Steps

### Step 1: Destination Options API

**File to create:** `src/app/api/dashboard/campaigns/destinations/route.ts`

```
GET /api/dashboard/campaigns/destinations
- Auth: diviner (session user must own diviner record)
- Returns: {
    profile: {
      id: "diviner-uuid",
      type: "PROFILE",
      label: "My Profile Page",
      username: "debasis",
      url: "/debasis",
      display_name: "Debasis Kar",
      avatar_url: "https://..."
    },
    services: [
      {
        id: "template-uuid",
        type: "SERVICE",
        diviner_service_id: "ds-uuid",
        template_name: "Nativity Birth Chart",
        template_slug: "nativity-birth-chart",
        category: "astrology",
        url: "/debasis/services/nativity-birth-chart",
        price: 175.00,
        duration_minutes: 90,
        is_published: true,
        publish_status: "published"
      },
      {
        id: "template-uuid-2",
        type: "SERVICE",
        diviner_service_id: "ds-uuid-2",
        template_name: "3 Card Basic Question",
        template_slug: "3-card-basic-question",
        category: "tarot",
        url: "/debasis/services/3-card-basic-question",
        price: 35.00,
        duration_minutes: 20,
        is_published: true,
        publish_status: "published"
      }
    ]
  }

- Logic:
  1. Get authenticated user's diviner record
  2. Build profile destination from diviner data
  3. Query diviner_services WHERE diviner_id = X AND is_enabled = true
  4. JOIN service_templates for template name/slug/category
  5. JOIN services for diviner-specific price/duration (if exists)
  6. Build service destination list
  7. Only return services where is_enabled = true
  8. Sort services by category, then template name
```

### Step 2: Modify Campaign Creation API

**File to modify:** `src/app/api/dashboard/campaigns/route.ts`

**Current POST handler accepts:** name, description, status, start_date, end_date, commission_type, commission_value, budget_cap_cents, target_product_type, utm_source, utm_medium, utm_campaign

**Add to POST handler — new fields:**
```typescript
// New fields in request body
destination_type: 'PROFILE' | 'SERVICE'  // required for new campaigns (optional for backward compat)
destination_service_template_id: string   // required if destination_type = 'SERVICE'
channel: string                           // optional
content_variant: string                   // optional
```

**New validation logic to add BEFORE insert:**

```typescript
// 1. Validate destination_type
if (destination_type && !['PROFILE', 'SERVICE'].includes(destination_type)) {
  return NextResponse.json({ error: 'Invalid destination type' }, { status: 422 });
}

// 2. If PROFILE:
if (destination_type === 'PROFILE') {
  // Set destination_profile_id = diviner.id (auto-select current diviner)
  // Ensure destination_service_template_id is null
}

// 3. If SERVICE:
if (destination_type === 'SERVICE') {
  // a. Validate destination_service_template_id is provided
  if (!destination_service_template_id) {
    return NextResponse.json({ error: 'Service selection required' }, { status: 422 });
  }

  // b. Check service template exists and is active
  const template = await supabase
    .from('service_templates')
    .select('id, slug, is_active')
    .eq('id', destination_service_template_id)
    .single();

  if (!template.data || !template.data.is_active) {
    return NextResponse.json({ error: 'Service template not found or inactive' }, { status: 422 });
  }

  // c. Check diviner has this service enabled
  const divinerService = await supabase
    .from('diviner_services')
    .select('id, is_enabled')
    .eq('diviner_id', divinerId)
    .eq('template_id', destination_service_template_id)
    .single();

  if (!divinerService.data || !divinerService.data.is_enabled) {
    return NextResponse.json(
      { error: 'This service is not enabled for your account' },
      { status: 403 }
    );
  }

  // Set destination_diviner_service_id = divinerService.data.id
  // Set destination_profile_id = null
}

// 4. Generate campaign code
// Call generate_campaign_code() RPC or generate in code
const campaignCode = await generateCampaignCode(supabase);

// 5. Generate share URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://astrologypro.com';
const shareUrl = `${appUrl}/r/${campaignCode}`;
```

**Campaign code generation in TypeScript (backup if SQL function not used):**

```typescript
async function generateCampaignCode(supabase: SupabaseClient, maxRetries = 3): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = 'cmp_';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Check uniqueness
    const { data } = await supabase
      .from('affiliate_campaigns')
      .select('id')
      .eq('campaign_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error('Failed to generate unique campaign code after retries');
}
```

**After campaign insert — create tracking link:**

```typescript
// 6. Create tracking link
const destinationUrl = resolveDestinationUrl(diviner.username, destination_type, template?.slug);

const { data: trackingLink } = await supabase
  .from('tracking_links')
  .insert({
    diviner_id: divinerId,
    code: campaignCode,        // reuse same code for tracking link
    destination_url: destinationUrl,
    campaign_id: campaign.id,
    destination_type: destination_type,
    destination_entity_id: destination_type === 'PROFILE'
      ? divinerId
      : destination_service_template_id,
    source: utm_source || channel,
    campaign: name,
    is_active: true
  })
  .select()
  .single();

// 7. Update campaign with tracking_link_id
await supabase
  .from('affiliate_campaigns')
  .update({ tracking_link_id: trackingLink.id })
  .eq('id', campaign.id);
```

**URL resolution function:**

```typescript
function resolveDestinationUrl(
  username: string,
  destinationType: 'PROFILE' | 'SERVICE',
  serviceSlug?: string
): string {
  if (destinationType === 'PROFILE') {
    return `/${username}`;
  }
  return `/${username}/services/${serviceSlug}`;
}
```

### Step 3: Modify Campaign Update API

**File to modify:** `src/app/api/dashboard/campaigns/[id]/route.ts`

**Add to PATCH handler — destination change validation:**

```typescript
// If destination is being changed:
if (destination_type !== undefined || destination_service_template_id !== undefined) {
  // Revalidate destination access (same checks as creation)
  // If campaign is active and destination changes:
  //   - Update tracking_links destination
  //   - Log change in audit (if audit table from landing page system exists)
  // If campaign was auto-paused and diviner is changing destination:
  //   - Allow change but keep status as paused (diviner must manually activate)
  //   - Clear auto_paused_at and auto_pause_reason
}
```

**Add auto-pause status display:**

In the GET handler, when returning campaign detail, include:
```typescript
// Add to response
auto_paused: campaign.auto_paused_at !== null,
auto_pause_reason: campaign.auto_pause_reason,
can_reactivate: campaign.auto_paused_at !== null && isDestinationStillValid
```

### Step 4: Campaign Status Transition Validation

**Add to PATCH handler — status transition rules:**

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  'draft':     ['active', 'archived'],
  'active':    ['paused', 'completed'],
  'paused':    ['active', 'completed', 'archived'],
  'completed': ['archived'],
  'expired':   ['archived'],
};

// Before allowing status change:
if (newStatus) {
  // 1. Check valid transition
  if (!VALID_TRANSITIONS[campaign.status]?.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot change from ${campaign.status} to ${newStatus}` },
      { status: 422 }
    );
  }

  // 2. Cannot activate if destination service is disabled
  if (newStatus === 'active' && campaign.destination_type === 'SERVICE') {
    const ds = await supabase
      .from('diviner_services')
      .select('is_enabled')
      .eq('diviner_id', campaign.diviner_id)
      .eq('template_id', campaign.destination_service_template_id)
      .single();

    if (!ds.data?.is_enabled) {
      return NextResponse.json(
        { error: 'Cannot activate: linked service is currently disabled' },
        { status: 422 }
      );
    }
  }

  // 3. Cannot activate without destination
  if (newStatus === 'active' && !campaign.destination_type) {
    return NextResponse.json(
      { error: 'Cannot activate: no destination set. Edit the campaign to add a destination.' },
      { status: 422 }
    );
  }
}
```

### Step 5: Campaign Action Endpoints

Add convenience action endpoints (the existing API may already handle some via PATCH, but explicit action routes improve clarity):

**File to create:** `src/app/api/dashboard/campaigns/[id]/pause/route.ts`
```
POST /api/dashboard/campaigns/[id]/pause
- Auth: diviner
- Validates: campaign belongs to diviner, status is 'active'
- Sets: status = 'paused', updated_at = now()
- Returns: updated campaign
```

**File to create:** `src/app/api/dashboard/campaigns/[id]/activate/route.ts`
```
POST /api/dashboard/campaigns/[id]/activate
- Auth: diviner
- Validates:
  - campaign belongs to diviner
  - status is 'draft' or 'paused'
  - destination is set
  - if SERVICE destination: diviner_services.is_enabled = true
  - if auto-paused: clear auto_pause fields
- Sets: status = 'active', auto_paused_at = null, auto_pause_reason = null
- Returns: updated campaign
```

**File to create:** `src/app/api/dashboard/campaigns/[id]/archive/route.ts`
```
POST /api/dashboard/campaigns/[id]/archive
- Auth: diviner
- Validates: campaign belongs to diviner, status is not 'active'
- Sets: status = 'archived', tracking_links.is_active = false
- Returns: updated campaign
```

### Step 6: Admin Destination Override

**File to modify:** `src/app/api/admin/campaigns/[id]/route.ts`

Admin PATCH should also accept destination fields and apply the same validation, but with additional powers:
- Admin can set destination to any diviner's profile or service
- Admin can override auto-pause (reactivate even if service disabled — with warning)
- Admin can change `diviner_id` on a campaign (reassign)

### Step 7: Campaign Expiry Check Enhancement

**File to modify:** Both GET handlers in dashboard and admin campaign APIs

The existing auto-expiry logic (marks campaigns as expired if `end_date` passed) should also deactivate the tracking link:

```typescript
// In the existing auto-expire logic, add:
if (expiredCampaignIds.length > 0) {
  await supabase
    .from('tracking_links')
    .update({ is_active: false })
    .in('campaign_id', expiredCampaignIds);
}
```

## Validation Rules Summary

| Rule | When | Error |
|---|---|---|
| destination_type must be PROFILE or SERVICE | Create/Update | 422 |
| SERVICE requires destination_service_template_id | Create/Update | 422 |
| Service template must exist and be active | Create/Update | 422 |
| Service must be enabled for diviner | Create/Update | 403 |
| PROFILE auto-selects own diviner | Create | Auto-set |
| Cannot activate without destination | Status change | 422 |
| Cannot activate with disabled service | Status change | 422 |
| Campaign code must be unique | Create | Retry code generation |
| end_date >= start_date | Create/Update | 422 |
| Valid status transition only | Status change | 422 |

## Verification Plan

1. GET `/api/dashboard/campaigns/destinations` returns diviner's profile + only enabled services
2. Disabled services do NOT appear in destination options
3. POST campaign with PROFILE destination: creates campaign + tracking link with correct URL
4. POST campaign with SERVICE destination: validates access, creates campaign + tracking link
5. POST campaign with disabled service: returns 403
6. POST campaign with non-existent template: returns 422
7. PATCH campaign destination: validates new destination
8. Activate auto-paused campaign: validates service is re-enabled first
9. Activate campaign without destination: returns 422
10. Campaign code is `cmp_` + 8 chars format
11. Share URL is `/r/{campaign_code}`
12. Admin can override and reassign campaigns
13. Existing campaigns without destination still load and work
14. Campaign expiry deactivates tracking link

## Edge Cases

- Diviner has zero enabled services: destination options returns profile only, services array empty
- Diviner creates campaign, then loses all services: campaign auto-pauses via trigger
- Campaign code collision: retry up to 3 times, fail loudly if all collide (extremely unlikely with 62^8 space)
- Two campaigns point to same service: both are valid, each has unique code
- Campaign destination changed while active: tracking link destination_url updates, existing click records retain old destination_id for historical accuracy
- Admin creates campaign for diviner who doesn't know: campaign in draft status, diviner sees it in their dashboard
