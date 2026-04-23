import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ChevronLeft, Telescope } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { createClient } from "@/lib/supabase/server";
import { resolveUserBirthData } from "@/lib/community/birth-data-resolver";

/**
 * Community self-natal chart route.
 *
 * Renders the shared admin Horoscope Toolkit (`HoroscopeToolkitPage`)
 * restricted to the Nativity Birth Chart tab (`western_horoscope_v2`).
 *
 * Pattern mirrors `src/app/community/charts/detailed/page.tsx` — the
 * reference implementation confirmed in Task 01 audit.
 *
 * The prior bespoke client renderer (790 lines, its own API surface
 * under `/api/community/nativity-chart/*`) is preserved as
 * `./_legacy-nativity-chart-page.tsx` per the master task directive to
 * keep legacy UI available for review.
 */

export const metadata = {
  title: "Nativity Birth Chart - AstrologyPro Community",
};

export const dynamic = "force-dynamic";

const NATAL_TAB_SLUG = "western_horoscope_v2";

// Field labels shown to the user if birth data is incomplete. Order here
// is also the order they appear in the missing-data checklist.
const REQUIRED_FIELD_LABELS: Array<{
  key: "dateOfBirth" | "birthTime" | "birthCity" | "birthCountry" | "coordinates";
  label: string;
}> = [
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "birthTime", label: "Birth time" },
  { key: "birthCity", label: "Birth city" },
  { key: "birthCountry", label: "Birth country" },
  { key: "coordinates", label: "Birth coordinates (lat / lng)" },
];

function MissingBirthDataCard({ missing }: { missing: string[] }) {
  const missingSet = new Set(missing);
  const items = REQUIRED_FIELD_LABELS.filter((f) => missingSet.has(f.key));

  return (
    <Card className="max-w-2xl border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-4" />
          Add your birth details to generate a chart
        </CardTitle>
        <CardDescription className="text-amber-800 dark:text-amber-300/90">
          The Nativity Birth Chart needs a complete birth record. Please
          complete the following and return here:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200 pl-5 list-disc">
          {items.length > 0 ? (
            items.map((f) => <li key={f.key}>{f.label}</li>)
          ) : (
            <li>Birth information is incomplete. Please update your profile.</li>
          )}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/community/profile">Complete Profile</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/community/family">Manage Family Birth Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CommunityNativityChartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Membership gate — identical shape to community/charts/detailed.
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

  // Resolve birth data via the canonical PM resolver (priority: family
  // self-row → latest booking client row → community_members profile).
  const resolved = await resolveUserBirthData(
    user.id,
    member.id,
    member.full_name ?? null,
  );

  const missingForChart: string[] = [];
  if (!resolved.dateOfBirth) missingForChart.push("dateOfBirth");
  if (!resolved.birthTime) missingForChart.push("birthTime");
  if (!resolved.birthCity) missingForChart.push("birthCity");
  if (!resolved.birthCountry) missingForChart.push("birthCountry");

  const header = (
    <div className="space-y-1">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Community
      </Link>
      <div className="flex items-center gap-2 pt-2">
        <Telescope className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Nativity Birth Chart</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Your Western natal chart with planetary placements, house cusps, and AI interpretations.
      </p>
    </div>
  );

  if (missingForChart.length > 0) {
    return (
      <div className="space-y-6">
        {header}
        <MissingBirthDataCard missing={missingForChart} />
      </div>
    );
  }

  const prefill = await buildToolkitPrefillForm({
    person1: {
      fullName: resolved.fullName,
      dateOfBirth: resolved.dateOfBirth,
      birthTime: resolved.birthTime,
      birthCity: resolved.birthCity,
      birthCountry: resolved.birthCountry,
      birthLat: resolved.birthLat,
      birthLng: resolved.birthLng,
      birthTimezone: resolved.birthTimezone,
    },
  });

  // community_members does not store birth_lat/birth_lng. Let the shared
  // prefill builder geocode birth_city + birth_country before falling back
  // to the coordinates missing state.
  if (!prefill.person1.city) {
    return (
      <div className="space-y-6">
        {header}
        <MissingBirthDataCard missing={["coordinates"]} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      <HoroscopeToolkitPage
        basePath="/community/horoscope"
        allowedSlugs={[NATAL_TAB_SLUG]}
        initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
      />
    </div>
  );
}
