import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 }
    );
  }

  const body = (await req.json()) as { notes?: string };
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 }
    );
  }

  const { error } = await admin
    .from("orders")
    .update({ notes })
    .eq("id", id)
    .eq("diviner_id", diviner.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Update failed", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
