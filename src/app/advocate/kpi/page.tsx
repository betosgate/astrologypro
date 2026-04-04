import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Clock } from "lucide-react";

export const metadata = { title: "KPI Overview - AstrologyPro Advocate" };
export const dynamic = "force-dynamic";

interface MonthlyData {
  month: string; // "YYYY-MM"
  count: number;
  earned: number;
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default async function AdvocateKpiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, referral_code, commission_percent, total_referrals, total_earned, total_paid")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  // Fetch recent referrals with booking + client info
  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select("id, commission_amount, status, created_at, booking_id, bookings(scheduled_at, clients(full_name, email))")
    .eq("affiliate_id", advocate.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const allReferrals = referrals ?? [];

  // Compute pending payout
  const totalEarned = Number(advocate.total_earned ?? 0);
  const totalPaid = Number(advocate.total_paid ?? 0);
  const pending = totalEarned - totalPaid;

  // Build monthly data for the last 6 months
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
  }

  const monthlyMap: Record<string, { count: number; earned: number }> = {};
  for (const mk of monthKeys) {
    monthlyMap[mk] = { count: 0, earned: 0 };
  }

  for (const ref of allReferrals) {
    const d = new Date(ref.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      monthlyMap[key].count += 1;
      monthlyMap[key].earned += Number(ref.commission_amount ?? 0);
    }
  }

  const monthlyData: MonthlyData[] = monthKeys.map((k) => ({
    month: k,
    count: monthlyMap[k].count,
    earned: monthlyMap[k].earned,
  }));

  const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);

  // Recent referrals (last 20)
  const recentReferrals = allReferrals.slice(0, 20);

  const stats = [
    {
      icon: Users,
      label: "Total Referrals",
      value: String(advocate.total_referrals ?? 0),
      description: "Bookings referred via your link",
    },
    {
      icon: DollarSign,
      label: "Total Earned",
      value: `$${totalEarned.toFixed(2)}`,
      description: "Lifetime commissions",
    },
    {
      icon: TrendingUp,
      label: "Total Paid",
      value: `$${totalPaid.toFixed(2)}`,
      description: "Payouts processed",
    },
    {
      icon: Clock,
      label: "Pending Payout",
      value: `$${pending.toFixed(2)}`,
      description: "Awaiting disbursement",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KPI Overview</h1>
        <p className="text-muted-foreground">
          Performance metrics for code{" "}
          <span className="font-mono font-medium text-foreground">{advocate.referral_code}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {s.label}
                </CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly chart (bar chart via CSS) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Conversions — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-foreground">{m.count}</span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max((m.count / maxCount) * 100, 4)}px`, minHeight: "4px", maxHeight: "100px" }}
                />
                <span className="text-xs text-muted-foreground">{formatMonth(m.month)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Monthly Earnings</span>
              <span>Last 6 months total: ${monthlyData.reduce((s, m) => s + m.earned, 0).toFixed(2)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {monthlyData.map((m) => (
                <div key={m.month} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{formatMonth(m.month)}</span>
                  <span className="font-medium">${m.earned.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Referrals</CardTitle>
          <CardDescription>Last {recentReferrals.length} referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReferrals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No referrals yet. Share your link to get started!
            </p>
          ) : (
            <div className="divide-y">
              {recentReferrals.map((ref) => {
                const booking = (ref as any).bookings;
                const client = booking?.clients;
                const bookingDate = booking?.scheduled_at
                  ? new Date(booking.scheduled_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div key={ref.id} className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {client?.full_name ?? "Client"}
                        {client?.email && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({client.email})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Referred{" "}
                        {new Date(ref.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {bookingDate && ` · Booking: ${bookingDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        ${Number(ref.commission_amount ?? 0).toFixed(2)}
                      </span>
                      <Badge variant={ref.status === "paid" ? "default" : "secondary"}>
                        {ref.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
