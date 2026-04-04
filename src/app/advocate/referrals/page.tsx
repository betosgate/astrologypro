import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "My Referrals - AstrologyPro" };

export default async function AdvocateReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, referral_code")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select("id, created_at, status, commission_amount, booking_id")
    .eq("advocate_id", advocate.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Referrals</h1>
        <p className="text-muted-foreground">Bookings referred via your code <span className="font-mono font-medium text-foreground">{advocate.referral_code}</span></p>
      </div>

      {!referrals || referrals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No referrals yet. Share your link to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </CardTitle>
                  <Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Commission: <span className="font-medium text-foreground">${Number(r.commission_amount ?? 0).toFixed(2)}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
