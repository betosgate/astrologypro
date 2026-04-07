import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

interface SavedCard {
  position: number;
  position_name: string;
  card_name: string;
  is_reversed: boolean;
  keywords: string[];
  meaning: string;
}

// POST /api/community/tarot/readings — save a completed reading
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { spread_id, spread_name, cards } = body as {
    spread_id?: string;
    spread_name?: string;
    cards?: SavedCard[];
  };

  if (!spread_id || !spread_name || !Array.isArray(cards) || cards.length === 0) {
    return NextResponse.json(
      { error: "spread_id, spread_name, and cards are required" },
      { status: 422 }
    );
  }

  // Validate card shape
  for (const c of cards) {
    if (
      typeof c.position !== "number" ||
      typeof c.position_name !== "string" ||
      typeof c.card_name !== "string" ||
      typeof c.is_reversed !== "boolean" ||
      !Array.isArray(c.keywords) ||
      typeof c.meaning !== "string"
    ) {
      return NextResponse.json({ error: "Invalid card shape in cards array" }, { status: 422 });
    }
  }

  const { data, error } = await supabase
    .from("tarot_readings")
    .insert({
      user_id: user.id,
      spread_id,
      spread_name,
      cards,
    })
    .select("id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logActivity({
    userId: user.id,
    eventCategory: 'reading',
    eventType: 'tarot.reading_saved',
    metadata: { spreadName: spread_name, readingId: data.id },
  })

  return NextResponse.json({ reading: data }, { status: 201 });
}

// GET /api/community/tarot/readings — list user's readings (paginated)
// Query: ?page=1&limit=20&spread_id=celtic-cross
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const spreadId = searchParams.get("spread_id");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("tarot_readings")
    .select("id, spread_id, spread_name, created_at, notes, share_token, cards", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // deterministic tie-breaker
    .range(offset, offset + limit - 1);

  if (spreadId) query = query.eq("spread_id", spreadId);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return only first 3 cards for list preview
  const readings = (data ?? []).map((r) => ({
    id: r.id,
    spread_id: r.spread_id,
    spread_name: r.spread_name,
    created_at: r.created_at,
    notes: r.notes,
    share_token: r.share_token,
    cards_preview: Array.isArray(r.cards) ? (r.cards as SavedCard[]).slice(0, 3) : [],
  }));

  return NextResponse.json({ readings, total: count ?? 0 });
}
