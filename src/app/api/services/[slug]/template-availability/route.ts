import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTemplateMatches } from "@/lib/booking/template-matched-services";
import { getBaseServiceTemplateSlug } from "@/lib/service-template-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/services/[slug]/template-availability?date=YYYY-MM-DD&submission=<uuid>
 *
 * Shared calendar date resolver for the `Book Without Choosing a Diviner`
 * flow. Given a chosen date, returns available UTC slots grouped across
 * compatible diviners. The UI selects a slot first, then chooses among the
 * diviners available at that exact time.
 *
 * Response:
 *   {
 *     template: { id, slug, name, category },
 *     slots: Array<{
 *       start: ISO,
 *       end: ISO | null,
 *       diviners: Array<...matched diviner + service + slot...>
 *     }>
 *   }
 *
 * Ranking (audit §7):
 *   1. earliestSlot ASC
 *   2. isCertified (true first)
 *   3. averageRating DESC
 *   4. completedSessions DESC
 *   5. basePrice ASC
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const submissionId = searchParams.get("submission");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const match = await resolveTemplateMatches(admin, slug);
  if (!match) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (submissionId) {
    const { data: sub } = await admin
      .from("service_template_intake_submissions")
      .select("id, template_slug")
      .eq("id", submissionId)
      .maybeSingle();
    if (!sub) {
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 404 },
      );
    }
    const storedSlug = (sub.template_slug as string | null) ?? "";
    if (getBaseServiceTemplateSlug(storedSlug) !== match.baseSlug) {
      return NextResponse.json(
        { error: "Submission does not belong to this template" },
        { status: 403 },
      );
    }
  }

  const templateInfo = {
    id: match.template.id,
    slug: match.template.slug,
    name: match.template.name,
    category: match.template.category,
  };

  /**
   * Pre-match candidate diagnostic. Lists EVERY diviner who has an
   * `services` row tied to this template, whether or not they passed
   * the upstream gates inside resolveTemplateMatches (publishing,
   * payout-ready, certification, etc.). Lets us see which diviner got
   * filtered out and why — the typical answer for "1 reader" when 2
   * are configured. Three separate queries (services / diviners /
   * diviner_services) avoid Supabase relation-hint quirks.
   */
  const { data: rawServices } = await admin
    .from("services")
    .select("id, diviner_id, is_active, base_price")
    .eq("template_id", match.template.id);

  const candidateDivinerIds = [
    ...new Set(
      (rawServices ?? [])
        .map((row) => (row as Record<string, unknown>).diviner_id as string | null)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const [{ data: rawDiviners }, { data: rawDivinerServices }] = await Promise.all([
    candidateDivinerIds.length > 0
      ? admin
          .from("diviners")
          .select(
            "id, username, display_name, is_certified, is_active, " +
              "onboarding_completed, account_status, charges_enabled, " +
              "payouts_enabled, stripe_account_id",
          )
          .in("id", candidateDivinerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    candidateDivinerIds.length > 0
      ? admin
          .from("diviner_services")
          .select("diviner_id, is_enabled, is_published")
          .eq("template_id", match.template.id)
          .in("diviner_id", candidateDivinerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const divinerById = new Map<string, Record<string, unknown>>();
  for (const d of (rawDiviners ?? []) as Array<Record<string, unknown>>) {
    divinerById.set(d.id as string, d);
  }
  const dsByDiviner = new Map<string, Record<string, unknown>>();
  for (const ds of (rawDivinerServices ?? []) as Array<Record<string, unknown>>) {
    dsByDiviner.set(ds.diviner_id as string, ds);
  }

  const matchedDivinerIds = new Set(match.diviners.map((d) => d.divinerId));
  const candidatesDiagnostic = (rawServices ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const divinerId = (r.diviner_id as string | null) ?? "";
    const div = divinerById.get(divinerId);
    const ds = dsByDiviner.get(divinerId);
    return {
      divinerId: divinerId || null,
      username: (div?.username as string | undefined) ?? null,
      reachedMatchDiviners: matchedDivinerIds.has(divinerId),
      gates: {
        serviceIsActive: r.is_active === true,
        divinerIsActive: div?.is_active === true,
        onboardingCompleted: div?.onboarding_completed === true,
        accountStatusActive: div?.account_status === "active",
        chargesEnabled: div?.charges_enabled === true,
        payoutsEnabled: div?.payouts_enabled === true,
        hasStripeAccount:
          typeof div?.stripe_account_id === "string" &&
          (div.stripe_account_id as string).length > 0,
        isCertified: div?.is_certified === true,
        divinerServicesRowExists: !!ds,
        divinerServicesEnabled: ds?.is_enabled === true,
        divinerServicesPublished: ds?.is_published === true,
      },
    };
  });

  if (match.diviners.length === 0) {
    return NextResponse.json({
      template: templateInfo,
      slots: [],
      divinersAvailable: [],
      _debug: {
        matchDivinerCount: 0,
        candidates: candidatesDiagnostic,
        perDiviner: [],
      },
    });
  }

  const origin = request.nextUrl.origin;

  /**
   * Fetch the slots a single diviner offers on `date` for the active
   * service, with a fallback for diviners whose availability template is
   * NOT scoped to this specific service.
   *
   * Why the fallback exists:
   * /api/availability/[ownerId] strictly requires `availability_templates.
   * service_id === serviceId` when a serviceId is supplied — generic
   * templates (`service_id = NULL`) are excluded. That's correct for the
   * single-diviner booking page, but on the SHARED template page it
   * silently drops every compatible diviner who configured "available for
   * any service" instead of pinning one template per service. Symptom:
   * "1 reader" for a slot where 2+ are actually free.
   *
   * Strategy: try service-scoped first (preserves intent for diviners
   * who explicitly pinned templates per-service); if that returns zero
   * slots, retry with `allSlots=1` so the generic template is honored.
   * The generic-template diviner is still gated by the earlier
   * `match.diviners` filter (template enabled + published + payout-ready), so
   * this is purely a slot-resolution fallback, not an authorization one.
   */
  type FetchPath = "scoped" | "generic" | "none";
  async function fetchDivinerSlots(d: (typeof match.diviners)[number]) {
    const duration = d.service.durationMinutes || 30;
    const buildUrl = (allSlots: boolean) => {
      const url = new URL(
        `/api/availability/${encodeURIComponent(d.divinerId)}`,
        origin,
      );
      url.searchParams.set("date", date);
      url.searchParams.set("duration", String(duration));
      if (allSlots) {
        url.searchParams.set("allSlots", "1");
      } else {
        url.searchParams.set("serviceId", d.service.id);
      }
      return url.toString();
    };

    async function fetchOnce(url: string) {
      try {
        const res = await fetch(url, {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return [] as Array<{ start: string; end: string | null }>;
        const json = (await res.json().catch(() => [])) as
          | Array<{ start?: unknown; end?: unknown }>
          | { slots?: Array<{ start?: unknown; end?: unknown }> };
        const rawSlots = Array.isArray(json)
          ? json
          : Array.isArray(json.slots)
            ? json.slots
            : [];
        return rawSlots
          .map((s) => ({
            start: typeof s.start === "string" ? s.start : "",
            end: typeof s.end === "string" ? s.end : null,
          }))
          .filter((s) => s.start.length > 0);
      } catch {
        return [] as Array<{ start: string; end: string | null }>;
      }
    }

    const scoped = await fetchOnce(buildUrl(false));
    if (scoped.length > 0) {
      return { diviner: d, slots: scoped, path: "scoped" as FetchPath };
    }

    // Retry without the serviceId filter so generic
    // (service_id = NULL) availability templates are honored too.
    const generic = await fetchOnce(buildUrl(true));
    return {
      diviner: d,
      slots: generic,
      path: (generic.length > 0 ? "generic" : "none") as FetchPath,
    };
  }

  const perDivinerResults = await Promise.all(
    match.diviners.map((d) => fetchDivinerSlots(d)),
  );

  // Diagnostic block, also surfaced on the response under `_debug` so
  // bug reports can include it without scraping server logs. Records
  // exactly what the route saw for each compatible diviner: how many
  // slots they offered and which fetch path produced them. The most
  // common reasons "1 reader" surfaces wrongly are:
  //   - match.diviners shorter than expected (gated upstream by
  //     canPubliclySellService — usually a missing Stripe payout setup)
  //   - per-diviner fetch returns 0 from both the scoped AND generic
  //     paths (no availability_templates row covering this date / window)
  //   - slot grids don't align (different slot_interval_minutes or
  //     different timezone on each diviner's template)
  const perDivinerDebug = perDivinerResults.map((r) => ({
    divinerId: r.diviner.divinerId,
    username: r.diviner.username || null,
    serviceId: r.diviner.service.id,
    durationMinutes: r.diviner.service.durationMinutes,
    slotCount: r.slots.length,
    fetchPath: r.path,
    sampleStarts: r.slots.slice(0, 3).map((s) => s.start),
  }));
  console.log(
    `[template-availability] slug=${slug} date=${date} matchDivinerCount=${match.diviners.length} perDiviner=${JSON.stringify(perDivinerDebug)}`,
  );

  const available = perDivinerResults
    .filter((r) => r.slots.length > 0)
    .map(({ diviner: d, slots }) => {
      const earliestSlot = slots.reduce(
        (min, s) => (!min || s.start < min.start ? s : min),
        null as { start: string; end: string | null } | null,
      );
      return {
        divinerId: d.divinerId,
        username: d.username,
        displayName: d.displayName,
        avatarUrl: d.avatarUrl,
        tagline: d.tagline,
        isCertified: d.isCertified,
        averageRating: d.averageRating,
        reviewCount: d.reviewCount,
        completedSessions: d.completedSessions,
        timezone: d.timezone,
        service: {
          id: d.service.id,
          slug: d.service.slug,
          name: d.service.name,
          basePrice: d.service.basePrice,
          durationMinutes: d.service.durationMinutes,
        },
        earliestSlot,
        totalSlots: slots.length,
      };
    });

  const slotGroups = new Map<
    string,
    {
      start: string;
      end: string | null;
      diviners: Array<{
        divinerId: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        tagline: string | null;
        isCertified: boolean;
        averageRating: number | null;
        reviewCount: number;
        completedSessions: number;
        timezone: string | null;
        service: {
          id: string;
          slug: string;
          name: string;
          basePrice: number;
          durationMinutes: number;
        };
        slot: { start: string; end: string | null };
      }>;
    }
  >();

  /**
   * Bucketing key. Two diviners that compute the same slot moment but
   * stamp it with different sub-minute precision (or with millisecond
   * drift from different clocks) used to land in two different Map
   * entries — that produced the "1 reader" + "1 reader" you'd see for
   * what should be one aggregated slot. Normalizing to minute precision
   * (UTC) gives us a stable key.
   *
   * The per-diviner exact `slot.start` is still preserved on the
   * `diviners[].slot` payload so the booking deeplink uses the diviner's
   * own canonical timestamp.
   */
  function bucketKey(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    // YYYY-MM-DDTHH:MM (UTC) — minute precision, no seconds/ms.
    return d.toISOString().slice(0, 16);
  }

  for (const { diviner: d, slots } of perDivinerResults) {
    for (const slot of slots) {
      const key = bucketKey(slot.start);
      const current =
        slotGroups.get(key) ??
        {
          // Display start is whichever slot landed in this bucket first;
          // since they're all the same minute, the representation only
          // matters for client-side formatting, which uses the wall-clock
          // hour/minute and ignores seconds anyway.
          start: slot.start,
          end: slot.end,
          diviners: [],
        };
      current.end = current.end ?? slot.end;
      current.diviners.push({
        divinerId: d.divinerId,
        username: d.username,
        displayName: d.displayName,
        avatarUrl: d.avatarUrl,
        tagline: d.tagline,
        isCertified: d.isCertified,
        averageRating: d.averageRating,
        reviewCount: d.reviewCount,
        completedSessions: d.completedSessions,
        timezone: d.timezone,
        service: {
          id: d.service.id,
          slug: d.service.slug,
          name: d.service.name,
          basePrice: d.service.basePrice,
          durationMinutes: d.service.durationMinutes,
        },
        slot,
      });
      slotGroups.set(key, current);
    }
  }


  const slots = [...slotGroups.values()]
    .map((slot) => {
      slot.diviners.sort((a, b) => {
        if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
        const ar = a.averageRating ?? 0;
        const br = b.averageRating ?? 0;
        if (Math.abs(br - ar) > 0.001) return br - ar;
        if (a.completedSessions !== b.completedSessions)
          return b.completedSessions - a.completedSessions;
        return a.service.basePrice - b.service.basePrice;
      });
      return slot;
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  // Keep the previous date-level list for callers that still consume it.
  available.sort((a, b) => {
    const aStart = a.earliestSlot?.start ?? "";
    const bStart = b.earliestSlot?.start ?? "";
    if (aStart !== bStart) return aStart < bStart ? -1 : 1;
    if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
    const ar = a.averageRating ?? 0;
    const br = b.averageRating ?? 0;
    if (Math.abs(br - ar) > 0.001) return br - ar;
    if (a.completedSessions !== b.completedSessions)
      return b.completedSessions - a.completedSessions;
    return a.service.basePrice - b.service.basePrice;
  });

  return NextResponse.json({
    template: templateInfo,
    slots,
    divinersAvailable: available,
    // Bug-report payload — safe to expose, no sensitive fields.
    _debug: {
      matchDivinerCount: match.diviners.length,
      candidates: candidatesDiagnostic,
      perDiviner: perDivinerDebug,
    },
  });
}
