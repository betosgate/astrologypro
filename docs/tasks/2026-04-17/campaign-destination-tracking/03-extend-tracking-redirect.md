# Task 03 - Extend /r/[code] with Rich Click Logging - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Phase: 3 - Rich Click Tracking
- Depends On: Campaign Tasks 01, 02 + Landing Page Tasks 01, 02, 03 (needs `service_templates.is_active` column from LP Task 03)
- Blocks: Tasks 04, 05

## Goal

Extend the existing `/r/[code]` tracking redirect route with rich click logging into the `campaign_clicks` table. Add unique click detection, bot filtering, device/geo enrichment, and entity-based URL resolution. Maintain backward compatibility for non-campaign tracking links.

## Current State

**File:** `src/app/r/[code]/route.ts`

Current behavior:
1. Looks up `tracking_links` by `code`
2. Increments `clicks` atomically via `increment_tracking_link_clicks()` RPC
3. Redirects to `destination_url`
4. Falls back to homepage if code not found

**Problems:**
- No per-click logging — only an atomic counter
- No device/geo/referrer capture
- No unique click detection
- No bot filtering
- No campaign-aware resolution
- Uses raw `destination_url` — breaks on slug changes

## Implementation Steps

### Step 1: Install User-Agent Parser

The codebase currently captures raw user-agent strings but has no parsing library.

```bash
npm install ua-parser-js
npm install -D @types/ua-parser-js
```

**Why ua-parser-js:** Lightweight (12KB), zero dependencies, well-maintained, supports device type / browser / OS parsing. Already a standard choice.

### Step 2: Create Click Logging Utility

**File to create:** `src/lib/campaign-click-logger.ts`

