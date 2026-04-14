import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "id is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Enforce object-level authorization: only the owner can delete their saved search
  const { data: existing, error: fetchError } = await admin
    .from("mundane_saved_searches")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: fetchError.message },
      { status: 500 }
    );
  }
  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { error } = await admin
    .from("mundane_saved_searches")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
