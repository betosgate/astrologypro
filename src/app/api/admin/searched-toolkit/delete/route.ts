import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

/**
 * DELETE /api/admin/searched-toolkit/delete?id=[id]
 * 
 * Securely deletes a specific AI response record.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    // Use the official admin check logic
    const adminUser = await getAdminUser();
    if (!adminUser) {
       return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const admin = createAdminClient();
    
    // Perform deletion
    const { error } = await admin
      .from("astro_ai_responses")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      status: "success", 
      message: "Record deleted successfully",
      id 
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
