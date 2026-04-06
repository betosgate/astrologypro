import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const forecastType = sp.get("forecast_type") ?? "";
  const entityId = sp.get("entity_id") ?? "";
  const published = sp.get("published") ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, forecast_type, forecast_period_start, forecast_period_end, signal_strength, is_published, created_at, mundane_entities(name, flag_emoji)",
      { count: "exact" }
    );

  if (forecastType) query = query.eq("forecast_type", forecastType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (published === "true") query = query.eq("is_published", true);
  if (published === "false") query = query.eq("is_published", false);

  query = query
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    forecasts: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title?: string;
    entity_id?: string;
    forecast_type?: string;
    forecast_period_start?: string;
    forecast_period_end?: string;
    content?: string;
    signal_strength?: string;
    is_published?: boolean;
  };

  const { title, forecast_type, forecast_period_start, forecast_period_end, content } = body;

  if (!title || !title.trim()) return NextResponse.json({ error: "title is required" }, { status: 422 });
  if (!forecast_type) return NextResponse.json({ error: "forecast_type is required" }, { status: 422 });
  if (!forecast_period_start) return NextResponse.json({ error: "forecast_period_start is required" }, { status: 422 });
  if (!forecast_period_end) return NextResponse.json({ error: "forecast_period_end is required" }, { status: 422 });
  if (!content || !content.trim()) return NextResponse.json({ error: "content is required" }, { status: 422 });

  const VALID_TYPES = ["political", "economic", "weather", "social", "market", "general"] as const;
  if (!(VALID_TYPES as readonly string[]).includes(forecast_type)) {
    return NextResponse.json({ error: "Invalid forecast_type" }, { status: 422 });
  }

  const VALID_STRENGTHS = ["low", "medium", "high", "critical"] as const;
  if (body.signal_strength && !(VALID_STRENGTHS as readonly string[]).includes(body.signal_strength)) {
    return NextResponse.json({ error: "Invalid signal_strength" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_forecasts")
    .insert({
      title: title.trim(),
      entity_id: body.entity_id ?? null,
      forecast_type,
      forecast_period_start,
      forecast_period_end,
      content: content.trim(),
      signal_strength: body.signal_strength ?? null,
      is_published: body.is_published ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
