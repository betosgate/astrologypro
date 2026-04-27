import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/monthly-transits/ensure
 *
 * Spec source:
 *   tasks/27.04.2026/community-monthly-transit-architecture/05-integrate-generation-triggers.md
 *
 * Wraps the shared `ensureCurrentMonthTransitsForMember` service for
 * authenticated community users. Used as the lazy-fallback hook from
 * `/community/transits` so a mid-month subscriber (or a member who just
 * added a new family-member with a freshly generated natal chart) gets
 * a current-month summary row without waiting for the 1st-of-month cron.
 *
 * Idempotent. Already-current rows are skipped unless `forceRegenerate`
 * is true. The endpoint never bumps natal-chart governance state — the
 * service writes monthly_transits only.
 *
 * Response shape mirrors the service's `EnsureMonthlyTransitsResult`.
 *
 * Body (all optional):
 *   {
 *     "forceRegenerate": false,
 *     "month": "2026-04"
 *   }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "No community membership" },
      { status: 404 }
    );
  }
  if (member.membership_status !== "active") {
    return NextResponse.json(
      { error: "Inactive membership" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const forceRegenerate = body?.forceRegenerate === true;
  const month =
    typeof body?.month === "string" && body.month.trim().length > 0
      ? body.month.trim()
      : undefined;

  try {
    const result = await ensureCurrentMonthTransitsForMember(member.id, {
      forceRegenerate,
      month,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[monthly-transits/ensure] failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to ensure transits",
      },
      { status: 500 }
    );
  }
}
