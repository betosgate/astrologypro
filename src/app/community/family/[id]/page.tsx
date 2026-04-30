import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  Info,
  Mail,
  Star,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/community/progress-ring";

import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { deriveNatalReportState } from "@/lib/community/chart-report-state";
import { loadLinkedNatalReport } from "@/lib/community/saved-report-link";
import { formatBirthPlace } from "@/lib/community/birth-location";
import { calcFamilyProfileCompletion } from "@/lib/community/family-profile-completion";

import { FamilyMemberActions } from "./_family-member-actions";

/**
 * Community family-member natal chart route.
 *
 * Renders the shared admin Horoscope Toolkit restricted to the Nativity
 * Birth Chart tab (`western_horoscope_v2`), prefilled from the
 * selected family member's saved birth fields.
 *
 * Pattern mirrors `src/app/community/charts/detailed/page.tsx`:
 *  1. server-side auth via the Next Supabase client,
 *  2. membership gate on `community_members`,
 *  3. ownership-scoped read on `community_family_members` (query-level
 *     enforcement — `.eq("member_id", member.id).eq("id", id)` — so
 *     this route never leaks another account's family member even
 *     though the read uses the admin client),
 *  4. `buildToolkitPrefillForm` → `HoroscopeToolkitPage`.
 *
 * The previous bespoke client implementation (NatalWheel + Ascendant/MC
 * cards + Planet Placements grid, plus its own fetch-loop loading
 * lifecycle) is preserved as `./_legacy-family-member-page.tsx` per the
 * master task directive. See the JSX comment at the toolkit render site.
 */

export const metadata = {
  title: "Family Member Natal Chart - AstrologyPro Community",
};

export const dynamic = "force-dynamic";

const NATAL_TAB_SLUG = "western_horoscope_v2";

interface PageProps {
  params: Promise<{ id: string }>;
}

type FamilyMemberRow = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
  relationship: string | null;
  age_group: "child" | "adult" | string | null;
  natal_chart: Record<string, unknown> | null;
  natal_status: string | null;
  natal_report_id: string | null;
  natal_report_status: string | null;
  chart_updated_at: string | null;
  notes: string | null;
  invite_email: string | null;
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
  user_id: string | null;
};

