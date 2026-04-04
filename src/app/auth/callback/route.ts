import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleDestination } from "@/types/user";
import { getUserPortals } from "@/lib/user-roles";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function logLogin(userId: string, req: NextRequest) {
  try {
    const admin = createAdminClient();
    await admin.from("user_login_logs").insert({
      user_id: userId,
      ip: getClientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
      city: req.headers.get("cf-ipcity") ?? null,
      country: req.headers.get("cf-ipcountry") ?? null,
    });
  } catch {
    // non-blocking
  }
}

// Destination for admin-invited users who need to complete their profile
const INVITE_DESTINATIONS: Record<string, string> = {
  social_advo: "/join/advocate?invited=true",
  trainee: "/join/trainee?invited=true",
  diviner: "/onboarding",
  client: "/portal",
  perennial_mandalism: "/community",
  mystery_school: "/community",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next"); // explicit override
  const isInvite = searchParams.get("invite") === "true";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const metadata = user?.user_metadata ?? {};

      // ── Log login event ───────────────────────────────────────────────────
      if (user?.id) {
        logLogin(user.id, request);
      }

      // ── Community member first login: create membership row ────────────────
      const pendingMembership = metadata.pending_membership as string | undefined;
      if (pendingMembership && user?.id && user?.email) {
        const admin = createAdminClient();
        const { data: existing } = await admin
          .from("community_members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          await admin.from("community_members").insert({
            user_id: user.id,
            email: user.email,
            full_name: metadata.full_name ?? metadata.name ?? null,
            membership_type: pendingMembership,
            membership_status: "active",
          });
        }
      }

      // ── Explicit next param (e.g. magic link with ?next=/portal) ──────────
      if (next) {
        return NextResponse.redirect(new URL(next, origin));
      }

      // ── Admin invite: route to profile-completion page ────────────────────
      if (isInvite && metadata.invited_by_admin) {
        const role = metadata.role as string | undefined;
        const dest = role ? (INVITE_DESTINATIONS[role] ?? getRoleDestination(role)) : "/switch";
        return NextResponse.redirect(new URL(dest, origin));
      }

      // ── Multi-role: if user has 2+ portals, send to switch page ──────────
      if (user?.id) {
        const portals = await getUserPortals(supabase, user.id);
        if (portals.length > 1) {
          return NextResponse.redirect(new URL("/switch", origin));
        }
        if (portals.length === 1) {
          return NextResponse.redirect(new URL(portals[0].href, origin));
        }
      }

      // ── Fallback: detect destination from user role in metadata ───────────
      const role = metadata.role as string | undefined;
      return NextResponse.redirect(new URL(getRoleDestination(role), origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin)
  );
}
