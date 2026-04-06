import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/notifications/[id]
 * Marks the notification as read (or unread).
 * Body: { is_read: boolean }
 * Auth: own notifications only (enforced by user_id filter).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { is_read?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 422 });
  }

  if (typeof body.is_read !== "boolean") {
    return NextResponse.json({ error: "is_read (boolean) is required." }, { status: 422 });
  }

  const admin = createAdminClient();

  const { data: notification, error } = await admin
    .from("notifications")
    .update({ is_read: body.is_read })
    .eq("id", id)
    .eq("user_id", user.id) // object-level auth: only the owner may update
    .select()
    .single();

  if (error || !notification) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json({ notification });
}

/**
 * DELETE /api/notifications/[id]
 * Dismisses (deletes) a notification.
 * Auth: own notifications only.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { error, count } = await admin
    .from("notifications")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id); // object-level auth

  if (error) {
    console.error("[DELETE /api/notifications/:id]", error.message);
    return NextResponse.json({ error: "Failed to delete notification." }, { status: 500 });
  }

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
