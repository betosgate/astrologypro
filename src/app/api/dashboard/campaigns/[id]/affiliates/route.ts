import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/dashboard/campaigns/[id]/affiliates
// Add affiliate to campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { affiliate_id, affiliate_type, custom_commission_value } = body as Record<string, unknown>;

  if (typeof affiliate_id !== "string" || !affiliate_id.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "affiliate_id is required" },
      { status: 422 }
    );
  }
  if (typeof affiliate_type !== "string" || !["diviner_affiliate", "social_advocate"].includes(affiliate_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "affiliate_type must be diviner_affiliate or social_advocate" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

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

  // Verify campaign ownership
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    campaign_id: id,
    affiliate_id: (affiliate_id as string).trim(),
    affiliate_type,
  };
  if (typeof custom_commission_value === "number") {
    insertPayload.custom_commission_value = custom_commission_value;
  }

  const { data, error } = await admin
    .from("campaign_affiliates")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    const httpStatus = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        type: `https://httpstatuses.io/${httpStatus}`,
        title: httpStatus === 409 ? "Affiliate already enrolled in this campaign" : "Database error",
        detail: error.message,
      },
      { status: httpStatus }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/dashboard/campaigns/[id]/affiliates
// Remove affiliate from campaign
// Body: { affiliate_id, affiliate_type }
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { affiliate_id, affiliate_type } = body as Record<string, unknown>;

  if (typeof affiliate_id !== "string" || typeof affiliate_type !== "string") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "affiliate_id and affiliate_type are required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

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

  // Verify campaign ownership
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from("campaign_affiliates")
    .delete()
    .eq("campaign_id", id)
    .eq("affiliate_id", affiliate_id)
    .eq("affiliate_type", affiliate_type);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
