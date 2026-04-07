import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { is_paused: boolean };

  if (typeof body.is_paused !== "boolean") {
    return NextResponse.json(
      { error: "is_paused must be a boolean" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("email_sequence_controls")
    .update({
      is_paused: body.is_paused,
      paused_at: body.is_paused ? new Date().toISOString() : null,
      paused_by: body.is_paused ? user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sequence: data });
}
