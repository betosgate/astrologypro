import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



/**
 * GET — list all decans with ritual step counts + content-completeness flags.
 *
 * Sprint 2026-05-06: extended response shape adds Decan content columns
 * (intro_video_url, intro_audio_url, ritual_video_url, tarot_explanation,
 * artwork_url, preview_text, learning_objectives, practice_focus_*,
 * content_active, content_updated_at) plus completeness booleans
 * (metadata_complete, media_complete, ritual_complete, resources_complete)
 * and counts (resource_count, instructor_journal_count). Preserves the
 * legacy `ritualStepCount` field for back-compat.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [decansRes, ritualRes, resourcesRes, instructorRes] = await Promise.all([
    admin
      .from("decans")
      .select(
        "id, decan_number, sign, planet, title, decan_name, start_month, start_day, end_month, end_day, description, tarot_card_ref, tarot_explanation, artwork_url, preview_text, intro_video_url, intro_audio_url, ritual_video_url, learning_objectives, practice_focus_title, practice_focus_instructions, practice_focus_technique, related_audio_url, content_active, content_updated_at",
      )
      .order("decan_number"),
    admin.from("decan_rituals").select("decan_id, is_published"),
    admin.from("decan_resources").select("decan_id, is_published"),
    admin.from("decan_instructor_journals").select("decan_id, is_published"),
  ]);

  if (decansRes.error) {
    return NextResponse.json({ error: decansRes.error.message }, { status: 500 });
  }

  const ritualStepCount: Record<string, number> = {};
  const ritualPublishedCount: Record<string, number> = {};
  for (const r of (ritualRes.data ?? []) as Array<{
    decan_id: string;
    is_published: boolean | null;
  }>) {
    ritualStepCount[r.decan_id] = (ritualStepCount[r.decan_id] ?? 0) + 1;
    if (r.is_published) {
      ritualPublishedCount[r.decan_id] =
        (ritualPublishedCount[r.decan_id] ?? 0) + 1;
    }
  }
  const resourceCount: Record<string, number> = {};
  for (const r of (resourcesRes.data ?? []) as Array<{
    decan_id: string;
    is_published: boolean | null;
  }>) {
    if (r.is_published) {
      resourceCount[r.decan_id] = (resourceCount[r.decan_id] ?? 0) + 1;
    }
  }
  const instructorCount: Record<string, number> = {};
  for (const r of (instructorRes.data ?? []) as Array<{
    decan_id: string;
    is_published: boolean | null;
  }>) {
    if (r.is_published) {
      instructorCount[r.decan_id] =
        (instructorCount[r.decan_id] ?? 0) + 1;
    }
  }

  return NextResponse.json(
    ((decansRes.data ?? []) as Array<Record<string, unknown>>).map((d) => {
      const id = d.id as string;
      const ritualPub = ritualPublishedCount[id] ?? 0;
      const resCount = resourceCount[id] ?? 0;
      const metadataComplete =
        Boolean(d.title) &&
        Boolean(d.tarot_card_ref) &&
        Boolean(d.tarot_explanation) &&
        Boolean(d.artwork_url) &&
        Boolean(d.preview_text) &&
        Boolean(d.description);
      const mediaComplete =
        Boolean(d.intro_video_url) || Boolean(d.intro_audio_url);
      return {
        ...d,
        ritualStepCount: ritualStepCount[id] ?? 0,
        ritual_published_count: ritualPub,
        resource_count: resCount,
        instructor_journal_count: instructorCount[id] ?? 0,
        metadata_complete: metadataComplete,
        media_complete: mediaComplete,
        ritual_complete: ritualPub > 0,
        resources_complete: resCount > 0,
      };
    }),
  );
}

/** POST — add a ritual step to a decan */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decanId, stepOrder, stepType, content, description, tarotCardRef } = await req.json();
  if (!decanId || !content) {
    return NextResponse.json({ error: "decanId and content required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // If description or tarot mapping provided, update the decan row
  if (description !== undefined || tarotCardRef !== undefined) {
    const patch: Record<string, unknown> = {};
    if (description !== undefined) patch.description = description;
    if (tarotCardRef !== undefined) patch.tarot_card_ref = tarotCardRef || null;
    await admin.from("decans").update(patch).eq("id", decanId);
  }

  if (stepOrder !== undefined && stepType && content) {
    const { data, error } = await admin
      .from("decan_rituals")
      .insert({ decan_id: decanId, step_order: stepOrder, step_type: stepType, content })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ success: true });
}
