import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  DollarSign,
  Eye,
  TrendingUp,
  GraduationCap,
  Star,
  Megaphone,
  UserCheck,
  ArrowRight,
  Activity,
  UserPlus,
  Target,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const metadata = { title: "Admin — AstrologyPro" };

export const dynamic = "force-dynamic";

const ADMIN_ACTIVITY_LABELS: Record<string, string> = {
  page_view: "Page View",
  booking_checkout_started: "Booking Started",
  weekly_subscription_checkout_started: "Subscription Started",
  check_in_submitted: "Check-In Submitted",
  testimonial_submitted: "Testimonial Submitted",
};

function formatAdminActivityTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type RevenueBookingRow = {
  total_amount: number | null;
  base_price: number | null;
};

type RecentDivinerRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  created_at: string;
};

type RecentBookingRow = {
  id: string;
  scheduled_at: string;
  status: string;
  base_price: number | null;
  diviners: { display_name: string | null } | null;
  clients: { full_name: string | null } | null;
};

export default async function AdminPage() {
  const admin = createAdminClient();

  const now = new Date();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    divinerCount,
    activeDivinerCount,
    divinersNew30d,
    totalBookings,
    completedBookings,
    revenueResult,
    pageViewsMonth,
    recentDiviners,
    topDiviners,
    recentBookings,
    communityMembersResult,
    // Role KPI extras
    clientsTotal,
    clientsNew30d,
    advocatesTotal,
    advocatesActive,
    advocatesNew30d,
    communityNew30d,
    mysteryNew30d,
    traineesTotal,
    traineesActiveCount,
    traineesNew30d,
    // ── New KPI queries ───────────────────────────────────────────────────
    activeUsersToday,
    newUsersThisWeek,
    ordersCompleted,
    revenueThisMonth,
    revenueLastMonth,
    activityEventsMonth,
    activityEventsRecent,
    pageViewsRecent,
  ] = await Promise.all([
    // Total diviners
    admin
      .from("diviners")
      .select("id", { count: "exact", head: true }),

    // Active diviners (subscription active)
    admin
      .from("diviners")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active"),

    // Diviners joined last 30 days
    admin
      .from("diviners")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgoISO),

    // Total bookings all-time
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true }),

    // Completed bookings all-time
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),

    // Total platform revenue (sum of base_price on completed bookings)
    admin
      .from("bookings")
      .select("base_price, total_amount")
      .eq("status", "completed"),

    // Page views last 30 days
    admin
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgoISO),

    // Recently joined diviners
    admin
      .from("diviners")
      .select("id, display_name, username, plan_id, subscription_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    // Top diviners by completed bookings
    admin
      .from("bookings")
      .select("diviner_id, base_price, total_amount")
      .eq("status", "completed"),

    // Recent bookings
    admin
      .from("bookings")
      .select(
        "id, scheduled_at, status, base_price, diviners(display_name), clients(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(10),

    // Community members by type (needed for role KPI perennial/mystery totals)
    admin
      .from("community_members")
      .select("membership_type, membership_status"),

    // ── Role KPI extras ────────────────────────────────────────────────────
    admin.from("clients").select("id", { count: "exact", head: true }),
    admin.from("clients").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgoISO),
    admin.from("social_advocates").select("id", { count: "exact", head: true }),
    admin.from("social_advocates").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("social_advocates").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgoISO),
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "perennial_mandalism").gte("joined_at", thirtyDaysAgoISO),
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "mystery_school").gte("joined_at", thirtyDaysAgoISO),
    admin.from("trainees").select("id", { count: "exact", head: true }),
    admin.from("trainees").select("id", { count: "exact", head: true }).eq("training_status", "active"),
    admin.from("trainees").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgoISO),

    // ── New KPI queries ───────────────────────────────────────────────────
    // Active users today (profiles with last_sign_in_at >= today)
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("last_sign_in_at", todayStart),
    // New users this week
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgoISO),
    // Completed orders (for AOV)
    admin.from("bookings").select("total_amount, base_price").eq("status", "completed"),
    // Revenue this month
    admin.from("bookings").select("total_amount, base_price").eq("status", "completed").gte("created_at", thisMonthStart),
    // Revenue last month
    admin.from("bookings").select("total_amount, base_price").eq("status", "completed").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    admin
      .from("diviner_activity_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgoISO),
    admin
      .from("diviner_activity_events")
      .select("id, diviner_id, activity_type, path, traffic_source, created_at")
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("page_views")
      .select("diviner_id")
      .gte("created_at", thirtyDaysAgoISO),
  ]);

  const totalBookingCount = totalBookings.count ?? 0;
  const completedCount = completedBookings.count ?? 0;

  const totalRevenue =
    revenueResult.data?.reduce(
      (sum, b) => sum + (b.total_amount ?? b.base_price ?? 0),
      0
    ) ?? 0;

  const pageViewCount = pageViewsMonth.count ?? 0;

  // Aggregate top diviners by revenue from topDiviners query
  const divinerRevMap: Record<string, { revenue: number; bookings: number }> = {};
  for (const b of (topDiviners.data ?? []) as Array<{
    diviner_id: string;
    base_price: number | null;
    total_amount: number | null;
  }>) {
    const key = b.diviner_id;
    if (!key) continue;
    if (!divinerRevMap[key]) divinerRevMap[key] = { revenue: 0, bookings: 0 };
    divinerRevMap[key].revenue += b.total_amount ?? b.base_price ?? 0;
    divinerRevMap[key].bookings += 1;
  }

  const topDivinerIds = Object.entries(divinerRevMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id, stats]) => ({ id, ...stats }));

  // Community stats (used in role KPI cards)
  const communityRows = (communityMembersResult.data ?? []) as Array<{ membership_type: string; membership_status: string }>;
  const perennialMembers = communityRows.filter((m) => m.membership_type === "perennial_mandalism" && m.membership_status === "active").length;
  const mysteryMembersTotal = communityRows.filter((m) => m.membership_type === "mystery_school" && m.membership_status === "active").length;

  // Fetch names for top diviners
  let topDivinerDetails: Array<{
    id: string;
    display_name: string;
    username: string;
    plan_id: string | null;
    revenue: number;
    bookings: number;
  }> = [];
  if (topDivinerIds.length > 0) {
    const { data: divDetails } = await admin
      .from("diviners")
      .select("id, display_name, username, plan_id")
      .in(
        "id",
        topDivinerIds.map((d) => d.id)
      );
    topDivinerDetails = topDivinerIds.map((d) => {
      const det = divDetails?.find((x) => x.id === d.id);
      return {
        id: d.id,
        display_name: det?.display_name ?? "Unknown",
        username: det?.username ?? "",
        plan_id: det?.plan_id ?? null,
        revenue: d.revenue,
        bookings: d.bookings,
      };
    });
  }

  // ── New KPI computations ──────────────────────────────────────────────────
  const activeUsersTodayCount = activeUsersToday.count ?? 0;
  const newUsersWeekCount = newUsersThisWeek.count ?? 0;

  const bookingConversionRate =
    totalBookingCount > 0
      ? ((completedCount / totalBookingCount) * 100).toFixed(1)
      : "0.0";

  const completedOrdersData = (ordersCompleted.data ?? []) as RevenueBookingRow[];
  const completedOrderCount = completedOrdersData.length;
  const completedOrderSum = completedOrdersData.reduce(
    (sum, b) => sum + (b.total_amount ?? b.base_price ?? 0),
    0
  );
  const avgOrderValue = completedOrderCount > 0 ? completedOrderSum / completedOrderCount : 0;

  const thisMonthRevenue = ((revenueThisMonth.data ?? []) as RevenueBookingRow[]).reduce(
    (sum, b) => sum + (b.total_amount ?? b.base_price ?? 0),
    0
  );
  const lastMonthRevenue = ((revenueLastMonth.data ?? []) as RevenueBookingRow[]).reduce(
    (sum, b) => sum + (b.total_amount ?? b.base_price ?? 0),
    0
  );
  const momGrowth =
    lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : thisMonthRevenue > 0
      ? "100.0"
      : "0.0";
  const activityEventCount = activityEventsMonth.count ?? 0;
  const recentPublicActivity = (activityEventsRecent.data ?? []) as Array<{
    id: string;
    diviner_id: string;
    activity_type: string;
    path: string | null;
    traffic_source: string | null;
    created_at: string;
  }>;
  const pageViewRows = (pageViewsRecent.data ?? []) as Array<{ diviner_id: string | null }>;
  const viewsByDiviner = new Map<string, number>();
  for (const row of pageViewRows) {
    if (!row.diviner_id) continue;
    viewsByDiviner.set(row.diviner_id, (viewsByDiviner.get(row.diviner_id) ?? 0) + 1);
  }
  const analyticsDivinerIds = [...new Set([
    ...viewsByDiviner.keys(),
    ...recentPublicActivity.map((event) => event.diviner_id),
  ])];
  let analyticsDivinerLookup = new Map<string, { display_name: string; username: string }>();
  if (analyticsDivinerIds.length > 0) {
    const { data: analyticsDiviners } = await admin
      .from("diviners")
      .select("id, display_name, username")
      .in("id", analyticsDivinerIds);
    analyticsDivinerLookup = new Map(
      (analyticsDiviners ?? []).map((diviner) => [
        diviner.id,
        { display_name: diviner.display_name ?? "Unknown", username: diviner.username ?? "" },
      ])
    );
  }
  const topViewedDiviners = [...viewsByDiviner.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({
      id,
      views,
      display_name: analyticsDivinerLookup.get(id)?.display_name ?? "Unknown",
      username: analyticsDivinerLookup.get(id)?.username ?? "",
    }));

  // ── Role KPI data ─────────────────────────────────────────────────────────
  const roleKpis = [
    {
      key:          "diviner",
      label:        "Diviners",
      icon:         <Star className="size-4" />,
      color:        "text-amber-500",
      total:        divinerCount.count ?? 0,
      active:       activeDivinerCount.count ?? 0,
      newThisMonth: divinersNew30d.count ?? 0,
      href:         "/admin/users?role=diviner",
    },
    {
      key:          "client",
      label:        "Clients",
      icon:         <Users className="size-4" />,
      color:        "text-blue-500",
      total:        clientsTotal.count ?? 0,
      active:       clientsTotal.count ?? 0,
      newThisMonth: clientsNew30d.count ?? 0,
      href:         "/admin/users?role=client",
    },
    {
      key:          "advocate",
      label:        "Advocates",
      icon:         <Megaphone className="size-4" />,
      color:        "text-purple-500",
      total:        advocatesTotal.count ?? 0,
      active:       advocatesActive.count ?? 0,
      newThisMonth: advocatesNew30d.count ?? 0,
      href:         "/admin/users?role=advocate",
    },
    {
      key:          "perennial",
      label:        "Perennial",
      icon:         <BookOpen className="size-4" />,
      color:        "text-emerald-500",
      total:        communityRows.filter((m) => m.membership_type === "perennial_mandalism").length,
      active:       perennialMembers,
      newThisMonth: communityNew30d.count ?? 0,
      href:         "/admin/users?role=community",
    },
    {
      key:          "mystery",
      label:        "Mystery School",
      icon:         <UserCheck className="size-4" />,
      color:        "text-violet-500",
      total:        communityRows.filter((m) => m.membership_type === "mystery_school").length,
      active:       mysteryMembersTotal,
      newThisMonth: mysteryNew30d.count ?? 0,
      href:         "/admin/users?role=community",
    },
    {
      key:          "trainee",
      label:        "Trainees",
      icon:         <GraduationCap className="size-4" />,
      color:        "text-rose-500",
      total:        traineesTotal.count ?? 0,
      active:       traineesActiveCount.count ?? 0,
      newThisMonth: traineesNew30d.count ?? 0,
      href:         "/admin/users?role=trainee",
    },
  ];

  const planLabel: Record<string, string> = {
    tarot: "Tarot",
    astrology: "Astrology",
    both: "Oracle",
  };

  const statusBadge: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    trialing: "bg-blue-500/10 text-blue-500",
    canceled: "bg-red-500/10 text-red-500",
    past_due: "bg-yellow-500/10 text-yellow-500",
  };

  const bookingStatusBadge: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    confirmed: "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    canceled: "bg-red-500/10 text-red-500",
    in_progress: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground">All-time platform statistics</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookingCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">all-time completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageViewCount}</div>
            <p className="text-xs text-muted-foreground">last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBookingCount > 0
                ? ((completedCount / totalBookingCount) * 100).toFixed(1)
                : "0.0"}
              %
            </div>
            <p className="text-xs text-muted-foreground">bookings completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Extended KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersTodayCount}</div>
            <p className="text-xs text-muted-foreground">signed in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (7d)</CardTitle>
            <UserPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newUsersWeekCount}</div>
            <p className="text-xs text-muted-foreground">joined this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Conversion</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingConversionRate}%</div>
            <p className="text-xs text-muted-foreground">completed / total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">{completedOrderCount} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MoM Growth</CardTitle>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(momGrowth) >= 0 ? "+" : ""}{momGrowth}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(thisMonthRevenue)} vs {formatCurrency(lastMonthRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Activity</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityEventCount}</div>
            <p className="text-xs text-muted-foreground">last 30 days across all diviners</p>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Users by Role</h2>
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground gap-1">
            <Link href="/admin/roles">
              Full breakdown <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {roleKpis.map((r) => (
            <Link key={r.key} href={r.href} className="group">
              <Card className="transition-colors hover:border-border/80 hover:bg-muted/30">
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  {/* Icon + label */}
                  <div className="flex items-center gap-1.5">
                    <span className={r.color}>{r.icon}</span>
                    <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
                  </div>
                  {/* Total */}
                  <p className="text-2xl font-bold leading-none">{r.total.toLocaleString()}</p>
                  {/* Active + new */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="text-emerald-500 font-medium">{r.active.toLocaleString()} active</span>
                    <span className="text-amber-500 font-medium">+{r.newThisMonth} / 30d</span>
                  </div>
                  {/* Active bar */}
                  {r.total > 0 && (
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.round((r.active / r.total) * 100)}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top diviners by revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Diviners by Revenue</CardTitle>
            <CardDescription>Ranked by completed booking revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topDivinerDetails.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No completed bookings yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDivinerDetails.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{d.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{d.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {planLabel[d.plan_id ?? ""] ?? d.plan_id ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {d.bookings}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(d.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recently joined diviners */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Joined</CardTitle>
            <CardDescription>Newest diviner accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentDiviners.data || recentDiviners.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No diviners yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentDiviners.data as RecentDivinerRow[]).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{d.display_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            @{d.username ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {planLabel[d.plan_id ?? ""] ?? d.plan_id ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadge[d.subscription_status ?? ""] ?? ""}`}
                        >
                          {d.subscription_status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Diviners by Views</CardTitle>
            <CardDescription>Public diviner page hits in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topViewedDiviners.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No diviner traffic recorded yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topViewedDiviners.map((diviner) => (
                    <TableRow key={diviner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{diviner.display_name}</p>
                          <p className="text-xs text-muted-foreground">@{diviner.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {diviner.views}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Diviner Activity</CardTitle>
            <CardDescription>Latest public interactions across diviner pages</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPublicActivity.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentPublicActivity.map((event) => {
                  const diviner = analyticsDivinerLookup.get(event.diviner_id);
                  return (
                    <div key={event.id} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {diviner?.display_name ?? "Unknown"} • {ADMIN_ACTIVITY_LABELS[event.activity_type] ?? event.activity_type}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{diviner?.username ?? ""} · {event.path ?? "/"}{event.traffic_source ? ` · ${event.traffic_source.replace(/_/g, " ")}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatAdminActivityTime(event.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Last 10 bookings across all diviners</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentBookings.data || recentBookings.data.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No bookings yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Diviner</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentBookings.data as RecentBookingRow[]).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.clients?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {b.diviners?.display_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${bookingStatusBadge[b.status ?? ""] ?? ""}`}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(b.base_price ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
