import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/mundane/entities/:id/charts/:chartId/set-primary
 * is handled via query param action=set-primary on PATCH below.
 *
 * PATCH /api/mundane/entities/:id/charts/:chartId
 * Update chart fields or set as primary.
 *
 * DELETE /api/mundane/entities/:id/charts/:chartId
 * Remove chart record.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chartId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: entityId, chartId } = await params;
  const admin = createAdminClient();

  const body = await req.json() as {
    chart_title?: string;
    chart_type?: string;
    event_date?: string;
    event_time?: string | null;
    timezone?: string | null;
    notes?: string | null;
    chart_url?: string | null;
    is_primary?: boolean;
  };

  // If setting as primary, unset all others for this entity first
  if (body.is_primary === true) {
    await admin
      .from("mundane_entity_charts")
      .update({ is_primary: false })
      .eq("entity_id", entityId)
      .eq("is_primary", true)
      .neq("id", chartId);
  }

  const { data, error } = await admin
    .from("mundane_entity_charts")
    .update({ ...body })
    .eq("id", chartId)
    .eq("entity_id", entityId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; chartId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: entityId, chartId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("mundane_entity_charts")
    .delete()
    .eq("id", chartId)
    .eq("entity_id", entityId);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
