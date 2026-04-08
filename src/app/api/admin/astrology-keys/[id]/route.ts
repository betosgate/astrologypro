import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/astrology-keys/[id]
 * Update an existing API key (label, access_key, secret_key, is_active).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { label, access_key, secret_key, is_active } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (label !== undefined) updates.label = label;
  if (access_key !== undefined) updates.access_key = access_key;
  if (secret_key !== undefined) updates.secret_key = secret_key;
  if (is_active !== undefined) updates.is_active = is_active;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astrology_api_keys")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/astrology-keys/[id]
 * Delete an API key.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("astrology_api_keys")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
