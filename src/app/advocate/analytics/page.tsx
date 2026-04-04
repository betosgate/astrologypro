import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";

export const metadata = { title: "Analytics - AstrologyPro Advocate" };

function getMonthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default async function AdvocateAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select(
      "id, total_referrals, total_earned, total_paid, commission_percent, referral_code"
    )
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  // Fetch all referrals with booking details for analytics
  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select(
      "id, commission_amount, status, created_at, bookings(scheduled_at, clients(full_name, email))"
    )
    .eq("affiliate_id", advocate.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const allReferrals = referrals ?? [];

  // Build 6-month chart data
  const now = new Date();
  const monthlyData: { month: string; referrals: number; earned: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthRefs = allReferrals.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= d.getTime() && t < end.getTime();
    });
    monthlyData.push({
      month: getMonthLabel(d),
      referrals: monthRefs.length,
      earned: monthRefs.reduce(
        (sum, r) => sum + Number(r.commission_amount ?? 0),
        0
      ),
    });
  }

  const pendingCount = allReferrals.filter((r) => r.status === "pending").length;
  const paidCount = allReferrals.filter((r) => r.status === "paid").length;
  const pendingEarnings =
    Number(advocate.total_earned ?? 0) - Number(advocate.total_paid ?? 0);

  const stats = [
    {
      label: "Total Referrals",
      value: advocate.total_referrals ?? 0,
      icon: Users,
      sub: `${pendingCount} pending · ${paidCount} paid`,
    },
    {
      label: "Total Earned",
      value: formatCurrency(advocate.total_earned ?? 0),
      icon: DollarSign,
      sub: `${advocate.commission_percent}% commission rate`,
    },
    {
      label: "Pending Payout",
      value: formatCurrency(pendingEarnings),
      icon: TrendingUp,
      sub: "Paid out monthly",
    },
    {
      label: "This Month",
      value: monthlyData[5]?.referrals ?? 0,
      icon: BarChart3,
      sub: formatCurrency(monthlyData[5]?.earned ?? 0) + " earned",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Click and conversion report for your referral code{" "}
          <span className="font-mono font-semibold text-foreground">
            {advocate.referral_code}
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {s.label}
                </CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance — Last 6 Months</CardTitle>
          <CardDescription>Referrals and earnings by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {monthlyData.map((m) => {
              const maxRefs = Math.max(
                ...monthlyData.map((x) => x.referrals),
                1
              );
              const barH = Math.round((m.referrals / maxRefs) * 80);
              return (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div className="flex h-24 items-end w-full px-1">
                    <div
                      className="w-full rounded-t bg-amber-500/70 transition-all"
                      style={{ height: `${barH}px` }}
                      title={`${m.referrals} referrals`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">
                    {m.month}
                  </p>
                  <p className="text-xs font-semibold">{m.referrals}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(m.earned)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Report</CardTitle>
          <CardDescription>Recent bookings made through your link</CardDescription>
        </CardHeader>
        <CardContent>
          {allReferrals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No conversions yet. Share your referral link to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Date</th>
                    <th className="pb-2 text-left font-medium">Client</th>
                    <th className="pb-2 text-right font-medium">Commission</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allReferrals.slice(0, 50).map((r) => {
                    const booking = r.bookings as unknown as {
                      scheduled_at?: string;
                      clients?: { full_name?: string; email?: string } | null;
                    } | null;
                    const clientName =
                      booking?.clients?.full_name ??
                      booking?.clients?.email ??
                      "—";
                    return (
                      <tr key={r.id}>
                        <td className="py-2 text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2">{clientName}</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(r.commission_amount ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          <Badge
                            variant={
                              r.status === "paid" ? "default" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
