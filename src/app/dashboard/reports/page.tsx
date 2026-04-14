import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ArrowLeft,
  Star,
} from "lucide-react";

export const metadata = {
  title: "Revenue & Booking Reports",
};

function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
    short: start.toLocaleString("en-US", { month: "short", year: "2-digit" }),
  };
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Build 12-month ranges
  const months = Array.from({ length: 12 }, (_, i) => getMonthRange(11 - i));

  // Fetch all completed bookings in the last 12 months for revenue table
  const twelveMonthsAgo = getMonthRange(11).start;

  const [
    allBookings,
    serviceBreakdown,
    totalClients,
    pendingBookings,
  ] = await Promise.all([
    // All bookings in last 12 months
    admin
      .from("bookings")
      .select("id, status, total_amount, base_price, created_at, scheduled_at, services(name)")
      .eq("diviner_id", diviner.id)
      .gte("created_at", twelveMonthsAgo)
      .order("created_at", { ascending: false }),
    // Revenue by service (completed only)
    admin
      .from("bookings")
      .select("total_amount, base_price, services(id, name)")
      .eq("diviner_id", diviner.id)
      .eq("status", "completed")
      .gte("created_at", twelveMonthsAgo),
    // Total unique clients ever
    admin
      .from("client_diviners")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id),
    // Pending payments
    admin
      .from("bookings")
      .select("total_amount")
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString()),
  ]);

  const bookings = allBookings.data ?? [];
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => ["canceled", "no_show"].includes(b.status));
  const pending = bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status));

  // Monthly revenue breakdown
  const monthlyRows = months.map((m) => {
    const monthBookings = bookings.filter(
      (b) => b.created_at >= m.start && b.created_at < m.end
    );
    const revenue = monthBookings
      .filter((b) => b.status === "completed")
      .reduce((s, b) => s + (Number(b.total_amount) ?? 0), 0);
    const count = monthBookings.length;
    const completedCount = monthBookings.filter((b) => b.status === "completed").length;
    return { ...m, revenue, count, completedCount };
  });

  // Revenue by service
  const svcMap = new Map<string, { name: string; revenue: number; count: number }>();
  for (const b of serviceBreakdown.data ?? []) {
    const svc = b.services as unknown as { id: string; name: string } | null;
    const key = svc?.id ?? "__unknown";
    const name = svc?.name ?? "Unknown Service";
    const existing = svcMap.get(key) ?? { name, revenue: 0, count: 0 };
    existing.revenue += Number(b.total_amount) ?? 0;
    existing.count += 1;
    svcMap.set(key, existing);
  }
  const serviceRows = Array.from(svcMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Summary stats
  const totalRevenue = completed.reduce((s, b) => s + (Number(b.total_amount) ?? 0), 0);
  const completionRate = bookings.length > 0
    ? Math.round((completed.length / bookings.length) * 100)
    : 0;
  const avgSessionValue = completed.length > 0
    ? Math.round(totalRevenue / completed.length)
    : 0;
  const pendingRevenue = (pendingBookings.data ?? [])
    .reduce((s, b) => s + (Number(b.total_amount) ?? 0), 0);

  // MoM change (current vs previous month)
  const thisMonthRevenue = monthlyRows[11].revenue;
  const lastMonthRevenue = monthlyRows[10].revenue;
  const momChange = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Revenue and booking statistics for your practice
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">12-Month Revenue</CardDescription>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{completed.length} completed sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">This Month</CardDescription>
            {momChange !== null && momChange >= 0
              ? <TrendingUp className="size-4 text-green-500" />
              : <TrendingDown className="size-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</div>
            {momChange !== null && (
              <p className={`flex items-center gap-1 text-xs ${momChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {momChange >= 0 ? "+" : ""}{momChange}% vs last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Completion Rate</CardDescription>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completed.length} completed · {cancelled.length} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Avg Session Value</CardDescription>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgSessionValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingRevenue)} pending pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown</CardTitle>
          <CardDescription>Last 12 months — completed sessions only</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyRows
                .slice()
                .reverse()
                .map((row, i, arr) => {
                  const prev = arr[i + 1];
                  const change = prev && prev.revenue > 0
                    ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100)
                    : null;
                  return (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{row.completedCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {change !== null ? (
                          <span className={`flex items-center justify-end gap-1 text-xs ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {change >= 0
                              ? <TrendingUp className="size-3" />
                              : <TrendingDown className="size-3" />}
                            {change >= 0 ? "+" : ""}{change}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue by service */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Top services by completed session revenue (12 months)</CardDescription>
          </div>
          <Link
            href="/dashboard/services"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Manage Services
          </Link>
        </CardHeader>
        <CardContent>
          {serviceRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No completed sessions yet.</p>
          ) : (
            <div className="space-y-3">
              {serviceRows.map((svc, i) => {
                const maxRevenue = serviceRows[0]?.revenue ?? 1;
                const pct = Math.round((svc.revenue / maxRevenue) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{svc.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {svc.count} sessions · {formatCurrency(svc.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking status breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Booking Status (12 months)</CardTitle>
              <CardDescription>Breakdown of all bookings</CardDescription>
            </div>
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Completed", count: completed.length, icon: CheckCircle2, color: "text-green-500" },
                { label: "Pending / Confirmed", count: pending.length, icon: Clock, color: "text-blue-500" },
                { label: "Cancelled / No-Show", count: cancelled.length, icon: XCircle, color: "text-red-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <row.icon className={`size-4 ${row.color}`} />
                    <span className="text-sm font-medium">{row.label}</span>
                  </div>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Practice Totals</CardTitle>
              <CardDescription>All-time summary</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Total Clients", value: (totalClients.count ?? 0).toString(), icon: Calendar },
                { label: "Total Sessions (12mo)", value: bookings.length.toString(), icon: Calendar },
                { label: "Pending Revenue", value: formatCurrency(pendingRevenue), icon: DollarSign },
                { label: "Avg Session Value", value: formatCurrency(avgSessionValue), icon: Star },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <row.icon className="size-4 text-muted-foreground" />
                    <span className="text-sm">{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
