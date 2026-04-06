import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVideoSDKToken, isVideoSDKConfigured } from "@/lib/videosdk";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter: {ip_sessionId} -> [timestamps]
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const window = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitStore.get(key) ?? []).filter((t) => t > window);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

function problem(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

/**
 * POST /api/video-sessions/[id]/join
 * Public endpoint — validates the client_token for the session.
 * Body: { token: string }  (the client_token stored in the session row)
 * Returns: { videosdk_token, room_id, session_status, room_name }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit by IP + session ID
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rlKey = `${ip}:${params.id}`;
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Too Many Requests",
        detail: "Rate limit exceeded. Try again later.",
        status: 429,
      },
      {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": "3600",
        },
      }
    );
  }

  if (!isVideoSDKConfigured()) {
    return problem(
      503,
      "Service Unavailable",
      "Video reading system not configured. Contact support."
    );
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Request body must be valid JSON.");
  }

  if (!body.token || typeof body.token !== "string") {
    return problem(422, "Validation Error", "Field 'token' is required.");
  }

  const admin = createAdminClient();
  const { data: session, error: fetchErr } = await admin
    .from("video_sessions")
    .select(
      "id, room_id, room_name, status, client_id, client_token, diviner_id"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (fetchErr || !session) {
    return problem(404, "Not Found", "Video session not found.");
  }

  if (!["created", "waiting", "live"].includes(session.status)) {
    return problem(
      409,
      "Conflict",
      `Session is not joinable (status: ${session.status}).`
    );
  }

  if (!session.client_token) {
    return problem(403, "Forbidden", "No client access token configured for this session.");
  }

  // Constant-time comparison to prevent timing attacks
  const provided = body.token.trim();
  const stored = session.client_token;
  const equal =
    provided.length === stored.length &&
    provided.split("").every((c, i) => c === stored[i]);

  if (!equal) {
    return problem(403, "Forbidden", "Invalid session token.");
  }

  // Determine participant name
  let participantName = "Guest";
  let participantId = `client-${session.id}`;
  if (session.client_id) {
    const { data: clientRow } = await admin
      .from("clients")
      .select("id, full_name")
      .eq("id", session.client_id)
      .maybeSingle();
    if (clientRow) {
      participantId = clientRow.id;
      participantName = clientRow.full_name ?? "Guest";
    }
  }

  const videosdkToken = await generateVideoSDKToken(
    session.room_id,
    participantId,
    participantName,
    "guest",
    3600
  );

  return NextResponse.json({
    videosdk_token: videosdkToken,
    room_id: session.room_id,
    session_status: session.status,
    room_name: session.room_name,
  });
}
