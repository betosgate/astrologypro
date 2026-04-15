import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── Field definitions per import type ────────────────────────────────────────

const IMPORT_TYPE_FIELDS: Record<string, string[]> = {
  csv_events: ["title", "event_date", "location", "event_type"],
  csv_entities: ["name", "type", "region"],
  csv_leaders: ["name", "title", "entity_id", "birth_date"],
  csv_forecasts: ["title", "entity_id", "forecast_period_start", "forecast_period_end", "content"],
};

type ColumnMapping = Record<string, string>; // csv_col -> db_field

// ─── POST — process with confirmed column_mapping ─────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const { id } = await params;
  if (!id) return rfc9457(400, "Bad Request", "id is required");

  const body = await req.json() as {
    column_mapping?: ColumnMapping;
    csv_text?: string; // raw CSV passed back from client
  };

  const columnMapping = body.column_mapping;
  if (!columnMapping || Object.keys(columnMapping).length === 0) {
    return rfc9457(422, "Validation Error", "column_mapping is required");
  }
  if (!body.csv_text?.trim()) {
    return rfc9457(422, "Validation Error", "csv_text is required for processing");
  }

  const admin = createAdminClient();

  // Fetch the import record
  const { data: importRecord, error: fetchError } = await admin
    .from("mundane_imports")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") return rfc9457(404, "Not Found", "Import not found");
    return rfc9457(500, "Internal Server Error", fetchError.message);
  }

  if (importRecord.status === "processing" || importRecord.status === "completed") {
    return rfc9457(409, "Conflict", `Import is already ${importRecord.status}`);
  }

  // Mark as processing
  await admin
    .from("mundane_imports")
    .update({ status: "processing", column_mapping: columnMapping })
    .eq("id", id);

  // ── Parse the CSV ────────────────────────────────────────────────────────────
  function parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    return lines.map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  }

  const rows = parseCSV(body.csv_text);
  if (rows.length < 2) {
    await admin.from("mundane_imports").update({ status: "failed", error_details: ["CSV has no data rows"] }).eq("id", id);
    return rfc9457(422, "Validation Error", "CSV has no data rows");
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const importType = importRecord.import_type as string;
  let importedRows = 0;
  let errorRows = 0;
  const errorDetails: Array<{ row: number; error: string }> = [];

  // Helper to get value by mapped field
  function getMapped(row: string[], field: string): string {
    const csvCol = Object.entries(columnMapping).find(([, dbField]) => dbField === field)?.[0];
    if (!csvCol) return "";
    const colIndex = headers.indexOf(csvCol);
    if (colIndex === -1) return "";
    return (row[colIndex] ?? "").trim();
  }

  // ── Insert rows based on import_type ────────────────────────────────────────
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2; // 1-indexed, header is row 1

    try {
      if (importType === "csv_events") {
        const title = getMapped(row, "title");
        const eventDate = getMapped(row, "event_date");
        if (!title || !eventDate) {
          throw new Error("title and event_date are required");
        }
        const VALID_EVENT_TYPES = ["historical","forecast","ingress","eclipse","return","transit_hit","election","conflict","economic","weather","other"];
        const rawEventType = getMapped(row, "event_type") || "other";
        const eventType = VALID_EVENT_TYPES.includes(rawEventType) ? rawEventType : "other";
        const { error } = await admin.from("mundane_events").insert({
          title,
          event_date: eventDate,
          location: getMapped(row, "location") || null,
          event_type: eventType,
          created_by: adminUser.id,
        });
        if (error) throw new Error(error.message);
      } else if (importType === "csv_entities") {
        const name = getMapped(row, "name");
        if (!name) throw new Error("name is required");
        const rawType = getMapped(row, "type") || "other";
        const VALID_ENTITY_TYPES = ["country","city","institution","market","commodity","organization","other"];
        const entityType = VALID_ENTITY_TYPES.includes(rawType) ? rawType : "other";
        const { error } = await admin.from("mundane_entities").insert({
          name,
          entity_type: entityType,
          region: getMapped(row, "region") || null,
          created_by: adminUser.id,
        });
        if (error) throw new Error(error.message);
      } else if (importType === "csv_leaders") {
        const name = getMapped(row, "name");
        if (!name) throw new Error("name is required");
        const entityId = getMapped(row, "entity_id") || null;
        const birthDate = getMapped(row, "birth_date") || null;
        const { error } = await admin.from("mundane_leaders").insert({
          full_name: name,
          office_title: getMapped(row, "title") || null,
          country_entity_id: entityId,
          birth_date: birthDate,
        });
        if (error) throw new Error(error.message);
      } else if (importType === "csv_forecasts") {
        const title = getMapped(row, "title");
        const start = getMapped(row, "forecast_period_start");
        const end = getMapped(row, "forecast_period_end");
        const content = getMapped(row, "content");
        if (!title || !start) throw new Error("title and forecast_period_start are required");
        const { error } = await admin.from("mundane_forecasts").insert({
          title,
          entity_id: getMapped(row, "entity_id") || null,
          forecast_period_start: start,
          forecast_period_end: end || null,
          content: content || title,
          outcome_status: "open",
          is_public: false,
          is_published: false,
          forecast_type: "general",
          created_by: adminUser.id,
        });
        if (error) throw new Error(error.message);
      }
      importedRows++;
    } catch (err) {
      errorRows++;
      errorDetails.push({
        row: rowNum,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const completedAt = new Date().toISOString();
  const finalStatus = errorRows > 0 && importedRows === 0 ? "failed" : "completed";

  const { data: updated, error: updateError } = await admin
    .from("mundane_imports")
    .update({
      status: finalStatus,
      imported_rows: importedRows,
      error_rows: errorRows,
      error_details: errorDetails,
      completed_at: completedAt,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return rfc9457(500, "Internal Server Error", updateError.message);

  return NextResponse.json({
    ...updated,
    allowed_fields: IMPORT_TYPE_FIELDS[importType] ?? [],
  });
}

// ─── GET — allowed fields for a given import type (helper for UI) ──────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mundane_imports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return rfc9457(404, "Not Found", "Import not found");
    return rfc9457(500, "Internal Server Error", error.message);
  }

  return NextResponse.json({
    ...data,
    allowed_fields: IMPORT_TYPE_FIELDS[data.import_type as string] ?? [],
  });
}
