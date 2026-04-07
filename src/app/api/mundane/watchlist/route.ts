import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DEFAULT_WATCHLIST_NAME = "My Watchlist";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Get or create default watchlist
  let { data: watchlist, error } = await admin
    .from("mundane_watchlists")
    .select("*")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_WATCHLIST_NAME)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  if (!watchlist) {
    const { data: created, error: createErr } = await admin
      .from("mundane_watchlists")
      .insert({
        user_id: user.id,
        name: DEFAULT_WATCHLIST_NAME,
        entity_ids: [],
        leader_ids: [],
      })
      .select()
      .single();

    if (createErr) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: createErr.message },
        { status: 500 }
      );
    }
    watchlist = created;
  }

  return NextResponse.json(watchlist);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    entity_ids?: string[];
    leader_ids?: string[];
  };

  const admin = createAdminClient();

  // Upsert default watchlist
  const { data, error } = await admin
    .from("mundane_watchlists")
    .upsert(
      {
        user_id: user.id,
        name: DEFAULT_WATCHLIST_NAME,
        ...(body.entity_ids !== undefined ? { entity_ids: body.entity_ids } : {}),
        ...(body.leader_ids !== undefined ? { leader_ids: body.leader_ids } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,name" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
