import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/community/rituals — list current user's ritual configurations
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify community membership
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("user_ritual_configurations")
    .select(
      "id, ritual_name, ritual_tags, created_at, updated_at, last_executed_at, execution_count, current_step, is_complete"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rituals: data ?? [] });
}

// POST /api/community/rituals — create a new ritual configuration
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { ritual_name, ritual_tags } = body as {
    ritual_name?: string;
    ritual_tags?: string[];
  };

  if (!ritual_name || !Array.isArray(ritual_tags) || ritual_tags.length === 0) {
    return NextResponse.json(
      { error: "ritual_name and ritual_tags are required" },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("user_ritual_configurations")
    .insert({
      user_id: user.id,
      community_member_id: member.id,
      ritual_name,
      ritual_tags,
    })
    .select("id, ritual_name, ritual_tags, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ritual: data }, { status: 201 });
}
