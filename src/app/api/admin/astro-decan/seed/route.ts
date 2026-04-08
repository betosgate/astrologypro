import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import decanRecords from "@/data/astro_decan_new_infos.seed.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/admin/astro-decan/seed
 *
 * Admin-only one-shot data sync that loads the legacy MongoDB
 * `astro_decan_new_infos` records into the PostgreSQL table of the same
 * name. Idempotent: each row is upserted by its `mongo_id` so re-running the
 * endpoint is safe.
 *
 * **Requires the schema migration to be applied first.**
 * The DDL portion (CREATE TABLE / indexes / RLS) lives in
 * `supabase/migrations/20260408000106_astro_decan_new_infos.sql` and must be
 * applied via the Supabase dashboard SQL editor or `supabase db push`.
 * PostgREST (and therefore the supabase-js client this endpoint uses)
 * cannot run DDL, so this route only handles the data sync.
 *
 * If the table is missing, returns 409 with clear instructions.
 *
 * Response (success): { ok: true, total, inserted, updated, table: "astro_decan_new_infos" }
 * Response (table missing): RFC 9457 problem details, status 409
 * Response (auth):    { error: "Unauthorized" }, status 401
 */

interface MongoRecord {
  _id?: { $oid?: string } | string;
  planet?: string;
  signs?: string;
  decan?: string;
  tarot_name?: string;
  tarot_card_big_image?: string;
  tarot_card_thumb_image?: string;
  greek_daemon?: string;
  planet_sign_short_desc?: string;
  planet_sign_long_desc?: string;
  tarot_short_desc?: string;
  tarot_long_desc?: string;
  daemon_short_desc?: string;
  daemon_long_desc?: string;
  decan_img?: string;
}

function extractMongoId(raw: MongoRecord["_id"]): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.$oid === "string") return raw.$oid;
  return null;
}

export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = decanRecords as MongoRecord[];

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      {
        type: "/errors/empty-source",
        title: "Empty Source File",
        status: 422,
        detail:
          "The bundled JSON source contains no records. Check tasks/08.04.2026/astro-toolkit/divine_infinity.astro_decan_new_infos.json.",
      },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Pre-flight: detect if the table exists. PostgREST returns code "42P01"
  // (relation does not exist) when the table is missing — surface a clear
  // error so the operator knows to run the DDL migration first.
  const probe = await admin
    .from("astro_decan_new_infos")
    .select("id", { count: "exact", head: true });

  if (probe.error) {
    const code = (probe.error as { code?: string }).code;
    if (code === "42P01" || /does not exist/i.test(probe.error.message ?? "")) {
      return NextResponse.json(
        {
          type: "/errors/table-missing",
          title: "Table Not Found",
          status: 409,
          detail:
            "The astro_decan_new_infos table does not exist yet. Apply supabase/migrations/20260408000106_astro_decan_new_infos.sql via the Supabase dashboard SQL editor (or `supabase db push`) before running this endpoint.",
          migration:
            "supabase/migrations/20260408000106_astro_decan_new_infos.sql",
        },
        { status: 409 },
      );
    }
    console.error("[admin/astro-decan/seed] probe error:", probe.error);
    return NextResponse.json(
      {
        type: "/errors/internal",
        title: "Probe Failed",
        status: 500,
        detail: probe.error.message,
      },
      { status: 500 },
    );
  }

  const existingCount = probe.count ?? 0;

  // Build the upsert payload. Skip records without a mongo_id (the unique
  // conflict key) — we don't have a way to dedupe them safely otherwise.
  const rows: Array<Record<string, string | null>> = [];
  let skippedNoId = 0;

  for (const r of records) {
    const mongoId = extractMongoId(r._id);
    if (!mongoId) {
      skippedNoId++;
      continue;
    }
    rows.push({
      mongo_id: mongoId,
      planet: r.planet ?? null,
      signs: r.signs ?? null,
      decan: r.decan ?? null,
      tarot_name: r.tarot_name ?? null,
      tarot_card_big_image: r.tarot_card_big_image ?? null,
      tarot_card_thumb_image: r.tarot_card_thumb_image ?? null,
      greek_daemon: r.greek_daemon ?? null,
      planet_sign_short_desc: r.planet_sign_short_desc ?? null,
      planet_sign_long_desc: r.planet_sign_long_desc ?? null,
      tarot_short_desc: r.tarot_short_desc ?? null,
      tarot_long_desc: r.tarot_long_desc ?? null,
      daemon_short_desc: r.daemon_short_desc ?? null,
      daemon_long_desc: r.daemon_long_desc ?? null,
      decan_img: r.decan_img ?? null,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      {
        type: "/errors/no-rows",
        title: "No Importable Rows",
        status: 422,
        detail:
          "Every record in the JSON source is missing a `_id.$oid` value. Cannot upsert without a stable conflict key.",
      },
      { status: 422 },
    );
  }

  // Upsert by mongo_id. PostgREST requires the conflict target to be a
  // UNIQUE/PK column (mongo_id has UNIQUE in the migration).
  const { error: upsertError } = await admin
    .from("astro_decan_new_infos")
    .upsert(rows, { onConflict: "mongo_id" });

  if (upsertError) {
    console.error("[admin/astro-decan/seed] upsert error:", upsertError);
    return NextResponse.json(
      {
        type: "/errors/upsert-failed",
        title: "Upsert Failed",
        status: 500,
        detail: upsertError.message,
      },
      { status: 500 },
    );
  }

  // Re-count to report the post-import row count.
  const { count: finalCount } = await admin
    .from("astro_decan_new_infos")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    table: "astro_decan_new_infos",
    source_records: records.length,
    upserted: rows.length,
    skipped_no_id: skippedNoId,
    rows_before: existingCount,
    rows_after: finalCount ?? null,
    note:
      "Upsert is idempotent on mongo_id. The endpoint cannot tell apart inserts vs updates because PostgREST upsert does not return per-row affected status.",
  });
}
