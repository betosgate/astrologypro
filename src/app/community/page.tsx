import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Users,
  Star,
  Flame,
  TrendingUp,
  BookMarked,
  Heart,
  GraduationCap,
  HandHeart,
  MapPin,
  Clock,
  CalendarDays,
  Sparkles,
  Scroll,
  CheckCircle2,
  AlertTriangle,
  BookText,
  User,
  CreditCard,
  Compass,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { AstroChartsSection } from "@/components/community/astro-charts-section";
import { ChartQuickActions } from "@/components/community/chart-quick-actions";
import { HouseholdReadinessSection } from "@/components/community/household-readiness-section";
import { MembershipCard, type MembershipSubscription } from "@/components/community/membership-card";
import { ManageSubscriptionButton } from "@/components/mystery-school/manage-subscription-button";
import { ProfileCompletionCard, type ProfileCompletionData } from "@/components/community/profile-completion-card";
import { ProgressRing } from "@/components/community/progress-ring";
import { DashboardFeedPreview } from "@/components/community/dashboard-feed-preview";
import { getCommunityDashboardFeed } from "@/lib/dashboard-content";
import { calcFamilyProfileCompletion } from "@/lib/community/family-profile-completion";
import { formatBirthPlace } from "@/lib/community/birth-location";
import { deriveNatalReportState } from "@/lib/community/chart-report-state";
import { isBirthDataComplete } from "@/lib/community/birth-data-readiness";
import { SectionContainer } from "@/components/shared/section-container";

export const metadata = { title: "Community - AstrologyPro" };
export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────

// Legacy local profile completion calculation kept for traceability. It counted
// natal_chart as 10%, which made complete profiles look incomplete while their
// chart was still pending. Active UI now uses calcFamilyProfileCompletion().
// function calcFamilyMemberPct(m: {
//   full_name?: string | null;
//   date_of_birth?: string | null;
//   birth_time?: string | null;
//   birth_city?: string | null;
//   birth_country?: string | null;
//   relationship?: string | null;
//   natal_chart?: Record<string, unknown> | null;
// }): number {
//   let pct = 0;
//   if (m.full_name?.trim()) pct += 20;
//   if (m.date_of_birth) pct += 15;
//   if (m.birth_time) pct += 15;
//   if (m.birth_city?.trim()) pct += 15;
//   if (m.birth_country?.trim()) pct += 15;
//   if (m.relationship?.trim()) pct += 10;
//   if (m.natal_chart && Object.keys(m.natal_chart).length > 0) pct += 10;
//   return pct;
// }

function ringColor(pct: number): string {
  if (pct >= 100) return "hsl(142, 71%, 45%)";
  if (pct >= 60) return "hsl(var(--primary))";
  return "hsl(25, 90%, 55%)";
}

function journeySetupCtaLabel(key?: string): string {
  switch (key) {
    case "profile_photo":
      return "Upload Photo →";
    case "full_name":
      return "Complete Profile →";
    case "birth_data":
      return "Complete Birth Data →";
    case "natal_chart":
      return "Generate Chart →";
    case "family_member":
      return "Add Family Member →";
    case "relationship_chart":
      return "Generate Relationship Chart →";
    default:
      return "Continue Setup →";
  }
}

function formatDateLong(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

type PmApiSubscription = {
  id: string;
  status: string;
  current_period_end: string | null;
  last_payment_date?: string | null;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  interval: string;
  plan_name: string;
  one_time_fee?: number;
  one_time_fee_currency?: string;
  membership_status?: string | null;
  membership_type?: string | null;
  plan_type?: string | null;
  stripe_customer_id?: string | null;
  tier_id?: string | null;
  tier_name?: string | null;
};

function stripeCentsToAmount(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function billingCycleFromInterval(
  interval: string | null | undefined
): MembershipSubscription["billing_cycle"] {
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  return null;
}

async function fetchPmSubscription(): Promise<PmApiSubscription | null> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const protocol =
      hdrs.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") ? "http" : "https");
    const origin = host ? `${protocol}://${host}` : APP_URL;
    const cookie = hdrs.get("cookie");

    const res = await fetch(`${origin}/api/pm/subscription`, {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    });

    if (!res.ok) {
      console.error("[community] Failed to fetch PM subscription API", res.status);
      return null;
    }

    const body = (await res.json()) as {
      subscription?: PmApiSubscription | null;
    };
    console.log("[community] /api/pm/subscription", {
      route: "/community",
      status: res.status,
      subscription_status: body.subscription?.status ?? null,
      current_period_end: body.subscription?.current_period_end ?? null,
      last_payment_date: body.subscription?.last_payment_date ?? null,
      cancel_at_period_end: body.subscription?.cancel_at_period_end ?? null,
    });
    return body.subscription ?? null;
  } catch (err) {
    console.error("[community] PM subscription API error:", err);
    return null;
  }
}

function capitalize(value: string | null | undefined): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRelationshipBadgeClasses(rel: string): string {
  const r = rel.toLowerCase();
  if (r === "self" || r === "primary") return "bg-amber-500/20 text-amber-500 border-amber-500/30";
  if (r === "spouse" || r === "partner") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (r === "son" || r === "boy") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (r === "daughter" || r === "girl") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  if (r === "child") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (r === "friend") return "bg-sky-500/20 text-sky-400 border-sky-500/30";
  if (r === "parent") return "bg-pink-500/20 text-pink-400 border-pink-500/30";
  if (r === "sibling") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

const AVATAR_COLORS = [
  "bg-rose-500/15 text-rose-600",
  "bg-violet-500/15 text-violet-600",
  "bg-sky-500/15 text-sky-600",
  "bg-amber-500/15 text-amber-600",
  "bg-emerald-500/15 text-emerald-600",
];

/** Returns true if the date is within `days` days from now */
function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const target = new Date(iso).getTime();
  const now = Date.now();
  return target > now && target - now <= days * 24 * 60 * 60 * 1000;
}

