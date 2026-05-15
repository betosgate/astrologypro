import { NextRequest, NextResponse } from "next/server";
import { BSON, MongoClient, ObjectId, type Document } from "mongodb";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const TABLE_NAME = "ingress_charts";
const MIGRATION_FILE =
  "supabase/migrations/20260513000003_ingress_charts_legacy_mongo_import.sql";

const CONFIG_KEYS = [
  "INGRESS_CHARTS_MONGO_COLLECTION",
  "OLD_DIVINE_DB_NAME",
  "old_divine_mongo_url",
] as const;

type ImportBody = {
  batch_size?: unknown;
  dry_run?: unknown;
  limit?: unknown;
  publish_imported?: unknown;
};

type ImportOptions = {
  batch_size?: unknown;
  dry_run?: unknown;
  limit?: unknown;
  publish_imported?: unknown;
};

type IngressMongoConfig = {
  collectionName: string;
  dbName: string;
  mongoUrl: string;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type IngressInsertRow = {
  mongo_id: string;
  legacy_user_id: string | null;
  legacy_year: number | null;
  legacy_mongo_document: JsonValue;
  title: string;
  ingress_type: string | null;
  importance: string;
  short_description: string | null;
  effective_time_period: string | null;
  event_time_period: string | null;
  event_timestamp: string | null;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lon: number | null;
  location_timezone: string | null;
  system_interpretation: JsonValue | null;
  chart_data: JsonValue | null;
  sector_analysis: JsonValue | null;
  tags: string[];
  sector_focus: string[];
  is_social_advo: boolean;
  is_published: boolean;
  author_name: string | null;
  author_email: string | null;
  created_at?: string;
  updated_at?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalarString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function scalarNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function scalarInteger(value: unknown): number | null {
  const parsed = scalarNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function scalarBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

function extractMongoId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return scalarString(value);
  if (value instanceof ObjectId) return value.toHexString();
  if (isRecord(value) && typeof value.$oid === "string") return scalarString(value.$oid);
  if (
    isRecord(value) &&
    typeof (value as { toHexString?: unknown }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }
  return null;
}

function toPlainJson(value: unknown): JsonValue | null {
  if (value === undefined) return null;
  return BSON.EJSON.serialize(value, { relaxed: true }) as JsonValue;
}

function toIsoTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (isRecord(value) && "$date" in value) {
    const dateValue = value.$date;
    if (typeof dateValue === "string" || typeof dateValue === "number") {
      return toIsoTimestamp(dateValue);
    }
    if (isRecord(dateValue) && typeof dateValue.$numberLong === "string") {
      return toIsoTimestamp(Number(dateValue.$numberLong));
    }
  }
  return null;
}

function toDateOnly(value: unknown): string | null {
  const timestamp = toIsoTimestamp(value);
  return timestamp ? timestamp.slice(0, 10) : null;
}

function nestedRecord(source: Document, key: string): Record<string, unknown> {
  const value = source[key];
  return isRecord(value) ? value : {};
}

function getFirstString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = scalarString(source[key]);
    if (value) return value;
  }
  return null;
}

