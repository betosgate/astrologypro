import { createClient } from "@/lib/supabase/server";
import { resolveUserBirthData } from "@/lib/community/birth-data-resolver";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/me/birth-data
 *
 * Resolves the authenticated PM member's birth data via priority fallback:
 *   family_self → past_booking → member_profile → none
 *
 * Returns which source was used so the UI can surface it to the user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "No community membership", status: 404 },
      { status: 404 }
    );
  }

  if (member.membership_status !== "active") {
    return Response.json(
      { type: "https://httpstatuses.com/403", title: "Inactive membership", status: 403 },
      { status: 403 }
    );
  }

  try {
    const resolved = await resolveUserBirthData(user.id, member.id, member.full_name);
    return Response.json({ ok: true, data: resolved });
  } catch (err) {
    console.error("[api/community/me/birth-data] error:", err);
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Internal error", status: 500 },
      { status: 500 }
    );
  }
}
