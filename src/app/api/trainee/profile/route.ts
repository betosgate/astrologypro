import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validation schema for PATCH
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

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  specialties: z.array(z.enum(ALLOWED_SPECIALTIES)).optional(),
  avatar_url: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/trainee/profile
// Returns the authenticated trainee's profile with mentor name and progress.
// ---------------------------------------------------------------------------
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: trainee, error } = await admin
    .from("trainees")
    .select(
      "id, name, email, username, bio, specialties, avatar_url, training_status, mentor_diviner_id, graduated_at, created_at"
    )
    .eq("user_id", user.id)
    .single();

  if (error || !trainee) {
    return NextResponse.json({ error: "Trainee not found." }, { status: 404 });
  }

  // Fetch mentor name + overall progress in parallel
  const [mentorResult, progressResult] = await Promise.all([
    trainee.mentor_diviner_id
      ? admin
          .from("diviners")
          .select("display_name")
          .eq("id", trainee.mentor_diviner_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("user_program_progress")
      .select("total_lessons, completed_lessons, progress_pct")
      .eq("user_id", user.id),
  ]);

  const mentorName = mentorResult.data
    ? (mentorResult.data as { display_name: string }).display_name
    : null;

  // Aggregate progress across all programs
  const progressRows = (progressResult.data as { total_lessons: number; completed_lessons: number; progress_pct: number }[] | null) ?? [];
  const totalLessons = progressRows.reduce((sum, r) => sum + (r.total_lessons ?? 0), 0);
  const completedLessons = progressRows.reduce((sum, r) => sum + (r.completed_lessons ?? 0), 0);
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return NextResponse.json({
    profile: {
      id: trainee.id,
      name: trainee.name,
      email: trainee.email,
      username: trainee.username,
      bio: trainee.bio ?? null,
      specialties: trainee.specialties ?? [],
      avatar_url: (trainee as { avatar_url?: string | null }).avatar_url ?? null,
      training_status: trainee.training_status,
      mentor_name: mentorName,
      graduated_at: trainee.graduated_at ?? null,
      created_at: trainee.created_at,
    },
    progress: {
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      overall_pct: overallPct,
    },
    allowed_specialties: ALLOWED_SPECIALTIES,
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/trainee/profile
// Updates name, bio, specialties, and/or avatar_url — own record only.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        type: "https://arologypro.com/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "One or more fields are invalid.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify the trainee record exists and belongs to this user
  const { data: existing, error: lookupError } = await admin
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Trainee not found." }, { status: 404 });
  }

  // Only update fields that were provided
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.specialties !== undefined) updates.specialties = parsed.data.specialties;
  if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;

  const { error: updateError } = await admin
    .from("trainees")
    .update(updates)
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
