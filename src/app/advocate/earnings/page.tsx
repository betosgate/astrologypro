import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = { title: "Earnings - AstrologyPro" };

export default async function AdvocateEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, total_earned, total_paid, commission_percent")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  const pending = Number(advocate.total_earned ?? 0) - Number(advocate.total_paid ?? 0);

  const { data: referrals } = await admin
    .from("affiliate_referrals")
    .select("id, commission_amount, status, created_at, bookings(clients(full_name, email), services(name))")
    .eq("affiliate_id", advocate.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const referralRows = referrals ?? [];
  const statusCounts = referralRows.reduce(
    (acc, row) => {
      if (row.status === "pending") acc.pending += 1;
      if (row.status === "earned") acc.earned += 1;
      if (row.status === "paid") acc.paid += 1;
      return acc;
    },
    { pending: 0, earned: 0, paid: 0 },
  );

  const stats = [
    { icon: DollarSign, label: "Total Earned", value: `$${Number(advocate.total_earned ?? 0).toFixed(2)}` },
    { icon: TrendingUp, label: "Total Paid Out", value: `$${Number(advocate.total_paid ?? 0).toFixed(2)}` },
    { icon: Clock, label: "Pending Payout", value: `$${pending.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">Your commission history and payout status</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="size-4" /> {s.label}
                </CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{Number(advocate.commission_percent ?? 10).toFixed(0)}%</p>
          <p className="mt-1 text-sm text-muted-foreground">Earned on every booking referred via your link</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Commission Queue</CardTitle>
          <CardDescription>
            Recent commission activity and payout readiness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4 text-amber-500" />
                Pending
              </div>
              <p className="mt-2 text-2xl font-bold">{statusCounts.pending}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 text-blue-500" />
                Earned
              </div>
              <p className="mt-2 text-2xl font-bold">{statusCounts.earned}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                Paid
              </div>
              <p className="mt-2 text-2xl font-bold">{statusCounts.paid}</p>
            </div>
          </div>

          {referralRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No commission activity yet. Start sharing your referral link to generate bookings.
            </p>
          ) : (
            <div className="space-y-3">
              {referralRows.map((row) => {
                const booking = row.bookings as {
                  clients?: { full_name?: string | null; email?: string | null } | null;
                  services?: { name?: string | null } | null;
                } | null;
                const clientName =
                  booking?.clients?.full_name ??
                  booking?.clients?.email ??
                  "Client";
                const serviceName = booking?.services?.name ?? "Booking";

                return (
                  <div key={row.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {serviceName} · {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        ${Number(row.commission_amount ?? 0).toFixed(2)}
                      </span>
                      <Badge variant={row.status === "paid" ? "default" : "secondary"} className="capitalize">
                        {row.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Payouts are processed monthly. Contact support for payout requests or discrepancies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
