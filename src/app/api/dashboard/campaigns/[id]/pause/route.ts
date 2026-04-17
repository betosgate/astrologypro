/**
 * POST /api/dashboard/campaigns/[id]/pause
 * Pauses an active campaign.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id, status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.status !== "active") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: `Cannot pause a campaign with status '${campaign.status}'. Only active campaigns can be paused.`,
      },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("affiliate_campaigns")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
