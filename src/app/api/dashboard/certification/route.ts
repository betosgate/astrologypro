import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/certification
 *
 * Returns the authenticated diviner's certification status and, if they
 * also have a trainee record, their training completion progress.
 *
 * Response shape:
 * {
 *   isCertified: boolean;
 *   certifiedAt: string | null;       // ISO timestamp
 *   certifiedBy: string | null;       // admin email that awarded it
 *   training: {
 *     status: string;                 // trainee.training_status
 *     graduatedAt: string | null;
 *     totalLessons: number;
 *     completedLessons: number;
 *     completionPct: number;          // 0–100
 *   } | null;                         // null if user has no trainee record
 * }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unauthorized",
        detail: "Authentication required.",
        status: 401,
      },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const admin = createAdminClient();

  // Fetch the diviner record (must exist)
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id, is_certified, certified_at, certified_by")
    .eq("user_id", user.id)
    .maybeSingle();

  if (divinerError || !diviner) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Not Found",
        detail: "No diviner profile found for this account.",
        status: 404,
      },
      { status: 404, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  // Fetch optional trainee record (same user may also be a trainee)
  const { data: trainee } = await admin
    .from("trainees")
    .select("id, training_status, graduated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  let training: {
    status: string;
    graduatedAt: string | null;
    totalLessons: number;
    completedLessons: number;
    completionPct: number;
  } | null = null;

  if (trainee) {
    // Count total active lessons and completed lessons in parallel
    const [totalRes, completedRes] = await Promise.all([
      admin
        .from("training_lessons")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("trainee_lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("trainee_id", trainee.id)
        .not("completed_at", "is", null),
    ]);

    const totalLessons = totalRes.count ?? 0;
    const completedLessons = completedRes.count ?? 0;
    const completionPct =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    training = {
      status: trainee.training_status as string,
      graduatedAt: (trainee.graduated_at as string | null) ?? null,
      totalLessons,
      completedLessons,
      completionPct,
    };
  }

  return NextResponse.json({
    isCertified: diviner.is_certified as boolean,
    certifiedAt: (diviner.certified_at as string | null) ?? null,
    certifiedBy: (diviner.certified_by as string | null) ?? null,
    training,
  });
}
