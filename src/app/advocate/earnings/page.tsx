import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock } from "lucide-react";

export const metadata = { title: "Earnings - AstrologyPro" };

export default async function AdvocateEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, total_earned, total_paid, commission_percent")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  const pending = Number(advocate.total_earned ?? 0) - Number(advocate.total_paid ?? 0);

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
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Payouts are processed monthly. Contact support for payout requests.
        </CardContent>
      </Card>
    </div>
  );
}