```typescript
import { createHash } from 'crypto';
import UAParser from 'ua-parser-js';

interface ClickLogInput {
  campaignId: string | null;
  trackingLinkId: string;
  campaignCode: string;
  divinerId: string;
  destinationType: 'PROFILE' | 'SERVICE';
  destinationId: string;
  resolvedUrl: string;
  request: Request;  // Next.js Request object
}

interface ParsedClickData {
  // Device
  device_type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  browser: string | null;
  os: string | null;

  // Geo (Vercel headers)
  country_code: string | null;
  country_region: string | null;
  city: string | null;

  // Identity
  ip_hash: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  anonymous_visitor_id: string | null;

  // Source
  source: string | null;
  medium: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;

  // Classification
  is_bot: boolean;
}

/**
 * Parse request headers into structured click data.
 * Uses Vercel headers for geo, ua-parser-js for device, SHA256 for IP hash.
 */
export function parseClickData(request: Request): ParsedClickData {
  const headers = request.headers;
  const userAgent = headers.get('user-agent') || '';
  const referrer = headers.get('referer') || headers.get('referrer') || null;

  // Parse user-agent
  const ua = new UAParser(userAgent);
  const device = ua.getDevice();
  const browser = ua.getBrowser();
  const os = ua.getOS();

  // Determine device type
  let deviceType: ParsedClickData['device_type'] = 'unknown';
  if (isBot(userAgent)) {
    deviceType = 'bot';
  } else if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  // IP hash
  const ip = headers.get('x-real-ip')
    || headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || null;
  const ipHash = ip
    ? createHash('sha256').update(ip).digest('hex')
    : null;

  // Anonymous visitor ID (hash of IP + user-agent for session-like grouping)
  const anonymousVisitorId = ip && userAgent
    ? createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 16)
    : null;

  // Geo from Vercel headers
  const countryCode = headers.get('x-vercel-ip-country') || null;
  const countryRegion = headers.get('x-vercel-ip-country-region') || null;
  const city = headers.get('x-vercel-ip-city') || null;

  // UTM from query params (if referer has them)
  const url = new URL(request.url);
  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  const utmCampaign = url.searchParams.get('utm_campaign');
  const utmContent = url.searchParams.get('utm_content');

  return {
    device_type: deviceType,
    browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : null,
    os: os.name ? `${os.name} ${os.version || ''}`.trim() : null,
    country_code: countryCode,
    country_region: countryRegion,
    city: city,
    ip_hash: ipHash,
    user_agent: userAgent || null,
    referrer_url: referrer,
    anonymous_visitor_id: anonymousVisitorId,
    source: utmSource,
    medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_content: utmContent,
    is_bot: deviceType === 'bot',
  };
}

/**
 * Bot detection regex.
 * Covers major bots, crawlers, and social preview scrapers.
 * Reuses the pattern from src/proxy.ts SOCIAL_BOT_UA.
 */
const BOT_REGEX = /bot|crawler|spider|scraper|facebookexternalhit|facebot|linkedinbot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|applebot|pinterestbot|tumblr|redditbot|bingbot|googlebot|yandexbot|baiduspider|duckduckbot|ia_archiver|prerender/i;

export function isBot(userAgent: string): boolean {
  return BOT_REGEX.test(userAgent);
}

/**
 * Check if this click is unique (no prior click from same visitor in 24h window).
 */
export async function isUniqueClick(
  supabase: SupabaseClient,
  campaignId: string,
  anonymousVisitorId: string
): Promise<boolean> {
  if (!anonymousVisitorId) return true; // Can't determine, count as unique

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('campaign_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('anonymous_visitor_id', anonymousVisitorId)
    .gte('clicked_at', twentyFourHoursAgo);

  return (count ?? 0) === 0;
}

/**
 * Log a click to campaign_clicks table. Fire-and-forget — errors logged, not thrown.
 */
export async function logCampaignClick(
  supabase: SupabaseClient,
  input: ClickLogInput,
  clickData: ParsedClickData,
  isUnique: boolean
): Promise<void> {
  try {
    await supabase.from('campaign_clicks').insert({
      campaign_id: input.campaignId,
      tracking_link_id: input.trackingLinkId,
      campaign_code: input.campaignCode,
      diviner_id: input.divinerId,
      destination_type: input.destinationType,
      destination_id: input.destinationId,
      resolved_url: input.resolvedUrl,
      clicked_at: new Date().toISOString(),
      referrer_url: clickData.referrer_url,
      user_agent: clickData.user_agent,
      ip_hash: clickData.ip_hash,
      device_type: clickData.device_type,
      browser: clickData.browser,
      os: clickData.os,
      country_code: clickData.country_code,
      country_region: clickData.country_region,
      city: clickData.city,
      session_id: null,  // Can be populated from cookie if needed
      anonymous_visitor_id: clickData.anonymous_visitor_id,
      source: clickData.source,
      medium: clickData.medium,
      utm_campaign: clickData.utm_campaign,
      utm_source: clickData.utm_source,
      utm_medium: clickData.utm_medium,
      utm_content: clickData.utm_content,
      is_unique_click: isUnique,
      is_bot: clickData.is_bot,
    });
  } catch (err) {
    console.error('[campaign-click-logger] Failed to log click:', err);
    // Do not throw — click logging must not block redirect
  }
}
```

### Step 3: Create Destination Resolver

**File to create:** `src/lib/campaign-destination-resolver.ts`

