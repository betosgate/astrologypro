import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/clients/search?q=...
 *
 * Searches for clients associated with the authenticated diviner.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.toLowerCase() || "";

  try {
    // Fetch client relationships for this diviner
    const { data: relations, error } = await supabase
      .from("client_diviners")
      .select("client_id, clients(id, full_name, email)")
      .eq("owner_id", diviner.id);

    if (error) throw error;

    let clients = relations
      .map((r: any) => r.clients)
      .filter(Boolean);

    // Apply search filter if query exists
    if (q) {
      clients = clients.filter((c: any) => 
        c.full_name?.toLowerCase().includes(q) || 
        c.email?.toLowerCase().includes(q)
      );
    }

    // Limit to top 20 for performance
    return NextResponse.json({ clients: clients.slice(0, 20) });
  } catch (err) {
    console.error("[api/dashboard/clients/search] error:", err);
    return NextResponse.json({ error: "Failed to search clients" }, { status: 500 });
  }
}
