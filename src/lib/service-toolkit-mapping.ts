/**
 * Service → Toolkit Mapping
 *
 * Single source of truth that links a sold service (via service_templates.slug)
 * to the admin toolkit that fulfills it:
 *   - Astrology templates → Horoscope Toolkit tab slug (the `tab` query param on
 *     /admin/horoscope — see TABS in src/app/admin/horoscope/page.tsx).
 *   - Tarot templates → Tarot Toolkit spread NAME (resolved to tarot_spreads.id
 *     at runtime via a DB lookup — see resolveTarotSpreadId).
 *
 * Rules of engagement (per product decision 2026-04-18):
 *   - Astrology: ALL 12 templates are mapped 1:1 (see ASTROLOGY_TAB_MAP).
 *   - Tarot: ONLY the 3 templates that already have a matching seeded spread
 *     are mapped. The other 4 sold tarot services intentionally return `null`
 *     — the UI MUST hide the "Open Service" link for those until the Tarot
 *     Toolkit catalogue is extended.
 *
 * This file is pure data + pure functions — safe to import from server
 * components, client components, and API routes alike.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToolkitKind = "horoscope" | "tarot";

export interface ToolkitResolution {
  kind: ToolkitKind;
  /** Horoscope tab slug (when kind === "horoscope") */
  tabSlug?: string;
  /** tarot_spreads.id (when kind === "tarot"); resolved at runtime */
  spreadId?: string;
  /** Tarot spread name we looked up by (when kind === "tarot") */
  spreadName?: string;
  /** Path the diviner should be sent to */
  sessionPath: string;
}

// ─── Astrology: template slug → horoscope tab slug (1:1) ─────────────────────
// Keys = service_templates.slug  (see migration 20260414000002)
// Values = horoscope TAB slug    (see TABS[] in /admin/horoscope/page.tsx)

export const ASTROLOGY_TAB_MAP: Record<string, string> = {
  "nativity-birth-chart": "western_horoscope_v2",
  "solar-return": "solar_return_v2",
  "weekly-transits": "tropical_transits_weekly_v2",
  "monthly-transits-lunar-return": "tropical_transits_monthly_v3",
  "romantic-relationships": "romantic_forecast_report_tropical_v2",
  "friendship-relationships": "friendship_report_tropical_v2",
  "business-relationship": "business_partner_v2",
  "predictive-event-horary": "horary_chart_v2",
  "jupiter-return": "jupiter_return_v2",
  "saturn-return": "saturn_return_v2",
  "mars-return": "mars_return_v2",
  "uranus-opposition": "uranus_return_v2",
};

/**
 * Two-person astrology services require partner birth data.
 * The booking wizard shows the partner form for these.
 */
export const TWO_PERSON_ASTROLOGY_SLUGS: ReadonlySet<string> = new Set([
  "romantic-relationships",
  "friendship-relationships",
  "business-relationship",
]);

// ─── Tarot: template slug -> tarot_spreads.name ─────────────────────────────
// The current catalogue has active spreads for every tarot service template.
// "General ..." service templates reuse the same spread as their non-general
// counterpart.

export const TAROT_SPREAD_NAME_MAP: Record<string, string> = {
  "3-card-basic-question-spread": "3 Card Basic Question Spread",
  "5-card-complex-question-spread": "5 Card Complex Question Spread",
  "7-card-6-month-forward-review": "7 Card 6 Month Forward Review",
  "7-card-horseshoe-spread-major-read": "7 Card Horseshoe Spread (Major Read)",
  "10-card-celtic-cross-major-read": "10 Card Celtic Cross (Major Read)",
  "10-card-relationship-spread": "10 Card Relationship Spread",
  "12-card-astrological-spread-major-read": "12 Card Astrological Spread (Major Read)",
  "general-3-card-basic-question-spread": "3 Card Basic Question Spread",
  "general-5-card-complex-question-spread": "5 Card Complex Question Spread",
  "general-7-card-6-month-forward-review": "7 Card 6 Month Forward Review",
  "general-7-card-horseshoe-spread-major-read": "7 Card Horseshoe Spread (Major Read)",
  "general-10-card-celtic-cross-major-read": "10 Card Celtic Cross (Major Read)",
  "general-10-card-relationship-spread": "10 Card Relationship Spread",
  "general-12-card-astrological-spread-major-read": "12 Card Astrological Spread (Major Read)",
};

