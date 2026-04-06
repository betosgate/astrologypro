import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { reason } = await req.json();
  const admin = createAdminClient();

  // Ban user via Supabase Auth (10-year ban = effectively permanent)
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "87600h",
  });
  if (banError) return NextResponse.json({ error: banError.message }, { status: 500 });

  // Record block
  await admin.from("user_blocks").insert({
    user_id: userId,
    reason: reason?.trim() || null,
    blocked_by: user.email,
  });

  return NextResponse.json({ success: true });
}
