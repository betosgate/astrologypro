import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/mundane/alerts/notifications/:id
 * Mark as read or snooze a notification.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json() as {
    is_read?: boolean;
    snoozed_until?: string | null;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_alert_notifications")
    .update({ ...body })
    .eq("id", id)
    .eq("user_id", user.id)
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

/**
 * DELETE /api/mundane/alerts/notifications/:id
 * Dismiss (hard-delete) a notification.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("mundane_alert_notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
