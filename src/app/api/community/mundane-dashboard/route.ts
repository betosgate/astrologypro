import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [ingressRes, forecastsRes, entityCountRes] = await Promise.all([
    // 5 most recent published ingress charts
    supabase
      .from("ingress_charts")
      .select("id, title, ingress_type, importance, short_description, event_timestamp, validity_start, validity_end, location_name")
      .eq("is_published", true)
      .order("event_timestamp", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(5),

    // 5 upcoming published forecasts
    supabase
      .from("mundane_forecasts")
      .select("id, title, entity_id, forecast_type, forecast_period_start, forecast_period_end, signal_strength, mundane_entities(name, flag_emoji)")
      .eq("is_published", true)
      .gte("forecast_period_end", today)
      .order("forecast_period_start", { ascending: true })
      .order("id", { ascending: true })
      .limit(5),

    // Active entity count
    supabase
      .from("mundane_entities")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  return NextResponse.json({
    ingressCharts: ingressRes.data ?? [],
    forecasts: forecastsRes.data ?? [],
    entityCount: entityCountRes.count ?? 0,
  });
}