```typescript
/**
 * Resolve campaign destination to a URL at runtime using entity IDs.
 * Never trusts stored URLs — always resolves from current entity state.
 */
export async function resolveCampaignDestination(
  supabase: SupabaseClient,
  campaign: {
    destination_type: 'PROFILE' | 'SERVICE' | null;
    destination_profile_id: string | null;
    destination_service_template_id: string | null;
    diviner_id: string;
  }
): Promise<{ url: string; valid: boolean; reason?: string }> {

  // No destination set — fallback
  if (!campaign.destination_type) {
    const diviner = await getDivinerUsername(supabase, campaign.diviner_id);
    return {
      url: diviner ? `/${diviner.username}` : '/',
      valid: false,
      reason: 'No destination configured'
    };
  }

  // PROFILE destination
  if (campaign.destination_type === 'PROFILE') {
    const diviner = await getDivinerUsername(supabase, campaign.destination_profile_id!);
    if (!diviner || !diviner.is_active) {
      return { url: '/', valid: false, reason: 'Diviner profile not found or inactive' };
    }
    return { url: `/${diviner.username}`, valid: true };
  }

  // SERVICE destination
  if (campaign.destination_type === 'SERVICE') {
    // Get diviner username
    const diviner = await getDivinerUsername(supabase, campaign.diviner_id);
    if (!diviner || !diviner.is_active) {
      return { url: '/', valid: false, reason: 'Diviner not found or inactive' };
    }

    // Get service template slug
    const { data: template } = await supabase
      .from('service_templates')
      .select('slug, is_active')
      .eq('id', campaign.destination_service_template_id!)
      .single();

    if (!template) {
      return { url: `/${diviner.username}`, valid: false, reason: 'Service template not found' };
    }

    if (!template.is_active) {
      return { url: `/${diviner.username}`, valid: false, reason: 'Service template inactive' };
    }

    // Check diviner still has access
    const { data: ds } = await supabase
      .from('diviner_services')
      .select('is_enabled, is_published')
      .eq('diviner_id', campaign.diviner_id)
      .eq('template_id', campaign.destination_service_template_id!)
      .single();

    if (!ds || !ds.is_enabled) {
      // Fallback to profile page
      return {
        url: `/${diviner.username}`,
        valid: false,
        reason: 'Service not enabled for this diviner'
      };
    }

    if (!ds.is_published) {
      // Service enabled but not published — redirect to profile
      return {
        url: `/${diviner.username}`,
        valid: false,
        reason: 'Service landing page not published'
      };
    }

    return { url: `/${diviner.username}/services/${template.slug}`, valid: true };
  }

  return { url: '/', valid: false, reason: 'Unknown destination type' };
}

async function getDivinerUsername(supabase: SupabaseClient, divinerId: string) {
  const { data } = await supabase
    .from('diviners')
    .select('username, is_active')
    .eq('id', divinerId)
    .single();
  return data;
}
```

**Key design: entity-based resolution**
- Never uses stored `destination_url` for campaigns — always resolves from entity IDs
- Survives username changes, slug changes, service renames
- Validates access at redirect time — invalid destinations fall back to diviner profile
- Invalid fallbacks log the reason for debugging

### Step 4: Rewrite /r/[code] Route

**File to modify:** `src/app/r/[code]/route.ts`

