import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Resources - AstrologyPro" };

export default async function TraineeResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Study materials, guides, and reference charts curated by your mentor.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="size-7 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Resources coming soon</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your mentor will share study materials and reference guides here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
