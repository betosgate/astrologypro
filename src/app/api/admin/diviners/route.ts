import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/diviners — returns id + display_name for dropdowns
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const admin = createAdminClient();
  let query = admin
    .from("diviners")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(limit);

  if (q) {
    query = query.ilike("display_name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ diviners: data });
}
