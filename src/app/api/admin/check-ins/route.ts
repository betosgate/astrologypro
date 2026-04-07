import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Cursor helpers ───────────────────────────────────────────────────────────

interface CursorPayload {
  created_at: string;
  id: string;
}

function encodeCursor(created_at: string, id: string): string {
  return Buffer.from(JSON.stringify({ created_at, id })).toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "created_at" in parsed &&
      "id" in parsed &&
      typeof (parsed as CursorPayload).created_at === "string" &&
      typeof (parsed as CursorPayload).id === "string"
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── GET /api/admin/check-ins ─────────────────────────────────────────────────
// Query params: diviner_id?, search?, cursor?, limit?, format=csv
export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin authentication required." },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const sp = req.nextUrl.searchParams;
  const divinerId = sp.get("diviner_id");
  const search = sp.get("search");
  const cursorParam = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 200);
  const format = sp.get("format");

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from("check_ins")
    .select(
      `id, first_name, last_name, email, birth_date, birth_city, birth_time,
       created_at,
       diviners(id, display_name, username)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (divinerId) {
    query = query.eq("diviner_id", divinerId);
  }

  if (search && search.trim()) {
    const safeTerm = search.trim().replace(/[%_().,]/g, "");
    if (safeTerm) {
      query = query.or(
        `email.ilike.%${safeTerm}%,first_name.ilike.%${safeTerm}%,last_name.ilike.%${safeTerm}%`
      );
    }
  }

  // Cursor-based pagination
  if (cursorParam) {
    const cursor = decodeCursor(cursorParam);
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }
  }

  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/check-ins] query error", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to fetch check-ins." },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const rows = data ?? [];

  // ─── CSV export ──────────────────────────────────────────────────────────────
  if (format === "csv") {
    const escape = (v: string | null | undefined): string => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = "First Name,Last Name,Email,Birth Date,Birth City,Birth Time,Diviner,Date\n";
    const csvRows = rows.map((r) => {
      const diviner = Array.isArray(r.diviners) ? r.diviners[0] : r.diviners;
      return [
        escape(r.first_name),
        escape(r.last_name),
        escape(r.email),
        escape(r.birth_date),
        escape(r.birth_city),
        escape(r.birth_time),
        escape(diviner ? (diviner as { display_name: string }).display_name : ""),
        escape(new Date(r.created_at).toISOString()),
      ].join(",");
    });

    const csv = header + csvRows.join("\n");
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="check-ins-${date}.csv"`,
      },
    });
  }

  // ─── JSON response ────────────────────────────────────────────────────────────
  let nextCursor: string | null = null;
  if (rows.length === limit) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  return NextResponse.json({
    data: rows,
    nextCursor,
    total: count ?? 0,
  });
}
