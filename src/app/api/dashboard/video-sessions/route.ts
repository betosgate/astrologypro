import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createVideoSDKRoom,
  generateVideoSDKToken,
  isVideoSDKConfigured,
} from "@/lib/videosdk";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "created",
  "waiting",
  "live",
  "ended",
  "cancelled",
] as const;

type VideoSessionStatus = (typeof VALID_STATUSES)[number];

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

  return diviner ? { ...diviner, userId: user.id } : null;
}

/**
 * GET /api/dashboard/video-sessions
 * List video sessions for the authenticated diviner, cursor-paginated.
 * Query params: status, cursor (created_at:id), limit (default 20)
 */
export async function GET(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problem(401, "Unauthorized", "Authentication required.");

  const sp = req.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const bookingIdFilter = sp.get("booking_id");
  const cursor = sp.get("cursor");
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? "20")));

  const admin = createAdminClient();

  let query = admin
    .from("video_sessions")
    .select(
      `id, booking_id, room_id, room_name, provider, status,
       started_at, ended_at, duration_seconds, phone_dial_in_enabled,
       created_at, updated_at,
       clients(id, full_name, email),
       bookings(id)`
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (
    statusFilter &&
    VALID_STATUSES.includes(statusFilter as VideoSessionStatus)
  ) {
    query = query.eq("status", statusFilter);
  }

  if (bookingIdFilter) {
    query = query.eq("booking_id", bookingIdFilter);
  }

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split(":");
    if (cursorDate && cursorId) {
      query = query.or(
        `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
      );
    }
  }

  const { data, error } = await query;
  if (error) return problem(500, "Internal Server Error", error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor =
    hasMore && items.length > 0
      ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
      : null;

  return NextResponse.json({ sessions: items, nextCursor, hasMore });
}

/**
 * POST /api/dashboard/video-sessions
 * Create a new video session.
 * Body: { booking_id?, client_id?, room_name?, phone_dial_in_enabled? }
 */
export async function POST(req: NextRequest) {
  if (!isVideoSDKConfigured()) {
    return problem(
      503,
      "Service Unavailable",
      "Video reading system not configured. Contact support."
    );
  }

  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problem(401, "Unauthorized", "Authentication required.");

  let body: {
    booking_id?: unknown;
    client_id?: unknown;
    room_name?: unknown;
    phone_dial_in_enabled?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Request body must be valid JSON.");
  }

  const bookingId =
    typeof body.booking_id === "string" ? body.booking_id.trim() : undefined;
  const clientId =
    typeof body.client_id === "string" ? body.client_id.trim() : undefined;
  const roomName =
    typeof body.room_name === "string" ? body.room_name.trim() : undefined;
  const phoneDialIn =
    typeof body.phone_dial_in_enabled === "boolean"
      ? body.phone_dial_in_enabled
      : false;

  // Validate booking belongs to diviner if provided
  if (bookingId) {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("id, diviner_id")
      .eq("id", bookingId)
      .eq("diviner_id", diviner.id)
      .maybeSingle();
    if (!booking) {
      return problem(404, "Not Found", "Booking not found or does not belong to this diviner.");
    }
  }

  // Create VideoSDK room
  let roomId: string;
  try {
    const result = await createVideoSDKRoom();
    roomId = result.roomId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return problem(502, "Bad Gateway", `Failed to create video room: ${message}`);
  }

  // Generate diviner token (host)
  let divinerToken: string;
  try {
    divinerToken = await generateVideoSDKToken(
      roomId,
      diviner.id,
      diviner.display_name ?? "Host",
      "host"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return problem(500, "Internal Server Error", `Token generation failed: ${message}`);
  }

  // Generate client token if client_id is provided
  let clientToken: string | undefined;
  if (clientId) {
    const admin = createAdminClient();
    const { data: clientRow } = await admin
      .from("clients")
      .select("id, full_name")
      .eq("id", clientId)
      .maybeSingle();

    if (clientRow) {
      try {
        clientToken = await generateVideoSDKToken(
          roomId,
          clientRow.id,
          clientRow.full_name ?? "Guest",
          "guest"
        );
      } catch {
        // Non-fatal — session still created, token can be refreshed later
      }
    }
  }

  const admin = createAdminClient();
  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner.id,
    room_id: roomId,
    provider: "videosdk",
    status: "created",
    diviner_token: divinerToken,
    phone_dial_in_enabled: phoneDialIn,
  };
  if (bookingId) insertPayload.booking_id = bookingId;
  if (clientId) insertPayload.client_id = clientId;
  if (roomName) insertPayload.room_name = roomName;
  if (clientToken) insertPayload.client_token = clientToken;

  const { data: session, error: insertErr } = await admin
    .from("video_sessions")
    .insert(insertPayload)
    .select("id, room_id, room_name, status, created_at")
    .single();

  if (insertErr) {
    return problem(500, "Internal Server Error", insertErr.message);
  }

  return NextResponse.json(
    {
      id: session.id,
      room_id: session.room_id,
      room_name: session.room_name,
      status: session.status,
      diviner_token: divinerToken,
      ...(clientToken ? { client_token: clientToken } : {}),
    },
    { status: 201 }
  );
}
