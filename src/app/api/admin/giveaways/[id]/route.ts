import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

const VALID_TRANSITIONS: Record<GiveawayStatus, GiveawayStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["ended", "cancelled"],
  ended: ["cancelled"],
  cancelled: [],
};

export async function GET(
  _req: NextRequest,
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

  const { data: giveaway, error } = await admin
    .from("giveaways")
    .select(
      `*, diviner:diviners(id, display_name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !giveaway) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
    );
  }

  // Entry count
  const { count: entryCount } = await admin
    .from("giveaway_entries")
    .select("id", { count: "exact", head: true })
    .eq("giveaway_id", id);

  // Winners with entry join
  const { data: winners } = await admin
    .from("giveaway_winners")
    .select("id, entry_id, selected_at, notified_at, notes, entry:giveaway_entries(id, name, email)")
    .eq("giveaway_id", id)
    .order("selected_at", { ascending: true });

  return NextResponse.json({
    ...giveaway,
    entry_count: entryCount ?? 0,
    winners: winners ?? [],
  });
}

export async function PATCH(
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

  // Fetch current state
  const { data: current, error: fetchError } = await admin
    .from("giveaways")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
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

  // Validate status transition if status is being changed
  if (body.status && body.status !== current.status) {
    const currentStatus = current.status as GiveawayStatus;
    const nextStatus = body.status as GiveawayStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Invalid Status Transition",
          status: 422,
          detail: `Cannot transition from '${currentStatus}' to '${nextStatus}'.`,
        },
        { status: 422 }
      );
    }
  }

  // Build update payload — only allow known fields
  const allowedFields = [
    "title", "description", "prize_description", "status",
    "entry_fields", "max_entries", "starts_at", "ends_at",
    "winner_count", "winner_selection", "is_public",
  ];

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (key in body) {
      updatePayload[key] = body[key] ?? null;
    }
  }

  const { data: updated, error: updateError } = await admin
    .from("giveaways")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
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

  // Soft-cancel: set status to cancelled
  const { data: updated, error } = await admin
    .from("giveaways")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
