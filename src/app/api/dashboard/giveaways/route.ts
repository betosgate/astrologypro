import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, diviner: null };

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, diviner };
}

// GET /api/dashboard/giveaways
// List diviner's own giveaways with entry_count and winner_count
export async function GET(_req: NextRequest) {
  const { user, diviner } = await getAuthenticatedDiviner();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");
  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  const admin = createAdminClient();

  const { data: giveaways, error } = await admin
    .from("giveaways")
    .select(
      "id, title, description, prize_description, status, starts_at, ends_at, winner_count, winner_selection, is_public, max_entries, created_at, updated_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[dashboard/giveaways] list error", error);
    return problem(500, "Internal Server Error", "Failed to fetch giveaways.");
  }

  const rows = giveaways ?? [];
  const ids = rows.map((g) => g.id);

  let entryCounts: Record<string, number> = {};
  let winnerCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: entryData } = await admin
      .from("giveaway_entries")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (entryData) {
      for (const row of entryData) {
        entryCounts[row.giveaway_id] = (entryCounts[row.giveaway_id] ?? 0) + 1;
      }
    }

    const { data: winnerData } = await admin
      .from("giveaway_winners")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (winnerData) {
      for (const row of winnerData) {
        winnerCounts[row.giveaway_id] = (winnerCounts[row.giveaway_id] ?? 0) + 1;
      }
    }
  }

  const enriched = rows.map((g) => ({
    ...g,
    entry_count: entryCounts[g.id] ?? 0,
    winner_count_selected: winnerCounts[g.id] ?? 0,
  }));

  return NextResponse.json({ giveaways: enriched });
}

// POST /api/dashboard/giveaways
// Create a new giveaway
export async function POST(req: NextRequest) {
  const { user, diviner } = await getAuthenticatedDiviner();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");
  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const {
    title,
    description,
    prize_description,
    starts_at,
    ends_at,
    max_entries,
    winner_count = 1,
    winner_selection = "random",
    is_public = true,
  } = body;

  if (!title || typeof title !== "string" || (title as string).trim() === "") {
    return problem(422, "Validation Error", "title is required.");
  }
  if (
    !prize_description ||
    typeof prize_description !== "string" ||
    (prize_description as string).trim() === ""
  ) {
    return problem(422, "Validation Error", "prize_description is required.");
  }

  const validSelections = ["random", "manual"];
  if (!validSelections.includes(winner_selection as string)) {
    return problem(422, "Validation Error", "winner_selection must be 'random' or 'manual'.");
  }

  if (starts_at && ends_at) {
    if (new Date(ends_at as string) <= new Date(starts_at as string)) {
      return problem(422, "Validation Error", "ends_at must be after starts_at.");
    }
  }

  const admin = createAdminClient();

  const { data: giveaway, error } = await admin
    .from("giveaways")
    .insert({
      diviner_id: diviner.id,
      title: (title as string).trim(),
      description: description ? (description as string).trim() : null,
      prize_description: (prize_description as string).trim(),
      status: "draft",
      entry_fields: ["name", "email"],
      max_entries: max_entries ? Number(max_entries) : null,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
      winner_count: Number(winner_count) || 1,
      winner_selection,
      is_public: Boolean(is_public),
    })
    .select()
    .single();

  if (error) {
    console.error("[dashboard/giveaways] insert error", error);
    return problem(500, "Internal Server Error", "Failed to create giveaway.");
  }

  return NextResponse.json(giveaway, { status: 201 });
}
