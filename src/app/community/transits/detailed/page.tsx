import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveUserBirthData } from "@/lib/community/birth-data-resolver";
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadLinkedMonthlyReport } from "@/lib/community/saved-report-link";

export const metadata = {
  title: "Detailed Monthly Transits - AstrologyPro Community",
};

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthStartDate(month: string): string {
  return `${month}-01`;
}

/**
 * Community Perennial Mandalism — full monthly transit report for a
 * selected household member.
 *
 * Spec source:
 *   tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle/
 *
 * Query params:
 *   ?familyMemberId=<uuid>   — the household member the report is for.
 *                              Defaults to the auth user's self-row.
 *   ?month=YYYY-MM           — defaults to the current month.
 *   ?regenerate=1            — bypass the saved-view branch and force
 *                              the toolkit to mount for live regeneration
 *                              even when a saved full report exists.
 *
 * Behaviour:
 *  - Auth + active PM membership required.
 *  - `familyMemberId` (when supplied) must belong to the caller's household.
 *  - Selected member's birth data is prefilled and the toolkit's birth
 *    fields are read-only.
 *  - When a saved full report is already linked to (member, month) and
 *    `regenerate=1` is NOT set, hydrate the shared toolkit from the
 *    saved astro_ai_responses row without live AI/compute calls.
 *  - Otherwise mount the toolkit for generation. On successful generation,
 *    the toolkit posts the full payload to the monthly linkage endpoint
 *    so `monthly_transits.full_report_id` is recorded atomically.
 */
