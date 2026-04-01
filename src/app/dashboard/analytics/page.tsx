import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Users, Link2, TrendingUp } from "lucide-react";

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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all analytics data in parallel
  const [
    todayViews,
    weekViews,
    monthViews,
    uniqueVisitorsResult,
    referrersResult,
    dailyViewsResult,
    bookingsThisMonth,
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", todayStart),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", weekStart),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart),
    supabase
      .from("page_views")
      .select("ip_hash")
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart),
    supabase
      .from("page_views")
      .select("referrer")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo)
      .not("referrer", "is", null)
      .not("referrer", "eq", ""),
    supabase
      .from("page_views")
      .select("created_at")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .gte("created_at", monthStart),
  ]);

  const todayCount = todayViews.count ?? 0;
  const weekCount = weekViews.count ?? 0;
  const monthCount = monthViews.count ?? 0;

  // Unique visitors
  const uniqueIps = new Set(
    (uniqueVisitorsResult.data ?? []).map((r: { ip_hash: string }) => r.ip_hash)
  );
  const uniqueVisitorCount = uniqueIps.size;

  // Top referrers
  const referrerCounts: Record<string, number> = {};
  for (const row of referrersResult.data ?? []) {
    const ref = (row as { referrer: string }).referrer;
    try {
      const hostname = new URL(ref).hostname;
      referrerCounts[hostname] = (referrerCounts[hostname] ?? 0) + 1;
    } catch {
      referrerCounts[ref] = (referrerCounts[ref] ?? 0) + 1;
    }
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Views by day (last 30 days)
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = 0;
  }
  for (const row of dailyViewsResult.data ?? []) {
    const key = new Date((row as { created_at: string }).created_at)
      .toISOString()
      .split("T")[0];
    if (key in dailyMap) {
      dailyMap[key]++;
    }
  }
  const dailyEntries = Object.entries(dailyMap);
  const maxDayViews = Math.max(...dailyEntries.map(([, v]) => v), 1);

  // Conversion rate
  const bookingCount = bookingsThisMonth.count ?? 0;
  const conversionRate =
    monthCount > 0 ? ((bookingCount / monthCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Your page was viewed {weekCount} time{weekCount !== 1 ? "s" : ""} this
          week
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground">page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthCount}</div>
            <p className="text-xs text-muted-foreground">page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Visitors
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitorCount}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <CardDescription>Bookings / Page Views (this month)</CardDescription>
          </div>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {bookingCount} booking{bookingCount !== 1 ? "s" : ""} from{" "}
            {monthCount} view{monthCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Views - Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
              {dailyEntries.map(([date, count]) => {
                const height = Math.max((count / maxDayViews) * 100, 2);
                const dayLabel = new Date(date + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                );
                return (
                  <div
                    key={date}
                    className="group relative flex-1"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-primary transition-colors group-hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                      title={`${dayLabel}: ${count} views`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>
                {new Date(dailyEntries[0]?.[0] + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </span>
              <span>
                {new Date(
                  dailyEntries[dailyEntries.length - 1]?.[0] + "T12:00:00"
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-4" />
              Top Referrers
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No referrer data yet
              </p>
            ) : (
              <div className="space-y-3">
                {topReferrers.map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between">
                    <span className="truncate text-sm">{domain}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
