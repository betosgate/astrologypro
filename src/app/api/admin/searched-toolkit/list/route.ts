import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/searched-toolkit/list
 * 
 * Lists all saved AI responses for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    // Master admin check
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const admin = createAdminClient();
    
    // Fetch toolkit records
    const { data: records, error } = await admin
      .from("astro_ai_responses")
      .select("id, toolname, form_data, created_at, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user details from Auth Admin
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    
    // Create a map of user_id -> { name, email }
    const userMap: Record<string, { name: string; email: string }> = {};
    if (!authError && authUsers?.users) {
      const users = authUsers.users as Array<{
        id: string;
        user_metadata?: Record<string, any> | null;
        email?: string | null;
      }>;

      users.forEach(u => {
        userMap[u.id] = {
          name: u.user_metadata?.name || "Unknown User",
          email: u.email || "No Email"
        };
      });
    }

    // Merge user info into records
    const enrichedResults = records.map(r => ({
      ...r,
      user_name: userMap[r.user_id]?.name || "Unknown",
      user_email: userMap[r.user_id]?.email || "N/A"
    }));

    return NextResponse.json({ status: "success", results: enrichedResults });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
