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

// POST /api/dashboard/giveaways/[id]/draw
// Run a random winner draw for this giveaway.
// Selects one random eligible entry (is_winner = false).
// Inserts into giveaway_winners and marks the entry as winner.
// Idempotent: if a winner already exists, returns the existing winner.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  // Object-level auth
  const { data: giveaway } = await admin
    .from("giveaways")
    .select("id, status, title, prize_description")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!giveaway) return problem(404, "Not Found", "Giveaway not found.");

  if (!["active", "ended"].includes(giveaway.status)) {
    return problem(
      409,
      "Conflict",
      "Draw can only be run on active or ended giveaways."
    );
  }

  // Idempotent: return existing winner if one was already selected
  const { data: existingWinner } = await admin
    .from("giveaway_winners")
    .select(
      "id, selected_at, giveaway_entries(id, name, email)"
    )
    .eq("giveaway_id", id)
    .limit(1)
    .maybeSingle();

  if (existingWinner) {
    return NextResponse.json({
      alreadyDrawn: true,
      winner: existingWinner,
    });
  }

  // Fetch all eligible entries (not yet winners)
  const { data: eligibleEntries, error: entriesError } = await admin
    .from("giveaway_entries")
    .select("id, name, email")
    .eq("giveaway_id", id)
    .eq("is_winner", false);

  if (entriesError) {
    console.error("[draw] entries error", entriesError);
    return problem(500, "Internal Server Error", "Failed to fetch entries.");
  }

  if (!eligibleEntries || eligibleEntries.length === 0) {
    return problem(409, "No Eligible Entries", "There are no eligible entries to draw from.");
  }

  // Random selection
  const winner = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];

  // Mark entry as winner
  const { error: markError } = await admin
    .from("giveaway_entries")
    .update({ is_winner: true })
    .eq("id", winner.id);

  if (markError) {
    console.error("[draw] mark winner error", markError);
    return problem(500, "Internal Server Error", "Failed to mark winner.");
  }

  // Insert into giveaway_winners
  const { data: winnerRecord, error: winnerError } = await admin
    .from("giveaway_winners")
    .insert({
      giveaway_id: id,
      entry_id: winner.id,
    })
    .select("id, selected_at")
    .single();

  if (winnerError) {
    // Unique violation means a concurrent draw ran — return existing
    if (winnerError.code === "23505") {
      const { data: race } = await admin
        .from("giveaway_winners")
        .select("id, selected_at, giveaway_entries(id, name, email)")
        .eq("giveaway_id", id)
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ alreadyDrawn: true, winner: race });
    }
    console.error("[draw] insert winner error", winnerError);
    return problem(500, "Internal Server Error", "Failed to save winner.");
  }

  return NextResponse.json({
    alreadyDrawn: false,
    winner: {
      ...winnerRecord,
      giveaway_entries: { id: winner.id, name: winner.name, email: winner.email },
    },
  });
}
