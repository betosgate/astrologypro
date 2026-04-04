import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Profile - AstrologyPro" };

export default async function TraineeProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, email, username, bio, specialties, training_status, mentor_diviner_id, created_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  let mentorName = "Unassigned";
  if (trainee.mentor_diviner_id) {
    const { data: mentor } = await supabase
      .from("diviners")
      .select("display_name")
      .eq("id", trainee.mentor_diviner_id)
      .single();
    if (mentor) mentorName = mentor.display_name;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your trainee profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{trainee.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{trainee.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono font-medium">@{trainee.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mentor</span>
            <span className="font-medium">{mentorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={trainee.training_status === "active" ? "default" : "secondary"}>
              {trainee.training_status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium">
              {new Date(trainee.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        </CardContent>
      </Card>

      {trainee.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{trainee.bio}</p>
          </CardContent>
        </Card>
      )}

      {trainee.specialties && trainee.specialties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trainee.specialties.map((s: string) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
