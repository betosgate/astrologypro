/**
 * Training School Graduation Logic
 *
 * Graduation requires ALL lessons across ALL programs accessible to the user
 * to be completed via their authoritative path:
 *   - Trigger-gated lessons: ALL in-video quiz triggers must be passed
 *   - Legacy quiz lessons: lesson must be in lesson_completions
 *   - Plain lessons: lesson must be in lesson_completions
 *
 * This is the authoritative graduation eligibility check for the training school.
 * Used by the lesson complete route, quiz route, and trigger answer route.
 */

import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendProgramComplete } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

/**
 * Checks whether a trainee user has completed ALL lessons in ALL programs
 * they are enrolled in, using each lesson's authoritative completion path.
 *
 * For trigger-gated lessons: checks lesson_completions (which is only written
 * after all triggers are passed).
 * For plain/quiz lessons: same lesson_completions check.
 *
 * Returns true if all lessons are in lesson_completions.
 */
async function allLessonsComplete(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  // Fetch all active lesson IDs across all active programs the user's role can access.
  // We fetch from programs API logic: get all active programs → categories → lessons.
  const { data: programs } = await admin
    .from("training_programs")
    .select("id")
    .eq("is_active", true);

  if (!programs || programs.length === 0) return false;

  const programIds = programs.map((p) => p.id);

  const { data: categories } = await admin
    .from("training_categories")
    .select("id")
    .in("training_id", programIds)
    .eq("is_active", true);

  if (!categories || categories.length === 0) return false;

  const categoryIds = categories.map((c) => c.id);

  const { data: lessons } = await admin
    .from("training_lessons")
    .select("id")
    .in("category_id", categoryIds)
    .eq("is_active", true);

  if (!lessons || lessons.length === 0) return false;

  const lessonIds = lessons.map((l) => l.id);

  // Count how many of these lessons are in lesson_completions for this user
  const { count: completedCount } = await admin
    .from("lesson_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  return (completedCount ?? 0) >= lessonIds.length;
}

/**
 * Checks if the user has completed all lessons and, if so, awards graduation.
 * Idempotent — safe to call multiple times; skips if already graduated.
 *
 * Returns true if graduation was newly awarded, false otherwise.
 */
export async function checkAndAwardTrainingGraduation(
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();

  // Short-circuit: if already graduated, skip
  const { data: traineeRow } = await admin
    .from("trainees")
    .select("id, graduated_at, training_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!traineeRow) return false;
  if (traineeRow.graduated_at || traineeRow.training_status === "graduated") {
    return false;
  }

  const allDone = await allLessonsComplete(userId);
  if (!allDone) return false;

  // All lessons complete — award graduation. Retry on certificate_code
  // unique-violation (Postgres 23505) — 48 bits of entropy means a
  // collision is astronomically unlikely (~20M graduations) but the cost
  // of a single retry is one extra UPDATE so we may as well handle it.
  const now = new Date().toISOString();
  const MAX_CERT_RETRIES = 3;
  let lastError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < MAX_CERT_RETRIES; attempt++) {
    const certCode = randomBytes(6).toString("hex").toUpperCase();
    const { error } = await admin
      .from("trainees")
      .update({
        graduated_at: now,
        training_status: "graduated",
        certificate_code: certCode,
      })
      .eq("id", traineeRow.id)
      .is("graduated_at", null); // idempotent guard

    if (!error) {
      lastError = null;
      break;
    }

    lastError = error as { code?: string; message?: string };
    const code = (error as { code?: string }).code;
    if (code !== "23505") {
      // Not a unique-violation — no point retrying.
      break;
    }
    // Loop and try a fresh code.
  }

  if (lastError) {
    console.warn("[training-graduation] update failed:", lastError.message);
    return false;
  }

  // Fire-and-forget: graduation email + notification
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const certificateUrl = `${appUrl}/trainee/training/graduation`;

  admin.auth.admin.getUserById(userId).then(({ data: authUser }) => {
    const email = authUser.user?.email ?? "";
    const meta = (authUser.user?.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string) ??
      (meta.name as string) ??
      email.split("@")[0];

    if (email) {
      sendProgramComplete({
        to: email,
        name,
        programName: "Training Program",
        certificateUrl,
      }).catch((err) => console.error("[training-graduation-email]", err));
    }
  }).catch(() => {});

  createNotification({
    userId,
    title: "Training Complete!",
    body: "You've completed all training programs. Your certificate is ready.",
    type: "training",
    actionUrl: "/trainee/training/graduation",
  }).catch(() => {});

  console.log(`[training-graduation] User ${userId} graduated at ${now}`);
  return true;
}
