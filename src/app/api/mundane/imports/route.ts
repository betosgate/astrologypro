import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_IMPORT_TYPES = ["csv_events", "csv_entities", "csv_leaders", "csv_forecasts"] as const;

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── Minimal CSV parser (no external dependency) ──────────────────────────────

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
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

// ─── GET — list import history ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("mundane_imports")
    .select(
      "id, import_type, file_name, status, total_rows, imported_rows, error_rows, created_at, completed_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return rfc9457(500, "Internal Server Error", error.message);

  return NextResponse.json({
    imports: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

// ─── POST — upload CSV, parse preview ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return rfc9457(400, "Bad Request", "Expected multipart/form-data");
  }

  const importType = (formData.get("import_type") as string | null) ?? "";
  const file = formData.get("file") as File | null;

  if (!importType || !(VALID_IMPORT_TYPES as readonly string[]).includes(importType)) {
    return rfc9457(
      422,
      "Validation Error",
      `import_type must be one of: ${VALID_IMPORT_TYPES.join(", ")}`
    );
  }
  if (!file || file.size === 0) {
    return rfc9457(422, "Validation Error", "file is required");
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return rfc9457(422, "Validation Error", "Only .csv files are accepted");
  }
  if (file.size > 5 * 1024 * 1024) {
    return rfc9457(413, "Payload Too Large", "File must be under 5 MB");
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return rfc9457(422, "Validation Error", "CSV file is empty");
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const totalRows = dataRows.length;

  // Preview: first 5 data rows as array of { col: value } objects
  const rawPreview = dataRows.slice(0, 5).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });

  const admin = createAdminClient();
  const { data: importRecord, error } = await admin
    .from("mundane_imports")
    .insert({
      import_type: importType,
      file_name: file.name,
      status: "pending",
      total_rows: totalRows,
      raw_preview: rawPreview,
      column_mapping: {},
      created_by: adminUser.id,
    })
    .select()
    .single();

  if (error) return rfc9457(500, "Internal Server Error", error.message);

  return NextResponse.json(
    {
      ...importRecord,
      detected_columns: headers,
    },
    { status: 201 }
  );
}
