import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ROLE_DESTINATIONS: Record<string, string> = {
  diviner: "/onboarding",
  client: "/portal",
  social_advo: "/join/advocate?invited=true",
  trainee: "/join/trainee?invited=true",
  perennial_mandalism: "/join/community?program=perennial_mandalism&invited=true",
  mystery_school: "/join/community?program=mystery_school&invited=true",
};

export async function POST(req: Request) {
  // Verify caller is admin
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { email, role, name } = body as { email: string; role: string; name?: string };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!ROLE_DESTINATIONS[role]) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const redirectTo = `${APP_URL}/auth/callback?invite=true&role=${encodeURIComponent(role)}`;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      role,
      invited_by_admin: true,
      ...(name ? { name } : {}),
      ...(role === "perennial_mandalism" || role === "mystery_school"
        ? { pending_membership: role }
        : {}),
    },
    redirectTo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
