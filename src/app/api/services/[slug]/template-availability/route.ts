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
 * flow. Given a chosen date, returns the ranked list of compatible diviners
 * who actually have at least one slot on that date, with the matched service
 * + earliest slot per diviner for handoff.
 *
 * Response:
 *   {
 *     template: { id, slug, name, category },
 *     divinersAvailable: Array<{
 *       divinerId, username, displayName, avatarUrl, tagline, isCertified,
 *       averageRating, reviewCount, completedSessions, timezone,
 *       service: { id, slug, name, basePrice, durationMinutes },
 *       earliestSlot: { start: ISO, end: ISO } | null,
 *       totalSlots: number,
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

  if (match.diviners.length === 0) {
    return NextResponse.json({ template: templateInfo, divinersAvailable: [] });
  }

  const origin = request.nextUrl.origin;
  const perDivinerResults = await Promise.all(
    match.diviners.map(async (d) => {
      const duration = d.service.durationMinutes || 30;
      const url = new URL(
        `/api/availability/${encodeURIComponent(d.divinerId)}`,
        origin,
      );
      url.searchParams.set("date", date);
      url.searchParams.set("duration", String(duration));
      url.searchParams.set("serviceId", d.service.id);
      try {
        const res = await fetch(url.toString(), {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return { diviner: d, slots: [] as string[] };
        const json = (await res.json().catch(() => ({}))) as {
          slots?: Array<{ start?: unknown; end?: unknown }>;
        };
        const slots = Array.isArray(json.slots)
          ? (json.slots as Array<{ start?: unknown }>)
              .map((s) => (typeof s.start === "string" ? s.start : ""))
              .filter((s) => s.length > 0)
          : [];
        return { diviner: d, slots };
      } catch {
        return { diviner: d, slots: [] as string[] };
      }
    }),
  );

  const available = perDivinerResults
    .filter((r) => r.slots.length > 0)
    .map(({ diviner: d, slots }) => {
      const earliestStart = slots.reduce(
        (min, s) => (min === "" || s < min ? s : min),
        "",
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
        earliestSlot: earliestStart
          ? {
              start: earliestStart,
              // end not critical for picking; let booking wizard resolve.
              end: null as string | null,
            }
          : null,
        totalSlots: slots.length,
      };
    });

  // Date-aware ranking per audit §7.
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
    divinersAvailable: available,
  });
}