// ── Section heading component ──────────────────────────────────────────────
function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default async function CommunityDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Read only columns that exist in the current community_members schema.
  // The removed cancel_* fields were causing valid members to be redirected.
  // We also pull birth_* fields here so the dashboard Profile Completion
  // block reads from the same table /community/profile writes to, instead of
  // the best-effort-synced `clients` row.
  const { data: member } = await supabase
    .from("community_members")
    .select(
      "id, full_name, email, membership_type, membership_status, plan_type, joined_at, expires_at, pm_tier_id, current_period_end, extra_member_count, date_of_birth, birth_time, birth_city"
    )
    .eq("user_id", user.id)
    .maybeSingle();


  if (!member) redirect("/get-started");

  // ── Derive subscription display data from member row ──────────────────────
  const PLAN_LABELS: Record<string, Record<string, string>> = {
    perennial_mandalism: {
      individual: "Perennial Mandalism — Single",
      family: "Perennial Mandalism — Family",
    },
    mystery_school: {
      individual: "Mystery School",
      family: "Mystery School",
    },
  };
  const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
    perennial_mandalism: { individual: 19.95, family: 34.95 },
    mystery_school: { individual: 27.0, family: 27.0 },
  };

  const membershipType = (member.membership_type ?? "perennial_mandalism") as string;
  const planType = (member.plan_type ?? "individual") as string;

  const isMysterySchool = member.membership_type === "mystery_school";
  const isPerennial = !isMysterySchool;
  const programName = isMysterySchool ? "Mystery School" : "Perennial Mandalism";

  // ── Parallel data fetches ──────────────────────────────────────────────────
  const [
    clientResult,
    familyMembersResult,
    otherMembersResult,
    recentWisdomResult,
    recentBlogResult,
    ritualsResult,
    profileCompletionFamilyResult,
    profileCompletionRelChartResult,
    pmTierResult,
    platformSettingsResult,
    mysterySchoolStudentResult,
    pmApiSubscription,
  ] = await Promise.all([
    // Client profile for progress ring calculation
    supabase
      .from("clients")
      .select("birth_date, birth_time, birth_city")
      .eq("user_id", user.id)
      .single(),

    // Family members — full fields for profile completion rings.
    // `user_id` is selected so the top-summary family chip row can
    // deduplicate the primary member if they were also added as a
    // family-member row (community-dashboard-family-chips Task 02).
    supabase
      .from("community_family_members")
      .select(
        // birth_lat / birth_lng are needed for the household-readiness card
        // to use the chart-flow `isBirthDataComplete` gate (the same rule
        // /community/transits uses). Without coordinates a row may pass
        // text-field checks but still be ineligible for chart generation.
        // Spec: tasks/06.05.2026/community-dashboard-household-readiness-card/03-wire-household-readiness-metrics-and-actions.md
        "id, user_id, full_name, relationship, date_of_birth, birth_time, birth_time_unknown, birth_city, birth_country, birth_lat, birth_lng, natal_chart, natal_status, natal_report_id, natal_report_status"
      )
      .eq("member_id", member.id)
      .limit(10),

    // Other community members for members connected count
    supabase
      .from("community_members")
      .select("id, full_name, membership_type, joined_at")
      .eq("membership_status", "active")
      .neq("user_id", user.id)
      .limit(5),

    // Recent spiritual wisdom items
    supabase
      .from("spiritual_wisdom")
      .select("id, title, descriptive_title, type, image_url, youtube_url")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(3),

    // Recent blog posts
    supabase
      .from("blog_posts")
      .select("id, title, slug, category, excerpt, image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),

    // User's saved rituals
    supabase
      .from("user_ritual_configurations")
      .select("id, ritual_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),

    // Profile completion: family members with natal_chart data
    supabase
      .from("community_family_members")
      .select("id, user_id, relationship, natal_chart, natal_status, natal_report_id, natal_report_status")
      .eq("member_id", member.id),

    // Profile completion: relationship charts generated
    supabase
      .from("relationship_charts")
      .select("id, generated_at")
      .eq("member_id", member.id)
      .not("generated_at", "is", null)
      .limit(1),

    // PM plan tier for rich membership display
    member.pm_tier_id
      ? supabase
          .from("pm_plan_tiers")
          .select("id, name, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members")
          .eq("id", member.pm_tier_id)
          .single()
      : Promise.resolve({ data: null }),

    // Admin discount toggle — read via admin client (RLS bypass)
    createAdminClient()
      .from("platform_settings")
      .select("ms_pm_discount_enabled")
      .limit(1)
      .maybeSingle(),

    createAdminClient()
      .from("mystery_school_students")
      .select(
        "id, enrolled_at, enrollment_date, entry_quarter, entry_year, stripe_subscription_id, one_time_fee_amount, status, paused_at, cancelled_at, access_expires_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),

    isPerennial ? fetchPmSubscription() : Promise.resolve(null),
  ]);

  const client = clientResult.data;
  const familyMembers = familyMembersResult.data ?? [];
  const otherMembers = otherMembersResult.data ?? [];
  const recentWisdom = recentWisdomResult.data ?? [];
  const recentBlog = recentBlogResult.data ?? [];
  const rituals = ritualsResult.data ?? [];
  const pcFamilyMembers = profileCompletionFamilyResult.data ?? [];
  const pcRelCharts = profileCompletionRelChartResult.data ?? [];
  const pmTier = pmTierResult.data ?? null;
  const pmDiscountEnabled = platformSettingsResult.data?.ms_pm_discount_enabled ?? false;
  const mysterySchoolStudent = mysterySchoolStudentResult.data as {
    id: string;
    enrolled_at: string;
    enrollment_date: string | null;
    entry_quarter: string | null;
    entry_year: number | null;
    stripe_subscription_id: string | null;
    one_time_fee_amount: number | null;
    status: string;
    paused_at: string | null;
    cancelled_at: string | null;
    access_expires_at: string | null;
  } | null;

  let mysterySchoolCurrentPeriodEnd: string | null = null;
  let mysterySchoolRecurringAmount: number | null = null;
  let mysterySchoolRecurringCurrency = "usd";
  if (mysterySchoolStudent?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(
        mysterySchoolStudent.stripe_subscription_id,
        { expand: ["latest_invoice"] }
      ) as unknown as {
        current_period_end?: number;
        billing_cycle_anchor?: number;
        latest_invoice?: {
          period_end?: number | null;
        } | string | null;
        items?: {
          data?: Array<{
            price?: {
              unit_amount?: number | null;
              currency?: string | null;
            };
          }>;
        };
      };
      const invoicePeriodEnd =
        sub.latest_invoice &&
        typeof sub.latest_invoice !== "string" &&
        typeof sub.latest_invoice.period_end === "number"
          ? sub.latest_invoice.period_end
          : null;
      const nextBillingTimestamp =
        sub.current_period_end ??
        invoicePeriodEnd ??
        sub.billing_cycle_anchor ??
        null;

      if (nextBillingTimestamp) {
        mysterySchoolCurrentPeriodEnd = new Date(
          nextBillingTimestamp * 1000
        ).toISOString();
      }
      const price = sub.items?.data?.[0]?.price;
      if (typeof price?.unit_amount === "number") {
        mysterySchoolRecurringAmount = price.unit_amount / 100;
      }
      if (price?.currency) {
        mysterySchoolRecurringCurrency = price.currency;
      }
    } catch {
      // Non-fatal: card can still render without the current billing date.
    }
  }

  const mysterySchoolHasActiveAccess = Boolean(
    mysterySchoolStudent &&
      (
        mysterySchoolStudent.status === "active" ||
        (
          mysterySchoolStudent.status === "cancelled" &&
          mysterySchoolStudent.access_expires_at &&
          new Date(mysterySchoolStudent.access_expires_at) > new Date()
        )
      )
  );
  const mysterySchoolNeedsResubscribe = Boolean(
    mysterySchoolStudent && !mysterySchoolHasActiveAccess
  );
  const mysterySchoolEntryLabel =
    mysterySchoolStudent?.entry_quarter && mysterySchoolStudent?.entry_year
      ? `${capitalize(mysterySchoolStudent.entry_quarter)} ${mysterySchoolStudent.entry_year}`
      : null;
  const mysterySchoolEnrolledDate =
    formatDateLong(mysterySchoolStudent?.enrollment_date ?? mysterySchoolStudent?.enrolled_at ?? null);
  const mysterySchoolAccessUntil =
    formatDateLong(mysterySchoolStudent?.access_expires_at ?? mysterySchoolCurrentPeriodEnd);
  const mysterySchoolRenewalDate =
    mysterySchoolStudent?.status === "active"
      ? formatDateLong(mysterySchoolCurrentPeriodEnd)
      : null;
  const mysterySchoolBillingLabel = mysterySchoolRecurringAmount
    ? `${formatCurrency(mysterySchoolRecurringAmount, mysterySchoolRecurringCurrency)}/month`
    : "Managed in Stripe";
  const mysterySchoolEnrollmentFeeLabel =
    typeof mysterySchoolStudent?.one_time_fee_amount === "number"
      ? formatCurrency(mysterySchoolStudent.one_time_fee_amount)
      : null;

  // ── Membership card subscription prop ────────────────────────────────────
  const membershipPlanType =
    isPerennial && pmApiSubscription?.plan_type
      ? pmApiSubscription.plan_type
      : planType;

  // Max members: from tier table if available, else derive from plan_type
  const maxMembers: number =
    (pmTier as { max_total_members?: number } | null)?.max_total_members ??
    (membershipPlanType === "family" ? 5 : 1);

  // family count: family members + the primary member
  const memberCount =
    membershipPlanType === "family"
      ? Math.min((familyMembers?.length ?? 0) + 1, maxMembers)
      : 1;

  // Tier display name: prefer the PM subscription API, then pm_plan_tiers.
  const tierName: string | null =
    (isPerennial
      ? pmApiSubscription?.tier_name ?? pmApiSubscription?.plan_name
      : null) ??
    (pmTier as { name?: string } | null)?.name ??
    PLAN_LABELS[membershipType]?.[membershipPlanType] ??
    null;

  // Best renewal date: PM prefers the API's Stripe current_period_end.
  const renewalDate: string | null =
    (isPerennial ? pmApiSubscription?.current_period_end : null) ??
    (member as { current_period_end?: string | null }).current_period_end ??
    member.expires_at ??
    null;

  const membershipSubscription: MembershipSubscription = {
    membership_type:
      (isPerennial ? pmApiSubscription?.membership_type ?? null : null) ??
      membershipType,
    plan_type: membershipPlanType,
    plan_label:
      (isPerennial ? pmApiSubscription?.plan_name ?? null : null) ??
      PLAN_LABELS[membershipType]?.[membershipPlanType] ??
      PLAN_LABELS["perennial_mandalism"]["individual"],
    tier_name: tierName,
    status:
      isPerennial && pmApiSubscription?.cancel_at_period_end
        ? "cancelling"
        : (isPerennial ? pmApiSubscription?.status ?? null : null) ??
          member.membership_status ??
          "active",
    amount:
      isPerennial && pmApiSubscription
        ? stripeCentsToAmount(pmApiSubscription.amount)
        : isPerennial && pmTier
        ? Number(pmTier.base_price_usd ?? 0) +
          (member.extra_member_count ?? 0) *
            Number(pmTier.extra_per_member_usd ?? 0)
        : isMysterySchool && mysterySchoolRecurringAmount
        ? mysterySchoolRecurringAmount
        : PLAN_AMOUNTS[membershipType]?.[membershipPlanType] ??
          PLAN_AMOUNTS["perennial_mandalism"]["individual"],
    currency:
      (isPerennial ? pmApiSubscription?.currency ?? null : null) ??
      mysterySchoolRecurringCurrency ??
      "usd",
    billing_cycle:
      (isPerennial
        ? billingCycleFromInterval(pmApiSubscription?.interval)
        : null) ?? "monthly",
    renewal_date: renewalDate,
    last_payment_date: isPerennial
      ? pmApiSubscription?.last_payment_date ?? null
      : null,
    created_at: (member.joined_at && typeof member.joined_at === "string" && member.joined_at.trim() !== "") ? member.joined_at : user.created_at,
    member_count: memberCount,
    max_members: maxMembers,
  };

  // ── Cancellation / renewal-soon flags ─────────────────────────────────────
  const isCancelling =
    Boolean(isPerennial && pmApiSubscription?.cancel_at_period_end) ||
    Boolean((member as { cancel_at_period_end?: boolean | null }).cancel_at_period_end) ||
    Boolean((member as { cancel_at?: string | null }).cancel_at) ||
    member.membership_status === "cancelling";

  const cancelAt: string | null =
    (member as { cancel_at?: string | null }).cancel_at ??
    (isCancelling ? renewalDate : null);

  const renewingSoon = !isCancelling && isWithinDays(renewalDate, 7);

  // ── Days remaining until renewal/cancellation ─────────────────────────────
  function daysUntil(iso: string | null): number | null {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }
  const daysRemaining = daysUntil(renewalDate);

  // ── Dashboard birth-data readiness ring ──────────────────────────────────
  // Canonical source: community_members (what /community/profile saves to).
  // Falling back to `clients` first caused a dashboard/profile mismatch where
  // /community/profile showed 100% but /community showed 0% because the
  // best-effort cross-role sync had not yet populated the `clients` row.
  const memberBirthFields = {
    date_of_birth:
      (member as { date_of_birth?: string | null }).date_of_birth ?? null,
    birth_time:
      (member as { birth_time?: string | null }).birth_time ?? null,
    birth_city:
      (member as { birth_city?: string | null }).birth_city ?? null,
  };
  const hasDob = Boolean(
    memberBirthFields.date_of_birth &&
      String(memberBirthFields.date_of_birth).trim() !== ""
  );
  const hasBirthTime = Boolean(
    memberBirthFields.birth_time &&
      String(memberBirthFields.birth_time).trim() !== ""
  );
  const hasBirthCity = Boolean(
    memberBirthFields.birth_city &&
      String(memberBirthFields.birth_city).trim() !== ""
  );
  let profilePct = 0;
  if (hasDob) profilePct += 34;
  if (hasBirthTime) profilePct += 33;
  if (hasBirthCity) profilePct += 33;
  const profileMissingFields: string[] = [];
  if (!hasDob) profileMissingFields.push("Date of birth");
  if (!hasBirthTime) profileMissingFields.push("Birth time");
  if (!hasBirthCity) profileMissingFields.push("Birth city");

  // ── Household Readiness Card metrics ─────────────────────────────────────
  // Spec: tasks/06.05.2026/community-dashboard-household-readiness-card/
  //         03-wire-household-readiness-metrics-and-actions.md
  //
  // Replaces the legacy two-ring "Birth Data Readiness" card whose
  // "Household Members 100%" was based on raw member count, not actual
  // per-member birth-data completeness. We compute three distinct
  // dimensions per household so the dashboard never claims everything
  // is set up when half the members are missing chart-eligible data:
  //
  //   selfBirthDataComplete  — primary member's chart-eligibility
  //   completeMemberCount    — household members ready for chart gen
  //   natalChartsReadyCount  — household members with a generated chart
  //
  // We deliberately use `isBirthDataComplete` (the chart-generation gate
  // shared with /community/transits) for family rows because the readiness
  // card is selling chart-readiness, not generic profile completeness.
  // The lower "Your Circle" section keeps using `calcFamilyProfileCompletion`
  // for its richer per-member profile view.
  const selfBirthDataComplete = hasDob && hasBirthTime && hasBirthCity;

  // Family rows readiness (chart-eligibility view).
  const familyMembersBirthComplete = familyMembers.filter((fm) =>
    isBirthDataComplete({
      date_of_birth: fm.date_of_birth ?? null,
      birth_time: fm.birth_time ?? null,
      birth_city: fm.birth_city ?? null,
      birth_country: (fm as { birth_country?: string | null }).birth_country ?? null,
      birth_lat: (fm as { birth_lat?: number | string | null }).birth_lat ?? null,
      birth_lng: (fm as { birth_lng?: number | string | null }).birth_lng ?? null,
    })
  );

  // Total visible household = family rows + 1 (primary member). We do NOT
  // cap at maxMembers here — the readiness card reports actual visible
  // members, while membership/billing surfaces handle plan-limit display.
  const householdTotalCount = familyMembers.length + 1;
  const householdCompleteCount =
    (selfBirthDataComplete ? 1 : 0) + familyMembersBirthComplete.length;
  const householdMissingDetailsCount =
    householdTotalCount - householdCompleteCount;

  // Chart-readiness per row. `deriveNatalReportState` is the same helper
  // used by Your Circle and the natal CTA, so counts here always agree
  // with the per-row badges below.
  const familyChartsReadyCount = familyMembers.filter(
    (fm) => deriveNatalReportState(fm) === "generated"
  ).length;

  // Self chart readiness: prefer the family row representing self if one
  // exists; otherwise fall back to the existing `pcFamilyMembers` lookup
  // which is already wired below.
  const selfFamilyRow =
    familyMembers.find((fm) => fm.user_id === user.id) ??
    familyMembers.find(
      (fm) => (fm.relationship ?? "").toLowerCase() === "self"
    ) ??
    null;
  const selfChartReady =
    selfFamilyRow != null
      ? deriveNatalReportState(selfFamilyRow) === "generated"
      : false;

  // To avoid double-counting when self IS a family row.
  const selfIsInFamilyRows = selfFamilyRow != null;
  const householdNatalChartsReadyCount = selfIsInFamilyRows
    ? familyChartsReadyCount
    : familyChartsReadyCount + (selfChartReady ? 1 : 0);

  // Eligibility = how many household members CAN have a chart generated
  // right now. We derive this from the same completeness rule so the
  // "Charts Ready X / Y" denominator never exceeds the actually-eligible set.
  const householdNatalChartsEligibleCount = householdCompleteCount;

  // ── Full profile completion data (weighted, for ProfileCompletionCard) ────
  const hasPhoto = Boolean(
    user.user_metadata?.avatar_url &&
      String(user.user_metadata.avatar_url).trim() !== ""
  );
  const pcHasFullName = Boolean(member.full_name && member.full_name.trim() !== "");
  const pcHasBirthData = hasDob && hasBirthTime && hasBirthCity;
  const pcHasNatalChart = pcFamilyMembers.some(
    (fm) => deriveNatalReportState(fm) === "generated"
  );
  const ownSelfChartRow =
    pcFamilyMembers.find((fm) => fm.user_id === user.id) ??
    pcFamilyMembers.find(
      (fm) => (fm.relationship ?? "").toLowerCase() === "self"
    );
  const ownChartGenerated =
    ownSelfChartRow != null &&
    deriveNatalReportState(ownSelfChartRow) === "generated";
  const pcHasFamilyMember = pcFamilyMembers.length > 0;
  const pcHasRelationshipChart = pcRelCharts.length > 0;

  const profileCompletionItems: ProfileCompletionData["items"] = [
    {
      key: "profile_photo",
      label: "Profile photo uploaded",
      completed: hasPhoto,
      pct: 20,
      action_url: "/community/profile",
    },
    {
      key: "full_name",
      label: "Full name set",
      completed: pcHasFullName,
      pct: 10,
      action_url: "/community/profile",
    },
    {
      key: "birth_data",
      label: "Birth data complete (date, time & location)",
      completed: pcHasBirthData,
      pct: 25,
      action_url: "/community/profile",
    },
    {
      key: "natal_chart",
      label: "Natal chart generated",
      completed: pcHasNatalChart,
      pct: 20,
      action_url: "/community/charts",
    },
    {
      key: "family_member",
      label: "At least 1 family member added",
      completed: pcHasFamilyMember,
      pct: 10,
      action_url: "/community/family",
    },
    {
      key: "relationship_chart",
      label: "Relationship chart generated",
      completed: pcHasRelationshipChart,
      pct: 15,
      action_url: "/community/charts",
    },
  ];

  const profileCompletionData: ProfileCompletionData = {
    overall_pct: profileCompletionItems
      .filter((i) => i.completed)
      .reduce((sum, i) => sum + i.pct, 0),
    items: profileCompletionItems,
  };

  const profileIsComplete = profileCompletionData.overall_pct >= 100;
  const nextJourneyItem = profileCompletionData.items.find((i) => !i.completed);
  const dashboardFeedItems = await getCommunityDashboardFeed(
    isMysterySchool ? "mystery_school" : "perennial_mandalism"
  );

  // ── Feature quick links ────────────────────────────────────────────────────
  const features = isMysterySchool
    ? [
        {
          icon: BookOpen,
          title: "Learning Library",
          description:
            "Access courses and study materials on astrology, tarot, and esoteric traditions.",
          href: "/community/resources",
        },
        {
          icon: Calendar,
          title: "Live Classes",
          description: "Join weekly live sessions with master practitioners.",
          href: "/community/sessions",
        },
        {
          icon: Users,
          title: "Study Circles",
          description: "Connect with fellow students for practice and discussion.",
          href: "/community/sessions",
        },
        {
          icon: Star,
          title: "Mentored Readings",
          description:
            "Submit practice readings for feedback from senior practitioners.",
          href: "/community/sessions",
        },
      ]
    : [
        {
          icon: Star,
          title: "Wisdom Circles",
          description:
            "Participate in group readings and cosmic event ceremonies.",
          href: "/community/sessions",
        },
        {
          icon: Calendar,
          title: "New Moon Sessions",
          description:
            "Monthly group intention-setting and divination circles.",
          href: "/community/sessions",
        },
        {
          icon: BookOpen,
          title: "Sacred Texts",
          description:
            "Curated library of perennial wisdom and mandalist teachings.",
          href: "/community/resources",
        },
        {
          icon: Users,
          title: "Community Forum",
          description: "Connect with fellow members on your path.",
          href: "/community/sessions",
        },
      ];

  // ── Own chart completeness (server-side, no polling needed) ───────────────
  //
  // Community Dashboard Task 02 (2026-04-24):
  // The logged-in PM member's natal-readiness must be derived from
  // `community_members` (the PM member record that `/community/profile`
  // reads and writes), not from `clients` (a broader client-domain record
  // that can be stale, missing, or unsynced for PM members).
  //
  // Reuse the already-derived booleans `hasDob`, `hasBirthTime`, and
  // `hasBirthCity` computed earlier from `memberBirthFields` so the card,
  // the profile-completion widget, and the progress bar all agree on a
  // single source of truth for the PM member's own birth data.
  //
  // Scope: only the logged-in PM member's own cosmic blueprint card.
  // Household/family-member chart logic is intentionally left unchanged.
  const ownChartMissingFields: string[] = [];
  if (!hasDob) ownChartMissingFields.push("date of birth");
  if (!hasBirthTime) ownChartMissingFields.push("birth time");
  if (!hasBirthCity) ownChartMissingFields.push("birth city");
  const ownChartReady = ownChartMissingFields.length === 0;
  const relationshipChartCount = pcRelCharts.length;

  // ── Quick actions definition ───────────────────────────────────────────────
  //
  // Task 04: natal chart + transits now point at the canonical toolkit routes
  // delivered in Tasks 02 (`/community/horoscope`) and existing
  // `/community/transits`. The "missing birth data" branch still points to
  // `/community/profile` because the user needs to complete their profile
  // before the toolkit page can render a chart.
  const quickActions = [
    {
      icon: ownChartReady ? Star : Sparkles,
      label: ownChartGenerated ? "View Chart" : "Generate Chart",
      href: "/community/charts",
      highlight: !ownChartGenerated && ownChartReady,
    },
    {
      icon: TrendingUp,
      label: "Transits",
      href: "/community/transits",
      highlight: false,
    },
    {
      icon: Flame,
      label: "Create Ritual",
      href: "/community/rituals/new",
      highlight: rituals.length === 0,
    },
    {
      icon: Scroll,
      label: "Sacred Texts",
      href: "/community/resources",
      highlight: false,
    },
    {
      icon: Users,
      label: "Manage Family",
      href: "/community/family",
      highlight: familyMembers.length === 0,
    },
    {
      icon: BookText,
      label: "Book a Reading",
      href: "/astrologers",
      highlight: false,
    },
  ];

  // ── Family Chips Data for Top Card ───────────────────────────────────────
  //
  // community-dashboard-family-chips (2026-04-24):
  //   Task 02 — dedup Self. A family-member row can duplicate the primary
  //             member in two legitimate ways: it was invited (fm.user_id
  //             matches auth.uid()), or legacy rows share the same name.
  //             We skip both.
  //   Task 03 — deterministic order: Self → Spouse/Partner → children →
  //             others → missing-role.
  //   Task 04 — flag missing-role chips so the renderer can show a distinct
  //             "Missing role" treatment instead of the old grey "Member".
  //
  // `relationshipPriority` sorts within known groups and is stable for
  // unknown strings (they all land in the same "others" bucket so their
  // relative order is preserved from the DB query).
  const normalizeRel = (rel: string | null | undefined): string =>
    (rel ?? "").trim().toLowerCase();

  const relationshipPriority = (rel: string): number => {
    const r = normalizeRel(rel);
    if (r === "self" || r === "primary") return 0;
    if (r === "spouse" || r === "partner") return 1;
    if (
      r === "child" ||
      r === "children" ||
      r === "son" ||
      r === "boy" ||
      r === "daughter" ||
      r === "girl"
    )
      return 2;
    if (r === "") return 4; // missing — after known groups
    return 3; // everything else (parent, sibling, friend, other)
  };

  type FamilyChip = {
    id: string;
    name: string;
    relationship: string;
    missingRelationship: boolean;
    sortKey: number;
    isMock?: boolean;
  };

  const primarySelfName = (member.full_name ?? "").trim().toLowerCase();

  const buildRealChips = (): FamilyChip[] => {
    const chips: FamilyChip[] = [
      {
        id: member.id,
        name: member.full_name || "Self",
        relationship: "Self",
        missingRelationship: false,
        sortKey: 0,
      },
    ];

    for (const fm of familyMembers) {
      // Dedup against primary member — stable id first, name fallback.
      const isSameAsPrimaryByUser =
        (fm as { user_id?: string | null }).user_id != null &&
        (fm as { user_id?: string | null }).user_id === user.id;
      const isSameAsPrimaryByName =
        primarySelfName !== "" &&
        (fm.full_name ?? "").trim().toLowerCase() === primarySelfName;
      if (isSameAsPrimaryByUser || isSameAsPrimaryByName) continue;

      const rel = (fm.relationship ?? "").trim();
      const missing = rel === "";
      chips.push({
        id: fm.id,
        name: fm.full_name || "Unknown",
        relationship: missing ? "" : capitalize(rel),
        missingRelationship: missing,
        sortKey: relationshipPriority(rel),
      });
    }

    return chips.sort((a, b) => a.sortKey - b.sortKey);
  };

  const familyChipData: FamilyChip[] =
    planType === "family" && familyMembers.length > 0 ? buildRealChips() : [];
  const maxVisibleFamilyChips = 5;
  const visibleFamilyChips = familyChipData.slice(0, maxVisibleFamilyChips);
  const hiddenFamilyChipCount = Math.max(
    familyChipData.length - visibleFamilyChips.length,
    0
  );
  const showFamilyEmptyState = planType === "family" && familyMembers.length === 0;

  return (
    <SectionContainer verticalPadding="none" className="px-0 sm:px-0 lg:px-0">
      <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{programName}</h1>
          <p className="text-muted-foreground">
            Welcome, {member.full_name ?? "member"} · Member since{" "}
            {new Date(member.joined_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TOP SUMMARY BAR
      ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        {/* Top row: membership badge + member since + profile completion */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Membership type badge */}
            <Badge
              variant="outline"
              className="text-xs font-semibold border-primary/40 bg-primary/5 text-primary"
            >
              {planType === "family"
                ? `${programName} — Family`
                : programName}
            </Badge>
            {/* Subscription status badge */}
            <Badge
              variant={
                member.membership_status === "active"
                  ? "default"
                  : isCancelling
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs capitalize"
            >
              {isCancelling ? "Cancelling" : (member.membership_status ?? "active")}
            </Badge>
            {/* Days remaining until next billing / access end */}
            {daysRemaining !== null && !isCancelling && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 inline-block shrink-0" aria-hidden="true" />
                {daysRemaining === 0
                  ? "Renews today"
                  : `${daysRemaining}d until renewal`}
              </span>
            )}
            {daysRemaining !== null && isCancelling && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <Clock className="size-3 inline-block shrink-0" aria-hidden="true" />
                {daysRemaining === 0
                  ? "Access ends today"
                  : `${daysRemaining}d of access remaining`}
              </span>
            )}
            {/* Next billing date */}
            {renewalDate && !isCancelling && (
              <span className="text-xs text-muted-foreground">
                Next billing:{" "}
                {new Date(renewalDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {isPerennial && pmApiSubscription?.last_payment_date && (
              <span className="text-xs text-muted-foreground">
                Last payment:{" "}
                {new Date(pmApiSubscription.last_payment_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Member since{" "}
              {new Date(member.joined_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {/* Profile completion mini bar */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-40">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Journey
              </span>
              <Progress
                value={profileCompletionData.overall_pct}
                className="h-1.5 flex-1"
                aria-label={`Journey setup ${profileCompletionData.overall_pct}% complete`}
              />
              <span className="text-xs font-bold tabular-nums text-primary">
                {profileCompletionData.overall_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Family Members Row (community-dashboard-family-chips) */}
        {/*
          Task 05 — the visible "Family Members" text label is removed;
            the people icon carries a title/aria-label as its sole anchor.
          Task 06 — more breathing room: mt-6 pushes the row away from
            the metadata row above, gap-4 widens the gap between the row
            and the divider below. gap-y-2 on the chip wrap keeps multi-
            line wraps readable on small screens.
        */}
        {familyChipData.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span
                title="Family members"
                aria-label="Family members"
                role="img"
                className="inline-flex items-center mr-1 shrink-0"
              >
                <Users
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              {visibleFamilyChips.map((chip) => {
                const chipContent = (
                  <>
                    <User className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{chip.name}</span>
                    {/*
                      Task 04 — missing-role chip is visually distinct from
                      the grey fallback. The amber dashed border + italic
                      label + hover/focus title tells the user the row is
                      real but the relationship field hasn't been filled
                      in yet, without looking like a hard error.
                    */}
                    {chip.missingRelationship ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 min-h-0 rounded-full font-medium italic border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-700"
                        title="Relationship is missing for this member"
                      >
                        Missing: relationship
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 min-h-0 rounded-full font-medium border ${getRelationshipBadgeClasses(
                          chip.relationship
                        )}`}
                      >
                        {chip.relationship}
                      </Badge>
                    )}
                  </>
                );

                if (chip.missingRelationship) {
                  return (
                    <Link
                      key={chip.id}
                      href={`/community/family?edit=${encodeURIComponent(chip.id)}`}
                      title={`Complete profile for ${chip.name}`}
                      className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/5 pl-2.5 pr-1 py-1 transition-colors hover:border-amber-500/60 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {chipContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={chip.id}
                    className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 pl-2.5 pr-1 py-1"
                  >
                    {chipContent}
                  </div>
                );
              })}
              {hiddenFamilyChipCount > 0 && (
                <Link
                  href="/community/family"
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View ${hiddenFamilyChipCount} more family member${hiddenFamilyChipCount === 1 ? "" : "s"}`}
                >
                  +{hiddenFamilyChipCount} more
                </Link>
              )}
            </div>
            <div className="h-px w-full bg-border/50" />
          </div>
        )}

        {showFamilyEmptyState && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    No family members added yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your Family plan is active. Add your first household member to
                    start generating charts together.
                  </p>
                </div>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href="/community/family">Add Family Member</Link>
                </Button>
              </div>
            </div>
            <div className="h-px w-full bg-border/50" />
          </div>
        )}

        {/* Quick action buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/community/profile">
              <User className="mr-1.5 size-3.5" />
              My Profile
            </Link>
          </Button>
          {/* Client update 2026-04-24:
              Hide "Manage Subscription" from the top summary quick actions in
              section one. Keep the implementation commented for now instead of
              deleting so it can be restored easily if requirements change. */}
          {/* <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/community/plan">
              <CreditCard className="mr-1.5 size-3.5" />
              Manage Subscription
            </Link>
          </Button> */}
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/astrologers">
              <Compass className="mr-1.5 size-3.5" />
              Get a Reading
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/community/library">
              <BookMarked className="mr-1.5 size-3.5" />
              Sacred Library
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/account/legal">
              <Scroll className="mr-1.5 size-3.5" />
              Agreements
            </Link>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — YOUR MEMBERSHIP
      ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeading icon={CreditCard} title="Your Membership" subtitle="Plan, billing, and profile status" />

        {/* Cancellation warning — access-ends alert */}
        {isCancelling && cancelAt && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <AlertTriangle className="size-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700 dark:text-red-400">
                Access ends on{" "}
                <strong>
                  {new Date(cancelAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
                . Reactivate to keep full access.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 w-full sm:w-auto border-red-500/40 text-red-700 hover:bg-red-500/10">
              <Link href="/community/plan">Reactivate</Link>
            </Button>
          </div>
        )}

        {/* Renewing soon — amber notice */}
        {renewingSoon && renewalDate && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Renewing soon —{" "}
                {new Date(renewalDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <Badge className="shrink-0 self-start sm:self-auto bg-amber-500/15 text-amber-700 border-amber-500/30 text-xs">
              Renewing Soon
            </Badge>
          </div>
        )}

        {/* Rich membership card */}
        <MembershipCard subscription={membershipSubscription} userEmail={user.email} />

        {/* Dedicated Add Perennial Mandalism Member entry point */}
        {membershipSubscription.plan_type === "family" &&
          membershipSubscription.member_count < membershipSubscription.max_members && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 px-5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">Add Perennial Mandalism Member</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Open the full add-member form to enroll a new family member.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/community/members/new">+ Add Member</Link>
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Journey setup progress — horizontal progress bar when not complete; badge when complete.
            This is the WEIGHTED journey metric (photo, birth data, natal chart, family, relationship chart).
            Profile Details data-field % is a separate bar on /community/profile. */}
        {profileIsComplete ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Journey Setup Complete
            </span>
          </div>
        ) : (
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Complete Your Journey Setup</p>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {profileCompletionData.overall_pct}%
                </span>
              </div>
              <Progress
                value={profileCompletionData.overall_pct}
                className="h-2"
                aria-label={`Journey setup ${profileCompletionData.overall_pct}% complete`}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {profileCompletionData.items.filter((i) => !i.completed).length} milestone
                  {profileCompletionData.items.filter((i) => !i.completed).length !== 1 ? "s" : ""} remaining
                </p>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  {/* Legacy CTA always sent users to profile, even when the next
                      journey milestone was chart or family setup:
                      <Link href="/community/profile">Continue Setup →</Link> */}
                  <Link href={nextJourneyItem?.action_url ?? "/community/profile"}>
                    {journeySetupCtaLabel(nextJourneyItem?.key)}
                  </Link>
                </Button>
              </div>
              {/* Legacy inline next-item logic recalculated the first incomplete
                  item here. Kept for traceability; the active UI now reuses
                  nextJourneyItem so the main CTA and inline link cannot diverge.
                  {(() => {
                    const next = profileCompletionData.items.find((i) => !i.completed);
                    return next ? (
                      <p className="text-xs text-muted-foreground">
                        Next: <Link href={next.action_url} className="text-primary hover:underline">{next.label}</Link>
                      </p>
                    ) : null;
                  })()} */}
              {/* Show the same next incomplete item used by the main CTA. */}
              {nextJourneyItem && (
                <p className="text-xs text-muted-foreground">
                  Next: <Link href={nextJourneyItem.action_url} className="text-primary hover:underline">{nextJourneyItem.label}</Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mystery School access / upgrade — secondary CTA, only for Perennial members */}
        {/* {isPerennial && (
          <Card className="border-dashed border-purple-500/30">
            <CardContent className="py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="size-4 shrink-0 text-purple-500" aria-hidden="true" />
                {mysterySchoolHasActiveAccess ? (
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Mystery School access is active
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mysterySchoolStudent?.status === "cancelled" && mysterySchoolAccessUntil
                        ? `Access remains open until ${mysterySchoolAccessUntil}`
                        : mysterySchoolRenewalDate
                        ? `Next renewal ${mysterySchoolRenewalDate}`
                        : "Open your Mystery School dashboard"}
                    </p>
                  </div>
                ) : mysterySchoolNeedsResubscribe ? (
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Mystery School subscription inactive
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mysterySchoolStudent?.status === "paused"
                        ? "Your subscription is paused. Resume with a new payment to reopen access."
                        : "Resubscribe to restore your curriculum access and billing."}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground truncate">
                    Deepen your practice with the Mystery School curriculum
                  </p>
                )}
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 w-full sm:w-auto border-purple-500/40 text-purple-700 hover:bg-purple-500/10">
                <Link href={mysterySchoolHasActiveAccess ? "/mystery-school" : "/mystery-school/enroll"}>
                  {mysterySchoolHasActiveAccess
                    ? "Open Mystery School"
                    : mysterySchoolNeedsResubscribe
                    ? "Rejoin Mystery School"
                    : "Upgrade to Mystery School"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )} */}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK ACTIONS ROW
      ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeading icon={Sparkles} title="Quick Actions" subtitle="Jump into your most-used features" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  action.highlight
                    ? "border-primary/30 bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                    : "border-border bg-card"
                }`}
              >
                {/* Pending action indicator dot */}
                {action.highlight && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}

                <div className={`flex size-9 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${action.highlight ? "bg-primary/15" : "bg-muted"}`}>
                  <Icon className={`size-4 ${action.highlight ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — ASTROLOGY
      ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeading icon={Compass} title="Your Charts & Astrology" subtitle="Birth charts, transits, and cosmic insights" />

        {/* Quick Chart Generation — one-click natal/monthly/relationship */}
        <ChartQuickActions />

        {/* Profile Progress + Astro Charts */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Household Readiness — replaces the legacy two-ring
              "Birth Data Readiness" card. The legacy card claimed
              `Household Members 100%` based on raw count; this one
              reports actual per-member chart-eligibility, chart-ready
              counts, and outstanding-details counts.
              Spec: tasks/06.05.2026/community-dashboard-household-readiness-card/ */}
          <HouseholdReadinessSection
            selfBirthDataPercent={profilePct}
            selfBirthDataComplete={selfBirthDataComplete}
            selfMissingFields={profileMissingFields}
            completeMemberCount={householdCompleteCount}
            totalMemberCount={householdTotalCount}
            missingDetailsCount={householdMissingDetailsCount}
            chartsReadyCount={householdNatalChartsReadyCount}
            chartsEligibleCount={householdNatalChartsEligibleCount}
          />

          {/* Astro Charts polling/display */}
          <AstroChartsSection />
        </div>

        {/* Own natal chart status */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Client update 2026-04-24:
              Hide the standalone own-chart status card for now. This was the
              green "Your Natal Chart / Birth data complete" block. Keep the
              implementation commented instead of deleting it so the dashboard
              can restore this state card later if requirements change. */}
          {/* {ownChartReady ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Star className="size-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">Your Natal Chart</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Birth data complete — open your chart</p>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-primary">
                    <Link href="/community/charts">View Chart →</Link>
                  </Button>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs border-emerald-500/40 text-emerald-700">
                  Ready
                </Badge>
              </CardContent>
            </Card>
          ) : ( */}
          {ownChartReady ? null : (
            <Card className="border-dashed border-amber-500/20">
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/15">
                  <Sparkles className="size-6 text-amber-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Discover your cosmic blueprint</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Generate your birth chart to unlock personalized insights, planetary transits, and cosmic guidance.
                  </p>
                </div>
                <p className="text-xs text-amber-600">
                  Missing: {ownChartMissingFields.join(", ")}
                </p>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href="/community/profile">
                    <Sparkles className="mr-1.5 size-3.5" />
                    Complete Birth Data
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Relationship charts quick stat */}
          {/* Client update 2026-04-24:
              Hide the standalone ready-state relationship-chart stat card for
              now. Keep the implementation commented instead of deleting it so
              this quick-summary card can be restored later if needed. */}
          {/* {relationshipChartCount > 0 ? (
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                  <Heart className="size-5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">Relationship Charts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {relationshipChartCount} chart{relationshipChartCount !== 1 ? "s" : ""} generated
                  </p>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-primary">
                    <Link href="/community/charts">View Charts →</Link>
                  </Button>
                </div>
                <span className="text-2xl font-bold tabular-nums text-violet-600 shrink-0">
                  {relationshipChartCount}
                </span>
              </CardContent>
            </Card>
          ) : ( */}
          {/* Client update 2026-04-30:
              Hide the empty-state relationship chart CTA for now. Keep the
              implementation commented instead of deleting it so it can be
              restored later if requirements change. */}
          {/* {relationshipChartCount > 0 ? null : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-5 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10">
                  <Heart className="size-5 text-violet-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Explore your cosmic connections</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Generate a synastry or composite chart to reveal the unique dynamics between you and a loved one.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/community/charts">
                    <Heart className="mr-1.5 size-3.5" />
                    Generate Chart
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )} */}
        </div>

        {/* Client update 2026-04-24:
            Hide the standalone "Western Natal Chart" promo card for now.
            Keep the implementation commented instead of deleting it so this
            entry point can be restored easily if requirements change. */}
        {/* <Card className="border-sky-500/20 bg-sky-500/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                <Telescope className="size-4 text-sky-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Western Natal Chart</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ownChartReady
                    ? "Your birth data is on file — generate or view your western horoscope."
                    : "Enter your birth details to generate your western natal chart."}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 w-full sm:w-auto border-sky-500/40 text-sky-700 hover:bg-sky-500/10"
            >
              <Link href="/community/charts">
                <Telescope className="mr-1.5 size-3.5" />
                View My Natal Chart
              </Link>
            </Button>
          </CardContent>
        </Card> */}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — SACRED PRACTICE (Perennial only)
      ════════════════════════════════════════════════════════════════════ */}
      {isPerennial && (
        <section className="space-y-4">
          <SectionHeading icon={BookOpen} title="Sacred Study" subtitle="Rituals, services, and spiritual practice" />

          {/* My Rituals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-orange-500" />
                <h3 className="text-sm font-semibold">My Rituals</h3>
                {rituals.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {rituals.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/community/rituals/new">+ Create Ritual</Link>
                </Button>
                {rituals.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/community/rituals">View All</Link>
                  </Button>
                )}
              </div>
            </div>

            {rituals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/10">
                    <Flame className="size-6 text-orange-500" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Begin your sacred practice</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Create your first ritual to deepen your spiritual journey and weave sacred intention into daily life.
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/community/rituals/new">
                      <Flame className="mr-1.5 size-3.5" />
                      Create Ritual
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {rituals.map((r) => (
                  <Card
                    key={r.id}
                    className="transition-colors hover:border-primary/30"
                  >
                    <CardContent className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Flame className="size-4 shrink-0 text-orange-500" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.ritual_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="shrink-0">
                        <Link href={`/community/rituals/${r.id}`}>View →</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sunday Service entry point */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <Sparkles className="size-4 text-amber-600" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">Sunday Service</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Join the weekly community gathering for study, reflection, and ritual.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 w-full sm:w-auto">
                <Link href="/community/sessions">View Schedule</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — YOUR CIRCLE (Perennial only)
      ════════════════════════════════════════════════════════════════════ */}
      {isPerennial && (
        <section className="space-y-4">
          <SectionHeading icon={Heart} title="Your Circle" subtitle="Family members and community connections" />

          {/* Family Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Family & Relationships</h3>
                {familyMembers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {familyMembers.length} member{familyMembers.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/community/family">Manage Family →</Link>
              </Button>
            </div>

            {familyMembers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10">
                    <Heart className="size-6 text-rose-500" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Share the stars with your loved ones</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Add family members to explore their charts together and generate relationship compatibility insights.
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/community/family">
                      <Heart className="mr-1.5 size-3.5" />
                      Add Family Member
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {familyMembers.map((m, idx) => {
                  const completion = calcFamilyProfileCompletion(
                    m as {
                      full_name?: string | null;
                      date_of_birth?: string | null;
                      birth_time?: string | null;
                      birth_time_unknown?: boolean | null;
                      birth_city?: string | null;
                      birth_country?: string | null;
                      relationship?: string | null;
                      natal_chart?: Record<string, unknown> | null;
                    }
                  );
                  const completionPct = completion.percent;
                  const hasNatalChart =
                    deriveNatalReportState(m) === "generated";
                  const profileComplete = completionPct >= 100;
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  // Community Family UX Task 02 (2026-04-24):
                  // Build a compact missing-field summary for incomplete
                  // cards. `completion.missing` is the source of truth
                  // (from calcFamilyProfileCompletion) — we only format
                  // labels for card layout (lowercase, strip the parenthetical
                  // hint on "Birth time (or mark unknown)"). The card line
                  // shows up to two fields inline and "+N more" when the
                  // list is longer, so it never overflows the grid layout.
                  const missingDisplay = completion.missing.map((label) =>
                    label.replace(/\s*\(.*?\)\s*$/, "").toLowerCase()
                  );
                  const missingSummary = (() => {
                    if (missingDisplay.length === 0) return null;
                    if (missingDisplay.length <= 2) {
                      return missingDisplay.join(", ");
                    }
                    const head = missingDisplay.slice(0, 2).join(", ");
                    return `${head} +${missingDisplay.length - 2} more`;
                  })();

                  // Community Family UX Task 04 (2026-04-24):
                  // Deep-link incomplete-member corrective CTAs to the family
                  // index with an edit query param so `/community/family`
                  // opens the inline edit state for the exact member.
                  const completeProfileHref = `/community/family?edit=${encodeURIComponent(m.id)}`;

                  return (
                    <Card key={m.id} className="transition-colors hover:border-primary/30">
                      <CardContent className="py-4 px-4 space-y-3">
                        {/* Top row: avatar + name + chart badge */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}
                          >
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate uppercase">
                              {m.full_name}
                            </p>
                            {m.relationship && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {m.relationship}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] px-1.5 py-0 ${
                              hasNatalChart
                                ? "border-emerald-500/40 text-emerald-700"
                                : "border-amber-500/40 text-amber-700"
                            }`}
                          >
                            {hasNatalChart ? "Chart Ready" : "Chart Pending"}
                          </Badge>
                        </div>

                        {/* Profile details chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {m.date_of_birth && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <CalendarDays className="size-3 shrink-0" />
                              {new Date(m.date_of_birth + "T12:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {m.birth_time && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="size-3 shrink-0" />
                              {m.birth_time}
                            </span>
                          )}
                          {(m.birth_city || m.birth_country) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              {formatBirthPlace(m.birth_city, m.birth_country)}
                            </span>
                          )}
                        </div>

                        {/* Profile completion ring + link */}
                        <div className="flex items-center justify-between gap-3">
                          <ProgressRing
                            percentage={completionPct}
                            size={56}
                            strokeWidth={6}
                            color={ringColor(completionPct)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground leading-snug">
                              Profile {profileComplete ? "complete" : "incomplete"}
                            </p>
                            {/*
                              Task 02 — missing-field summary for incomplete
                              members. `truncate` + `title` makes sure rare
                              long strings still fit the card and remain
                              discoverable on hover.
                            */}
                            {!profileComplete && missingSummary && (
                              <p
                                className="text-[11px] text-amber-600/90 leading-snug mt-0.5 truncate"
                                title={`Missing: ${missingDisplay.join(", ")}`}
                              >
                                Missing: {missingSummary}
                              </p>
                            )}
                            {/*
                              Task 03 — helper line on the complete-but-no-chart
                              state so the user sees at a glance that chart
                              generation is the next step, not more profile
                              editing.
                            */}
                            {profileComplete && !hasNatalChart && (
                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                Ready to generate chart
                              </p>
                            )}
                            {!profileComplete && (
                              <Button asChild variant="link" size="sm" className="h-auto p-0 mt-0.5 text-xs text-primary">
                                <Link href={completeProfileHref}>
                                  Complete Profile →
                                </Link>
                              </Button>
                            )}
                            {profileComplete && !hasNatalChart && (
                              <Button asChild variant="link" size="sm" className="h-auto p-0 mt-0.5 text-xs text-primary">
                                <Link href={`/community/family/${m.id}`}>
                                  Generate Chart →
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
{/* <Card className="border-dashed">
  <CardContent className="flex items-center justify-center py-3">
    <Button asChild variant="ghost" size="sm">
      <Link href="/community/charts">
        <TrendingUp className="mr-1.5 size-3.5" />
        Explore Compatibility
      </Link>
    </Button>
  </CardContent>
</Card> */}
              </div>
            )}
          </div>

          {/* Community Members */}
          {otherMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Community Members</h3>
                <Badge variant="outline" className="text-xs">
                  {otherMembers.length}+ connected
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {otherMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {(m.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium">{m.full_name ?? "Member"}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {m.membership_type === "mystery_school" ? "MS" : "PM"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — SACRED STUDY (library / wisdom / articles)
      ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeading icon={BookMarked} title="Sacred Library" subtitle="Wisdom teachings, articles, and study materials" />

        {/* Content Library */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookMarked className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Content Library</h3>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/community/library">View All →</Link>
            </Button>
          </div>
          <DashboardFeedPreview items={dashboardFeedItems} />
        </div>

        {/* Recent Spiritual Wisdom */}
        {recentWisdom.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Spiritual Wisdom</h3>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/community/resources">View All →</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recentWisdom.map((item) => (
                <Card key={item.id} className="transition-colors hover:border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm leading-snug line-clamp-2">
                      {item.title}
                    </CardTitle>
                    {item.descriptive_title && (
                      <CardDescription className="text-xs line-clamp-1">
                        {item.descriptive_title}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.type ?? "text"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Blog Posts */}
        {recentBlog.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-blue-500" />
                <h3 className="text-sm font-semibold">Latest Articles</h3>
              </div>
            </div>
            <div className="space-y-2">
              {recentBlog.map((post) => (
                <Card key={post.id} className="transition-colors hover:border-primary/30">
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {post.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {post.category}
                          </Badge>
                        )}
                        {post.published_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — COMMUNITY (events, sessions, broadcasts)
      ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeading icon={Users} title="Community" subtitle="Events, sessions, and fellow seekers" />

        {/* Feature quick links */}
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="transition-colors hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={f.href}>Explore</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — MYSTERY SCHOOL (Perennial upgrade — last, not first)
      ════════════════════════════════════════════════════════════════════ */}
      {isPerennial && (
        <section>
          <SectionHeading icon={GraduationCap} title="Mystery School" subtitle="Deepen your practice with structured study" />
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-900 border border-purple-500/30 px-6 py-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/20">
                <GraduationCap className="size-7 text-purple-300" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-tight">The Mystery School Awaits You</p>
                <p className="text-xs text-purple-300/80 mt-0.5">Sacred Gateway — Next Seasonal Cohort Open</p>
              </div>
            </div>
            {mysterySchoolHasActiveAccess ? (
              <>
                <p className="text-sm text-purple-100/80 max-w-2xl leading-relaxed">
                  Your Mystery School subscription is already linked to this account. Continue your curriculum, review your cohort details, and return to the active decan journey from here.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-xl border border-purple-400/20 bg-black/15 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200/70">Status</p>
                    <p className="mt-1 text-sm font-semibold text-white capitalize">
                      {mysterySchoolStudent?.status === "cancelled" && mysterySchoolAccessUntil
                        ? "Cancelled · Access Active"
                        : mysterySchoolStudent?.status ?? "Active"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-400/20 bg-black/15 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200/70">Enrolled</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {mysterySchoolEnrolledDate ?? "Recently"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-400/20 bg-black/15 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200/70">Billing</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {mysterySchoolBillingLabel}
                    </p>
                    {mysterySchoolEnrollmentFeeLabel ? (
                      <p className="mt-1 text-xs text-purple-200/70">
                        Enrollment paid {mysterySchoolEnrollmentFeeLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-purple-400/20 bg-black/15 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200/70">
                      {mysterySchoolStudent?.status === "cancelled" ? "Access Until" : "Next Renewal"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {mysterySchoolStudent?.status === "cancelled"
                        ? (mysterySchoolAccessUntil ?? "Pending Stripe sync")
                        : (mysterySchoolRenewalDate ?? "Managed in Stripe")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-400/20 bg-black/15 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200/70">Cohort</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {mysterySchoolEntryLabel ?? "Seasonal Entry"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="default"
                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-purple-900/40"
                  >
                    <Link href="/mystery-school/training">
                      Open Mystery School →
                    </Link>
                  </Button>
                  <ManageSubscriptionButton
                    size="default"
                    variant="outline"
                    className="border-purple-300/30 bg-white/5 text-white hover:bg-white/10"
                  />
                </div>
              </>
            ) : mysterySchoolNeedsResubscribe ? (
              <>
                <p className="text-sm text-purple-100/80 max-w-xl leading-relaxed">
                  {mysterySchoolStudent?.status === "paused"
                    ? "Your Mystery School subscription is paused. Make a new payment to restore dashboard access and continue the curriculum."
                    : "Your previous Mystery School access has ended. Rejoin to restore your curriculum, return to the current cohort path, and continue your structured study."}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-sm text-purple-100/70">
                    Rejoin from{" "}
                    <span className="font-bold text-white">$97 one-time</span>
                    {" "}+{" "}
                    <span className="font-bold text-white">$27/month</span>
                  </div>
                </div>
                <Button
                  asChild
                  size="default"
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-purple-900/40"
                >
                  <Link href="/mystery-school/enroll">Rejoin the Sacred Gateway →</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-purple-100/80 max-w-xl leading-relaxed">
                  Deepen your practice with the 12-week foundation and year-long decan curriculum.
                  Join the next seasonal cohort and unlock ancient wisdom through structured, mentored study.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-sm text-purple-100/70">
                    From{" "}
                    <span className="font-bold text-white">$97 one-time</span>
                    {" "}+{" "}
                    <span className="font-bold text-white">$27/month</span>
                    {pmDiscountEnabled && (
                      <>
                        {" "}— current PM monthly member rate{" "}
                        <span className="font-bold text-amber-300">$17.03/month</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  asChild
                  size="default"
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-purple-900/40"
                >
                  <Link href="/mystery-school/enroll">Enter the Sacred Gateway →</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DONATE BANNER — bottom, after all content
      ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <HandHeart className="size-5 text-amber-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-tight">
              Support the Sacred Journey
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-snug mt-0.5 line-clamp-2 sm:line-clamp-1">
              Your generosity sustains this community, funds new content, and keeps the wisdom flowing.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="shrink-0 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
        >
          <a href="https://divineinfinitebeing.com/donate" target="_blank" rel="noopener noreferrer">
            Donate Now
          </a>
        </Button>
      </div>
      </div>
    </SectionContainer>
  );
}
