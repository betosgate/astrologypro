import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problemDetail(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();
  const [{ data: sessions, error: sessionsError }, { data: importedRows, error: importedError }] =
    await Promise.all([
      admin
        .from("live_sessions")
        .select("id, title, platform, platform_url, ended_at, started_at, created_at")
        .eq("diviner_id", diviner.id)
        .eq("status", "ended")
        .not("platform_url", "is", null)
        .order("ended_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      admin
        .from("media_items")
        .select("id, source_live_session_id")
        .eq("diviner_id", diviner.id)
        .eq("source_type", "live_session")
        .not("source_live_session_id", "is", null),
    ]);

  if (sessionsError || importedError) {
    return problemDetail(
      500,
      "Internal Server Error",
      sessionsError?.message ?? importedError?.message ?? "Failed to load import candidates."
    );
  }

  const importedMap = new Map(
    (importedRows ?? [])
      .filter((row) => typeof row.source_live_session_id === "string")
      .map((row) => [row.source_live_session_id as string, row.id as string])
  );

  return NextResponse.json({
    sessions: (sessions ?? []).map((session) => ({
      ...session,
      already_imported: importedMap.has(session.id),
      media_item_id: importedMap.get(session.id) ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  if (typeof body.live_session_id !== "string" || !body.live_session_id.trim()) {
    return problemDetail(422, "Validation Error", "live_session_id is required.");
  }

  const admin = createAdminClient();
  const liveSessionId = body.live_session_id.trim();

  const { data: session, error: sessionError } = await admin
    .from("live_sessions")
    .select("id, diviner_id, title, platform, platform_url, ended_at")
    .eq("id", liveSessionId)
    .eq("diviner_id", diviner.id)
    .eq("status", "ended")
    .maybeSingle();

  if (sessionError) {
    return problemDetail(500, "Internal Server Error", sessionError.message);
  }
  if (!session || !session.platform_url) {
    return problemDetail(404, "Not Found", "Eligible live session not found.");
  }

  const { data: existingImport } = await admin
    .from("media_items")
    .select("id")
    .eq("diviner_id", diviner.id)
    .eq("source_live_session_id", liveSessionId)
    .maybeSingle();

  if (existingImport) {
    return problemDetail(409, "Duplicate Import", "This live session has already been added to the video library.");
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : session.title?.trim() || `Past live on ${session.platform}`;
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const thumbnailUrl =
    typeof body.thumbnail_url === "string" && body.thumbnail_url.trim()
      ? body.thumbnail_url.trim()
      : null;

  const { data: item, error: insertError } = await admin
    .from("media_items")
    .insert({
      diviner_id: diviner.id,
      type: "video",
      url: session.platform_url,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      platform: session.platform,
      is_active: true,
      is_featured: false,
      moderation_status: "pending",
      submitted_for_review_at: new Date().toISOString(),
      source_type: "live_session",
      source_live_session_id: liveSessionId,
    })
    .select("id, title, url, source_live_session_id")
    .single();

  if (insertError || !item) {
    return problemDetail(
      500,
      "Internal Server Error",
      insertError?.message ?? "Failed to import live session."
    );
  }

  return NextResponse.json({ item }, { status: 201 });
}
