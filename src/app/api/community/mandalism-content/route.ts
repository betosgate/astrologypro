import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify active community_members membership
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isActiveMember = member.membership_status === "active";

  const admin = createAdminClient();

  // Fetch published content — free content is always visible;
  // members-only content is only included for active members.
  let query = admin
    .from("mandalism_content")
    .select(
      "id, title, content_type, access_control, url, pdf_url, content_thumbnail_url, duration_label, description, start_at, end_at, priority"
    )
    .eq("is_published", true);

  if (isActiveMember) {
    // Active members see both free and members-only content
    query = query.or("access_control.eq.free,access_control.eq.members");
  } else {
    // Inactive/cancelled members only see free content
    query = query.eq("access_control", "free");
  }

  const { data, error } = await query
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
