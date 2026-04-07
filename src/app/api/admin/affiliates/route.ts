import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates
// Query: diviner_id?, status?, q?, limit?, cursor?
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const divinerId = searchParams.get("diviner_id");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (divinerId) query = query.eq("diviner_id", divinerId);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/admin/affiliates
// Body: { diviner_id, name, email, phone?, notes?, default_commission_type?, default_commission_value? }
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const {
    diviner_id,
    name,
    email,
    phone,
    notes,
    default_commission_type,
    default_commission_value,
  } = body as Record<string, unknown>;

  if (
    typeof diviner_id !== "string" || diviner_id.trim() === "" ||
    typeof name !== "string" || name.trim() === "" ||
    typeof email !== "string" || email.trim() === ""
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "diviner_id, name, and email are required." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner_id.trim(),
    name: (name as string).trim(),
    email: (email as string).trim().toLowerCase(),
    status: "active",
    created_by: user.id,
  };
  if (typeof phone === "string" && phone.trim()) insertPayload.phone = phone.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();
  if (typeof default_commission_type === "string") insertPayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") insertPayload.default_commission_value = default_commission_value;

  const { data, error } = await admin
    .from("diviner_affiliates")
    .insert(insertPayload)
    .select("id, diviner_id, name, email, phone, status, default_commission_type, default_commission_value, created_at")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { type: `https://httpstatuses.io/${status}`, title: status === 409 ? "Duplicate affiliate email for this diviner" : "Database error", detail: error.message },
      { status }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
