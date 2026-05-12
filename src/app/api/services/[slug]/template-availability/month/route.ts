import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTemplateMatches } from "@/lib/booking/template-matched-services";
import { getBaseServiceTemplateSlug } from "@/lib/service-template-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/services/[slug]/template-availability/month?month=YYYY-MM&submission=<uuid>
 *
 * Shared calendar month view for the `Book Without Choosing a Diviner` flow.
 * Returns the union of dates where ANY compatible + publicly-sellable diviner
 * has availability for this template.
 *
 * Response:
 *   {
 *     availableDates: string[],       // ISO YYYY-MM-DD, sorted ascending
 *     compatibleDivinerCount: number,
 *   }
 *
 * Submission param (`submission=<uuid>`) is optional at the API layer so the
 * shared calendar client can degrade safely, but page entry points should
 * treat it as required. When present we validate it belongs to the same
 * canonical template family (`general-*` and base slug are treated as one).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const submissionId = searchParams.get("submission");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month. Use YYYY-MM." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const match = await resolveTemplateMatches(admin, slug);
  if (!match) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Validate submission → template binding if passed.
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
    // Accept the raw slug or the canonical base slug — caller may pass either.
    const storedSlug = (sub.template_slug as string | null) ?? "";
    if (getBaseServiceTemplateSlug(storedSlug) !== match.baseSlug) {
      return NextResponse.json(
        { error: "Submission does not belong to this template" },
        { status: 403 },
      );
    }
  }

  if (match.diviners.length === 0) {
    return NextResponse.json({ availableDates: [], compatibleDivinerCount: 0 });
  }

  // Proxy per-diviner month availability in parallel using the existing
  // canonical endpoint. We reuse it (instead of re-implementing the
  // window/busy/override logic) so the shared view stays in lockstep with
  // per-diviner view rules.
  const origin = request.nextUrl.origin;
  const results = await Promise.all(
    match.diviners.map(async (d) => {
      const duration = d.service.durationMinutes || 30;

      async function fetchMonthDates(allSlots: boolean) {
        const url = new URL(
          `/api/availability/${encodeURIComponent(d.divinerId)}/month`,
          origin,
        );
        url.searchParams.set("month", month);
        url.searchParams.set("duration", String(duration));
        if (allSlots) {
          url.searchParams.set("allSlots", "1");
        } else {
          url.searchParams.set("serviceId", d.service.id);
        }

        try {
          const res = await fetch(url.toString(), {
            headers: { accept: "application/json" },
            // Server-to-server — no cache.
            cache: "no-store",
          });
          if (!res.ok) return [] as string[];
          const json = (await res.json().catch(() => ({}))) as {
            availableDates?: unknown;
          };
          return Array.isArray(json.availableDates)
            ? (json.availableDates as unknown[]).filter(
                (x): x is string =>
                  typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x),
              )
            : [];
        } catch {
          return [];
        }
      }

      const scoped = await fetchMonthDates(false);
      if (scoped.length > 0) return scoped;

      // Match the day-level shared availability route: if the diviner has
      // generic availability (`service_id = NULL`) instead of a schedule
      // scoped to this specific service row, still surface those dates.
      return fetchMonthDates(true);
    }),
  );

  const union = new Set<string>();
  for (const dates of results) for (const d of dates) union.add(d);
  const availableDates = [...union].sort();

  return NextResponse.json({
    availableDates,
    compatibleDivinerCount: match.diviners.length,
  });
}
