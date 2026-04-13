import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/live-sessions/[id] ───────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin authentication required." },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const admin = createAdminClient();

  const { data: session, error } = await admin
    .from("live_sessions")
    .select(
      `id, platform, platform_url, title, status, scheduled_at, started_at, ended_at,
       check_in_enabled, check_in_form_title, check_in_form_subtitle, created_at, updated_at,
       diviners(id, display_name, username, avatar_url)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/live-sessions/[id]] GET error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to fetch session." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
  if (!session) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Live session not found." },
      { status: 404, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const { count: checkInCount } = await admin
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("live_session_id", id);

  return NextResponse.json({ ...session, check_in_count: checkInCount ?? 0 });
}

// ─── PATCH /api/admin/live-sessions/[id] ─────────────────────────────────────
// Allowed fields: status, title, platform, platform_url, scheduled_at,
//                 check_in_enabled, check_in_form_title, check_in_form_subtitle
// Status transitions: scheduled→live, live→ended, any→cancelled
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const admin = createAdminClient();

  // Fetch existing session first
  const { data: existing, error: fetchErr } = await admin
    .from("live_sessions")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/live-sessions/[id]] PATCH fetch error", fetchErr);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to fetch session." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
  if (!existing) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Live session not found." },
      { status: 404, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const {
    status,
    title,
    platform,
    platform_url,
    scheduled_at,
    check_in_enabled,
    check_in_form_title,
    check_in_form_subtitle,
  } = body as Record<string, unknown>;

  const VALID_STATUSES = ["scheduled", "live", "ended", "cancelled"] as const;
  type SessionStatus = typeof VALID_STATUSES[number];

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.includes(status as SessionStatus)) {
      return NextResponse.json(
        { type: "about:blank", title: "Validation Error", status: 422, detail: `status must be one of: ${VALID_STATUSES.join(", ")}.` },
        { status: 422, headers: { "Content-Type": "application/problem+json" } }
      );
    }
  }

  const VALID_PLATFORMS = ["facebook", "youtube", "instagram", "tiktok", "zoom", "other"] as const;
  if (platform !== undefined) {
    if (typeof platform !== "string" || !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
      return NextResponse.json(
        { type: "about:blank", title: "Validation Error", status: 422, detail: `platform must be one of: ${VALID_PLATFORMS.join(", ")}.` },
        { status: 422, headers: { "Content-Type": "application/problem+json" } }
      );
    }
  }

  // Build update payload
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    updates.status = status;
    if (status === "live") {
      updates.started_at = new Date().toISOString();
    } else if (status === "ended") {
      updates.ended_at = new Date().toISOString();
    }
  }

  if (title !== undefined) updates.title = title && typeof title === "string" ? title.trim() : null;
  if (platform !== undefined) updates.platform = platform;
  if (platform_url !== undefined) updates.platform_url = platform_url && typeof platform_url === "string" ? platform_url.trim() : null;
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at || null;
  if (check_in_enabled !== undefined) updates.check_in_enabled = Boolean(check_in_enabled);
  if (check_in_form_title !== undefined) updates.check_in_form_title = check_in_form_title && typeof check_in_form_title === "string" ? check_in_form_title.trim() : null;
  if (check_in_form_subtitle !== undefined) updates.check_in_form_subtitle = check_in_form_subtitle && typeof check_in_form_subtitle === "string" ? check_in_form_subtitle.trim() : null;

  const { data, error } = await admin
    .from("live_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("[admin/live-sessions/[id]] PATCH update error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to update session." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  return NextResponse.json(data);
}

// ─── DELETE /api/admin/live-sessions/[id] ────────────────────────────────────
// Soft-cancel: sets status = 'cancelled'
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin authentication required." },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("live_sessions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("[admin/live-sessions/[id]] DELETE error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to cancel session." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
  if (!data) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Live session not found." },
      { status: 404, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  return NextResponse.json(data);
}
