import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, getIpIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ─── POST /api/auth/change-password ──────────────────────────────────────────
// Body: { currentPassword: string, newPassword: string }
// Requires authentication.
// Note: Supabase does not expose re-authentication via server-side client;
// the caller is responsible for confirming the current password client-side
// before calling this endpoint. The server enforces the session requirement
// and password strength only.

export async function POST(req: NextRequest) {
  // Rate limit: 5 per minute per IP before auth check to stop brute-force on the endpoint itself
  const ipRl = await rateLimit(getIpIdentifier(req), 5, 60 * 1_000);
  if (!ipRl.success) {
    return rateLimitResponse(ipRl, "Too many password-change attempts. Please wait before trying again.") as unknown as NextResponse;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Unauthorized",
        status: 401,
        detail: "You must be signed in to change your password.",
      },
      { status: 401 }
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Bad Request",
        status: 400,
        detail: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  const newPassword = (body.newPassword ?? "").toString();

  if (newPassword.length < 8) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Unprocessable Entity",
        status: 422,
        detail: "New password must be at least 8 characters.",
      },
      { status: 422 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Password Update Failed",
        status: 422,
        detail: error.message,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true });
}
