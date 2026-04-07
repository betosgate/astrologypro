import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * POST /api/community/discount-token
 *
 * Issues (or returns an existing) single-use 5% member cross-sell discount token
 * for an active Perennial community member.
 *
 * Returns: { token, expires_at, discount_percent }
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify active community membership
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json(
      { error: "Community membership not found" },
      { status: 403 }
    );
  }

  if (member.membership_status !== "active") {
    return NextResponse.json(
      { error: "Active community membership required" },
      { status: 403 }
    );
  }

  const adminSupabase = createAdminClient();

  // Return existing unexpired unused token if one exists
  const { data: existing } = await adminSupabase
    .from("member_discount_tokens")
    .select("token, expires_at, discount_percent")
    .eq("user_id", user.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      token: existing.token,
      expires_at: existing.expires_at,
      discount_percent: existing.discount_percent,
    });
  }

  // Issue a new token
  const { data: created, error } = await adminSupabase
    .from("member_discount_tokens")
    .insert({ user_id: user.id })
    .select("token, expires_at, discount_percent")
    .single();

  if (error || !created) {
    console.error("Failed to create discount token:", error);
    return NextResponse.json(
      { error: "Failed to issue discount token" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: created.token,
    expires_at: created.expires_at,
    discount_percent: created.discount_percent,
  });
}
