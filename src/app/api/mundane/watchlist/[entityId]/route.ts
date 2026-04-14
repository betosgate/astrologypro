import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DEFAULT_WATCHLIST_NAME = "My Watchlist";

/**
 * DELETE /api/mundane/watchlist/[entityId]
 * Remove an entity from the current user's watchlist by filtering it out of
 * the entity_ids array.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { entityId } = await params;
  const admin = createAdminClient();

  // Fetch current watchlist
  const { data: watchlist, error: fetchErr } = await admin
    .from("mundane_watchlists")
    .select("id, entity_ids")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_WATCHLIST_NAME)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: fetchErr.message },
      { status: 500 }
    );
  }

  if (!watchlist) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Watchlist not found" },
      { status: 404 }
    );
  }

  const updatedIds = (watchlist.entity_ids ?? []).filter(
    (id: string) => id !== entityId
  );

  const { data, error } = await admin
    .from("mundane_watchlists")
    .update({ entity_ids: updatedIds, updated_at: new Date().toISOString() })
    .eq("id", watchlist.id)
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

/**
 * PATCH /api/mundane/watchlist/[entityId]
 * Add an entity to the current user's watchlist (idempotent).
 * The current schema stores a flat entity_ids array; per-entity
 * notes/priority are not supported at the DB level yet.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { entityId } = await params;
  const admin = createAdminClient();

  // Fetch or create watchlist
  let { data: watchlist, error: fetchErr } = await admin
    .from("mundane_watchlists")
    .select("id, entity_ids")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_WATCHLIST_NAME)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: fetchErr.message },
      { status: 500 }
    );
  }

  if (!watchlist) {
    const { data: created, error: createErr } = await admin
      .from("mundane_watchlists")
      .insert({ user_id: user.id, name: DEFAULT_WATCHLIST_NAME, entity_ids: [], leader_ids: [] })
      .select("id, entity_ids")
      .single();
    if (createErr) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: createErr.message },
        { status: 500 }
      );
    }
    watchlist = created;
  }

  const existing: string[] = watchlist.entity_ids ?? [];
  const updatedIds = existing.includes(entityId)
    ? existing
    : [...existing, entityId];

  const { data, error } = await admin
    .from("mundane_watchlists")
    .update({ entity_ids: updatedIds, updated_at: new Date().toISOString() })
    .eq("id", watchlist.id)
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