export default async function CommunityTransitDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ familyMemberId?: string; month?: string; regenerate?: string }>;
}) {
  const sp = await searchParams;
  const requestedMonth =
    sp.month && MONTH_RE.test(sp.month.trim()) ? sp.month.trim() : currentMonthKey();
  const requestedFamilyMemberId =
    sp.familyMemberId && sp.familyMemberId.trim().length > 0
      ? sp.familyMemberId.trim()
      : null;
  const forceRegenerate = sp.regenerate === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!member || member.membership_type !== "perennial_mandalism") {
    redirect("/community");
  }
  if (member!.membership_status !== "active") {
    redirect("/join/community/resubscribe");
  }

  // ── Resolve the target family-member's birth data ─────────────────────
  // If a familyMemberId was supplied, validate ownership and pull that
  // row's birth data. Otherwise fall back to the existing self-resolver
  // behavior so old links keep working.
  let prefillSeed:
    | {
        fullName: string | null;
        dateOfBirth: string | null;
        birthTime: string | null;
        birthCity: string | null;
        birthCountry: string | null;
        birthLat: number | null;
        birthLng: number | null;
        birthTimezone: string | null;
      }
    | null = null;

  let targetFamilyMemberId: string | null = null;
  let memberDisplayName: string = member!.full_name ?? "Self";

  if (requestedFamilyMemberId) {
    const { data: fm } = await supabase
      .from("community_family_members")
      .select(
        "id, member_id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
      )
      .eq("id", requestedFamilyMemberId)
      .eq("member_id", member!.id)
      .maybeSingle();

    if (!fm) {
      // Either the row doesn't exist or it's not owned by this user.
      // Don't disclose which — render the generic missing-data card.
      return renderMissingMember({ requestedMonth });
    }

    targetFamilyMemberId = fm.id;
    memberDisplayName = fm.full_name ?? "Family member";
    prefillSeed = {
      fullName: fm.full_name ?? null,
      dateOfBirth: fm.date_of_birth ?? null,
      birthTime: fm.birth_time ?? null,
      birthCity: fm.birth_city ?? null,
      birthCountry: fm.birth_country ?? null,
      birthLat: typeof fm.birth_lat === "number" ? fm.birth_lat : null,
      birthLng: typeof fm.birth_lng === "number" ? fm.birth_lng : null,
      birthTimezone: null,
    };
  } else {
    const resolved = await resolveUserBirthData(user!.id, member!.id, member!.full_name);
    targetFamilyMemberId = resolved.selfFamilyMemberId ?? null;
    memberDisplayName = resolved.fullName ?? member!.full_name ?? "Self";
    prefillSeed = {
      fullName: resolved.fullName ?? null,
      dateOfBirth: resolved.dateOfBirth ?? null,
      birthTime: resolved.birthTime ?? null,
      birthCity: resolved.birthCity ?? null,
      birthCountry: resolved.birthCountry ?? null,
      birthLat: resolved.birthLat ?? null,
      birthLng: resolved.birthLng ?? null,
      birthTimezone: resolved.birthTimezone ?? null,
    };
  }

  // ── Validate required fields before mounting toolkit ──────────────────
  const missing: string[] = [];
  if (!prefillSeed.dateOfBirth) missing.push("date of birth");
  if (!prefillSeed.birthCity) missing.push("birth city");
  if (prefillSeed.birthLat == null) missing.push("birth coordinates");

  if (missing.length > 0) {
    return renderMissingMember({
      requestedMonth,
      familyMemberId: targetFamilyMemberId,
      missing,
    });
  }

  // ── Saved-view branch ─────────────────────────────────────────────────
  // If (member, month) already has a linked saved full report and the
  // user did NOT request regeneration, render directly from
  // astro_ai_responses — no live compute / AI calls.
  let savedReport: Awaited<ReturnType<typeof loadLinkedMonthlyReport>> | null = null;
  if (!forceRegenerate && targetFamilyMemberId) {
    try {
      savedReport = await loadLinkedMonthlyReport(targetFamilyMemberId, requestedMonth);
    } catch {
      savedReport = null;
    }
  }

  // ── Render saved / generate / regenerate through the shared toolkit ───
  const prefill = await buildToolkitPrefillForm({
    person1: prefillSeed,
    futureMonth: monthStartDate(requestedMonth),
  });

  return (
    <div className="space-y-4">
      <Link
        href="/community/transits"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Monthly Transits
      </Link>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Monthly Report — {memberDisplayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {savedReport && !forceRegenerate
              ? `Saved report for ${requestedMonth}.`
              : forceRegenerate
              ? `Regenerating ${requestedMonth} — the previous saved report stays available until this run completes successfully.`
              : `Generating ${requestedMonth}. The report will save automatically when the toolkit finishes.`}
            {savedReport?.created_at && !forceRegenerate ? (
              <> Generated {new Date(savedReport.created_at).toLocaleDateString()}.</>
            ) : null}
          </p>
        </div>
        {/*
          Regeneration is intentionally hidden for now.
          Keep this CTA code in place so it can be restored without
          rebuilding the action.
        */}
        {/* {savedReport && !forceRegenerate && targetFamilyMemberId ? (
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/community/transits/detailed?familyMemberId=${targetFamilyMemberId}&month=${requestedMonth}&regenerate=1`}
            >
              <RefreshCw className="mr-1.5 size-4" />
              Regenerate
            </Link>
          </Button>
        ) : null} */}
      </div>

      <HoroscopeToolkitPage
        basePath={`/community/transits/detailed?familyMemberId=${encodeURIComponent(
          targetFamilyMemberId ?? ""
        )}&month=${encodeURIComponent(requestedMonth)}`}
        apiBase="/api/community/horoscope"
        allowedSlugs={["tropical_transits_monthly_v3"]}
        initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
        initialSavedReport={
          savedReport && !forceRegenerate
            ? (savedReport as Record<string, unknown>)
            : null
        }
        autoSubmitPrefill={!savedReport || forceRegenerate}
        readOnlyBirthData={true}
        communityMonthlyFamilyMemberId={targetFamilyMemberId}
        communityMonthlyMonthKey={requestedMonth}
      />
    </div>
  );
}

function renderMissingMember({
  requestedMonth,
  familyMemberId,
  missing,
}: {
  requestedMonth: string;
  familyMemberId?: string | null;
  missing?: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/community/transits"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Monthly Transits
      </Link>
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-amber-600" />
            <h2 className="text-lg font-semibold">
              Missing birth data for this member
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We can&apos;t generate the full monthly report for {requestedMonth}{" "}
            because this household member is missing required fields
            {missing && missing.length > 0 ? (
              <> (<span className="font-medium">{missing.join(", ")}</span>)</>
            ) : null}
            .
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link
                href={
                  familyMemberId
                    ? `/community/family/${familyMemberId}/edit`
                    : "/community/family"
                }
              >
                Open member to add birth data
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/community/family">All Family Members</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
