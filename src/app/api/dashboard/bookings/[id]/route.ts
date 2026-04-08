import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/dashboard/bookings/[id]
 *
 * Deletes a booking for the authenticated diviner.
 */
export async function DELETE(
  request: NextRequest,
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
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 403 });
  }

  try {
    const { error } = await admin
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("owner_id", diviner.id);

    if (error) {
      console.error("[api/dashboard/bookings] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/dashboard/bookings] DELETE catch:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
