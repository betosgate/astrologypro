import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Star, TrendingUp, User, GraduationCap } from "lucide-react";
import Link from "next/link";

const TABBY_USERNAME = process.env.NEXT_PUBLIC_TABBY_USERNAME ?? "tabby";

export const metadata = { title: "Trainee Dashboard - AstrologyPro" };

export default async function TraineeDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, username, specialties, training_status, mentor_diviner_id, created_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  // Fetch mentor info if assigned
  let mentorName = "Unassigned";
  if (trainee.mentor_diviner_id) {
    const { data: mentor } = await supabase
      .from("diviners")
      .select("display_name")
      .eq("id", trainee.mentor_diviner_id)
      .single();
    if (mentor) mentorName = mentor.display_name;
  }

  const quickLinks = [
    { icon: Calendar, title: "Practice Sessions", description: "Schedule and review your supervised practice readings.", href: "/trainee/sessions" },
    { icon: TrendingUp, title: "My Progress", description: "Track your skills, completed modules, and feedback.", href: "/trainee/progress" },
    { icon: BookOpen, title: "Resources", description: "Study materials, guides, and reference charts.", href: "/trainee/resources" },
    { icon: User, title: "My Profile", description: "Manage your trainee profile and specialties.", href: "/trainee/profile" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trainee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {trainee.name}</p>
        </div>
        <Badge variant={trainee.training_status === "active" ? "default" : "secondary"}>
          {trainee.training_status}
        </Badge>
      </div>

      {/* Graduation CTA — E3-S5 */}
      {trainee.training_status === "graduated" && (
        <Card className="border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <GraduationCap className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">Congratulations, Graduate!</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                  You&apos;ve completed your training. Book your post-graduation consultation with Tabby to discuss next steps.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
              <Link href={`/${TABBY_USERNAME}`}>Book with Tabby</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mentor card */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Mentor</CardDescription>
          <CardTitle className="text-base">{mentorName}</CardTitle>
        </CardHeader>
        {!trainee.mentor_diviner_id && (
          <CardContent>
            <p className="text-sm text-muted-foreground">No mentor assigned yet. An administrator will connect you with a diviner mentor shortly.</p>
          </CardContent>
        )}
      </Card>

      {/* Specialties */}
      {trainee.specialties && trainee.specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trainee.specialties.map((s: string) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="transition-colors hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
