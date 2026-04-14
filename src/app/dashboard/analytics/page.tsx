import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, ArrowUpRight, TrendingUp, Activity, CalendarCheck2, MessageSquareQuote, Rss } from "lucide-react";

export const metadata = {
  title: "Analytics - Dashboard",
};

type DivinerActivityRow = {
  id: string;
  activity_type: string;
  path: string | null;
  traffic_source: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  page_view: "Page View",
  booking_checkout_started: "Booking Started",
  weekly_subscription_checkout_started: "Subscription Started",
  check_in_submitted: "Check-In Submitted",
  testimonial_submitted: "Testimonial Submitted",
};

function formatActivityTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

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
    activitySummaryResult,
    recentActivityResult,
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
    admin
      .from("diviner_activity_events")
      .select("activity_type")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    admin
      .from("diviner_activity_events")
      .select("id, activity_type, path, traffic_source, created_at, metadata")
      .eq("diviner_id", diviner.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
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
  const activitySummaryRows = (activitySummaryResult.data ?? []) as Array<{ activity_type: string }>;
  const recentActivity = (recentActivityResult.data ?? []) as DivinerActivityRow[];
  const engagementEvents = activitySummaryRows.filter((event) => event.activity_type !== "page_view");
  const engagementCount = engagementEvents.length;
  const bookingStartCount = activitySummaryRows.filter((event) => event.activity_type === "booking_checkout_started").length;
  const checkInCount = activitySummaryRows.filter((event) => event.activity_type === "check_in_submitted").length;
  const testimonialCount = activitySummaryRows.filter((event) => event.activity_type === "testimonial_submitted").length;
  const subscriptionStartCount = activitySummaryRows.filter((event) => event.activity_type === "weekly_subscription_checkout_started").length;

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
            <CardTitle className="text-sm font-medium">Engagements</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementCount}</div>
            <p className="text-xs text-muted-foreground">
              booking starts, check-ins, testimonials, subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Starts</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStartCount}</div>
            <p className="text-xs text-muted-foreground">
              {bookingCount} bookings completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-Ins</CardTitle>
            <CalendarCheck2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInCount}</div>
            <p className="text-xs text-muted-foreground">last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testimonials</CardTitle>
            <MessageSquareQuote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonialCount}</div>
            <p className="text-xs text-muted-foreground">submitted in the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Starts</CardTitle>
            <Rss className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStartCount}</div>
            <p className="text-xs text-muted-foreground">weekly subscription checkout starts</p>
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
      <div className="grid gap-4 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest public interactions on your diviner pages</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No tracked activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {ACTIVITY_LABELS[event.activity_type] ?? event.activity_type}
                        </span>
                        {event.traffic_source ? (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {event.traffic_source.replace(/_/g, " ")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {event.path ?? "/"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatActivityTime(event.created_at)}
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
