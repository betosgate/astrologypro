import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Helper — resolve diviner and verify they own the order
async function resolveDiviner(userId: string, orderId: string) {
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!diviner) return null;

  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("diviner_id", diviner.id)
    .maybeSingle();
  if (!order) return null;

  return diviner;
}

/**
 * GET /api/dashboard/orders/[id]/notes
 * List all notes for an order (newest first).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diviner = await resolveDiviner(user.id, id);
  if (!diviner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_notes")
    .select("id, content, created_by_name, created_at")
    .eq("order_id", id)
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

/**
 * POST /api/dashboard/orders/[id]/notes
 * Add a note to an order.
 * Body: { content: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diviner = await resolveDiviner(user.id, id);
  if (!diviner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { content?: string };
  const content = body.content?.trim() ?? "";
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "Content is required (max 2000 chars)" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_notes")
    .insert({
      order_id: id,
      diviner_id: diviner.id,
      content,
      created_by_name: diviner.display_name ?? "Diviner",
    })
    .select("id, content, created_by_name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}
