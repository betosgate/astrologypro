import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

// GET /api/dashboard/giveaways/[id]/entries
// List entries for a giveaway with winner flag.
// Auth: authenticated diviner who owns the giveaway.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  // Object-level auth
  const { data: giveaway } = await admin
    .from("giveaways")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!giveaway) return problem(404, "Not Found", "Giveaway not found.");

  const { data: entries, error } = await admin
    .from("giveaway_entries")
    .select("id, name, email, is_winner, entered_at, ip_address")
    .eq("giveaway_id", id)
    .order("entered_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[giveaways/[id]/entries] list error", error);
    return problem(500, "Internal Server Error", "Failed to fetch entries.");
  }

  return NextResponse.json({ entries: entries ?? [] });
}
