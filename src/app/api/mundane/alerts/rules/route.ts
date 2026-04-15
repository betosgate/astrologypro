import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_RULE_TYPES = [
  "eclipse_on_entity", "ingress_angular", "leader_chart_hit",
  "event_cluster", "forecast_window_open", "custom",
] as const;

const VALID_PRIORITY = ["low", "medium", "high", "critical"] as const;

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_alert_rules")
    .select("id, name, rule_type, conditions, delivery_channels, priority, is_active, muted_until, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    name?: string;
    rule_type?: string;
    conditions?: Record<string, unknown>;
    delivery_channels?: string[];
    priority?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "name is required" },
      { status: 422 }
    );
  }
  if (!body.rule_type || !(VALID_RULE_TYPES as readonly string[]).includes(body.rule_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "rule_type is invalid" },
      { status: 422 }
    );
  }
  if (body.priority && !(VALID_PRIORITY as readonly string[]).includes(body.priority)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "priority must be low, medium, high, or critical" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_alert_rules")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      rule_type: body.rule_type,
      conditions: body.conditions ?? {},
      delivery_channels: body.delivery_channels ?? ["in_app"],
      priority: body.priority ?? "medium",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
