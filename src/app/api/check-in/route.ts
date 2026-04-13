import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackDivinerActivityEvent } from "@/lib/diviner-analytics";

export const dynamic = "force-dynamic";

// Simple email regex — RFC 5322 compliant-enough for server validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problemDetails(
  status: number,
  title: string,
  detail: string,
  type = "about:blank"
) {
  return NextResponse.json(
    { type, title, status, detail },
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    }
  );
}

// ─── POST /api/check-in ────────────────────────────────────────────────────────
// Public endpoint — no auth required. Rate-limited per email+diviner (1hr window).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemDetails(400, "Bad Request", "Request body must be valid JSON.");
  }

  if (typeof body !== "object" || body === null) {
    return problemDetails(400, "Bad Request", "Request body must be a JSON object.");
  }

  const {
    diviner_username,
    first_name,
    last_name,
    email,
    birth_date,
    birth_city,
    birth_time,
  } = body as Record<string, unknown>;

  // ─── Validate required fields ────────────────────────────────────────────────
  if (!diviner_username || typeof diviner_username !== "string" || !diviner_username.trim()) {
    return problemDetails(422, "Validation Error", "diviner_username is required.");
  }
  if (!first_name || typeof first_name !== "string" || !first_name.trim()) {
    return problemDetails(422, "Validation Error", "first_name is required.");
  }
  if (!last_name || typeof last_name !== "string" || !last_name.trim()) {
    return problemDetails(422, "Validation Error", "last_name is required.");
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return problemDetails(422, "Validation Error", "email is required.");
  }
  if (!EMAIL_RE.test(email.trim())) {
    return problemDetails(422, "Validation Error", "email must be a valid email address.");
  }

  // ─── Optional field type checks ─────────────────────────────────────────────
  if (birth_date !== undefined && birth_date !== null && typeof birth_date !== "string") {
    return problemDetails(422, "Validation Error", "birth_date must be a string (YYYY-MM-DD).");
  }
  if (birth_city !== undefined && birth_city !== null && typeof birth_city !== "string") {
    return problemDetails(422, "Validation Error", "birth_city must be a string.");
  }
  if (birth_time !== undefined && birth_time !== null && typeof birth_time !== "string") {
    return problemDetails(422, "Validation Error", "birth_time must be a string (HH:MM).");
  }

  const admin = createAdminClient();

  // ─── Look up diviner by username ─────────────────────────────────────────────
  const { data: diviner, error: divinerErr } = await admin
    .from("diviners")
    .select("id")
    .eq("username", diviner_username.trim())
    .maybeSingle();

  if (divinerErr) {
    console.error("[check-in] diviner lookup error", divinerErr);
    return problemDetails(500, "Internal Server Error", "An unexpected error occurred.");
  }
  if (!diviner) {
    return problemDetails(404, "Not Found", "Diviner not found.");
  }

  // ─── Verify active live session ──────────────────────────────────────────────
  const { data: session, error: sessionErr } = await admin
    .from("live_sessions")
    .select("id")
    .eq("diviner_id", diviner.id)
    .eq("status", "live")
    .eq("check_in_enabled", true)
    .maybeSingle();

  if (sessionErr) {
    console.error("[check-in] session lookup error", sessionErr);
    return problemDetails(500, "Internal Server Error", "An unexpected error occurred.");
  }
  if (!session) {
    return problemDetails(409, "No active session", "This diviner is not currently live.", "https://astrologyPro.com/problems/no-active-session");
  }

  // ─── Rate limit: same email + same diviner within 1 hour ────────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentCheckIn, error: rateErr } = await admin
    .from("check_ins")
    .select("id")
    .eq("live_session_id", session.id)
    .eq("email", email.trim().toLowerCase())
    .gte("created_at", oneHourAgo)
    .maybeSingle();

  if (rateErr) {
    console.error("[check-in] rate limit check error", rateErr);
    return problemDetails(500, "Internal Server Error", "An unexpected error occurred.");
  }
  if (recentCheckIn) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Too Many Requests",
        status: 429,
        detail: "You have already checked in for this session. Please wait before checking in again.",
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

  // ─── Collect IP ───────────────────────────────────────────────────────────────
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgentRaw = req.headers.get("user-agent") ?? null;

  // ─── Insert check-in ─────────────────────────────────────────────────────────
  const { data: inserted, error: insertErr } = await admin
    .from("check_ins")
    .insert({
      diviner_id: diviner.id,
      live_session_id: session.id,
      first_name: (first_name as string).trim(),
      last_name: (last_name as string).trim(),
      email: email.trim().toLowerCase(),
      birth_date: birth_date ? (birth_date as string) : null,
      birth_city: birth_city ? (birth_city as string).trim() : null,
      birth_time: birth_time ? (birth_time as string) : null,
      ip_address: rawIp,
      user_agent: userAgentRaw,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[check-in] insert error", insertErr);
    return problemDetails(500, "Internal Server Error", "Failed to save check-in.");
  }

  await trackDivinerActivityEvent({
    divinerId: diviner.id,
    activityType: "check_in_submitted",
    path: `/${diviner_username.trim()}/check-in`,
    referrer: req.headers.get("referer"),
    request: req,
    metadata: {
      liveSessionId: session.id,
      checkInId: inserted.id,
    },
  });

  return NextResponse.json({ id: inserted.id, message: "You're checked in!" }, { status: 201 });
}
