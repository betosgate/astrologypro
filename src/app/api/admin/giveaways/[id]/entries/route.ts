import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  name: string;
  email: string;
  entered_at: string;
  is_winner: boolean;
  extra_fields: Record<string, string> | null;
  ip_address: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format"); // "csv" or default JSON
  const cursor = sp.get("cursor"); // entered_at value
  const cursorId = sp.get("cursor_id"); // id tie-breaker
  const PAGE_SIZE = 100;

  const admin = createAdminClient();

  // Verify giveaway exists and admin has access
  const { data: giveaway, error: giveawayError } = await admin
    .from("giveaways")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();

  if (giveawayError || !giveaway) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
    );
  }

  if (format === "csv") {
    // Fetch all entries for CSV export (no pagination limit for CSV)
    const { data: entries, error } = await admin
      .from("giveaway_entries")
      .select("id, name, email, entered_at, is_winner")
      .eq("giveaway_id", id)
      .order("entered_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Error", status: 500, detail: error.message },
        { status: 500 }
      );
    }

    const rows = entries ?? [];
    const lines: string[] = ["Name,Email,Entered At,Is Winner"];
    for (const row of rows) {
      const name = `"${(row.name ?? "").replace(/"/g, '""')}"`;
      const email = `"${(row.email ?? "").replace(/"/g, '""')}"`;
      const enteredAt = row.entered_at
        ? new Date(row.entered_at).toISOString()
        : "";
      const isWinner = row.is_winner ? "Yes" : "No";
      lines.push(`${name},${email},${enteredAt},${isWinner}`);
    }

    const csv = lines.join("\r\n");
    const slugTitle = (giveaway.title ?? "giveaway")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slugTitle}-entries.csv"`,
      },
    });
  }

  // JSON paginated response
  let query = admin
    .from("giveaway_entries")
    .select("id, name, email, entered_at, is_winner, extra_fields, ip_address")
    .eq("giveaway_id", id)
    .order("entered_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor && cursorId) {
    query = query.or(
      `entered_at.lt.${cursor},and(entered_at.eq.${cursor},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  const entries = (data ?? []) as EntryRow[];
  const last = entries[entries.length - 1];
  const nextCursor =
    entries.length === PAGE_SIZE && last
      ? { cursor: last.entered_at, cursor_id: last.id }
      : null;

  return NextResponse.json({ entries, nextCursor });
}