// ─── Pure helpers ────────────────────────────────────────────────────────────

/**
 * Rollout gate (CLAUDE.md §8 — every release must have a feature flag where
 * applicable). When `NEXT_PUBLIC_TOOLKIT_SESSION_ENABLED` is explicitly set to
 * "false" or "0", the feature is hidden everywhere:
 *   - `getSessionLinkForBooking` returns null -> no "Open Service" buttons
 *     render in the 4 placements; no URLs are embedded in diviner emails.
 *   - `isToolkitEnabled` is also consulted by the smart router to 404 direct
 *     URL access (defense in depth — a flipped flag must stop new traffic,
 *     not just hide UI).
 * Default (flag unset or any other value) is ENABLED so existing bookings
 * keep working without operator action.
 */
export function isToolkitEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_TOOLKIT_SESSION_ENABLED;
  if (raw === "false" || raw === "0") return false;
  return true;
}

/** True iff the template has a toolkit mapping today. */
export function isToolkitMappable(
  templateSlug: string | null | undefined,
  category: string | null | undefined,
): boolean {
  if (!templateSlug || !category) return false;
  if (category === "astrology") return templateSlug in ASTROLOGY_TAB_MAP;
  if (category === "tarot") return templateSlug in TAROT_SPREAD_NAME_MAP;
  return false;
}

/** True iff the service is one of the two-person astrology services. */
export function requiresPartnerBirthData(
  templateSlug: string | null | undefined,
): boolean {
  return !!templateSlug && TWO_PERSON_ASTROLOGY_SLUGS.has(templateSlug);
}

/**
 * Returns the diviner-facing session URL for a booking, or null if the
 * service has no toolkit mapping. Callers (UI, email) use `null` as the
 * signal to hide the "Open Service" link.
 *
 * Note: this returns the standalone smart-router URL
 * `/service/session/[bookingId]` regardless of category. Admin/dashboard
 * session URLs remain as backwards-compatible aliases.
 */
export function getSessionLinkForBooking(input: {
  bookingId: string;
  templateSlug: string | null | undefined;
  category: string | null | undefined;
}): string | null {
  if (!isToolkitEnabled()) return null;
  if (!isToolkitMappable(input.templateSlug, input.category)) return null;
  return `/service/session/${input.bookingId}`;
}

/**
 * Server-side helper: given a tarot template slug, resolve it to an actual
 * tarot_spreads.id via a DB query. Returns null if no matching spread is
 * active in tarot_spreads. Used by the tarot session route.
 *
 * Takes a Supabase client so it works with both user-scoped and admin clients.
 */
export async function resolveTarotSpreadId(
  supabase: SupabaseClient,
  templateSlug: string,
): Promise<{ spreadId: string; spreadName: string } | null> {
  const spreadName = TAROT_SPREAD_NAME_MAP[templateSlug];
  if (!spreadName) return null;

  const { data } = await supabase
    .from("tarot_spreads")
    .select("id, name")
    .eq("name", spreadName)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  return { spreadId: data.id, spreadName: data.name };
}

/**
 * Resolves the full toolkit target for a booking. Used by the smart router.
 * Returns null if unmapped.
 */
export async function resolveToolkitForBooking(
  supabase: SupabaseClient,
  input: {
    bookingId: string;
    templateSlug: string;
    category: string;
    routeBasePath?: "/admin" | "/dashboard" | "/service";
  },
): Promise<ToolkitResolution | null> {
  const routeBasePath = input.routeBasePath ?? "/service";
  if (input.category === "astrology") {
    const tabSlug = ASTROLOGY_TAB_MAP[input.templateSlug];
    if (!tabSlug) return null;
    return {
      kind: "horoscope",
      tabSlug,
      sessionPath: `${routeBasePath}/horoscope/session/${input.bookingId}`,
    };
  }
  if (input.category === "tarot") {
    const resolved = await resolveTarotSpreadId(supabase, input.templateSlug);
    if (!resolved) return null;
    return {
      kind: "tarot",
      spreadId: resolved.spreadId,
      spreadName: resolved.spreadName,
      sessionPath: `${routeBasePath}/tarot/session/${input.bookingId}`,
    };
  }
  return null;
}
