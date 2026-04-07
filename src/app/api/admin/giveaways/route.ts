import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const divinerId = sp.get("diviner_id");
  const cursor = sp.get("cursor"); // ends_at value
  const cursorId = sp.get("cursor_id"); // id tie-breaker
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 100);

  const admin = createAdminClient();

  let query = admin
    .from("giveaways")
    .select(
      `id, title, description, prize_description, status, entry_fields,
       max_entries, starts_at, ends_at, winner_count, winner_selection,
       is_public, created_at, updated_at,
       diviner:diviners(id, display_name)`
    )
    .order("ends_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (divinerId) {
    query = query.eq("diviner_id", divinerId);
  }

  // Cursor-based pagination (ends_at DESC, id DESC)
  if (cursor && cursorId) {
    query = query.or(`ends_at.lt.${cursor},and(ends_at.eq.${cursor},id.lt.${cursorId})`);
  } else if (cursor === "null" && cursorId) {
    // entries where ends_at IS NULL come first — skip them once we have a cursor
    query = query.or(`ends_at.not.is.null,and(ends_at.is.null,id.lt.${cursorId})`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  const giveaways = data ?? [];
  const last = giveaways[giveaways.length - 1];
  const nextCursor =
    giveaways.length === limit && last
      ? { cursor: last.ends_at ?? "null", cursor_id: last.id }
      : null;

  // Attach entry counts
  const ids = giveaways.map((g) => g.id);
  let entryCounts: Record<string, number> = {};
  let winnerCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: ecData } = await admin
      .from("giveaway_entries")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (ecData) {
      for (const row of ecData) {
        entryCounts[row.giveaway_id] = (entryCounts[row.giveaway_id] ?? 0) + 1;
      }
    }

    const { data: wcData } = await admin
      .from("giveaway_winners")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (wcData) {
      for (const row of wcData) {
        winnerCounts[row.giveaway_id] = (winnerCounts[row.giveaway_id] ?? 0) + 1;
      }
    }
  }

  const enriched = giveaways.map((g) => ({
    ...g,
    entry_count: entryCounts[g.id] ?? 0,
    winner_count_selected: winnerCounts[g.id] ?? 0,
  }));

  return NextResponse.json({ giveaways: enriched, nextCursor });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const {
    diviner_id,
    title,
    description,
    prize_description,
    entry_fields = ["name", "email"],
    max_entries,
    starts_at,
    ends_at,
    winner_count = 1,
    winner_selection = "random",
    is_public = true,
  } = body;

  if (!diviner_id || typeof diviner_id !== "string") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "diviner_id is required." },
      { status: 422 }
    );
  }
  if (!title || typeof title !== "string" || (title as string).trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "title is required." },
      { status: 422 }
    );
  }
  if (!prize_description || typeof prize_description !== "string" || (prize_description as string).trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "prize_description is required." },
      { status: 422 }
    );
  }

  const validSelections = ["random", "manual"];
  if (!validSelections.includes(winner_selection as string)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "winner_selection must be 'random' or 'manual'." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: giveaway, error: insertError } = await admin
    .from("giveaways")
    .insert({
      diviner_id,
      title: (title as string).trim(),
      description: description ? (description as string).trim() : null,
      prize_description: (prize_description as string).trim(),
      status: "draft",
      entry_fields: Array.isArray(entry_fields) ? entry_fields : ["name", "email"],
      max_entries: max_entries ? Number(max_entries) : null,
      starts_at: starts_at ? starts_at : null,
      ends_at: ends_at ? ends_at : null,
      winner_count: Number(winner_count) || 1,
      winner_selection,
      is_public: Boolean(is_public),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(giveaway, { status: 201 });
}
