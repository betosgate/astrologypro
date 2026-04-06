import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/community/nativity-chart/history — last 5 saved charts for the current user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("birth_chart_results")
    .select(
      "id, city_label, birth_day, birth_month, birth_year, birth_hour, birth_min, lat, lon, tzone, chart_url, astro_data, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ charts: data ?? [] });
}
