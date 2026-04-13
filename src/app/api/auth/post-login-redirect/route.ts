import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { getRoleDestination } from "@/types/user";
import { getInvitedRoleDestination } from "@/lib/invite-destinations";

export const dynamic = "force-dynamic";

const VALID_PORTAL_BASES = [
  "/dashboard",
  "/portal",
  "/community",
  "/mystery-school",
  "/trainee",
  "/advocate",
  "/admin",
];

function isTrustedPortal(url: string): boolean {
  return VALID_PORTAL_BASES.some(
    (base) => url === base || url.startsWith(base + "/")
  );
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Fire-and-forget login log — called after every successful password login */
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
 * Server-side redirect resolution after login. Called by the login page
 * immediately after signInWithPassword succeeds. Also records the login
 * event so every password login is captured in user_login_logs.
 *
 * Priority:
 * 1. Admin users → /admin (unless they have a saved last_portal_url)
 * 2. Diviner with last_portal_url saved in DB → return to that portal
 * 3. Diviner with onboarding completed → /dashboard
 * 4. Diviner without completed onboarding → /onboarding
 * 5. Fallback → role-based destination from user metadata
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ destination: "/login" }, { status: 401 });
  }

  // ── Log the login event (non-blocking) ───────────────────────────────────
  logPasswordLogin(user.id, req);

  const adminUser = await requireAdmin();
  const isAdmin = !!adminUser;
  const admin = createAdminClient();
  const role = user.user_metadata?.role as string | undefined;
  const isInvited = user.user_metadata?.invited_by_admin === true;

  if (role === "diviner" || isAdmin) {
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, onboarding_completed, last_portal_url")
      .eq("user_id", user.id)
      .maybeSingle();

    // If they have a saved last portal, return to it
    if (diviner?.last_portal_url && isTrustedPortal(diviner.last_portal_url)) {
      return NextResponse.json({ destination: diviner.last_portal_url });
    }

    // Admin without diviner record → /admin
    if (isAdmin) {
      return NextResponse.json({ destination: "/admin" });
    }

    // Diviner: gate on onboarding completion
    if (!diviner || !diviner.onboarding_completed) {
      return NextResponse.json({
        destination: isInvited ? getInvitedRoleDestination("diviner") : "/onboarding",
      });
    }

    return NextResponse.json({ destination: "/dashboard" });
  }

  if (role === "trainee") {
    const { data: trainee } = await admin
      .from("trainees")
      .select("id, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!trainee || !trainee.onboarding_completed) {
      return NextResponse.json({
        destination: isInvited ? getInvitedRoleDestination("trainee") : "/join/trainee/profile",
      });
    }

    return NextResponse.json({ destination: "/trainee" });
  }

  if (role === "social_advo") {
    const { data: advocate } = await admin
      .from("social_advocates")
      .select("id, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!advocate || !advocate.onboarding_completed) {
      return NextResponse.json({
        destination: isInvited ? getInvitedRoleDestination("social_advo") : "/join/advocate",
      });
    }

    return NextResponse.json({ destination: "/advocate" });
  }

  if (role === "perennial_mandalism") {
    const { data: member } = await admin
      .from("community_members")
      .select("id, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member || !member.onboarding_completed) {
      return NextResponse.json({
        destination: isInvited
          ? getInvitedRoleDestination("perennial_mandalism")
          : "/community/onboarding",
      });
    }

    return NextResponse.json({ destination: "/community" });
  }

  if (role === "mystery_school") {
    const { data: student } = await admin
      .from("mystery_school_students")
      .select("id, status, access_expires_at, stripe_subscription_id, one_time_fee_paid, one_time_fee_amount")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasBilling = Boolean(
      student?.stripe_subscription_id &&
      student?.one_time_fee_paid === true &&
      typeof student?.one_time_fee_amount === "number"
    );

    const hasActiveAccess = Boolean(
      student &&
      hasBilling &&
      (
        student.status === "active" ||
        (
          student.status === "cancelled" &&
          student.access_expires_at &&
          new Date(student.access_expires_at) > new Date()
        )
      )
    );

    if (hasActiveAccess) {
      return NextResponse.json({ destination: "/mystery-school" });
    }

    return NextResponse.json({
      destination: getInvitedRoleDestination("mystery_school"),
    });
  }

  // All other roles — use metadata role
  return NextResponse.json({ destination: getRoleDestination(role) });
}
