import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Profile - AstrologyPro" };

export default async function CommunityProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, email, membership_type, membership_status, joined_at, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");

  const programName = member.membership_type === "mystery_school" ? "Mystery School" : "Perennial Mandalism";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Your membership details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{member.full_name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{member.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Program</span>
            <Badge variant="secondary">{programName}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={member.membership_status === "active" ? "default" : "secondary"}>
              {member.membership_status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">
              {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
          {member.expires_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium">
                {new Date(member.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
