/**
 * POST /api/dashboard/campaigns/[id]/activate
 * Activates a draft or paused campaign.
 * Validates destination exists and (for SERVICE type) service is still enabled.
 * Clears auto-pause fields if previously auto-paused.
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
    .select(
      "id, status, destination_type, destination_service_template_id, auto_paused_at, tracking_link_id"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  if (!["draft", "paused"].includes(campaign.status)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: `Cannot activate a campaign with status '${campaign.status}'. Only draft or paused campaigns can be activated.`,
      },
      { status: 422 }
    );
  }

  // Must have a destination
  if (!campaign.destination_type) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "Cannot activate: no destination set. Edit the campaign to add a destination.",
      },
      { status: 422 }
    );
  }

  // SERVICE destination: check service is still enabled
  if (campaign.destination_type === "SERVICE" && campaign.destination_service_template_id) {
    const { data: ds } = await admin
      .from("diviner_services")
      .select("is_enabled")
      .eq("diviner_id", diviner.id)
      .eq("template_id", campaign.destination_service_template_id)
      .maybeSingle();

    if (!ds?.is_enabled) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail:
            "Cannot activate: the linked service is currently disabled. Contact your administrator to re-enable the service first.",
        },
        { status: 422 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    status: "active",
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  // Clear auto-pause fields if previously auto-paused
  if (campaign.auto_paused_at) {
    updatePayload.auto_paused_at = null;
    updatePayload.auto_pause_reason = null;
  }

  const { data, error } = await admin
    .from("affiliate_campaigns")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  // Reactivate tracking link
  if (campaign.tracking_link_id) {
    void admin
      .from("tracking_links")
      .update({ is_active: true })
      .eq("id", campaign.tracking_link_id)
      .then(() => {}, () => {});
  }

  return NextResponse.json({ data });
}
