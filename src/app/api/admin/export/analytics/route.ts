import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(","))
  ].join("\n");
}

// GET /api/admin/export/analytics
// Exports full training analytics (all trainees, no pagination limit)
export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch all trainees
  const { data: traineesData, error: traineesError } = await admin
    .from("trainees")
    .select("id, user_id, display_name, name, email, training_status, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (traineesError) {
    return NextResponse.json({ error: "Failed to fetch trainees." }, { status: 500 });
  }

  const trainees = traineesData ?? [];
  const userIds = trainees.map((t) => t.user_id).filter(Boolean);

  if (userIds.length === 0) {
    const csv = toCSV([], ["User ID", "Email", "Name", "Program", "Progress %", "Lessons Done", "Total Lessons", "Quiz Pass Rate", "Time Spent (mins)"]);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-export-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Fetch auth emails for trainees that don't have email stored
  const traineesNeedingEmail = trainees.filter((t) => !t.email);
  const emailMap = new Map<string, string>();
  for (const t of trainees) {
    if (t.email) emailMap.set(t.user_id, t.email);
  }

  if (traineesNeedingEmail.length > 0) {
    const authRes = await admin.rpc("get_auth_users_by_ids", {
      user_ids: traineesNeedingEmail.map((t) => t.user_id),
    });
    for (const u of (authRes.data ?? []) as Array<{ user_id: string; email: string }>) {
      if (u.email) emailMap.set(u.user_id, u.email);
    }
  }

  // Fetch aggregation data for all trainees in parallel
  const [
    enrollmentsRes,
    lessonCompletionsRes,
    quizAttemptsRes,
    lessonProgressRes,
    totalLessonsRes,
    programsRes,
  ] = await Promise.all([
    admin
      .from("program_enrollments")
      .select("user_id, program_id, completed_at")
      .in("user_id", userIds),
    admin
      .from("lesson_completions")
      .select("user_id, lesson_id")
      .in("user_id", userIds),
    admin
      .from("quiz_attempts")
      .select("user_id, lesson_id, passed")
      .in("user_id", userIds),
    admin
      .from("lesson_progress")
      .select("user_id, time_spent_seconds")
      .in("user_id", userIds),
    admin.from("training_lessons").select("id").eq("is_active", true),
    admin.from("training_programs").select("id, title"),
  ]);

  const enrollments     = enrollmentsRes.data ?? [];
  const lessonComps     = lessonCompletionsRes.data ?? [];
  const quizAttempts    = quizAttemptsRes.data ?? [];
  const lessonProgress  = lessonProgressRes.data ?? [];
  const totalLessons    = totalLessonsRes.data?.length ?? 0;
  const programMap      = new Map<string, string>(
    (programsRes.data ?? []).map((p: { id: string; title: string }) => [p.id, p.title])
  );

  // Per-user aggregation
  type Agg = {
    enrolled_program_ids: Set<string>;
    completed_lessons: Set<string>;
    quiz_attempts_total: number;
    quiz_pass_count: number;
    time_spent_seconds: number;
  };

  const aggs = new Map<string, Agg>();
  for (const uid of userIds) {
    aggs.set(uid, {
      enrolled_program_ids: new Set(),
      completed_lessons: new Set(),
      quiz_attempts_total: 0,
      quiz_pass_count: 0,
      time_spent_seconds: 0,
    });
  }

  for (const e of enrollments) {
    aggs.get(e.user_id)?.enrolled_program_ids.add(e.program_id);
  }
  for (const lc of lessonComps) {
    aggs.get(lc.user_id)?.completed_lessons.add(lc.lesson_id);
  }
  for (const qa of quizAttempts) {
    const a = aggs.get(qa.user_id);
    if (!a) continue;
    a.quiz_attempts_total += 1;
    if (qa.passed) a.quiz_pass_count += 1;
  }
  for (const lp of lessonProgress) {
    const a = aggs.get(lp.user_id);
    if (!a) continue;
    a.time_spent_seconds += lp.time_spent_seconds ?? 0;
  }

  // Build one row per user (not per program enrollment — one row per user with enrolled programs listed)
  const rows = trainees.map((t) => {
    const agg = aggs.get(t.user_id);
    const completed_lessons = agg?.completed_lessons.size ?? 0;
    const progress_pct = totalLessons > 0
      ? Math.round((completed_lessons / totalLessons) * 1000) / 10
      : 0;
    const quiz_pass_rate = (agg?.quiz_attempts_total ?? 0) > 0
      ? Math.round(((agg!.quiz_pass_count) / agg!.quiz_attempts_total) * 1000) / 10
      : 0;
    const time_mins = Math.round((agg?.time_spent_seconds ?? 0) / 60);
    const programNames = [...(agg?.enrolled_program_ids ?? [])]
      .map((id) => programMap.get(id) ?? id)
      .join("; ");

    return {
      "User ID":          t.user_id,
      "Email":            emailMap.get(t.user_id) ?? (t.email ?? ""),
      "Name":             t.display_name ?? t.name ?? "",
      "Program":          programNames,
      "Progress %":       progress_pct,
      "Lessons Done":     completed_lessons,
      "Total Lessons":    totalLessons,
      "Quiz Pass Rate":   quiz_pass_rate,
      "Time Spent (mins)": time_mins,
    };
  });

  const headers = [
    "User ID", "Email", "Name", "Program",
    "Progress %", "Lessons Done", "Total Lessons",
    "Quiz Pass Rate", "Time Spent (mins)",
  ];

  const csv = toCSV(rows as unknown as Record<string, unknown>[], headers);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-export-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