export default async function CommunityFamilyMemberPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Membership gate.
  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) redirect("/community");
  if (member.membership_type !== "perennial_mandalism") redirect("/community");
  if (member.membership_status !== "active") {
    redirect("/join/community/resubscribe");
  }

  // Ownership-scoped read. Using the admin client to bypass RLS but
  // constraining BOTH by `member_id` and `id` so we only ever return the
  // row if it belongs to this member. A forged `id` from another
  // account's URL will simply return null and 404 here.
  const admin = createAdminClient();
  const { data: familyRow } = await admin
    .from("community_family_members")
    .select(
      [
        "id",
        "full_name",
        "date_of_birth",
        "birth_time",
        "birth_city",
        "birth_country",
        "birth_lat",
        "birth_lng",
        "relationship",
        "age_group",
        "natal_chart",
        "natal_status",
        "natal_report_id",
        "natal_report_status",
        "chart_updated_at",
        "notes",
        "invite_email",
        "invite_sent_at",
        "invite_accepted_at",
        "user_id",
      ].join(", "),
    )
    .eq("member_id", member.id)
    .eq("id", id)
    .maybeSingle();

  if (!familyRow) {
    notFound();
  }

  const familyMember = familyRow as unknown as FamilyMemberRow;
  const isSelf = (familyMember.relationship ?? "").toLowerCase() === "self";
  const hasSavedChart = deriveNatalReportState(familyMember) === "generated";
  const linkedNatalReport = familyMember.natal_report_id
    ? await loadLinkedNatalReport(familyMember.id)
    : null;
  const legacyNatalReport =
    !linkedNatalReport && familyMember.natal_chart
      ? {
          toolname: NATAL_TAB_SLUG,
          natal_chart: familyMember.natal_chart,
          astro_api_data: { natal_chart_data: familyMember.natal_chart },
        }
      : null;
  const savedNatalReport = linkedNatalReport ?? legacyNatalReport;

  // Profile completion ring — legacy helper reused verbatim.
  const completion = calcFamilyProfileCompletion({
    full_name: familyMember.full_name,
    date_of_birth: familyMember.date_of_birth,
    birth_time: familyMember.birth_time,
    birth_city: familyMember.birth_city,
    birth_country: familyMember.birth_country,
    relationship: familyMember.relationship,
    // Pass the saved chart object cast to the completion helper's expected
    // shape; we only need its truthiness for the completion percent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    natal_chart: familyMember.natal_chart as any,
  });

  const ringColor =
    completion.percent >= 80
      ? "hsl(142, 71%, 45%)"
      : completion.percent >= 50
      ? "hsl(var(--primary))"
      : "hsl(25, 90%, 55%)";

  const hasBirthCoordinates =
    Number.isFinite(Number(familyMember.birth_lat)) &&
    Number.isFinite(Number(familyMember.birth_lng));
  const hasBirthPlaceWithoutCoordinates =
    Boolean(familyMember.birth_city || familyMember.birth_country) &&
    !hasBirthCoordinates;

  // Toolkit chart-ready check — stricter than legacy profile completion.
  const chartReadyMissing: string[] = [];
  if (!familyMember.date_of_birth) chartReadyMissing.push("Date of birth");
  if (!familyMember.birth_time) chartReadyMissing.push("Birth time");
  if (!familyMember.birth_city) chartReadyMissing.push("Birth city");
  if (!familyMember.birth_country) chartReadyMissing.push("Birth country");
  if (!hasBirthCoordinates) chartReadyMissing.push("Birth coordinates (lat / lng)");

  const hasBirthDataForChart = chartReadyMissing.length === 0;

  // Derived display values.
  const dob = familyMember.date_of_birth
    ? new Date(familyMember.date_of_birth + "T12:00:00")
    : null;
  const ageYears = dob
    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  // Build the prefill only when chart-ready to avoid unnecessary
  // Geoapify lookups from the helper.
  let encodedPrefill: string | null = null;
  if (hasBirthDataForChart) {
    const prefill = await buildToolkitPrefillForm({
      person1: {
        fullName: familyMember.full_name,
        dateOfBirth: familyMember.date_of_birth,
        birthTime: familyMember.birth_time,
        birthCity: familyMember.birth_city,
        birthCountry: familyMember.birth_country,
        birthLat: familyMember.birth_lat,
        birthLng: familyMember.birth_lng,
      },
    });
    if (prefill.person1.city) {
      encodedPrefill = encodeURIComponent(JSON.stringify(prefill));
    } else {
      // Geoapify failed AND no lat/lng on file — force the missing-data
      // branch so we don't render a toolkit that can't submit.
      chartReadyMissing.push("Birth coordinates (lat / lng)");
    }
  }

  const canRenderToolkit = encodedPrefill != null;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/family">
              <ArrowLeft className="mr-1.5 size-4" />
              Family
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {familyMember.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {familyMember.relationship ? `${familyMember.relationship} · ` : ""}
              {ageYears != null ? `Age ${ageYears} · ` : ""}
              {familyMember.age_group === "child"
                ? "Simplified chart"
                : "Full natal chart"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Interactive actions + Generate Chart + Invite form ──────────── */}
      <FamilyMemberActions
        id={familyMember.id}
        hasSavedChart={hasSavedChart}
        hasBirthDataForChart={hasBirthDataForChart}
        hasBirthPlaceWithoutCoordinates={hasBirthPlaceWithoutCoordinates}
        isSelf={isSelf}
        invite={{
          userId: familyMember.user_id,
          sentAt: familyMember.invite_sent_at,
          acceptedAt: familyMember.invite_accepted_at,
        }}
      />

      {/* ── Profile Details + Completion ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Birth Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of birth</span>
              <span>
                {dob
                  ? dob.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Birth time</span>
              {familyMember.birth_time ? (
                <span>{familyMember.birth_time}</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300 text-xs">
                  Unknown
                </span>
              )}
            </div>
            {(familyMember.birth_city || familyMember.birth_country) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birth place</span>
                <span>
                  {formatBirthPlace(
                    familyMember.birth_city,
                    familyMember.birth_country,
                  )}
                </span>
              </div>
            )}
            {familyMember.relationship && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship</span>
                <span>{familyMember.relationship}</span>
              </div>
            )}
            {familyMember.notes && (
              <div className="pt-1">
                <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                <p className="text-xs">{familyMember.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profile Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <ProgressRing
                percentage={completion.percent}
                size={64}
                strokeWidth={6}
                color={ringColor}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {completion.percent}% complete
                </p>
                {completion.missing.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Missing:{" "}
                    {completion.missing
                      .filter((m) => m !== "Natal chart generated")
                      .join(", ") || "—"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasSavedChart ? (
                <Badge className="bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/20">
                  Chart Ready ✓
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-950/20"
                >
                  Chart Pending
                </Badge>
              )}
              {familyMember.chart_updated_at && (
                <span className="text-xs text-muted-foreground">
                  Generated {formatDate(familyMember.chart_updated_at)}
                </span>
              )}
            </div>

            {/* Invite status summary preserved from legacy page. */}
            {!isSelf && (
              <div className="border-t pt-2 space-y-1">
                {familyMember.user_id && familyMember.invite_accepted_at ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="size-3.5" />
                    Login activated on{" "}
                    {formatDate(familyMember.invite_accepted_at)}
                  </div>
                ) : familyMember.invite_sent_at ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <Mail className="size-3.5 text-amber-500" />
                    Invite sent {formatDate(familyMember.invite_sent_at)}
                    {familyMember.invite_email &&
                      ` to ${familyMember.invite_email}`}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Not yet invited to log in
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Birth time warning ──────────────────────────────────────────── */}
      {!familyMember.birth_time && (
        <Card className="border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="size-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Birth time missing
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300/90">
                Add a birth time for greater accuracy — the ascendant and house
                positions cannot be calculated without it.{" "}
                <Link
                  href={`/community/family/${familyMember.id}/edit`}
                  className="underline hover:text-amber-700 dark:hover:text-amber-100"
                >
                  Edit profile →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Chart rendering ─────────────────────────────────────────────── */}

      {/* LEGACY TEMPORARY NATAL CHART UI
          Kept for reference while replacing this page with the shared
          HoroscopeToolkitPage renderer. The previous chart-rendering
          block (NatalWheel + Ascendant/MC cards + Planet Placements
          grid) has been replaced by HoroscopeToolkitPage below. The
          full original implementation is preserved in
          `./_legacy-family-member-page.tsx` in this folder. Do not
          delete until toolkit-based community natal rendering is fully
          accepted. */}

      {canRenderToolkit ? (
        <HoroscopeToolkitPage
          basePath={`/community/family/${familyMember.id}`}
          apiBase="/api/community/horoscope"
          allowedSlugs={[NATAL_TAB_SLUG]}
          initialPrefill={encodedPrefill}
          initialSavedReport={savedNatalReport}
          autoSubmitPrefill={!savedNatalReport}
          readOnlyBirthData={true}
          communityNatalFamilyMemberId={familyMember.id}
        />
      ) : (
        <Card className="max-w-2xl border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
              <AlertCircle className="size-4" />
              Add birth details to render the chart
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-300/90">
              {familyMember.full_name}&apos;s Nativity Birth Chart needs a
              complete birth record. Missing:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200 pl-5 list-disc">
              {chartReadyMissing.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/community/family/${familyMember.id}/edit`}>
                  <Star className="mr-1.5 size-3.5" />
                  Edit Birth Details
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/community/family">
                  <ChevronLeft className="mr-1.5 size-3.5" />
                  Back to Family
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
