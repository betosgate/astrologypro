import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — time-series data for a source ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const sp = req.nextUrl.searchParams;
  const sourceId = sp.get("source_id") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!sourceId) {
    return rfc9457(422, "Unprocessable Entity", "source_id query param is required");
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (from && !dateRe.test(from)) {
    return rfc9457(422, "Unprocessable Entity", "from must be YYYY-MM-DD format");
  }
  if (to && !dateRe.test(to)) {
    return rfc9457(422, "Unprocessable Entity", "to must be YYYY-MM-DD format");
  }

  const admin = createAdminClient();

  // Verify source exists
  const { data: dsData, error: dsError } = await admin
    .from("mundane_data_sources")
    .select("id, name, source_type, provider, config")
    .eq("id", sourceId)
    .maybeSingle();

  if (dsError) return rfc9457(500, "Internal Server Error", dsError.message);
  if (!dsData) return rfc9457(404, "Not Found", `Data source ${sourceId} not found`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_external_data")
    .select("id, source_id, data_type, symbol, recorded_at, value, change_percent, metadata, created_at")
    .eq("source_id", sourceId);

  if (from) query = query.gte("recorded_at", from);
  if (to) query = query.lte("recorded_at", to);

  query = query
    .order("recorded_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(365); // cap at 1 year of daily data

  const { data, error } = await query;
  if (error) return rfc9457(500, "Internal Server Error", error.message);

  return NextResponse.json({
    source: dsData,
    data_points: data ?? [],
    count: (data ?? []).length,
  });
}

// ─── POST — manually add a data point ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  let body: {
    source_id?: string;
    data_type?: string;
    symbol?: string;
    recorded_at?: string;
    value?: number;
    change_percent?: number;
  };

  try {
    body = await req.json();
  } catch {
    return rfc9457(422, "Unprocessable Entity", "Invalid JSON body");
  }

  const { source_id, data_type, symbol, recorded_at, value, change_percent } = body;

  if (!source_id || typeof source_id !== "string") {
    return rfc9457(422, "Unprocessable Entity", "source_id is required");
  }
  if (!data_type || typeof data_type !== "string") {
    return rfc9457(422, "Unprocessable Entity", "data_type is required");
  }
  if (!recorded_at || !/^\d{4}-\d{2}-\d{2}$/.test(recorded_at)) {
    return rfc9457(422, "Unprocessable Entity", "recorded_at is required and must be YYYY-MM-DD");
  }
  if (value !== undefined && typeof value !== "number") {
    return rfc9457(422, "Unprocessable Entity", "value must be a number");
  }
  if (change_percent !== undefined && typeof change_percent !== "number") {
    return rfc9457(422, "Unprocessable Entity", "change_percent must be a number");
  }

  const admin = createAdminClient();

  // Verify source exists
  const { data: dsData, error: dsError } = await admin
    .from("mundane_data_sources")
    .select("id")
    .eq("id", source_id)
    .maybeSingle();

  if (dsError) return rfc9457(500, "Internal Server Error", dsError.message);
  if (!dsData) return rfc9457(404, "Not Found", `Data source ${source_id} not found`);

  const { data: inserted, error: insertError } = await admin
    .from("mundane_external_data")
    .upsert(
      {
        source_id,
        data_type,
        symbol: symbol ?? null,
        recorded_at,
        value: value ?? null,
        change_percent: change_percent ?? null,
        metadata: {},
      },
      { onConflict: "source_id,data_type,symbol,recorded_at", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (insertError) return rfc9457(500, "Internal Server Error", insertError.message);

  return NextResponse.json({ data_point: inserted }, { status: 201 });
}
