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
} from "lucide-react";
import { ProfileStrength } from "@/components/dashboard/profile-strength";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RoiBanner } from "@/components/dashboard/roi-banner";
import { RoleUpgradeBanners } from "@/components/dashboard/role-upgrade-banners";
import { TodaysSessions } from "@/components/dashboard/todays-sessions";

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

  // Today's date range for the quick-start panel
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch stats in parallel
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
    // Last 6 months revenue for chart
    month5Revenue,
    month4Revenue,
    month3Revenue,
    month2Revenue,
    month1Revenue,
    month0Revenue,
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
    // Today's sessions for quick-start panel
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, services(name), clients(full_name, email)"
      )
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString())
      .order("scheduled_at", { ascending: true }),
    // Revenue for months 5..0 (for chart)
    ...[5, 4, 3, 2, 1, 0].map((m) => {
      const range = getMonthRange(m);
      return supabase
        .from("bookings")
        .select("total_amount")
        .eq("diviner_id", diviner.id)
        .eq("status", "completed")
        .gte("created_at", range.start)
        .lt("created_at", range.end);
    }),
  ]);

  const thisMonthBookingCount = thisMonthBookings.count ?? 0;
  const lastMonthBookingCount = lastMonthBookings.count ?? 0;
  const thisMonthRevenueTotal =
    thisMonthRevenue.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;
  const lastMonthRevenueTotal =
    lastMonthRevenue.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;
  const thisMonthClientCount = thisMonthClients.count ?? 0;
  const lastMonthClientCount = lastMonthClients.count ?? 0;
  const upcomingBookings = upcomingResult.data ?? [];

  // Today's sessions for the quick-start panel
  const todaysSessions = (todaysSessionsResult.data ?? []).map(
    (booking: any) => ({
      id: booking.id,
      scheduled_at: booking.scheduled_at,
      client_name:
        booking.clients?.full_name ?? booking.clients?.email ?? "Client",
      service_name: booking.services?.name ?? "Session",
    })
  );

  // Next upcoming session date (for "no sessions today" message)
  const nextSessionDate =
    upcomingBookings.length > 0 ? upcomingBookings[0].scheduled_at : null;

  // Build chart data
  const chartResults = [
    month5Revenue,
    month4Revenue,
    month3Revenue,
    month2Revenue,
    month1Revenue,
    month0Revenue,
  ];
  const monthlyChartData = chartResults.map((result, index) => ({
    month: getMonthAbbr(5 - index),
    revenue:
      result.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0,
  }));

  // Comparison helpers
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

  const bookingComparison = compareStat(
    thisMonthBookingCount,
    lastMonthBookingCount
  );
  const revenueComparison = compareRevenue(
    thisMonthRevenueTotal,
    lastMonthRevenueTotal
  );
  const clientComparison = compareStat(
    thisMonthClientCount,
    lastMonthClientCount
  );

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
      {/* Certified badge CTA — subtle banner for non-certified diviners */}
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

      {/* Cross-sell banners — show upgrade paths for missing roles */}
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
      <TodaysSessions
        sessions={todaysSessions}
        nextSessionDate={nextSessionDate}
      />

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

      {/* Stats Grid */}
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
                  title={`View details`}
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
                  {comparison.positive === true && (
                    <TrendingUp className="size-3" />
                  )}
                  {comparison.positive === false && (
                    <TrendingDown className="size-3" />
                  )}
                  {comparison.text}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Revenue — Last 6 Months</CardTitle>
            <CardDescription>
              Monthly revenue from completed sessions
            </CardDescription>
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
              <CardDescription>
                Your next scheduled sessions
              </CardDescription>
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
                        {booking.clients?.full_name ??
                          booking.clients?.email ??
                          "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.services?.name} &middot;{" "}
                        {formatDateTime(booking.scheduled_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed" ? "default" : "secondary"
                      }
                    >
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
            <CardDescription>
              Common tasks for your practice
            </CardDescription>
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
    </div>
  );
}
