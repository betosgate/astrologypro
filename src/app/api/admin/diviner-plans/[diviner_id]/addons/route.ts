import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ diviner_id: string }> };

// ─── GET /api/admin/diviner-plans/[diviner_id]/addons ─────────────────────────
// Returns active add-ons for a diviner.

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { diviner_id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_active_addons")
    .select("*, diviner_plan_addons(*)")
    .eq("diviner_id", diviner_id)
    .eq("status", "active")
    .order("activated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addons: data ?? [] });
}

// ─── POST /api/admin/diviner-plans/[diviner_id]/addons ────────────────────────
// Activates an add-on for a diviner.
// Body: { addon_id: string }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { diviner_id } = await params;
  const body: { addon_id?: unknown } = await req.json();
  const { addon_id } = body;

  if (!addon_id || typeof addon_id !== "string") {
    return NextResponse.json({ error: "addon_id is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Verify add-on exists and is active
  const { data: addon, error: addonErr } = await admin
    .from("diviner_plan_addons")
    .select("id")
    .eq("id", addon_id)
    .eq("is_active", true)
    .maybeSingle();

  if (addonErr) return NextResponse.json({ error: addonErr.message }, { status: 500 });
  if (!addon) return NextResponse.json({ error: "Add-on not found" }, { status: 404 });

  const { data, error } = await admin
    .from("diviner_active_addons")
    .upsert(
      {
        diviner_id,
        addon_id,
        status: "active",
        activated_at: new Date().toISOString(),
        cancelled_at: null,
      },
      { onConflict: "diviner_id,addon_id" }
    )
    .select("*, diviner_plan_addons(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addon: data }, { status: 201 });
}

// ─── DELETE /api/admin/diviner-plans/[diviner_id]/addons ──────────────────────
// Cancels an add-on for a diviner.
// Query param: addon_id

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { diviner_id } = await params;
  const { searchParams } = new URL(req.url);
  const addon_id = searchParams.get("addon_id");

  if (!addon_id) {
    return NextResponse.json({ error: "addon_id query param is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("diviner_active_addons")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("diviner_id", diviner_id)
    .eq("addon_id", addon_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
