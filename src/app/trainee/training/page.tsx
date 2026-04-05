import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Training School - AstrologyPro" };

/** Resolve role slugs for the current user by checking membership tables. */
async function getUserRoleSlugs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string[]> {
  const slugs: string[] = [];

  const [trainee, diviner, community, advocate, affiliate] = await Promise.all([
    supabase.from("trainees").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("diviners").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("community_members").select("id, membership_type").eq("user_id", userId).maybeSingle(),
    supabase.from("social_advocates").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("affiliates").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (trainee.data)    slugs.push("is_trainee");
  if (diviner.data)    slugs.push("is_astrologer");
  if (advocate.data)   slugs.push("is_social_advo");
  if (affiliate.data)  slugs.push("is_affiliate");

  if (community.data) {
    if (community.data.membership_type === "mystery_school")     slugs.push("is_mystery_school");
    if (community.data.membership_type === "perennial_mandalism") slugs.push("is_Perennial_Mandalism");
  }

  return slugs;
}

export default async function TrainingCategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  // Resolve the user's role slugs
  const userSlugs = await getUserRoleSlugs(supabase, user.id);

  // Fetch active categories joined with their program's allowed_roles
  // Only include categories whose program is unrestricted OR allows one of the user's slugs
  const { data: allCategories } = await supabase
    .from("training_categories")
    .select("id, name, description, priority, training_id, training_programs!inner(allowed_roles)")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  // Filter by role access
  const categories = (allCategories ?? []).filter((cat) => {
    const prog = cat.training_programs as { allowed_roles: string[] } | null;
    if (!prog) return true; // no program record — allow
    const allowed: string[] = prog.allowed_roles ?? [];
    if (allowed.length === 0) return true; // unrestricted
    return userSlugs.some((s) => allowed.includes(s));
  });

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training School</h1>
          <p className="text-muted-foreground">Study materials and lessons for your certification.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No training available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No training modules are available for your account. Contact your administrator if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch lesson counts per category
  const categoryIds = categories.map((c) => c.id);

  const { data: allLessons } = await supabase
    .from("training_lessons")
    .select("id, category_id")
    .in("category_id", categoryIds)
    .eq("is_active", true);

  // Fetch progress records for this trainee
  const lessonIds = (allLessons ?? []).map((l) => l.id);
  const { data: progressRows } = lessonIds.length > 0
    ? await supabase
        .from("trainee_lesson_progress")
        .select("lesson_id")
        .eq("trainee_id", trainee.id)
        .not("completed_at", "is", null)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const completedSet = new Set((progressRows ?? []).map((p) => p.lesson_id));

  // Build per-category stats
  const categoryStats = categories.map((cat) => {
    const total = (allLessons ?? []).filter((l) => l.category_id === cat.id).length;
    const completed = (allLessons ?? []).filter(
      (l) => l.category_id === cat.id && completedSet.has(l.id)
    ).length;
    return { ...cat, total, completed };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training School</h1>
        <p className="text-muted-foreground">Study materials and lessons for your certification.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categoryStats.map((cat) => {
          const progressPct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
          const isComplete = cat.total > 0 && cat.completed === cat.total;

          return (
            <Link key={cat.id} href={`/trainee/training/${cat.id}`} className="group block">
              <Card className="h-full transition-colors hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                      {cat.name}
                    </CardTitle>
                    {isComplete && (
                      <Badge variant="default" className="shrink-0">
                        Complete
                      </Badge>
                    )}
                  </div>
                  {cat.description && (
                    <CardDescription className="text-sm">{cat.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{cat.total} {cat.total === 1 ? "lesson" : "lessons"}</span>
                    <span>{cat.completed}/{cat.total} completed</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
