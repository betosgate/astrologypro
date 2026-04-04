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
  School,
  Megaphone,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const metadata = { title: "Admin — AstrologyPro" };

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

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
    mysteryStudentsResult,
    traineesResult,
    traineeGraduatedResult,
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

    // Community members by type
    admin
      .from("community_members")
      .select("membership_type, membership_status"),

    // Mystery school students by training_status
    admin
      .from("mystery_school_students")
      .select("training_status"),

    // Active trainees (decans)
    admin
      .from("mystery_school_students")
      .select("id", { count: "exact", head: true })
      .eq("training_status", "decans"),

    // Graduated mystery school students
    admin
      .from("mystery_school_students")
      .select("id", { count: "exact", head: true })
      .eq("training_status", "graduated"),

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
  ]);

  const totalDiviners = divinerCount.count ?? 0;
  const activeDiviners = activeDivinerCount.count ?? 0;
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

  // Community stats
  const communityRows = (communityMembersResult.data ?? []) as Array<{ membership_type: string; membership_status: string }>;
  const activeMembers = communityRows.filter((m) => m.membership_status === "active").length;
  const perennialMembers = communityRows.filter((m) => m.membership_type === "perennial_mandalism" && m.membership_status === "active").length;
  const mysteryMembersTotal = communityRows.filter((m) => m.membership_type === "mystery_school" && m.membership_status === "active").length;

  // Mystery school training breakdown
  const msRows = (mysteryStudentsResult.data ?? []) as Array<{ training_status: string }>;
  const msFoundation = msRows.filter((s) => s.training_status === "foundation").length;
  const msDecans = traineesResult.count ?? 0;
  const msGraduated = traineeGraduatedResult.count ?? 0;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Diviners</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDiviners}</div>
            <p className="text-xs text-muted-foreground">
              {activeDiviners} active subscriptions
            </p>
          </CardContent>
        </Card>

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

      {/* Community & Mystery School */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Community & Mystery School</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">active subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perennial Mandalism</CardTitle>
              <Star className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perennialMembers}</div>
              <p className="text-xs text-muted-foreground">active members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mystery School</CardTitle>
              <School className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mysteryMembersTotal}</div>
              <p className="text-xs text-muted-foreground">active members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Training</CardTitle>
              <BookOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{msFoundation + msDecans}</div>
              <p className="text-xs text-muted-foreground">{msFoundation} foundation · {msDecans} decans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graduates</CardTitle>
              <GraduationCap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{msGraduated}</div>
              <p className="text-xs text-muted-foreground">Priest / Priestess</p>
            </CardContent>
          </Card>
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
                  {recentDiviners.data.map((d: any) => (
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
                {recentBookings.data.map((b: any) => (
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
