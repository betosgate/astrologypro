import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncDivinerLiveMirror } from "@/lib/live-sessions";
import { isValidLivePlatformKey } from "@/lib/live-platform-governance";

export const dynamic = "force-dynamic";

// ─── Cursor helpers ───────────────────────────────────────────────────────────

interface CursorPayload {
  created_at: string;
  id: string;
}

function encodeCursor(created_at: string, id: string): string {
  return Buffer.from(JSON.stringify({ created_at, id })).toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "created_at" in parsed &&
      "id" in parsed &&
      typeof (parsed as CursorPayload).created_at === "string" &&
      typeof (parsed as CursorPayload).id === "string"
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── GET /api/admin/live-sessions ─────────────────────────────────────────────
// Query params: diviner_id?, status?, cursor?, limit?
export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin authentication required." },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const sp = req.nextUrl.searchParams;
  const divinerId = sp.get("diviner_id");
  const status = sp.get("status");
  const cursorParam = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 200);

  const admin = createAdminClient();

  let query = admin
    .from("live_sessions")
    .select(
      `id, platform, platform_url, title, status, scheduled_at, started_at, ended_at,
       check_in_enabled, check_in_form_title, check_in_form_subtitle, created_at, updated_at,
       diviners(id, display_name, username, avatar_url)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (divinerId) {
    query = query.eq("diviner_id", divinerId);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (cursorParam) {
    const cursor = decodeCursor(cursorParam);
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }
  }

  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/live-sessions] query error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to fetch live sessions." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const rows = data ?? [];

  // Fetch exact check-in counts per session in a single query
  const sessionIds = rows.map((r) => r.id);
  const checkInCounts: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: checkIns } = await admin
      .from("check_ins")
      .select("live_session_id")
      .in("live_session_id", sessionIds);

    for (const row of checkIns ?? []) {
      const liveSessionId = row.live_session_id as string | null;
      if (!liveSessionId) continue;
      checkInCounts[liveSessionId] = (checkInCounts[liveSessionId] ?? 0) + 1;
    }
  }

  const enriched = rows.map((r) => ({
    ...r,
    check_in_count: checkInCounts[r.id] ?? 0,
  }));

  let nextCursor: string | null = null;
  if (rows.length === limit) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  return NextResponse.json({
    data: enriched,
    nextCursor,
    total: count ?? 0,
  });
}

// ─── POST /api/admin/live-sessions ────────────────────────────────────────────
// Body: { diviner_id, platform, title?, scheduled_at?, platform_url?, check_in_enabled?, check_in_form_title?, check_in_form_subtitle? }
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin authentication required." },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Request body must be valid JSON." },
      { status: 400, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Request body must be a JSON object." },
      { status: 400, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const {
    diviner_id,
    platform,
    title,
    scheduled_at,
    platform_url,
    check_in_enabled,
    check_in_form_title,
    check_in_form_subtitle,
  } = body as Record<string, unknown>;

  if (!diviner_id || typeof diviner_id !== "string") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "diviner_id is required." },
      { status: 422, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  if (!isValidLivePlatformKey(platform)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "platform must be a supported live platform." },
      { status: 422, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("live_sessions")
    .insert({
      diviner_id,
      platform,
      title: title && typeof title === "string" ? title.trim() : null,
      scheduled_at: scheduled_at && typeof scheduled_at === "string" ? scheduled_at : null,
      platform_url: platform_url && typeof platform_url === "string" ? platform_url.trim() : null,
      check_in_enabled: typeof check_in_enabled === "boolean" ? check_in_enabled : true,
      check_in_form_title: check_in_form_title && typeof check_in_form_title === "string" ? check_in_form_title.trim() : undefined,
      check_in_form_subtitle: check_in_form_subtitle && typeof check_in_form_subtitle === "string" ? check_in_form_subtitle.trim() : undefined,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[admin/live-sessions] insert error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to create live session." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  try {
    await syncDivinerLiveMirror(diviner_id);
  } catch (syncError) {
    console.error("[admin/live-sessions] mirror sync error", syncError);
  }

  return NextResponse.json(data, { status: 201 });
}
