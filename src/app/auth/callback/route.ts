import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionNatalReadiness } from "@/lib/community/provision-natal-readiness";
import { ensureInvitedRoleProvisioning } from "@/lib/invite-provisioning";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function logLogin(userId: string, req: NextRequest, method = "magic_link") {
  try {
    const admin = createAdminClient();
    await admin.from("user_login_logs").insert({
      user_id: userId,
      ip: getClientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
      city: req.headers.get("cf-ipcity") ?? null,
      country: req.headers.get("cf-ipcountry") ?? null,
      login_method: method,
    });
  } catch {
    // non-blocking
  }
}

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
          const { data: newMember } = await admin
            .from("community_members")
            .insert({
              user_id: user.id,
              email: user.email,
              full_name: metadata.full_name ?? metadata.name ?? null,
              membership_type: pendingMembership,
              membership_status: "active",
            })
            .select("id")
            .single();

          // Task 08: auto-provision natal readiness for PM members on first login
          if (newMember?.id && pendingMembership === "perennial_mandalism") {
            provisionNatalReadiness({
              admin,
              communityMemberId: newMember.id,
              birthData: {
                fullName: (metadata.full_name ?? metadata.name ?? null) as string | null,
                dateOfBirth: (metadata.date_of_birth ?? null) as string | null,
                birthTime: (metadata.birth_time ?? null) as string | null,
                birthCity: (metadata.birth_city ?? null) as string | null,
                birthCountry: (metadata.birth_country ?? null) as string | null,
              },
            }); // fire-and-forget — non-blocking
          }
        } else if (existing && pendingMembership === "perennial_mandalism") {
          // Existing PM member logging in — ensure natal readiness is provisioned
          provisionNatalReadiness({
            admin,
            communityMemberId: existing.id,
            birthData: {
              fullName: (metadata.full_name ?? metadata.name ?? null) as string | null,
              dateOfBirth: (metadata.date_of_birth ?? null) as string | null,
              birthTime: (metadata.birth_time ?? null) as string | null,
              birthCity: (metadata.birth_city ?? null) as string | null,
              birthCountry: (metadata.birth_country ?? null) as string | null,
            },
          }); // fire-and-forget
        }
      }

      // ── Explicit next param (e.g. magic link with ?next=/portal) ──────────
      if (next) {
        return NextResponse.redirect(new URL(next, origin));
      }

      // ── Admin invite: provision role then resolve destination ─────────────
      const admin = createAdminClient();
      if (isInvite && metadata.invited_by_admin) {
        const role = metadata.role as string | undefined;
        if (user) {
          await ensureInvitedRoleProvisioning(admin, user, role);
        }
      }

      // ── Resolve destination via hierarchy + last portal memory ────────────
      if (user?.id) {
        const isInvited = isInvite && !!metadata.invited_by_admin;
        const destination = await resolveLoginDestination({
          userId: user.id,
          isAdmin: false,
          isInvited,
          adminClient: admin,
        });
        return NextResponse.redirect(new URL(destination, origin));
      }
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin)
  );
}
