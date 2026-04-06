import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/trainee/resources
 *
 * Returns all lesson assets for lessons the trainee can access
 * (i.e., lessons in programs the trainee's role grants access to),
 * grouped by asset_type category, plus the enriched lesson list
 * (with pdf_url / video_url) for the Study Guides section.
 *
 * Auth: authenticated trainee only — returns 401/403 otherwise.
 * Uses service-role client to bypass RLS for joined queries.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ── 1. Verify the user is an active trainee ──────────────────────────────
  const { data: trainee, error: traineeError } = await admin
    .from("trainees")
    .select("id, training_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (traineeError || !trainee) {
    return NextResponse.json({ error: "Trainee record not found." }, { status: 403 });
  }

  // ── 2. Resolve role slugs for program access (same logic as programs route) ──
  const [divinerRow, communityRow, advocateRow, affiliateRow] =
    await Promise.all([
      admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("community_members").select("membership_type").eq("user_id", user.id).maybeSingle(),
      admin.from("social_advocates").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("affiliates").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

  const userSlugs: string[] = ["is_trainee"];
  if (divinerRow.data) userSlugs.push("is_astrologer");
  if (advocateRow.data) userSlugs.push("is_social_advo");
  if (affiliateRow.data) userSlugs.push("is_affiliate");
  if (communityRow.data) {
    if (communityRow.data.membership_type === "mystery_school") userSlugs.push("is_mystery_school");
    if (communityRow.data.membership_type === "perennial_mandalism") userSlugs.push("is_Perennial_Mandalism");
  }

  // ── 3. Fetch all active programs this user may access ────────────────────
  const { data: programs, error: programsError } = await admin
    .from("training_programs")
    .select("id, name, allowed_roles")
    .eq("is_active", true);

  if (programsError) {
    return NextResponse.json({ error: programsError.message }, { status: 500 });
  }

  const accessibleProgramIds = (programs ?? [])
    .filter((p) => {
      const allowed: string[] = p.allowed_roles ?? [];
      return allowed.length === 0 || userSlugs.some((s) => allowed.includes(s));
    })
    .map((p) => p.id);

  if (accessibleProgramIds.length === 0) {
    return NextResponse.json({ assets: [], lessons: [] });
  }

  // ── 4. Fetch categories → lessons for accessible programs ─────────────────
  const { data: categories } = await admin
    .from("training_categories")
    .select("id, name, training_id")
    .in("training_id", accessibleProgramIds)
    .eq("is_active", true);

  const categoryIds = (categories ?? []).map((c) => c.id);

  if (categoryIds.length === 0) {
    return NextResponse.json({ assets: [], lessons: [] });
  }

  const { data: lessons, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, title, category_id, pdf_url, video_url, duration_mins, is_active")
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  const lessonIds = (lessons ?? []).map((l) => l.id);

  if (lessonIds.length === 0) {
    return NextResponse.json({ assets: [], lessons: [] });
  }

  // ── 5. Fetch all lesson assets for accessible lessons ─────────────────────
  const { data: assets, error: assetsError } = await admin
    .from("lesson_assets")
    .select("id, lesson_id, title, asset_type, url, file_size_bytes, is_downloadable, priority")
    .in("lesson_id", lessonIds)
    .order("priority", { ascending: true });

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  // ── 6. Build lesson lookup map (for asset enrichment) ────────────────────
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const programMap = new Map((programs ?? []).map((p) => [p.id, p]));

  const lessonMap = new Map((lessons ?? []).map((l) => {
    const cat = categoryMap.get(l.category_id);
    const prog = cat ? programMap.get(cat.training_id) : null;
    return [l.id, { ...l, category_name: cat?.name ?? null, program_name: prog?.name ?? null }];
  }));

  // ── 7. Enrich assets with lesson context ──────────────────────────────────
  const enrichedAssets = (assets ?? []).map((a) => {
    const lesson = lessonMap.get(a.lesson_id);
    return {
      ...a,
      lesson_title: lesson?.title ?? null,
      category_name: lesson?.category_name ?? null,
      program_name: lesson?.program_name ?? null,
    };
  });

  // ── 8. Enrich lessons (filter to those with pdf_url or video_url) ─────────
  const studyGuides = (lessons ?? [])
    .filter((l) => l.pdf_url || l.video_url)
    .map((l) => {
      const cat = categoryMap.get(l.category_id);
      const prog = cat ? programMap.get(cat.training_id) : null;
      return {
        id: l.id,
        title: l.title,
        pdf_url: l.pdf_url ?? null,
        video_url: l.video_url ?? null,
        duration_mins: l.duration_mins ?? null,
        category_name: cat?.name ?? null,
        program_name: prog?.name ?? null,
      };
    });

  return NextResponse.json({
    assets: enrichedAssets,
    study_guides: studyGuides,
    total_assets: enrichedAssets.length,
    total_study_guides: studyGuides.length,
  });
}
