import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateVideoSDKToken,
  isVideoSDKConfigured,
} from "@/lib/videosdk";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string): NextResponse {
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
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ? { ...diviner } : null;
}

async function getSessionOwnedByDiviner(sessionId: string, dividerId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("video_sessions")
    .select(
      `id, booking_id, diviner_id, client_id, room_id, room_name, provider,
       status, diviner_token, client_token, started_at, ended_at,
       duration_seconds, recording_url, notes, phone_dial_in_enabled,
       created_at, updated_at,
       clients(id, full_name, email)`
    )
    .eq("id", sessionId)
    .eq("diviner_id", dividerId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * GET /api/dashboard/video-sessions/[id]
 * Returns session details + participant count.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problem(401, "Unauthorized", "Authentication required.");

  const session = await getSessionOwnedByDiviner(params.id, diviner.id);
  if (!session) return problem(404, "Not Found", "Video session not found.");

  const admin = createAdminClient();
  const { count: participantCount } = await admin
    .from("video_session_participants")
    .select("id", { count: "exact", head: true })
    .eq("session_id", params.id);

  return NextResponse.json({ session, participantCount: participantCount ?? 0 });
}

/**
 * PATCH /api/dashboard/video-sessions/[id]
 * Update status, notes, recording_url; or action=refresh_tokens.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problem(401, "Unauthorized", "Authentication required.");

  const session = await getSessionOwnedByDiviner(params.id, diviner.id);
  if (!session) return problem(404, "Not Found", "Video session not found.");

  let body: {
    action?: unknown;
    status?: unknown;
    notes?: unknown;
    recording_url?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Request body must be valid JSON.");
  }

  // Refresh tokens action
  if (body.action === "refresh_tokens") {
    if (!isVideoSDKConfigured()) {
      return problem(503, "Service Unavailable", "Video reading system not configured.");
    }
    const divinerToken = await generateVideoSDKToken(
      session.room_id,
      diviner.id,
      diviner.display_name ?? "Host",
      "host",
      3600
    );

    let clientToken: string | null = null;
    if (session.client_id) {
      const admin = createAdminClient();
      const { data: clientRow } = await admin
        .from("clients")
        .select("id, full_name")
        .eq("id", session.client_id)
        .maybeSingle();
      if (clientRow) {
        clientToken = await generateVideoSDKToken(
          session.room_id,
          clientRow.id,
          clientRow.full_name ?? "Guest",
          "guest",
          3600
        );
      }
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {
      diviner_token: divinerToken,
      updated_at: new Date().toISOString(),
    };
    if (clientToken) updates.client_token = clientToken;

    const { error: updateErr } = await admin
      .from("video_sessions")
      .update(updates)
      .eq("id", params.id);

    if (updateErr) return problem(500, "Internal Server Error", updateErr.message);

    return NextResponse.json({
      diviner_token: divinerToken,
      ...(clientToken ? { client_token: clientToken } : {}),
    });
  }

  // Regular field updates
  const VALID_STATUSES = ["created", "waiting", "live", "ended", "cancelled"] as const;
  type VS = (typeof VALID_STATUSES)[number];

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as VS)) {
      return problem(422, "Validation Error", `Invalid status value.`);
    }
    updates.status = body.status;

    // Lifecycle timestamps
    if (body.status === "live" && !session.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (body.status === "ended" && !session.ended_at) {
      const endedAt = new Date();
      updates.ended_at = endedAt.toISOString();
      if (session.started_at) {
        updates.duration_seconds = Math.floor(
          (endedAt.getTime() - new Date(session.started_at).getTime()) / 1000
        );
      }
    }
  }

  if (body.notes !== undefined) {
    updates.notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }

  if (body.recording_url !== undefined) {
    updates.recording_url =
      typeof body.recording_url === "string" && body.recording_url.trim()
        ? body.recording_url.trim()
        : null;
  }

  if (Object.keys(updates).length === 1) {
    return problem(422, "Validation Error", "No updatable fields provided.");
  }

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from("video_sessions")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (updateErr) return problem(500, "Internal Server Error", updateErr.message);

  return NextResponse.json({ session: updated });
}
