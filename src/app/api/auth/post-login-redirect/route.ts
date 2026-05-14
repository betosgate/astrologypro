import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function logPasswordLogin(userId: string, req: NextRequest) {
  try {
    const admin = createAdminClient();
    await admin.from("user_login_logs").insert({
      user_id: userId,
      ip: getClientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
      city: req.headers.get("cf-ipcity") ?? null,
      country: req.headers.get("cf-ipcountry") ?? null,
      login_method: "password",
    });
  } catch {
    // non-blocking — never let logging break the login flow
  }
}

/**
 * GET /api/auth/post-login-redirect
 *
 * Server-side redirect resolution after password login.
 * Delegates all routing logic to resolveLoginDestination which:
 *   1. Checks for pending contract gates
 *   2. Returns saved last_portal_url from user_portal_preferences if present
 *   3. Falls back to role hierarchy on first visit
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ destination: "/login" }, { status: 401 });
  }

  logPasswordLogin(user.id, req);

  const adminUser = await requireAdmin();
  const isAdmin = !!adminUser;
  const isInvited = user.user_metadata?.invited_by_admin === true;
  const invitedRole =
    typeof user.user_metadata?.role === "string" ? user.user_metadata.role : undefined;
  const admin = createAdminClient();

  const destination = await resolveLoginDestination({
    userId: user.id,
    isAdmin,
    isInvited,
    invitedRole,
    adminClient: admin,
  });

  return NextResponse.json({ destination });
}
