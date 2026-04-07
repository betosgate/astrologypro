import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates
// Returns the authenticated diviner's affiliates, paginated
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  // Resolve diviner record for this user
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  let query = admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_at, updated_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

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

// POST /api/dashboard/affiliates
// Body: { name, email, phone?, notes?, default_commission_type?, default_commission_value? }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    name,
    email,
    phone,
    notes,
    default_commission_type,
    default_commission_value,
  } = body as Record<string, unknown>;

  if (
    typeof name !== "string" || name.trim() === "" ||
    typeof email !== "string" || email.trim() === ""
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "name and email are required." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner.id,
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
    const httpStatus = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        type: `https://httpstatuses.io/${httpStatus}`,
        title: httpStatus === 409 ? "Affiliate with this email already exists under your account" : "Database error",
        detail: error.message,
      },
      { status: httpStatus }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
