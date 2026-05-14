import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalarString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function scalarNumberParam(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

function getShortDescription(row: Record<string, unknown>) {
  const direct = scalarString(row.short_description);
  if (direct) return direct;

  if (isRecord(row.system_interpretation)) {
    return scalarString(row.system_interpretation.shortDescription);
  }

  return null;
}

function getTagOverlapCount(a: string[], b: string[]) {
  const bSet = new Set(b);
  return new Set(a.filter((tag) => bSet.has(tag))).size;
}

function numericValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function dateSortValue(value: unknown) {
  const dateString = scalarString(value);
  if (!dateString) return 0;
  const parsed = new Date(dateString).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toRelatedInsight(row: Record<string, unknown>) {
  const rowId = scalarString(row.id) ?? "";

  return {
    _id: scalarString(row.mongo_id) ?? rowId,
    id: rowId,
    type: scalarString(row.ingress_type) ?? "Ingress Chart",
    title: scalarString(row.title) ?? "Untitled ingress chart",
    description: getShortDescription(row),
    link: rowId ? `/admin/ingress-charts/${rowId}` : null,
    eventTimePeriod: scalarString(row.event_time_period),
    effective_timePeriod: scalarString(row.effective_time_period),
    location_name: scalarString(row.location_name),
    author_name: scalarString(row.author_name),
    author_email: scalarString(row.author_email),
    tags: stringArray(row.tags),
    relevanceScore: numericValue(row.relevance_score),
    locationScore: numericValue(row.location_score),
    tagsScore: numericValue(row.tags_score),
  };
}

async function getRelatedInsightsFromRpc(
  admin: AdminClient,
  chart: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const { data, error } = await admin.rpc("find_related_ingress_chart_insights", {
    p_chart_id: scalarString(chart.id),
    p_mongo_id: scalarString(chart.mongo_id),
    p_skip: skip,
    p_limit: limit,
  });

  if (error) return null;

  const rows = (Array.isArray(data) ? data : []).filter(isRecord);
  const totalCount = rows.length > 0 ? numericValue(rows[0].total_count) : 0;

  return {
    relatedInsights: rows.map(toRelatedInsight),
    hasMore: skip + limit < totalCount,
  };
}

async function getRelatedInsightsFallback(
  admin: AdminClient,
  chart: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const targetId = scalarString(chart.id);
  const targetLocation = scalarString(chart.location_name);
  const targetTags = stringArray(chart.tags);
  const select =
    "id, mongo_id, title, ingress_type, short_description, system_interpretation, event_time_period, effective_time_period, validity_end, location_name, author_name, author_email, tags";
  const candidateMap = new Map<string, Record<string, unknown>>();

  if (targetId && targetLocation) {
    const { data } = await admin
      .from("ingress_charts")
      .select(select)
      .neq("id", targetId)
      .eq("location_name", targetLocation)
      .limit(2000);

    for (const row of (Array.isArray(data) ? data : []).filter(isRecord)) {
      const rowId = scalarString(row.id);
      if (rowId) candidateMap.set(rowId, row);
    }
  }

  if (targetId && targetTags.length > 0) {
    const { data } = await admin
      .from("ingress_charts")
      .select(select)
      .neq("id", targetId)
      .overlaps("tags", targetTags)
      .limit(2000);

    for (const row of (Array.isArray(data) ? data : []).filter(isRecord)) {
      const rowId = scalarString(row.id);
      if (rowId) candidateMap.set(rowId, row);
    }
  }

  const scoredRows = Array.from(candidateMap.values())
    .map((row) => {
      const locationScore =
        targetLocation && scalarString(row.location_name) === targetLocation ? 100 : 0;
      const tagsScore = getTagOverlapCount(stringArray(row.tags), targetTags);
      const relevanceScore = locationScore + tagsScore;

      return {
        ...row,
        location_score: locationScore,
        tags_score: tagsScore,
        relevance_score: relevanceScore,
      };
    })
    .filter((row) => numericValue(row.relevance_score) > 1)
    .sort((a, b) => {
      const scoreDelta = numericValue(b.relevance_score) - numericValue(a.relevance_score);
      if (scoreDelta !== 0) return scoreDelta;

      const dateDelta = dateSortValue(b.validity_end) - dateSortValue(a.validity_end);
      if (dateDelta !== 0) return dateDelta;

      return String(b.id ?? "").localeCompare(String(a.id ?? ""));
    });

  const pagedRows = scoredRows.slice(skip, skip + limit);

  return {
    relatedInsights: pagedRows.map(toRelatedInsight),
    hasMore: skip + limit < scoredRows.length,
  };
}

async function getRelatedInsights(
  admin: AdminClient,
  chart: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const rpcResult = await getRelatedInsightsFromRpc(admin, chart, skip, limit);
  if (rpcResult) return rpcResult;

  return getRelatedInsightsFallback(admin, chart, skip, limit);
}


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const byId = await admin
    .from("ingress_charts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let data = byId.data;
  let error = byId.error;

  if (!data) {
    const byMongoId = await admin
      .from("ingress_charts")
      .select("*")
      .eq("mongo_id", id)
      .maybeSingle();

    data = byMongoId.data;
    error = byMongoId.error;
  }

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const relatedInsightSkip = scalarNumberParam(req.nextUrl.searchParams.get("skip"), 0, 0, 10000);
  const relatedInsightLimit = scalarNumberParam(req.nextUrl.searchParams.get("limit"), 6, 1, 24);
  const relatedInsights = await getRelatedInsights(
    admin,
    data as Record<string, unknown>,
    relatedInsightSkip,
    relatedInsightLimit,
  );

  return NextResponse.json({
    ...data,
    relatedInsights: relatedInsights.relatedInsights,
    hasMore: relatedInsights.hasMore,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingress_charts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("ingress_charts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
