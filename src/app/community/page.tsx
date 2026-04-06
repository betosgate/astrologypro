import { createClient } from "@/lib/supabase/server";
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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import Link from "next/link";
import { AstroChartsSection } from "@/components/community/astro-charts-section";
import { ProfileProgressSection } from "@/components/community/profile-progress-section";
import { MembershipCard, type MembershipSubscription } from "@/components/community/membership-card";
import { ProfileCompletionCard, type ProfileCompletionData } from "@/components/community/profile-completion-card";
import { ProgressRing } from "@/components/community/progress-ring";
import { MandalismContentPreview, type MandalismContent } from "@/components/community/mandalism-content-preview";

export const metadata = { title: "Community - AstrologyPro" };
export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Calculate profile completion % for a family member.
 * Weights: full_name 20%, date_of_birth 15%, birth_time 15%,
 *          birth_city 15%, birth_country 15%, relationship 10%, natal_chart 10%
 */
function calcFamilyMemberPct(m: {
  full_name?: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_city?: string | null;
  birth_country?: string | null;
  relationship?: string | null;
  natal_chart?: Record<string, unknown> | null;
}): number {
  let pct = 0;
  if (m.full_name?.trim()) pct += 20;
  if (m.date_of_birth) pct += 15;
  if (m.birth_time) pct += 15;
  if (m.birth_city?.trim()) pct += 15;
  if (m.birth_country?.trim()) pct += 15;
  if (m.relationship?.trim()) pct += 10;
  if (m.natal_chart && Object.keys(m.natal_chart).length > 0) pct += 10;
  return pct;
}

function ringColor(pct: number): string {
  if (pct >= 100) return "hsl(142, 71%, 45%)";
  if (pct >= 60) return "hsl(var(--primary))";
  return "hsl(25, 90%, 55%)";
}

const AVATAR_COLORS = [
  "bg-rose-500/15 text-rose-600",
  "bg-violet-500/15 text-violet-600",
  "bg-sky-500/15 text-sky-600",
  "bg-amber-500/15 text-amber-600",
  "bg-emerald-500/15 text-emerald-600",
];

