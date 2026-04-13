import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Share2, TrendingUp, Copy, ExternalLink } from "lucide-react";
import { APP_URL } from "@/lib/constants";
import { ensureDefaultCampaign } from "@/lib/campaign-defaults";

export const metadata = { title: "Advocate Dashboard - AstrologyPro" };

export default async function AdvocateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, name, username, referral_code, commission_percent, total_referrals, total_earned, total_paid, social_platforms")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  // Ensure default campaign exists on first visit (fire-and-forget)
  ensureDefaultCampaign({
    affiliateId: advocate.id,
    affiliateType: "social_advocate",
    affiliateName: advocate.name,
    commissionPercent: advocate.commission_percent,
  }).catch((err) => console.error("[advocate] Default campaign error:", err));

  const { data: recentReferrals } = await supabase
    .from("affiliate_referrals")
    .select("id, commission_amount, status, created_at")
    .eq("affiliate_id", advocate.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const outstanding = advocate.total_earned - advocate.total_paid;
  const referralUrl = `${APP_URL}?ref=${advocate.referral_code}`;

  const stats = [
    { label: "Total Referrals", value: advocate.total_referrals, icon: Users, color: "text-blue-500" },
    { label: "Total Earned", value: formatCurrency(advocate.total_earned), icon: DollarSign, color: "text-green-500" },
    { label: "Pending Payout", value: formatCurrency(outstanding), icon: TrendingUp, color: "text-amber-500" },
    { label: "Commission Rate", value: `${advocate.commission_percent}%`, icon: Share2, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advocate Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {advocate.name}</p>
        </div>
        <Badge variant="secondary">Active</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${s.color}`} />
                  {s.label}
                </CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Referral Link</CardTitle>
          <CardDescription>Share this link on your social platforms to earn {advocate.commission_percent}% commission on every booking.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">{referralUrl}</code>
          <Button variant="outline" size="sm" asChild>
            <a href={referralUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Recent referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentReferrals || recentReferrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Share2 className="mb-3 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No referrals yet. Start sharing your link!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReferrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(ref.commission_amount ?? 0)} commission</p>
                    <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={ref.status === "paid" ? "default" : "secondary"}>{ref.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
