import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
  return user;
}

type Params = { params: Promise<{ id: string }> };

// GET — RSVP list for an event
// Returns: [{ user_id, email, name, rsvp_status, attended, created_at }]
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: event_id } = await params;

  const admin = createAdminClient();

  // Fetch RSVPs
  const { data: rsvps, error } = await admin
    .from("event_rsvps")
    .select("user_id, rsvp_status, attended, created_at")
    .eq("event_id", event_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rsvps || rsvps.length === 0) return NextResponse.json({ rsvps: [] });

  // Enrich with community_members email + name (single batch query)
  const userIds = rsvps.map((r) => r.user_id);
  const { data: members } = await admin
    .from("community_members")
    .select("user_id, email, full_name")
    .in("user_id", userIds);

  const memberMap: Record<string, { email: string; full_name: string | null }> = {};
  for (const m of members ?? []) {
    memberMap[m.user_id] = { email: m.email, full_name: m.full_name };
  }

  const enriched = rsvps.map((r) => ({
    user_id: r.user_id,
    email: memberMap[r.user_id]?.email ?? null,
    name: memberMap[r.user_id]?.full_name ?? null,
    rsvp_status: r.rsvp_status,
    attended: r.attended,
    created_at: r.created_at,
  }));

  return NextResponse.json({ rsvps: enriched, total: enriched.length });
}
