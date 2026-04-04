import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const admin = createAdminClient();

  // Lift the ban
  const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 500 });

  // Close the active block record
  await admin
    .from("user_blocks")
    .update({ unblocked_at: new Date().toISOString(), unblocked_by: user.email })
    .eq("user_id", userId)
    .is("unblocked_at", null);

  return NextResponse.json({ success: true });
}
