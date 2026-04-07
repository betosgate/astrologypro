import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates/[id]/disputes
// List disputes raised by the authenticated user for this affiliate.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Ownership: confirm this affiliate belongs to the diviner linked to this user
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

  const { data: affiliate } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  // RLS on affiliate_commission_disputes filters to raised_by = auth.uid(), but we use
  // the admin client here and apply an explicit filter to avoid bypassing intent.
  const { data, error } = await admin
    .from("affiliate_commission_disputes")
    .select(
      "id, commission_id, affiliate_id, raised_by, status, reason, resolution_notes, resolved_at, created_at, updated_at"
    )
    .eq("affiliate_id", id)
    .eq("raised_by", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST /api/dashboard/affiliates/[id]/disputes
// Body: { commission_id: string, reason: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { commission_id, reason } = body as Record<string, unknown>;

  if (
    typeof commission_id !== "string" ||
    commission_id.trim() === "" ||
    typeof reason !== "string" ||
    reason.trim() === ""
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "commission_id and reason are required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Ownership check
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

  const { data: affiliate } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  // Verify commission belongs to this affiliate
  const { data: commission } = await admin
    .from("affiliate_commissions")
    .select("id")
    .eq("id", commission_id.trim())
    .eq("affiliate_id", id)
    .single();

  if (!commission) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/404",
        title: "Commission not found",
        detail: "commission_id does not belong to this affiliate.",
      },
      { status: 404 }
    );
  }

  const { data, error } = await admin
    .from("affiliate_commission_disputes")
    .insert({
      commission_id: commission_id.trim(),
      affiliate_id: id,
      raised_by: user.id,
      reason: reason.trim(),
    })
    .select(
      "id, commission_id, affiliate_id, raised_by, status, reason, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
