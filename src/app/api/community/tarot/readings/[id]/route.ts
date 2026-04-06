import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/community/tarot/readings/[id] — full reading detail (own + shared)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch reading — RLS handles auth: authenticated users can see own readings,
  // anon users can see readings with a share_token via the public_shared_reading policy.
  // We add an explicit ownership/share check here for defence in depth.
  const { data, error } = await supabase
    .from("tarot_readings")
    .select("id, user_id, spread_id, spread_name, cards, notes, share_token, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Object-level authorization: owner OR has a share_token (public)
  const isOwner = user?.id === data.user_id;
  const isShared = !!data.share_token;
  if (!isOwner && !isShared) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ reading: data });
}

// PATCH /api/community/tarot/readings/[id] — update notes or generate share token
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the reading belongs to this user before mutating
  const { data: existing, error: fetchError } = await supabase
    .from("tarot_readings")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id) // object-level authorization
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { notes, generate_share } = body as {
    notes?: string;
    generate_share?: boolean;
  };

  const updates: Record<string, unknown> = {};

  if (typeof notes === "string") {
    updates.notes = notes.trim();
  }

  if (generate_share === true && !existing.share_token) {
    // Generate a cryptographically random 12-char alphanumeric token
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    updates.share_token = Array.from(array, (b) => chars[b % chars.length]).join("");
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("tarot_readings")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, notes, share_token, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reading: data });
}

// DELETE /api/community/tarot/readings/[id] — delete own reading
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("tarot_readings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // object-level authorization

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