Replace the existing simple redirect with campaign-aware rich logging:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseClickData, isBot, isUniqueClick, logCampaignClick } from '@/lib/campaign-click-logger';
import { resolveCampaignDestination } from '@/lib/campaign-destination-resolver';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const supabase = createClient();

  // 1. Rate limit check (100 per minute per IP)
  const rateLimitResult = await checkRateLimit(request, {
    windowMs: 60_000,
    max: 100,
    identifier: 'tracking-redirect'
  });
  if (rateLimitResult) return rateLimitResult;

  // 2. Look up tracking link
  const { data: link } = await supabase
    .from('tracking_links')
    .select('*')
    .eq('code', code)
    .single();

  if (!link) {
    // Code not found — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Check if link is active
  if (link.is_active === false) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Parse click data from request
  const clickData = parseClickData(request);

  // 5. Determine destination URL
  let destinationUrl: string;
  let destinationType: 'PROFILE' | 'SERVICE' = 'PROFILE';
  let destinationId: string = link.diviner_id;

  if (link.campaign_id && link.destination_type && link.destination_entity_id) {
    // Campaign-based link — resolve from entity
    const { data: campaign } = await supabase
      .from('affiliate_campaigns')
      .select('id, status, destination_type, destination_profile_id, destination_service_template_id, diviner_id, start_date, end_date')
      .eq('id', link.campaign_id)
      .single();

    if (campaign && campaign.status === 'active') {
      // Check date validity
      const now = new Date();
      const startOk = !campaign.start_date || new Date(campaign.start_date) <= now;
      const endOk = !campaign.end_date || new Date(campaign.end_date) >= now;

      if (startOk && endOk) {
        const resolved = await resolveCampaignDestination(supabase, campaign);
        destinationUrl = resolved.url;
        destinationType = campaign.destination_type || 'PROFILE';
        destinationId = campaign.destination_type === 'PROFILE'
          ? campaign.destination_profile_id || campaign.diviner_id
          : campaign.destination_service_template_id || campaign.diviner_id;
      } else {
        // Campaign outside date range — fallback to diviner profile
        const diviner = await supabase
          .from('diviners').select('username').eq('id', link.diviner_id).single();
        destinationUrl = diviner.data ? `/${diviner.data.username}` : '/';
      }
    } else {
      // Campaign not active — fallback to diviner profile
      const diviner = await supabase
        .from('diviners').select('username').eq('id', link.diviner_id).single();
      destinationUrl = diviner.data ? `/${diviner.data.username}` : '/';
    }
  } else {
    // Legacy non-campaign link — use stored destination_url
    destinationUrl = link.destination_url;
  }

  // 6. Increment atomic click counter (backward compatible)
  supabase.rpc('increment_tracking_link_clicks', { link_id: link.id });
  // Fire-and-forget, don't await

  // 7. Log rich click data (fire-and-forget for campaign links)
  if (link.campaign_id && !clickData.is_bot) {
    const unique = await isUniqueClick(supabase, link.campaign_id, clickData.anonymous_visitor_id!);

    // Update unique clicks counter on tracking_links
    if (unique) {
      supabase
        .from('tracking_links')
        .update({ unique_clicks: (link.unique_clicks || 0) + 1 })
        .eq('id', link.id);
    }

    // Log full click record
    logCampaignClick(supabase, {
      campaignId: link.campaign_id,
      trackingLinkId: link.id,
      campaignCode: code,
      divinerId: link.diviner_id,
      destinationType,
      destinationId,
      resolvedUrl: destinationUrl,
      request,
    }, clickData, unique);
  }

  // 8. Build redirect URL with UTM params if campaign has them
  const redirectUrl = new URL(destinationUrl, request.url);

  if (link.campaign_id) {
    // Append ref param for attribution continuity
    redirectUrl.searchParams.set('ref', code);

    // Append UTM from campaign if not already in URL
    if (clickData.utm_source) redirectUrl.searchParams.set('utm_source', clickData.utm_source);
    if (clickData.utm_medium) redirectUrl.searchParams.set('utm_medium', clickData.utm_medium);
    if (clickData.utm_campaign) redirectUrl.searchParams.set('utm_campaign', clickData.utm_campaign);
  }

  // 9. Redirect (307 to preserve method)
  return NextResponse.redirect(redirectUrl, 307);
}
```

### Step 5: Performance Optimization

The redirect route must be fast (<100ms). Optimization strategies:

1. **Parallel queries:** Fetch tracking_link and parse click data simultaneously
2. **Fire-and-forget logging:** Click logging and counter increment do NOT block redirect
3. **Caching:** Consider caching tracking_link lookups for active campaigns (short TTL, 60s)
4. **Bot early exit:** If bot detected, skip unique check and detailed logging

```typescript
// Bot optimization
if (clickData.is_bot) {
  // Just increment counter and redirect — no detailed logging
  supabase.rpc('increment_tracking_link_clicks', { link_id: link.id });
  return NextResponse.redirect(new URL(destinationUrl, request.url), 307);
}
```

## Verification Plan

1. Visit `/r/cmp_TESTCODE` for an active campaign → redirected to correct destination
2. Check `campaign_clicks` table → new row with all fields populated
3. Visit again within 24h → `is_unique_click = false`
4. Visit after 24h → `is_unique_click = true`
5. Visit with bot user-agent → `is_bot = true`, minimal logging
6. Visit `/r/OLDCODE` (legacy non-campaign link) → still works, uses `destination_url`
7. Visit `/r/INVALID` → redirected to homepage
8. Visit `/r/EXPIRED_CAMPAIGN` → redirected to diviner profile
9. Visit `/r/DISABLED_SERVICE_CAMPAIGN` → redirected to diviner profile (fallback)
10. Verify device_type, browser, os fields populated correctly
11. Verify country_code, city populated (on Vercel deployment)
12. Verify rate limiting: 100+ rapid requests → 429 response
13. Verify UTM params appended to redirect URL
14. Verify `ref` param appended to redirect URL
15. Verify redirect is fast (<100ms for cached links)

## Edge Cases

- Tracking link exists but campaign was deleted: `campaign_id` is SET NULL via FK, link falls back to `destination_url`
- Campaign active but service was disabled between auto-pause trigger and click: resolver catches it, falls back to profile
- Rapid duplicate clicks from same visitor: first is unique, rest are non-unique within 24h window
- IPv6 addresses: SHA256 handles any string length
- Missing Vercel headers (local dev): geo fields are null, that's fine
- Very long user-agent strings: truncated at DB column level (TEXT type, no practical limit)
- Redirect loop: impossible — destination URLs are always internal page routes, never `/r/` routes
