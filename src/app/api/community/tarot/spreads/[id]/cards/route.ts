import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/tarot/spreads/[id]/cards
 * Returns the spread details + linked cards for a reading session.
 * Cards are linked via the `related_spread_ids` UUID array on tarot_cards.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the spread
  const { data: spread, error: sErr } = await supabase
    .from("tarot_spreads")
    .select("id, name, description, card_count, layout_json, image_url")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (sErr || !spread) {
    return NextResponse.json({ error: "Spread not found" }, { status: 404 });
  }

  // Fetch cards that have this spread ID in their related_spread_ids array
  const { data: cards, error: cErr } = await supabase
    .from("tarot_cards")
    .select("id, name, description, image_url, priority")
    .contains("related_spread_ids", [id])
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  return NextResponse.json({ spread, cards: cards ?? [] });
}
