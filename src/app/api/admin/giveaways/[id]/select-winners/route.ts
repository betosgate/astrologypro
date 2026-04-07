import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Fisher-Yates in-place shuffle — returns the array */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(
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
  const admin = createAdminClient();

  // Fetch giveaway
  const { data: giveaway, error: giveawayError } = await admin
    .from("giveaways")
    .select("id, winner_count, status")
    .eq("id", id)
    .maybeSingle();

  if (giveawayError || !giveaway) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
    );
  }

  // Check if winners already selected
  const { count: existingWinnerCount } = await admin
    .from("giveaway_winners")
    .select("id", { count: "exact", head: true })
    .eq("giveaway_id", id);

  if ((existingWinnerCount ?? 0) > 0) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Winners already selected",
        status: 409,
        detail: "Winners have already been selected for this giveaway.",
      },
      { status: 409 }
    );
  }

  let body: { mode: string; entry_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { mode, entry_ids } = body;

  if (mode !== "random" && mode !== "manual") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "mode must be 'random' or 'manual'." },
      { status: 422 }
    );
  }

  let selectedEntryIds: string[] = [];

  if (mode === "random") {
    // Fetch all non-winner entries
    const { data: entries, error: entriesError } = await admin
      .from("giveaway_entries")
      .select("id")
      .eq("giveaway_id", id)
      .eq("is_winner", false);

    if (entriesError) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Error", status: 500, detail: entriesError.message },
        { status: 500 }
      );
    }

    const allEntries = entries ?? [];
    if (allEntries.length === 0) {
      return NextResponse.json(
        { type: "about:blank", title: "No Entries", status: 409, detail: "No entries to pick from." },
        { status: 409 }
      );
    }

    shuffleArray(allEntries);
    const pickCount = Math.min(giveaway.winner_count, allEntries.length);
    selectedEntryIds = allEntries.slice(0, pickCount).map((e) => e.id);
  } else {
    // manual
    if (!Array.isArray(entry_ids) || entry_ids.length === 0) {
      return NextResponse.json(
        { type: "about:blank", title: "Validation Error", status: 422, detail: "entry_ids is required for manual mode." },
        { status: 422 }
      );
    }
    selectedEntryIds = entry_ids;
  }

  // Insert into giveaway_winners
  const winnerRows = selectedEntryIds.map((entryId) => ({
    giveaway_id: id,
    entry_id: entryId,
  }));

  const { error: winnerInsertError } = await admin
    .from("giveaway_winners")
    .insert(winnerRows);

  if (winnerInsertError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: winnerInsertError.message },
      { status: 500 }
    );
  }

  // Mark entries as winners
  const { error: updateError } = await admin
    .from("giveaway_entries")
    .update({ is_winner: true })
    .in("id", selectedEntryIds);

  if (updateError) {
    // Non-fatal — winners are inserted; log and continue
    console.error("Failed to update is_winner on entries:", updateError.message);
  }

  // Fetch winner details for response
  const { data: winners, error: fetchError } = await admin
    .from("giveaway_winners")
    .select("id, entry_id, entry:giveaway_entries(id, name, email)")
    .eq("giveaway_id", id)
    .in("entry_id", selectedEntryIds);

  if (fetchError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: fetchError.message },
      { status: 500 }
    );
  }

  const formatted = (winners ?? []).map((w) => {
    const entry = Array.isArray(w.entry) ? w.entry[0] : w.entry;
    return {
      id: w.id,
      entry_id: w.entry_id,
      name: entry?.name ?? "",
      email: entry?.email ?? "",
    };
  });

  return NextResponse.json({ winners: formatted });
}
