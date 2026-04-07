import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Lift the ban
  const { error: unbanError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "none",
  });
  if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 500 });

  // Close the active block record
  await admin
    .from("user_blocks")
    .update({ unblocked_at: new Date().toISOString(), unblocked_by: user.email })
    .eq("user_id", id)
    .is("unblocked_at", null);

  return NextResponse.json({ success: true });
}
