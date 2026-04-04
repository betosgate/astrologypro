import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export const metadata = { title: "Practice Sessions - AstrologyPro" };

export default async function TraineeSessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, training_status")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice Sessions</h1>
        <p className="text-muted-foreground">Schedule and review your supervised practice readings.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="size-7 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">No sessions yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your mentor will schedule supervised practice sessions here. Check back soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
