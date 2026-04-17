import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse, getIpIdentifier } from "@/lib/rate-limit";
import { createHash } from "crypto";

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "cta_click",
  "cta_secondary_click",
  "lead_form_open",
  "lead_form_submit",
  "booking_initiated",
  "booking_completed",
  "booking_cancelled",
  "link_shared",
  "page_scroll_25",
  "page_scroll_50",
  "page_scroll_75",
  "page_scroll_100",
  "time_on_page_30s",
  "time_on_page_60s",
  "time_on_page_120s",
]);

// Common bot user-agent patterns to filter
const BOT_UA_RE = /bot|crawler|spider|slurp|facebookexternalhit|googlebot|bingbot|yandex|baidu|duckduckbot|semrush|ahrefs|mj12bot/i;

export async function POST(req: NextRequest) {
  // Rate limit: 100 events per IP per minute
  const ip = getIpIdentifier(req);
  const rl = await rateLimit(`lp-event:${ip}`, 100, 60_000);
  if (!rl.success) return rateLimitResponse(rl);

  // Skip bot traffic
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA_RE.test(ua)) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Invalid JSON", status: 400 }, { status: 400 });
  }

  const { diviner_id, service_template_id, service_slug, event_type, referrer, utm_source, utm_medium, utm_campaign } = body as Record<string, string>;

  // Validate required fields
  if (!diviner_id || !service_template_id || !service_slug || !event_type) {
    return NextResponse.json({ type: "about:blank", title: "Missing required fields", status: 422 }, { status: 422 });
  }

  // Validate event_type
  if (!ALLOWED_EVENT_TYPES.has(event_type)) {
    return NextResponse.json({ type: "about:blank", title: "Invalid event_type", status: 422 }, { status: 422 });
  }

  // Skip preview mode — check referrer for ?preview=true
  if (referrer && referrer.includes("preview=true")) {
    return NextResponse.json({ ok: true });
  }

  // Hash IP for PII-safe visitor fingerprint
  const salt = process.env.ANALYTICS_SALT ?? "";
  const ipHash = createHash("sha256").update(ip + salt).digest("hex").slice(0, 64);

  // Parse traffic source from referrer
  let trafficSource = "direct";
  if (referrer) {
    try {
      const ref = new URL(referrer);
      const host = ref.hostname.replace(/^www\./, "");
      if (utm_source) {
        trafficSource = utm_source === "ig" || utm_source === "instagram" ? "social"
          : utm_source === "fb" || utm_source === "facebook" ? "social"
          : utm_source === "email" ? "email"
          : "referral";
      } else if (host.includes("google") || host.includes("bing") || host.includes("yahoo") || host.includes("duckduckgo")) {
        trafficSource = "organic_search";
      } else if (host.includes("facebook") || host.includes("instagram") || host.includes("twitter") || host.includes("tiktok") || host.includes("linkedin")) {
        trafficSource = "social";
      } else if (host && host !== req.headers.get("host")) {
        trafficSource = "referral";
      }
    } catch {
      // Ignore referrer parse errors
    }
  }

  const supabase = createAdminClient();

  // Validate diviner and service_template both exist (fast lookups)
  const [{ data: divinerRow }, { data: templateRow }] = await Promise.all([
    supabase.from("diviners").select("id").eq("id", diviner_id).maybeSingle(),
    supabase.from("service_templates").select("id").eq("id", service_template_id).maybeSingle(),
  ]);

  if (!divinerRow || !templateRow) {
    // Return 200 to avoid leaking entity existence to potential spammers
    return NextResponse.json({ ok: true });
  }

  // Insert event
  await supabase.from("diviner_activity_events").insert({
    diviner_id,
    activity_type: event_type,
    event_type,
    service_template_id,
    service_slug,
    path: `/${service_slug}`,
    referrer: referrer ?? null,
    ip_hash: ipHash,
    traffic_source: trafficSource,
    referral_code: utm_campaign ?? null,
    metadata: {
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