export default async function CommunityDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select(
      "id, full_name, email, membership_type, membership_status, plan_type, joined_at, expires_at, pm_tier_id, current_period_end, extra_member_count"
    )
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");

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
    perennial_mandalism: { individual: 9.97, family: 19.97 },
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
    mandalismItemsResult,
    profileCompletionFamilyResult,
    profileCompletionRelChartResult,
    pmTierResult,
  ] = await Promise.all([
    // Client profile for progress ring calculation
    supabase
      .from("clients")
      .select("birth_date, birth_time, birth_city")
      .eq("user_id", user.id)
      .single(),

    // Family members — full fields for profile completion rings
    supabase
      .from("community_family_members")
      .select(
        "id, full_name, relationship, date_of_birth, birth_time, birth_city, birth_country, natal_chart"
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

    // Mandalism content preview — latest 8 published items
    supabase
      .from("mandalism_content")
      .select(
        "id, title, content_type, access_control, url, pdf_url, content_thumbnail_url, duration_label, description, start_at, end_at, priority"
      )
      .eq("is_published", true)
      .or(`access_control.eq.free,access_control.eq.members`)
      .order("priority", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),

    // Profile completion: family members with natal_chart data
    supabase
      .from("community_family_members")
      .select("id, natal_chart")
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
  ]);

  const client = clientResult.data;
  const familyMembers = familyMembersResult.data ?? [];
  const otherMembers = otherMembersResult.data ?? [];
  const recentWisdom = recentWisdomResult.data ?? [];
  const recentBlog = recentBlogResult.data ?? [];
  const rituals = ritualsResult.data ?? [];
  const mandalismItems = (mandalismItemsResult.data ?? []) as MandalismContent[];
  const pcFamilyMembers = profileCompletionFamilyResult.data ?? [];
  const pcRelCharts = profileCompletionRelChartResult.data ?? [];
  const pmTier = pmTierResult.data ?? null;

  // ── Membership card subscription prop ────────────────────────────────────
  // Max members: from tier table if available, else derive from plan_type
  const maxMembers: number =
    (pmTier as { max_total_members?: number } | null)?.max_total_members ??
    (planType === "family" ? 5 : 1);

  // family count: family members + the primary member
  const memberCount =
    planType === "family"
      ? Math.min((familyMembers?.length ?? 0) + 1, maxMembers)
      : 1;

  // Tier display name: use pm_plan_tiers.name if available
  const tierName: string | null =
    (pmTier as { name?: string } | null)?.name ??
    PLAN_LABELS[membershipType]?.[planType] ??
    null;

  // Best renewal date: prefer current_period_end (Stripe), fallback expires_at
  const renewalDate: string | null =
    (member as { current_period_end?: string | null }).current_period_end ??
    member.expires_at ??
    null;

  const membershipSubscription: MembershipSubscription = {
    membership_type: membershipType,
    plan_type: planType,
    plan_label:
      PLAN_LABELS[membershipType]?.[planType] ??
      PLAN_LABELS["perennial_mandalism"]["individual"],
    tier_name: tierName,
    status: member.membership_status ?? "active",
    amount:
      PLAN_AMOUNTS[membershipType]?.[planType] ??
      PLAN_AMOUNTS["perennial_mandalism"]["individual"],
    currency: "usd",
    billing_cycle: "monthly",
    renewal_date: renewalDate,
    created_at: member.joined_at,
    member_count: memberCount,
    max_members: maxMembers,
  };

  // ── Legacy profile completion percentage (birth-data-only ring) ──────────
  let profilePct = 0;
  if (client?.birth_date) profilePct += 34;
  if (client?.birth_time) profilePct += 33;
  if (client?.birth_city) profilePct += 33;

  // ── Full profile completion data (weighted, for ProfileCompletionCard) ────
  const hasPhoto = Boolean(
    user.user_metadata?.avatar_url &&
      String(user.user_metadata.avatar_url).trim() !== ""
  );
  const pcHasFullName = Boolean(member.full_name && member.full_name.trim() !== "");
  const pcHasBirthData = Boolean(
    client?.birth_date && client?.birth_time && client?.birth_city
  );
  const pcHasNatalChart = pcFamilyMembers.some(
    (fm) =>
      fm.natal_chart != null &&
      Object.keys(fm.natal_chart as Record<string, unknown>).length > 0
  );
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
      action_url: "/community/family",
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
      action_url: "/community/family",
    },
  ];

  const profileCompletionData: ProfileCompletionData = {
    overall_pct: profileCompletionItems
      .filter((i) => i.completed)
      .reduce((sum, i) => sum + i.pct, 0),
    items: profileCompletionItems,
  };

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
  const ownChartMissingFields: string[] = [];
  if (!client?.birth_date) ownChartMissingFields.push("date of birth");
  if (!client?.birth_time) ownChartMissingFields.push("birth time");
  if (!client?.birth_city) ownChartMissingFields.push("birth city");
  const ownChartReady = ownChartMissingFields.length === 0;
  const relationshipChartCount = pcRelCharts.length;

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════════
          A. DONATE BANNER — top of page, before everything
      ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <HandHeart className="size-5 text-amber-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-tight">
              Support the Sacred Journey
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-snug mt-0.5 line-clamp-1">
              Your generosity sustains this community, funds new content, and keeps the wisdom flowing. Every gift matters.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
        >
          <a href="https://divineinfinitebeing.com/donate" target="_blank" rel="noopener noreferrer">
            Donate Now ❤
          </a>
        </Button>
      </div>

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
        <Badge
          variant={member.membership_status === "active" ? "default" : "secondary"}
        >
          {member.membership_status}
        </Badge>
      </div>

      {member.expires_at && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-3">
            <p className="text-sm text-amber-600">
              Membership expires{" "}
              {new Date(member.expires_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── C. Rich Membership Info Card ────────────────────────────────────── */}
      <MembershipCard subscription={membershipSubscription} />

      {/* ── PM Profile Completion Card ─────────────────────────────────────── */}
      <ProfileCompletionCard initialData={profileCompletionData} />

      {/* ── Profile Progress + Astro Charts ────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Profile Completion Progress Ring */}
        <ProfileProgressSection profilePct={profilePct} membersCount={otherMembers.length} />

        {/* Astro Charts polling/display */}
        <AstroChartsSection />
      </section>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════
          E. OWN CHART HIGHLIGHT — server-side, above family section
      ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="size-4 text-amber-500" />
          <h2 className="text-base font-semibold">Astro Overview</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Own natal chart status */}
          <Card className={ownChartReady ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${ownChartReady ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
                <Star className={`size-5 ${ownChartReady ? "text-emerald-600" : "text-amber-600"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">Your Natal Chart</p>
                {ownChartReady ? (
                  <>
                    <p className="text-xs text-emerald-600 mt-0.5">Birth data complete — ready to generate</p>
                    <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-primary">
                      <Link href="/community/family">View Charts →</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Missing: {ownChartMissingFields.join(", ")}
                    </p>
                    <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-primary">
                      <Link href="/community/profile">Complete Your Profile →</Link>
                    </Button>
                  </>
                )}
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-xs ${ownChartReady ? "border-emerald-500/40 text-emerald-700" : "border-amber-500/40 text-amber-700"}`}
              >
                {ownChartReady ? "Ready" : "Incomplete"}
              </Badge>
            </CardContent>
          </Card>

          {/* Relationship charts quick stat */}
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                <Heart className="size-5 text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">Relationship Charts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {relationshipChartCount > 0
                    ? `${relationshipChartCount} chart${relationshipChartCount !== 1 ? "s" : ""} generated`
                    : "No charts generated yet"}
                </p>
                <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-primary">
                  <Link href="/community/charts">
                    {relationshipChartCount > 0 ? "View Charts →" : "Generate a Chart →"}
                  </Link>
                </Button>
              </div>
              <span className="text-2xl font-bold tabular-nums text-violet-600 shrink-0">
                {relationshipChartCount}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── My Rituals ─────────────────────────────────────────────────────── */}
      {isPerennial && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              <h2 className="text-base font-semibold">My Rituals</h2>
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
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/10">
                  <Flame className="size-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">No rituals yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create your first ritual invocation to get started.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/community/rituals/new">Create a Ritual</Link>
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.ritual_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link href={`/community/rituals/${r.id}`}>View →</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          D. FAMILY MEMBERS — with profile completion rings
      ════════════════════════════════════════════════════════════════════ */}
      {isPerennial && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-rose-500" />
              <h2 className="text-base font-semibold">Family & Relationships</h2>
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
            <Card>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">No family members added</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add family members to generate natal charts and compatibility reports.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/community/family">Add Member</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((m, idx) => {
                const completionPct = calcFamilyMemberPct(
                  m as {
                    full_name?: string | null;
                    date_of_birth?: string | null;
                    birth_time?: string | null;
                    birth_city?: string | null;
                    birth_country?: string | null;
                    relationship?: string | null;
                    natal_chart?: Record<string, unknown> | null;
                  }
                );
                const hasNatalChart =
                  m.natal_chart != null &&
                  Object.keys(m.natal_chart as Record<string, unknown>).length > 0;
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

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
                        {m.birth_city && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            {m.birth_city}
                            {m.birth_country ? `, ${m.birth_country}` : ""}
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
                            Profile {completionPct < 100 ? "incomplete" : "complete"}
                          </p>
                          {completionPct < 100 && (
                            <Button asChild variant="link" size="sm" className="h-auto p-0 mt-0.5 text-xs text-primary">
                              <Link href={`/community/family/${m.id}`}>
                                Complete Profile →
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-3">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/community/charts">
                      <TrendingUp className="mr-1.5 size-3.5" />
                      Explore Compatibility
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* ── Members Connected ───────────────────────────────────────────────── */}
      {otherMembers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Community Members</h2>
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
        </section>
      )}

      <Separator />

      {/* ── Content Library ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Content Library</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/community/library">View All →</Link>
          </Button>
        </div>
        <MandalismContentPreview initialItems={mandalismItems} />
      </section>

      {/* ── Recent Spiritual Wisdom ────────────────────────────────────────── */}
      {recentWisdom.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <h2 className="text-base font-semibold">Spiritual Wisdom</h2>
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
        </section>
      )}

      {/* ── Recent Blog Posts ──────────────────────────────────────────────── */}
      {recentBlog.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-blue-500" />
              <h2 className="text-base font-semibold">Latest Articles</h2>
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
        </section>
      )}

      {/* ── Mystery School nav for existing MS members ─────────────────────── */}
      {isMysterySchool && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/10">
          <CardContent className="space-y-3 py-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">Continue Your Studies</p>
              <p className="text-sm text-muted-foreground mt-1">
                Access your Mystery School curriculum, decan work, and live training sessions.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/training">Go to Training →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* ── Feature Quick Links ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Explore</h2>
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
          B. MYSTERY SCHOOL BANNER — bottom, PM members only, full-width
      ════════════════════════════════════════════════════════════════════ */}
      {isPerennial && (
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
              {" "}— or{" "}
              <span className="font-bold text-amber-300">+$17.03/month</span>
              {" "}upgrade for PM members
            </div>
          </div>
          <Button
            asChild
            size="default"
            className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-purple-900/40"
          >
            <Link href="/community/upgrade">Enter the Sacred Gateway →</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
