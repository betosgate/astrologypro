/**
 * Campaign click logging utilities.
 * Parses request headers into structured click data, detects bots,
 * checks uniqueness, and logs to campaign_clicks table.
 * All DB writes are fire-and-forget — never block redirects.
 */

import { createHash } from "crypto";
// ua-parser-js v2 exports both a namespace and a class; use require to avoid TS import confusion
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { UAParser } = require("ua-parser-js") as { UAParser: new (ua?: string) => any };
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClickLogInput {
  campaignId: string | null;
  trackingLinkId: string;
  campaignCode: string;
  divinerId: string;
  destinationType: "PROFILE" | "SERVICE";
  destinationId: string;
  resolvedUrl: string;
  request: Request;
}

export interface ParsedClickData {
  device_type: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  browser: string | null;
  os: string | null;
  country_code: string | null;
  country_region: string | null;
  city: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  anonymous_visitor_id: string | null;
  source: string | null;
  medium: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  is_bot: boolean;
}

// ── Bot detection ─────────────────────────────────────────────────────────────

const BOT_REGEX =
  /bot|crawler|spider|scraper|facebookexternalhit|facebot|linkedinbot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|applebot|pinterestbot|tumblr|redditbot|bingbot|googlebot|yandexbot|baiduspider|duckduckbot|ia_archiver|prerender/i;

export function isBot(userAgent: string): boolean {
  return BOT_REGEX.test(userAgent);
}

// ── Click data parsing ────────────────────────────────────────────────────────

/**
 * Parse request headers into structured click data.
 * Uses Vercel geo headers, ua-parser-js for device, SHA256 for IP hash.
 */
export function parseClickData(request: Request): ParsedClickData {
  const headers = request.headers;
  const userAgent = headers.get("user-agent") ?? "";
  const referrer = headers.get("referer") ?? headers.get("referrer") ?? null;

  // Parse user-agent
  const ua = new UAParser(userAgent);
  const device = ua.getDevice();
  const browser = ua.getBrowser();
  const os = ua.getOS();

  // Determine device type
  let deviceType: ParsedClickData["device_type"] = "unknown";
  if (isBot(userAgent)) {
    deviceType = "bot";
  } else if (device.type === "mobile") {
    deviceType = "mobile";
  } else if (device.type === "tablet") {
    deviceType = "tablet";
  } else if (userAgent) {
    deviceType = "desktop";
  }

  // IP hash (SHA256, PII-safe)
  const rawIp =
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const ipHash = rawIp ? createHash("sha256").update(rawIp).digest("hex") : null;

  // Anonymous visitor ID — hash of IP + UA for session-like grouping
  const anonymousVisitorId =
    rawIp && userAgent
      ? createHash("sha256")
          .update(`${rawIp}:${userAgent}`)
          .digest("hex")
          .slice(0, 16)
      : null;

  // Geo from Vercel headers
  const countryCode = headers.get("x-vercel-ip-country") ?? null;
  const countryRegion = headers.get("x-vercel-ip-country-region") ?? null;
  const city = headers.get("x-vercel-ip-city") ?? null;

  // UTM from query params
  const url = new URL(request.url);
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmContent = url.searchParams.get("utm_content");

  return {
    device_type: deviceType,
    browser: browser.name
      ? `${browser.name} ${browser.version ?? ""}`.trim()
      : null,
    os: os.name ? `${os.name} ${os.version ?? ""}`.trim() : null,
    country_code: countryCode,
    country_region: countryRegion,
    city,
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
    is_bot: deviceType === "bot",
  };
}

// ── Unique click detection ────────────────────────────────────────────────────

/**
 * Returns true if no prior click from this visitor in the past 24 hours.
 */
export async function isUniqueClick(
  supabase: SupabaseClient,
  campaignId: string,
  anonymousVisitorId: string | null
): Promise<boolean> {
  if (!anonymousVisitorId) return true;

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { count } = await supabase
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("anonymous_visitor_id", anonymousVisitorId)
    .gte("clicked_at", twentyFourHoursAgo);

  return (count ?? 0) === 0;
}

// ── Click logging ─────────────────────────────────────────────────────────────

/**
 * Insert a click record into campaign_clicks.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function logCampaignClick(
  supabase: SupabaseClient,
  input: ClickLogInput,
  clickData: ParsedClickData,
  isUnique: boolean
): Promise<void> {
  try {
    await supabase.from("campaign_clicks").insert({
      campaign_id: input.campaignId,
      tracking_link_id: input.trackingLinkId,
      campaign_code: input.campaignCode,
      diviner_id: input.divinerId,
      destination_type: input.destinationType,
      destination_id: input.destinationId,
      resolved_url: input.resolvedUrl,
      clicked_at: new Date().toISOString(),
      referrer_url: clickData.referrer_url,
      user_agent: input.request.headers.get("user-agent"),
      ip_hash: clickData.ip_hash,
      device_type: clickData.device_type,
      browser: clickData.browser,
      os: clickData.os,
      country_code: clickData.country_code,
      country_region: clickData.country_region,
      city: clickData.city,
      session_id: null,
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
    console.error("[campaign-click-logger] Failed to log click:", err);
    // Do not throw — click logging must never block the redirect
  }
}
