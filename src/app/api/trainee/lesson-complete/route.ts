import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/trainee/lesson-complete
// Body: { lessonId: string, quizScore?: number, quizPassed?: boolean }
export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is a trainee
  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) {
    return NextResponse.json({ error: "Trainee record not found" }, { status: 403 });
  }

  let body: { lessonId?: string; quizScore?: number; quizPassed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId, quizScore, quizPassed } = body;

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  // Verify lesson exists
  const { data: lesson } = await supabase
    .from("training_lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Check if a record already exists
  const { data: existing } = await supabase
    .from("trainee_lesson_progress")
    .select("id, completed_at")
    .eq("trainee_id", trainee.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const upsertData: {
    trainee_id: string;
    lesson_id: string;
    completed_at?: string;
    quiz_score?: number;
    quiz_passed?: boolean;
  } = {
    trainee_id: trainee.id,
    lesson_id: lessonId,
  };

  // Only set completed_at if not already set (don't overwrite a prior completion)
  if (!existing?.completed_at) {
    upsertData.completed_at = new Date().toISOString();
  }

  if (quizScore !== undefined) upsertData.quiz_score = quizScore;
  if (quizPassed !== undefined) upsertData.quiz_passed = quizPassed;

  const { error } = await supabase
    .from("trainee_lesson_progress")
    .upsert(upsertData, { onConflict: "trainee_id,lesson_id" });

  if (error) {
    console.error("lesson-complete upsert error:", error.message);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }

  // Fire-and-forget graduation check after every completion
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/trainee/check-graduation`, {
    method: "POST",
    headers: { cookie: req.headers.get("cookie") ?? "" },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
