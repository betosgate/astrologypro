import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/charts/stats
 *
 * Admin-only endpoint returning chart operational health metrics for the
 * Perennial Mandalism entitlement system.
 *
 * Returns:
 *   natal        — profile counts by natal_status
 *   transits     — monthly transit counts by generation_status (current month)
 *   relationships — relationship chart counts including invalidated
 *   retries       — profiles with correction retries used
 *   tickets       — open chart-related support tickets
 *   locked        — profiles locked for review (exhausted retries)
 */
export async function GET() {
  // Admin auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify the user is an admin
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Run all stats queries in parallel for performance
  const [
    natalStats,
    transitStats,
    relationshipStats,
    retryStats,
    ticketStats,
    notificationFailureStats,
  ] = await Promise.all([
    // ── Natal chart stats by status ─────────────────────────────────────────
    admin
      .from("community_family_members")
      .select("natal_status, natal_retry_count, natal_max_retries")
      .not("member_id", "is", null),

    // ── Monthly transit stats for current month ──────────────────────────────
    admin
      .from("monthly_transits")
      .select("generation_status")
      .eq("month", currentMonth),

    // ── Relationship chart stats ──────────────────────────────────────────────
    admin
      .from("relationship_charts")
      .select("id, invalidated_at"),

    // ── Profiles with correction retries used ────────────────────────────────
    admin
      .from("community_family_members")
      .select("id, natal_retry_count, natal_max_retries, natal_status")
      .gt("natal_retry_count", 0),

    // ── Open chart-related support tickets ───────────────────────────────────
    admin
      .from("support_tickets")
      .select("id, category, status")
      .in("category", [
        "natal_chart_issue",
        "monthly_transit_issue",
        "family_relationship_chart_issue",
      ])
      .in("status", ["open", "pending", "in_progress"]),

    // ── Notification delivery failures ──────────────────────────────────────
    admin
      .from("monthly_transits")
      .select("id")
      .eq("notification_sent", false)
      .eq("generation_status", "generated") // generated but not notified
      .eq("month", currentMonth),
  ]);

  // ── Aggregate natal stats ─────────────────────────────────────────────────
  const natalRows = natalStats.data ?? [];
  const natal = {
    total_eligible: natalRows.length,
    not_started: natalRows.filter((r) => r.natal_status === "not_started").length,
    queued: natalRows.filter((r) => r.natal_status === "queued").length,
    generated: natalRows.filter((r) => r.natal_status === "generated").length,
    failed: natalRows.filter((r) => r.natal_status === "failed").length,
    locked_for_review: natalRows.filter((r) => r.natal_status === "locked_for_review").length,
  };

  // ── Aggregate transit stats ───────────────────────────────────────────────
  const transitRows = transitStats.data ?? [];
  const transits = {
    month: currentMonth,
    total: transitRows.length,
    pending: transitRows.filter((r) => r.generation_status === "pending").length,
    generated: transitRows.filter((r) => r.generation_status === "generated").length,
    notified: transitRows.filter((r) => r.generation_status === "notified").length,
    failed: transitRows.filter((r) => r.generation_status === "failed").length,
    suppressed: transitRows.filter((r) => r.generation_status === "suppressed").length,
    notification_failures: notificationFailureStats.data?.length ?? 0,
  };

  // ── Aggregate relationship chart stats ────────────────────────────────────
  const rcRows = relationshipStats.data ?? [];
  const relationships = {
    total: rcRows.length,
    current: rcRows.filter((r) => r.invalidated_at === null).length,
    needs_regeneration: rcRows.filter((r) => r.invalidated_at !== null).length,
  };

  // ── Retry stats ───────────────────────────────────────────────────────────
  const retryRows = retryStats.data ?? [];
  const retries = {
    profiles_with_retries_used: retryRows.length,
    profiles_at_limit: retryRows.filter(
      (r) => r.natal_retry_count >= r.natal_max_retries
    ).length,
    profiles_locked: retryRows.filter((r) => r.natal_status === "locked_for_review").length,
  };

  // ── Open chart tickets ────────────────────────────────────────────────────
  const ticketRows = ticketStats.data ?? [];
  const tickets = {
    open_chart_tickets: ticketRows.length,
    by_category: {
      natal_chart_issue: ticketRows.filter((t) => t.category === "natal_chart_issue").length,
      monthly_transit_issue: ticketRows.filter((t) => t.category === "monthly_transit_issue").length,
      family_relationship_chart_issue: ticketRows.filter(
        (t) => t.category === "family_relationship_chart_issue"
      ).length,
    },
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    natal,
    transits,
    relationships,
    retries,
    tickets,
  });
}
