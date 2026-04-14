import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCommunityDashboardFeed } from "@/lib/dashboard-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const audienceScope =
      member.membership_type === "mystery_school"
        ? "mystery_school"
        : "perennial_mandalism";
    const items = await getCommunityDashboardFeed(audienceScope);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard feed" },
      { status: 500 },
    );
  }
}
