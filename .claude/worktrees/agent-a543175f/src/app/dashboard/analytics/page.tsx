import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Users, ArrowUpRight, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Analytics - Dashboard",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Fetch all analytics data in parallel
  const [
    todayViews,
    weekViews,
    monthViews,
    uniqueVisitorsWeek,
    topReferrers,
    dailyViews,
    monthBookings,
  ] = await Promise.all([
    // Today views
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", todayStart),
    // Week views
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", weekStart.toISOString()),
    // Month views
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart),
    // Unique visitors this week (by ip_hash)
    supabase
      .from("page_views")
      .select("ip_hash")
      .eq("diviner_id", diviner.id)
      .gte("created_at", weekStart.toISOString()),
    // Top referrers this month
    supabase
      .from("page_views")
      .select("referrer")
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart)
      .not("referrer", "is", null)
      .not("referrer", "eq", ""),
    // Daily views for last 30 days
    supabase
      .from("page_views")
      .select("created_at")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),
    // Bookings this month (for conversion rate)
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart),
  ]);

  const todayCount = todayViews.count ?? 0;
  const weekCount = weekViews.count ?? 0;
  const monthCount = monthViews.count ?? 0;

  // Count unique visitors
  const uniqueIps = new Set(
    (uniqueVisitorsWeek.data ?? []).map((r: { ip_hash: string }) => r.ip_hash)
  );
  const uniqueCount = uniqueIps.size;

  // Aggregate referrers
  const referrerCounts: Record<string, number> = {};
  for (const row of topReferrers.data ?? []) {
    const ref = (row as { referrer: string }).referrer;
    if (ref) {
      try {
        const hostname = new URL(ref).hostname;
        referrerCounts[hostname] = (referrerCounts[hostname] ?? 0) + 1;
      } catch {
        referrerCounts[ref] = (referrerCounts[ref] ?? 0) + 1;
      }
    }
  }
  const sortedReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Build daily view chart data (last 30 days)
  const dayBuckets: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayBuckets[key] = 0;
  }
  for (const row of dailyViews.data ?? []) {
    const key = new Date(
      (row as { created_at: string }).created_at
    )
      .toISOString()
      .split("T")[0];
    if (key in dayBuckets) {
      dayBuckets[key]++;
    }
  }
  const chartData = Object.entries(dayBuckets);
  const maxViews = Math.max(...chartData.map(([, v]) => v), 1);

  // Conversion rate
  const bookingCount = monthBookings.count ?? 0;
  const conversionRate =
    monthCount > 0 ? ((bookingCount / monthCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Your page was viewed {weekCount} time{weekCount !== 1 ? "s" : ""} this
          week.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground">page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Visitors
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCount}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {bookingCount} bookings / {monthCount} views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views by day chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views (Last 30 Days)</CardTitle>
          <CardDescription>
            {monthCount} total views this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
            {chartData.map(([date, count]) => {
              const heightPercent = (count / maxViews) * 100;
              const dayLabel = new Date(date + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "narrow" }
              );
              return (
                <div
                  key={date}
                  className="group relative flex flex-1 flex-col items-center"
                  style={{ height: "100%" }}
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-primary transition-colors group-hover:bg-primary/80"
                      style={{
                        height: `${Math.max(heightPercent, 2)}%`,
                        minHeight: 2,
                      }}
                    />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Top referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="size-4" />
            Top Referrers
          </CardTitle>
          <CardDescription>Where your visitors come from</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedReferrers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No referrer data yet. Share your page link to see traffic sources.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedReferrers.map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between"
                >
                  <span className="truncate text-sm">{source}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count} visit{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
