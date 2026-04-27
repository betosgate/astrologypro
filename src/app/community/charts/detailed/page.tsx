import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";

export const metadata = {
  title: "Detailed Relationship Report - AstrologyPro Community",
};

export const dynamic = "force-dynamic";

const RELATIONSHIP_TAB_MAP = {
  romantic: "romantic_forecast_report_tropical_v2",
  friendship: "friendship_report_tropical_v2",
  business: "business_partner_v2",
} as const;

type RelationshipMode = keyof typeof RELATIONSHIP_TAB_MAP;

interface SearchParams {
  personAId?: string;
  personBId?: string;
  mode?: string;
}

function isRelationshipMode(mode: string | undefined): mode is RelationshipMode {
  return mode === "romantic" || mode === "friendship" || mode === "business";
}

export default async function CommunityRelationshipDetailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { personAId, personBId, mode } = await searchParams;

  if (!personAId || !personBId || personAId === personBId) {
    redirect("/community/charts");
  }

  if (!isRelationshipMode(mode)) {
    redirect("/community/charts");
  }

  const selectedMode = mode;
  const selectedSlug = RELATIONSHIP_TAB_MAP[selectedMode];
  const allowedSlugs = [
    selectedSlug,
    ...Object.values(RELATIONSHIP_TAB_MAP).filter((slug) => slug !== selectedSlug),
  ];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.membership_type !== "perennial_mandalism") {
    redirect("/community");
  }

  if (member.membership_status !== "active") {
    redirect("/join/community/resubscribe");
  }

  const admin = createAdminClient();
  const { data: familyRows } = await admin
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
    )
    .eq("member_id", member.id)
    .in("id", [personAId, personBId]);

  const family = (familyRows ?? []) as Array<{
    id: string;
    full_name: string | null;
    date_of_birth: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_country: string | null;
    birth_lat: number | null;
    birth_lng: number | null;
  }>;

  const personA = family.find((row) => row.id === personAId);
  const personB = family.find((row) => row.id === personBId);

  if (!personA || !personB) {
    redirect("/community/charts");
  }

  const prefill = await buildToolkitPrefillForm({
    person1: {
      fullName: personA.full_name,
      dateOfBirth: personA.date_of_birth,
      birthTime: personA.birth_time,
      birthCity: personA.birth_city,
      birthCountry: personA.birth_country,
      birthLat: personA.birth_lat,
      birthLng: personA.birth_lng,
    },
    person2: {
      fullName: personB.full_name,
      dateOfBirth: personB.date_of_birth,
      birthTime: personB.birth_time,
      birthCity: personB.birth_city,
      birthCountry: personB.birth_country,
      birthLat: personB.birth_lat,
      birthLng: personB.birth_lng,
    },
  });

  return (
    <div className="space-y-4">
      <Link
        href="/community/charts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Relationship Charts
      </Link>

      <HoroscopeToolkitPage
        basePath={`/community/charts/detailed?personAId=${encodeURIComponent(personAId)}&personBId=${encodeURIComponent(personBId)}&mode=${selectedMode}`}
        allowedSlugs={allowedSlugs}
        initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
        readOnlyBirthData={true}
      />
    </div>
  );
}