async function fetchIngressMongoConfig(): Promise<IngressMongoConfig> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrologypro.com";
  const url = `${baseUrl}/api/astro/fetch-config`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: CONFIG_KEYS }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`fetch-config API returned status ${res.status}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const collectionName = scalarString(data.INGRESS_CHARTS_MONGO_COLLECTION);
    const dbName = scalarString(data.OLD_DIVINE_DB_NAME);
    const mongoUrl = scalarString(data.old_divine_mongo_url);

    if (!collectionName || !dbName || !mongoUrl) {
      const keysPresent = Object.keys(data).join(", ");
      throw new Error(
        `Mongo import config missing. Required keys: [${CONFIG_KEYS.join(
          ", ",
        )}]. Keys received: [${keysPresent}]`,
      );
    }

    return { collectionName, dbName, mongoUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`fetchIngressMongoConfig failed: ${message}`);
  }
}

function mapMongoIngressChart(
  doc: Document,
  mongoId: string,
  publishImported: boolean,
): IngressInsertRow {
  const validityPeriod = nestedRecord(doc, "validityPeriod");
  const location = nestedRecord(doc, "location");
  const systemInterpretation = doc.systemInterpretation ?? doc.system_interpretation;
  const shortDescription =
    getFirstString(doc, ["short_description", "shortDescription"]) ??
    (isRecord(systemInterpretation)
      ? getFirstString(systemInterpretation, ["shortDescription", "short_description"])
      : null);

  const title =
    getFirstString(doc, ["chartName", "title", "name"]) ?? `Legacy Ingress Chart ${mongoId}`;

  const createdAt = toIsoTimestamp(doc.createdAt ?? doc.created_at);
  const updatedAt = toIsoTimestamp(doc.updatedAt ?? doc.updated_at);

  const row: IngressInsertRow = {
    mongo_id: mongoId,
    legacy_user_id: scalarString(doc.userId),
    legacy_year: scalarInteger(doc.year),
    legacy_mongo_document: toPlainJson(doc) ?? {},
    title,
    ingress_type: getFirstString(doc, ["ingressType", "ingress_type"]),
    importance: getFirstString(doc, ["importance"]) ?? "High Impact",
    short_description: shortDescription,
    effective_time_period: getFirstString(doc, [
      "effectiveTimePeriod",
      "effective_time_period",
    ]),
    event_time_period: getFirstString(doc, ["eventTimePeriod", "event_time_period"]),
    event_timestamp: toIsoTimestamp(doc.eventTimestamp ?? doc.event_timestamp),
    validity_start: toDateOnly(validityPeriod.startDate ?? doc.validity_start),
    validity_end: toDateOnly(validityPeriod.endDate ?? doc.validity_end),
    location_name: getFirstString(location, ["name"]) ?? scalarString(doc.location_name),
    location_lat: scalarNumber(location.latitude ?? doc.location_lat),
    location_lon: scalarNumber(location.longitude ?? doc.location_lon ?? doc.location_lng),
    location_timezone:
      getFirstString(location, ["timezone"]) ?? scalarString(doc.location_timezone),
    system_interpretation: toPlainJson(systemInterpretation),
    chart_data: toPlainJson(doc.chartData ?? doc.chart_data),
    sector_analysis: toPlainJson(doc.sectorAnalysis ?? doc.sector_analysis),
    tags: stringArray(doc.tags),
    sector_focus: stringArray(doc.sector_focus ?? doc.sectorFocus),
    is_social_advo: scalarBoolean(doc.is_social_advo ?? doc.isSocialAdvo, false),
    is_published: scalarBoolean(doc.is_published ?? doc.isPublished, publishImported),
    author_name:
      getFirstString(doc, ["author_name", "authorName"]) ?? scalarString(doc.userId),
    author_email: getFirstString(doc, ["author_email", "authorEmail"]),
  };

  if (createdAt) row.created_at = createdAt;
  if (updatedAt) row.updated_at = updatedAt;

  return row;
}

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    {
      type: "/errors/ingress-charts-mongo-import",
      title,
      status,
      detail,
    },
    { status },
  );
}

function importResultResponse(result: Awaited<ReturnType<typeof runIngressMongoImport>>) {
  return NextResponse.json({
    ok: true,
    dry_run: result.dry_run,
    table: TABLE_NAME,
    source: result.source,
    processed: result.processed,
    inserted: result.inserted,
    skipped_existing: result.skipped_existing,
    skipped_no_mongo_id: result.skipped_no_mongo_id,
    note: result.dry_run
      ? "Dry run only. No Postgres rows were inserted."
      : "Import completed. Existing rows are detected by ingress_charts.mongo_id and skipped.",
  });
}

async function assertImportColumnsExist() {
  const admin = createAdminClient();
  const probe = await admin
    .from(TABLE_NAME)
    .select("id, mongo_id, legacy_user_id, legacy_year, legacy_mongo_document", {
      count: "exact",
      head: true,
    });

  if (!probe.error) return { ok: true as const };

  const code = (probe.error as { code?: string }).code;
  const message = probe.error.message ?? "";
  const schemaIssue =
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    /does not exist|could not find|column/i.test(message);

  if (schemaIssue) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          type: "/errors/migration-required",
          title: "Migration Required",
          status: 409,
          detail:
            "The ingress_charts table is missing the legacy Mongo import columns. Apply the migration before running this import.",
          migration: MIGRATION_FILE,
          database_error: message,
        },
        { status: 409 },
      ),
    };
  }

  return {
    ok: false as const,
    response: problem(500, "Schema Probe Failed", message || `Error code: ${code || "unknown"}. Full error: ${JSON.stringify(probe.error)}`),
  };
}

let activeImport:
  | Promise<Awaited<ReturnType<typeof runIngressMongoImportUnlocked>>>
  | null = null;

async function runIngressMongoImportUnlocked(options: ImportOptions = {}) {
  const batchSizeRaw = scalarInteger(options.batch_size);
  const limit = scalarInteger(options.limit);
  const batchSize =
    batchSizeRaw && batchSizeRaw > 0 ? Math.min(batchSizeRaw, 500) : 100;
  const dryRun = scalarBoolean(options.dry_run, false);
  const publishImported = scalarBoolean(options.publish_imported, false);

  const schema = await assertImportColumnsExist();
  if (!schema.ok) {
    throw new Error(
      `Import schema check failed with status ${schema.response.status}.`,
    );
  }

  const config = await fetchIngressMongoConfig();
  const admin = createAdminClient();
  const mongo = new MongoClient(config.mongoUrl, {
    serverSelectionTimeoutMS: 15000,
  });

  let processed = 0;
  let inserted = 0;
  let skippedExisting = 0;
  let skippedNoMongoId = 0;
  let sourceCount: number | null = null;

  try {
    await mongo.connect();
    const collection = mongo.db(config.dbName).collection(config.collectionName);
    sourceCount = await collection.estimatedDocumentCount().catch(() => null);

    const cursor = collection.find({}).batchSize(batchSize);
    if (limit && limit > 0) cursor.limit(limit);

    let batch: Document[] = [];

    async function flushBatch() {
      if (batch.length === 0) return;

      const rowsByMongoId = new Map<string, IngressInsertRow>();
      for (const doc of batch) {
        const mongoId = extractMongoId(doc._id);
        if (!mongoId) {
          skippedNoMongoId++;
          continue;
        }
        rowsByMongoId.set(mongoId, mapMongoIngressChart(doc, mongoId, publishImported));
      }

      const mongoIds = Array.from(rowsByMongoId.keys());
      if (mongoIds.length === 0) {
        batch = [];
        return;
      }

      const { data: existingRows, error: existingError } = await admin
        .from(TABLE_NAME)
        .select("mongo_id")
        .in("mongo_id", mongoIds);

      if (existingError) {
        throw new Error(`Existing-row check failed: ${existingError.message}`);
      }

      const existingIds = new Set(
        (existingRows ?? [])
          .map((row: { mongo_id?: string | null }) => row.mongo_id)
          .filter((id: unknown): id is string => typeof id === "string"),
      );

      const rowsToInsert = mongoIds
        .filter((mongoId) => !existingIds.has(mongoId))
        .map((mongoId) => rowsByMongoId.get(mongoId))
        .filter((row): row is IngressInsertRow => !!row);

      skippedExisting += mongoIds.length - rowsToInsert.length;

      if (rowsToInsert.length > 0) {
        if (dryRun) {
          inserted += rowsToInsert.length;
        } else {
          const { error: insertError } = await admin
            .from(TABLE_NAME)
            .insert(rowsToInsert);

          if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`);
          }

          inserted += rowsToInsert.length;
        }
      }

      batch = [];
    }

    for await (const doc of cursor) {
      processed++;
      batch.push(doc);
      if (batch.length >= batchSize) {
        await flushBatch();
      }
    }

    await flushBatch();

    return {
      dry_run: dryRun,
      source: {
        database: config.dbName,
        collection: config.collectionName,
        estimated_count: sourceCount,
      },
      processed,
      inserted,
      skipped_existing: skippedExisting,
      skipped_no_mongo_id: skippedNoMongoId,
    };
  } finally {
    await mongo.close().catch(() => undefined);
  }
}

export async function runIngressMongoImport(options: ImportOptions = {}) {
  if (activeImport) {
    const result = await activeImport;
    return { ...result, already_running: true };
  }

  activeImport = runIngressMongoImportUnlocked(options);

  try {
    const result = await activeImport;
    return { ...result, already_running: false };
  } finally {
    activeImport = null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as ImportBody;

  const schema = await assertImportColumnsExist();
  if (!schema.ok) return schema.response;

  try {
    const result = await runIngressMongoImport(body);
    return importResultResponse(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown import error";
    console.error("[admin/ingress-charts/import-mongo] Error:", err);
    return problem(502, "Ingress Mongo Import Failed", message);
  }
}
