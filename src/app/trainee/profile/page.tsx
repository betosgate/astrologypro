import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ProfileCompletionBar } from "@/components/ui/profile-completion-bar";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { ProfileEditor } from "@/components/trainee/profile-editor";
import {
  getAllowedSpecialtiesForPackage,
  getRoleServicePackages,
  resolveRoleServicePackage,
} from "@/lib/role-service-packages";
import {
  GraduationCap,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Profile - AstrologyPro" };

// ---------------------------------------------------------------------------
// Allowed specialties (kept in sync with the API route validation schema)
// ---------------------------------------------------------------------------
const ALLOWED_SPECIALTIES = [
  "astrology",
  "tarot",
  "numerology",
  "human design",
  "oracle cards",
  "palmistry",
  "runes",
  "crystal healing",
] as const;

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  pending: "outline",
  graduated: "default",
  paused: "secondary",
  cancelled: "destructive",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TraineeProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
      .from("trainees")
      .select(
        "id, name, email, username, bio, specialties, phone, timezone, goals, training_status, mentor_diviner_id, graduated_at, created_at, service_package_code"
      )
      .eq("user_id", user.id)
      .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  // Fetch avatar_url separately (added in migration 20260406000016)
  // and mentor + progress in parallel
  const [avatarResult, mentorResult, progressResult, clientResult] = await Promise.all([
    admin
      .from("trainees")
      .select("avatar_url")
      .eq("id", trainee.id)
      .single(),
    trainee.mentor_diviner_id
      ? admin
          .from("diviners")
          .select("display_name, avatar_url, username")
          .eq("id", trainee.mentor_diviner_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("user_program_progress")
      .select("total_lessons, completed_lessons, progress_pct")
      .eq("user_id", user.id),
    admin
      .from("clients")
      .select("birth_date, birth_time, birth_city")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const avatarUrl =
    (avatarResult.data as { avatar_url?: string | null } | null)?.avatar_url ?? null;

  type MentorData = { display_name: string; avatar_url: string | null; username: string } | null;
  const mentor = mentorResult.data as MentorData;

  const progressRows = (progressResult.data as {
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
  }[] | null) ?? [];
  const clientProfile = clientResult.data as {
    birth_date?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
  } | null;

  const totalLessons = progressRows.reduce((sum, r) => sum + (r.total_lessons ?? 0), 0);
  const completedLessons = progressRows.reduce((sum, r) => sum + (r.completed_lessons ?? 0), 0);
  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const joinedDate = new Date(trainee.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const resolvedPackage = resolveRoleServicePackage(
    await getRoleServicePackages(),
    trainee.service_package_code,
  );
  const allowedSpecialties = getAllowedSpecialtiesForPackage(
    ALLOWED_SPECIALTIES,
    resolvedPackage,
  );

  const completion = calculateProfileCompletion([
    { key: "name", label: "Name", value: trainee.name },
    { key: "email", label: "Email", value: trainee.email },
    { key: "phone", label: "Phone", value: trainee.phone },
    { key: "timezone", label: "Timezone", value: trainee.timezone },
    { key: "bio", label: "Bio", value: trainee.bio },
    { key: "avatar_url", label: "Profile Photo", value: avatarUrl },
    { key: "birth_date", label: "Date of Birth", value: clientProfile?.birth_date },
    { key: "birth_time", label: "Birth Time", value: clientProfile?.birth_time },
    { key: "birth_city", label: "Birth City", value: clientProfile?.birth_city },
  ]);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your trainee profile and track your training status.
        </p>
      </div>

      <ProfileCompletionBar
        percentage={completion.percentage}
        missingFields={completion.missingFields}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
      />

      {/* ── Profile Editor (client component) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            Current package:{" "}
            <span className="font-medium text-foreground">
              {resolvedPackage.displayName}
            </span>
            . Allowed categories: {resolvedPackage.allowedCategories.join(", ")}.
          </div>
          <ProfileEditor
            profileId={trainee.id}
            name={trainee.name}
            bio={trainee.bio ?? null}
            specialties={trainee.specialties ?? []}
            avatarUrl={avatarUrl}
            username={trainee.username}
            allowedSpecialties={allowedSpecialties}
            phone={trainee.phone ?? null}
            timezone={trainee.timezone ?? null}
            goals={trainee.goals ?? null}
            birthDate={clientProfile?.birth_date ?? null}
            birthTime={clientProfile?.birth_time ?? null}
            birthCity={clientProfile?.birth_city ?? null}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* ── Account Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{trainee.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono font-medium">@{trainee.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{joinedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Training status</span>
            <Badge variant={STATUS_VARIANT[trainee.training_status] ?? "secondary"}>
              {trainee.training_status}
            </Badge>
          </div>
          {trainee.graduated_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Graduated</span>
              <span className="font-medium">
                {new Date(trainee.graduated_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Training Status ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Progress ring */}
            <CircularProgress
              percentage={overallPct}
              size={88}
              strokeWidth={8}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">
                {completedLessons} of {totalLessons} lessons complete
              </p>
              <p className="text-sm text-muted-foreground">
                {totalLessons === 0
                  ? "No lessons available yet."
                  : overallPct < 100
                  ? `${100 - overallPct}% remaining across all programs.`
                  : "All lessons complete — well done!"}
              </p>
              {/* Mentor */}
              {mentor ? (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">Mentor:</span>
                  <span className="font-medium">{mentor.display_name}</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">No mentor assigned yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Action links */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trainee/progress">
                <TrendingUp className="mr-1.5 size-3.5" aria-hidden="true" />
                View full progress
              </Link>
            </Button>
            {trainee.graduated_at && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/trainee/certificate">
                  <GraduationCap className="mr-1.5 size-3.5" aria-hidden="true" />
                  View certificate
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
