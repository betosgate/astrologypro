import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";
import { ProfileStrength } from "@/components/dashboard/profile-strength";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RoiBanner } from "@/components/dashboard/roi-banner";
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

  const { data: diviner } = await supabase
    .from("diviners")
    .select(
      "id, display_name, username, avatar_url, bio, tagline, specialties, stripe_account_id, google_calendar_token"
    )
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

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
      value: formatCurrency(thisMonthRevenueTotal / 100),
      icon: DollarSign,
      comparison: revenueComparison,
    },
    {
      label: "This Month Bookings",
      value: thisMonthBookingCount,
      icon: Calendar,
      comparison: bookingComparison,
    },
    {
      label: "New Clients",
      value: thisMonthClientCount,
      icon: Users,
      comparison: clientComparison,
    },
    {
      label: "Upcoming",
      value: upcomingBookings.length,
      icon: TrendingUp,
      comparison: { text: "Scheduled sessions", positive: null },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your practice.
        </p>
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
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
        <CardHeader>
          <CardTitle>Revenue — Last 6 Months</CardTitle>
          <CardDescription>
            Monthly revenue from completed sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart monthlyData={monthlyChartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              Your next scheduled sessions
            </CardDescription>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
