import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildToolkitFamilyMemberPrefills,
  buildToolkitPrefillForm,
} from "@/lib/horoscope-toolkit-prefill";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
import {
  loadLinkedRelationshipReport,
  type RelationshipReportType,
} from "@/lib/community/saved-report-link";

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
type RelationshipSlug = (typeof RELATIONSHIP_TAB_MAP)[RelationshipMode];

const RELATIONSHIP_MODE_BY_TAB = Object.fromEntries(
  Object.entries(RELATIONSHIP_TAB_MAP).map(([mode, slug]) => [slug, mode])
) as Record<RelationshipSlug, RelationshipMode>;

/**
 * UI mode → canonical relationship `report_type` enum (matches the DB
 * CHECK constraint on community_relationship_reports.report_type and
 * the validation in /api/community/saved-reports/relationship/link).
 * Note: the UI exposes "business" but the lifecycle row is "partnership".
 */
const MODE_TO_REPORT_TYPE: Record<RelationshipMode, RelationshipReportType> = {
  romantic: "romantic",
  friendship: "friendship",
  business: "partnership",
};

interface SearchParams {
  personAId?: string;
  personBId?: string;
  mode?: string;
  tab?: string;
  family?: string;
}

function isRelationshipMode(mode: string | undefined): mode is RelationshipMode {
  return mode === "romantic" || mode === "friendship" || mode === "business";
}

function isRelationshipSlug(slug: string | undefined): slug is RelationshipSlug {
  return typeof slug === "string" && slug in RELATIONSHIP_MODE_BY_TAB;
}

export default async function CommunityRelationshipDetailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const {
    personAId,
    personBId,
    mode,
    tab,
    family: familyParam,
  } = await searchParams;
  const isFamilyOverview = familyParam === "1" || familyParam === "true";

  if (!isRelationshipMode(mode)) {
    redirect("/community/charts");
  }

  if (!isFamilyOverview && (!personAId || !personBId || personAId === personBId)) {
    redirect("/community/charts");
  }

  const selectedMode = mode;
  if (isRelationshipSlug(tab) && RELATIONSHIP_MODE_BY_TAB[tab] !== selectedMode) {
    redirect(
      isFamilyOverview
        ? `/community/charts/detailed?family=1&mode=${RELATIONSHIP_MODE_BY_TAB[tab]}`
        : `/community/charts/detailed?personAId=${encodeURIComponent(personAId!)}&personBId=${encodeURIComponent(personBId!)}&mode=${RELATIONSHIP_MODE_BY_TAB[tab]}`
    );
  }
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
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, relationship, age_group"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  const family = (familyRows ?? []) as Array<{
    id: string;
    full_name: string | null;
    date_of_birth: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_country: string | null;
    birth_lat: number | null;
    birth_lng: number | null;
    relationship?: string | null;
    age_group?: string | null;
  }>;

  const selectedFamily = isFamilyOverview
    ? family
    : family.filter((row) => row.id === personAId || row.id === personBId);

  const personA = isFamilyOverview
    ? selectedFamily[0]
    : selectedFamily.find((row) => row.id === personAId);
  const personB = isFamilyOverview
    ? selectedFamily[1]
    : selectedFamily.find((row) => row.id === personBId);

  if (!personA || !personB) {
    redirect("/community/charts");
  }

  // ── Saved-report hydration ─────────────────────────────────────────
  // If a full relationship report has already been generated for this
  // pair + selected type, load it from `astro_ai_responses` (via the
  // domain `community_relationship_reports` linkage) and pass it to the
  // toolkit as `initialSavedReport`. The toolkit's saved-hydration mode
  // then renders the report directly without re-running compute /
  // synastry / composite / AI calls. If null, the toolkit falls back to
  // its existing live-generation flow exactly as before.
  const savedRelationshipReport = isFamilyOverview
    ? null
    : await loadLinkedRelationshipReport({
        personAId: personA.id,
        personBId: personB.id,
        reportType: MODE_TO_REPORT_TYPE[selectedMode],
      }).catch((err) => {
        console.error(
          "[community/charts/detailed] loadLinkedRelationshipReport failed:",
          err,
        );
        return null;
      });

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
  const familyMemberPrefills = isFamilyOverview
    ? await buildToolkitFamilyMemberPrefills(
        selectedFamily.map((familyMember) => ({
          id: familyMember.id,
          fullName: familyMember.full_name,
          relationship: familyMember.relationship ?? null,
          ageGroup: familyMember.age_group ?? null,
          dateOfBirth: familyMember.date_of_birth,
          birthTime: familyMember.birth_time,
          birthCity: familyMember.birth_city,
          birthCountry: familyMember.birth_country,
          birthLat: familyMember.birth_lat,
          birthLng: familyMember.birth_lng,
        })),
      )
    : [];

  const encodedPrefill = encodeURIComponent(
    JSON.stringify(
      isFamilyOverview
        ? {
            ...prefill,
            familyMembers: familyMemberPrefills,
            family_members: familyMemberPrefills,
            areaOfInquiry:
              prefill.areaOfInquiry ||
              `${selectedFamily.length} family members included in this ${selectedMode} family relationship overview.`,
          }
        : prefill,
    ),
  );
  const detailBasePath = isFamilyOverview
    ? `/community/charts/detailed?family=1&mode=${selectedMode}`
    : `/community/charts/detailed?personAId=${encodeURIComponent(personA.id)}&personBId=${encodeURIComponent(personB.id)}&mode=${selectedMode}`;

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
        basePath={detailBasePath}
        apiBase="/api/community/horoscope"
        allowedSlugs={allowedSlugs}
        initialPrefill={encodedPrefill}
        initialSavedReport={
          savedRelationshipReport
            ? (savedRelationshipReport as Record<string, unknown>)
            : null
        }
        autoSubmitPrefill={!savedRelationshipReport}
        readOnlyBirthData={true}
        // Pair ids drive the post-generate save call to
        // /api/community/saved-reports/relationship/link inside the
        // toolkit, so the next View hydrates from DB.
        communityRelationshipPersonAId={isFamilyOverview ? null : personA.id}
        communityRelationshipPersonBId={isFamilyOverview ? null : personB.id}
        communityRelationshipFamilyMembers={familyMemberPrefills}
      />
    </div>
  );
}
