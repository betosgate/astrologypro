import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  User,
  ExternalLink,
  ArrowUpRight,
  Star,
  UserCheck,
  Ban,
  Bell,
  UserPlus,
  Gift,
  RefreshCw,
  Target,
} from "lucide-react";
import { ProfileStrength } from "@/components/dashboard/profile-strength";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RoiBanner } from "@/components/dashboard/roi-banner";
import { RoleUpgradeBanners } from "@/components/dashboard/role-upgrade-banners";
import { TodaysSessions } from "@/components/dashboard/todays-sessions";
import { PlanetaryReturns } from "@/components/dashboard/planetary-returns";

export const metadata = {
  title: "Dashboard Overview",
};

function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getMonthAbbr(monthsAgo: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select(
      "id, display_name, username, avatar_url, bio, tagline, specialties, stripe_account_id, google_calendar_token, is_certified"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Check complementary roles for cross-sell banners
  const [traineeCheck, pmCheck] = await Promise.all([
    admin.from("trainees").select("id").eq("user_id", user.id).maybeSingle(),
    admin
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("membership_type", "perennial_mandalism")
      .eq("membership_status", "active")
      .maybeSingle(),
  ]);
  const isTrainee = !!traineeCheck.data;
  const isPerennialMandalism = !!pmCheck.data;

  // Current month range
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Last 7 days for check-ins
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Last 30 days for no-show rate
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all stats in parallel — chart queries run separately to avoid spread union type issue
  const [
    thisMonthBookings,
    lastMonthBookings,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthClients,
    lastMonthClients,
    upcomingResult,
    activeServicesResult,
    approvedTestimonialsResult,
    todaysSessionsResult,
    // New blocks
    testimonialsResult,
    allClientsResult,
    recentBookingsResult,
    pendingFollowUpsResult,
    recentCheckInsResult,
    giftCertificatesResult,
    activeSubscriptionsResult,
    activeCampaignsResult,
  ] = await Promise.all([
    // This month bookings
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", thisMonth.start)
      .lt("created_at", thisMonth.end),
    // Last month bookings
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", lastMonth.start)
      .lt("created_at", lastMonth.end),
    // This month revenue (completed)
    supabase
      .from("bookings")
      .select("total_amount")
      .eq("diviner_id", diviner.id)
      .eq("status", "completed")
      .gte("created_at", thisMonth.start)
      .lt("created_at", thisMonth.end),
    // Last month revenue (completed)
    supabase
      .from("bookings")
      .select("total_amount")
      .eq("diviner_id", diviner.id)
      .eq("status", "completed")
      .gte("created_at", lastMonth.start)
      .lt("created_at", lastMonth.end),
    // This month new clients
    supabase
      .from("client_diviners")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", thisMonth.start)
      .lt("created_at", thisMonth.end),
    // Last month new clients
    supabase
      .from("client_diviners")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", lastMonth.start)
      .lt("created_at", lastMonth.end),
    // Upcoming bookings
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, status, total_amount, services(name), clients(full_name, email)"
      )
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    // Active services count
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .eq("is_active", true),
    // Approved testimonials count
    supabase
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .eq("status", "approved"),
    // Today's sessions
    supabase
      .from("bookings")
      .select("id, scheduled_at, services(name), clients(full_name, email)")
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString())
      .order("scheduled_at", { ascending: true }),
    // Block: Testimonials (all statuses for pending + avg rating)
    admin
      .from("testimonials")
      .select("id, rating, status")
      .eq("diviner_id", diviner.id),
    // Block: Client Retention (total_sessions per client)
    admin
      .from("client_diviners")
      .select("id, total_sessions")
      .eq("diviner_id", diviner.id),
    // Block: No-Show Rate (last 30 days)
    admin
      .from("bookings")
      .select("id, status")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // Block: Pending Follow-Ups (unsent + due)
    admin
      .from("follow_up_sequences")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .is("sent_at", null)
      .lte("scheduled_at", new Date().toISOString()),
    // Block: Check-Ins (last 7 days)
    admin
      .from("check_ins")
      .select("id, first_name, last_name, created_at")
      .eq("diviner_id", diviner.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    // Block: Gift Certificates (unredeemed)
    admin
      .from("gift_certificates")
      .select("id, amount, remaining_amount")
      .eq("diviner_id", diviner.id)
      .is("redeemed_at", null),
    // Block: Weekly Subscriptions (active)
    admin
      .from("client_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .eq("subscription_type", "weekly_updates")
      .eq("status", "active"),
    // Block: Active Affiliate Campaigns
    admin
      .from("affiliate_campaigns")
      .select("id, name, budget_cap_cents, spent_cents")
      .eq("diviner_id", diviner.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // Chart revenue — separate Promise.all to avoid spread union type inference issues
  const chartRaw = await Promise.all(
    [5, 4, 3, 2, 1, 0].map((m) => {
      const range = getMonthRange(m);
      return supabase
        .from("bookings")
        .select("total_amount")
        .eq("diviner_id", diviner.id)
        .eq("status", "completed")
        .gte("created_at", range.start)
        .lt("created_at", range.end);
    })
  );

  const thisMonthBookingCount = thisMonthBookings.count ?? 0;
  const lastMonthBookingCount = lastMonthBookings.count ?? 0;
  const thisMonthRevenueTotal =
    thisMonthRevenue.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;
  const lastMonthRevenueTotal =
    lastMonthRevenue.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;
  const thisMonthClientCount = thisMonthClients.count ?? 0;
  const lastMonthClientCount = lastMonthClients.count ?? 0;
  const upcomingBookings = upcomingResult.data ?? [];

  // Today's sessions
  const todaysSessions = (todaysSessionsResult.data ?? []).map(
    (booking: any) => ({
      id: booking.id,
      scheduled_at: booking.scheduled_at,
      client_name:
        booking.clients?.full_name ?? booking.clients?.email ?? "Client",
      service_name: booking.services?.name ?? "Session",
    })
  );
  const nextSessionDate =
    upcomingBookings.length > 0 ? upcomingBookings[0].scheduled_at : null;

  // Chart data
  const monthlyChartData = chartRaw.map((result, index) => ({
    month: getMonthAbbr(5 - index),
    revenue:
      result.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0,
  }));

  // ── New block computations ──────────────────────────────────────────────

  // Testimonials
  const allTestimonials = testimonialsResult.data ?? [];
  const pendingTestimonials = allTestimonials.filter((t) => t.status === "pending").length;
  const approvedWithRating = allTestimonials.filter(
    (t) => t.status === "approved" && t.rating != null
  );
  const avgRating =
    approvedWithRating.length > 0
      ? (
          approvedWithRating.reduce((s, t) => s + (t.rating ?? 0), 0) /
          approvedWithRating.length
        ).toFixed(1)
      : null;

  // Client Retention
  const allClients = allClientsResult.data ?? [];
  const repeatClients = allClients.filter((c) => (c.total_sessions ?? 0) > 1).length;
  const retentionPct =
    allClients.length > 0
      ? Math.round((repeatClients / allClients.length) * 100)
      : 0;

  // No-Show Rate (last 30 days)
  const recentBookings = recentBookingsResult.data ?? [];
  const noShowCount = recentBookings.filter(
    (b) => b.status === "no_show" || b.status === "canceled"
  ).length;
  const noShowRate =
    recentBookings.length > 0
      ? Math.round((noShowCount / recentBookings.length) * 100)
      : 0;

  // Follow-Ups
  const pendingFollowUps = pendingFollowUpsResult.count ?? 0;

  // Check-Ins
  const recentCheckIns = recentCheckInsResult.data ?? [];

  // Gift Certificates
  const unreedeemedCerts = giftCertificatesResult.data ?? [];
  const totalCertValue = unreedeemedCerts.reduce(
    (s, c) => s + (Number(c.remaining_amount ?? c.amount) ?? 0),
    0
  );

  // Weekly Subscriptions
  const activeSubCount = activeSubscriptionsResult.count ?? 0;

  // Active Campaigns
  const activeCampaigns = activeCampaignsResult.data ?? [];
  const totalCampaignBudget = activeCampaigns.reduce(
    (s, c) => s + (c.budget_cap_cents ?? 0),
    0
  );
  const totalCampaignSpent = activeCampaigns.reduce(
    (s, c) => s + (c.spent_cents ?? 0),
    0
  );

  // ── Comparison helpers ──────────────────────────────────────────────────
  function compareStat(current: number, previous: number) {
    const diff = current - previous;
    if (diff === 0) return { text: "Same as last month", positive: null };
    const prefix = diff > 0 ? "+" : "";
    return {
      text: `${prefix}${diff} vs last month`,
      positive: diff > 0,
    };
  }

  function compareRevenue(current: number, previous: number) {
    if (previous === 0 && current === 0)
      return { text: "No revenue yet", positive: null };
    if (previous === 0)
      return { text: "First month with revenue!", positive: true };
    const pctChange = Math.round(((current - previous) / previous) * 100);
    const prefix = pctChange >= 0 ? "+" : "";
    return {
      text: `${prefix}${pctChange}% vs last month`,
      positive: pctChange >= 0,
    };
  }

  const bookingComparison = compareStat(thisMonthBookingCount, lastMonthBookingCount);
  const revenueComparison = compareRevenue(thisMonthRevenueTotal, lastMonthRevenueTotal);
  const clientComparison = compareStat(thisMonthClientCount, lastMonthClientCount);

  const stats = [
    {
      label: "This Month Revenue",
      value: formatCurrency(thisMonthRevenueTotal),
      icon: DollarSign,
      comparison: revenueComparison,
      href: "/dashboard/reports",
    },
    {
      label: "This Month Bookings",
      value: thisMonthBookingCount,
      icon: Calendar,
      comparison: bookingComparison,
      href: "/dashboard/bookings",
    },
    {
      label: "New Clients",
      value: thisMonthClientCount,
      icon: Users,
      comparison: clientComparison,
      href: "/dashboard/clients",
    },
    {
      label: "Upcoming",
      value: upcomingBookings.length,
      icon: TrendingUp,
      comparison: { text: "Scheduled sessions", positive: null },
      href: "/dashboard/bookings",
    },
  ];

  const profileUrl = `astrologypro.com/${diviner.username}`;
  const isCertified = !!(diviner as Record<string, unknown>).is_certified;

  return (
    <div className="space-y-8">
      {/* Certified badge CTA */}
      {!isCertified && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="size-4 shrink-0" />
            <span>
              <span className="font-medium">Get certified</span> — earn your Divine Infinite Being Certified badge and stand out on the discover page.
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="ml-4 shrink-0 text-xs font-medium text-amber-500 hover:text-amber-400 underline underline-offset-2"
          >
            Learn more
          </Link>
        </div>
      )}

      {/* Cross-sell banners */}
      <RoleUpgradeBanners
        isDiviner={true}
        isTrainee={isTrainee}
        isPerennialMandalism={isPerennialMandalism}
      />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here is an overview of your practice.
          </p>
        </div>
        <Link
          href={`/${diviner.username}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
          {profileUrl}
        </Link>
      </div>

      {/* Today's Sessions Quick-Start */}
      <TodaysSessions sessions={todaysSessions} nextSessionDate={nextSessionDate} />

      {/* Planetary Returns */}
      <PlanetaryReturns divinerId={diviner.id} />

      {/* Profile Completion */}
      <ProfileStrength
        diviner={{
          avatar_url: diviner.avatar_url,
          bio: diviner.bio,
          tagline: diviner.tagline,
          specialties: diviner.specialties,
          stripe_account_id: diviner.stripe_account_id,
          google_calendar_token: diviner.google_calendar_token,
        }}
        activeServicesCount={activeServicesResult.count ?? 0}
        approvedTestimonialCount={approvedTestimonialsResult.count ?? 0}
      />

      {/* ROI Banner */}
      <RoiBanner monthlyRevenue={thisMonthRevenueTotal} />

      {/* Primary KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const comparison = stat.comparison;
          return (
            <Card key={stat.label} className="relative group hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
                <Link
                  href={stat.href}
                  className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                  title="View details"
                >
                  <Icon className="size-4" />
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </CardHeader>
              <CardContent>
                <Link href={stat.href} className="block">
                  <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stat.value}</div>
                </Link>
                <p
                  className={`flex items-center gap-1 text-xs ${
                    comparison.positive === true
                      ? "text-green-500"
                      : comparison.positive === false
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {comparison.positive === true && <TrendingUp className="size-3" />}
                  {comparison.positive === false && <TrendingDown className="size-3" />}
                  {comparison.text}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary KPI Stats — Practice Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Testimonials */}
        <Card className="group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Testimonials</CardDescription>
            <Link href="/dashboard/testimonials" className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors" title="View testimonials">
              <Star className="size-4" />
              <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/testimonials" className="block">
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                {avgRating ? `${avgRating} ★` : "—"}
              </div>
            </Link>
            <p className="text-xs text-muted-foreground">
              {approvedWithRating.length} approved
              {pendingTestimonials > 0 && (
                <span className="ml-1 text-amber-500">· {pendingTestimonials} pending</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Client Retention */}
        <Card className="group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Client Retention</CardDescription>
            <Link href="/dashboard/clients" className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors" title="View clients">
              <UserCheck className="size-4" />
              <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/clients" className="block">
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">{retentionPct}%</div>
            </Link>
            <p className="text-xs text-muted-foreground">
              {repeatClients} of {allClients.length} clients returned
            </p>
          </CardContent>
        </Card>

        {/* No-Show Rate */}
        <Card className="group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">No-Show Rate</CardDescription>
            <Link href="/dashboard/bookings" className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors" title="View bookings">
              <Ban className="size-4" />
              <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/bookings" className="block">
              <div className={`text-2xl font-bold group-hover:text-primary transition-colors ${noShowRate > 20 ? "text-red-500" : ""}`}>
                {noShowRate}%
              </div>
            </Link>
            <p className="text-xs text-muted-foreground">
              {noShowCount} of {recentBookings.length} bookings (30 days)
            </p>
          </CardContent>
        </Card>

        {/* Follow-Ups Pending */}
        <Card className="group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Follow-Ups Due</CardDescription>
            <Link href="/dashboard/follow-ups" className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors" title="View follow-ups">
              <Bell className="size-4" />
              <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/follow-ups" className="block">
              <div className={`text-2xl font-bold group-hover:text-primary transition-colors ${pendingFollowUps > 0 ? "text-amber-500" : ""}`}>
                {pendingFollowUps}
              </div>
            </Link>
            <p className="text-xs text-muted-foreground">
              {pendingFollowUps === 0 ? "All caught up" : "Unsent sequences due"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Revenue — Last 6 Months</CardTitle>
            <CardDescription>Monthly revenue from completed sessions</CardDescription>
          </div>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
          >
            Full Report
            <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <RevenueChart monthlyData={monthlyChartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your next scheduled sessions</CardDescription>
            </div>
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
            >
              View All
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming bookings yet.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {booking.clients?.full_name ?? booking.clients?.email ?? "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.services?.name} &middot; {formatDateTime(booking.scheduled_at)}
                      </p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/bookings">
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    View Bookings
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/profile">
                  <span className="flex items-center gap-2">
                    <User className="size-4" />
                    Edit Profile
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/services">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Manage Services
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href={`/${diviner.username}`} target="_blank">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="size-4" />
                    View Live Profile
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-Ins & Gift Certificates */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-Ins */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                Check-Ins (Last 7 Days)
              </CardTitle>
              <CardDescription>New leads from your public check-in page</CardDescription>
            </div>
            <Link
              href="/dashboard/check-ins"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
            >
              View All
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No check-ins in the last 7 days.
              </p>
            ) : (
              <div className="space-y-2">
                {recentCheckIns.map((ci: any) => (
                  <div key={ci.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(ci.first_name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">
                        {ci.first_name} {ci.last_name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ci.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
                {recentCheckIns.length === 5 && (
                  <Link href="/dashboard/check-ins" className="flex items-center justify-center gap-1 pt-1 text-xs text-primary hover:underline">
                    View all check-ins <ArrowUpRight className="size-3" />
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gift Certificates */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-4 text-primary" />
                Gift Certificates
              </CardTitle>
              <CardDescription>Outstanding (unredeemed) certificates</CardDescription>
            </div>
            <Link
              href="/dashboard/gift-certificates"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
            >
              View All
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-2xl font-bold">{unreedeemedCerts.length}</p>
                <p className="text-xs text-muted-foreground">Unredeemed certificates</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCertValue)}</p>
                <p className="text-xs text-muted-foreground">Total remaining value</p>
              </div>
            </div>
            {unreedeemedCerts.length === 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                No outstanding certificates. <Link href="/dashboard/gift-certificates" className="text-primary hover:underline">Issue one</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Subscriptions & Active Campaigns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="size-4 text-primary" />
                Weekly Subscriptions
              </CardTitle>
              <CardDescription>Active weekly update subscribers</CardDescription>
            </div>
            <Link
              href="/dashboard/subscriptions"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
            >
              View All
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <RefreshCw className="size-8 text-primary/40 shrink-0" />
              <div>
                <p className="text-3xl font-bold">{activeSubCount}</p>
                <p className="text-sm text-muted-foreground">
                  {activeSubCount === 1 ? "active subscriber" : "active subscribers"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-primary" />
                Active Campaigns
              </CardTitle>
              <CardDescription>Affiliate campaigns currently running</CardDescription>
            </div>
            <Link
              href="/dashboard/campaigns"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5"
            >
              View All
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active campaigns. <Link href="/dashboard/campaigns" className="text-primary hover:underline">Create one</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {activeCampaigns.map((c: any) => {
                  const budget = c.budget_cap_cents ?? 0;
                  const spent = c.spent_cents ?? 0;
                  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[60%]">{c.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(spent / 100)} / {budget > 0 ? formatCurrency(budget / 100) : "∞"}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {activeCampaigns.length > 0 && (
                  <div className="pt-1 text-xs text-muted-foreground flex justify-between">
                    <span>{activeCampaigns.length} active campaign{activeCampaigns.length !== 1 ? "s" : ""}</span>
                    {totalCampaignBudget > 0 && (
                      <span>{formatCurrency(totalCampaignSpent / 100)} spent of {formatCurrency(totalCampaignBudget / 100)}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
