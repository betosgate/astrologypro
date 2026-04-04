import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Profile - AstrologyPro" };

export default async function AdvocateProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, name, email, username, bio, referral_code, social_platforms, created_at")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Your advocate account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{advocate.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{advocate.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono font-medium">@{advocate.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referral Code</span>
            <span className="font-mono font-medium">{advocate.referral_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">{new Date(advocate.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>
        </CardContent>
      </Card>

      {advocate.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{advocate.bio}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
