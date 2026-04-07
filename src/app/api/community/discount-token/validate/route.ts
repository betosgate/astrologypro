import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * GET /api/community/discount-token/validate?token=xxx
 *
 * No auth required — called from the booking flow to validate a token
 * before applying the platform-cut discount.
 *
 * Returns:
 *   { valid: true, discount_percent, user_id }  — if the token is valid
 *   { valid: false, reason }                     — if invalid/expired/used
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, reason: "token_missing" },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();

  const { data: record } = await adminSupabase
    .from("member_discount_tokens")
    .select("user_id, discount_percent, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  if (record.used_at) {
    return NextResponse.json({ valid: false, reason: "already_used" });
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({
    valid: true,
    discount_percent: record.discount_percent,
    user_id: record.user_id,
  });
}
