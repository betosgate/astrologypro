import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/phone-calls
 *
 * Returns the diviner's phone call history from phone_sessions.
 *
 * Query params:
 *   status  — filter by status (e.g. "completed", "active", "failed")
 *   from    — ISO datetime lower bound
 *   to      — ISO datetime upper bound
 *   page    — page number (default: 1)
 *   limit   — items per page (default: 20, max: 50)
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
    return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  try {
    let query = admin
      .from("phone_sessions")
      .select(
        `id,
         caller_phone,
         session_type,
         status,
         started_at,
         ended_at,
         duration_seconds,
         phone_provider,
         created_at,
         booking_id,
         client_id,
         clients(id, full_name, email, phone)`,
        { count: "exact" }
      )
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data: calls, count, error } = await query;

    if (error) {
      console.error("[api/dashboard/phone-calls] query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch call history" },
        { status: 500 }
      );
    }

    // Also fetch summary stats
    const { data: stats } = await admin.rpc("get_phone_call_stats", {
      p_diviner_id: diviner.id,
    }).maybeSingle();

    // If RPC doesn't exist yet, compute manually
    let summary = stats;
    if (!summary) {
      const { count: totalCalls } = await admin
        .from("phone_sessions")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id);

      const { count: completedCalls } = await admin
        .from("phone_sessions")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id)
        .eq("status", "completed");

      const { count: missedCalls } = await admin
        .from("phone_sessions")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id)
        .in("status", ["failed", "declined"]);

      const { count: activeCalls } = await admin
        .from("phone_sessions")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id)
        .in("status", ["active", "accepted", "pending"]);

      // Average duration of completed calls
      const { data: durationData } = await admin
        .from("phone_sessions")
        .select("duration_seconds")
        .eq("diviner_id", diviner.id)
        .eq("status", "completed")
        .not("duration_seconds", "is", null);

      const avgDuration = durationData && durationData.length > 0
        ? Math.round(
            durationData.reduce((sum, d) => sum + (d.duration_seconds ?? 0), 0) /
            durationData.length
          )
        : 0;

      summary = {
        total_calls: totalCalls ?? 0,
        completed_calls: completedCalls ?? 0,
        missed_calls: missedCalls ?? 0,
        active_calls: activeCalls ?? 0,
        avg_duration_seconds: avgDuration,
      };
    }

    return NextResponse.json({
      calls: calls ?? [],
      total: count ?? 0,
      page,
      limit,
      summary,
    });
  } catch (error) {
    console.error("[api/dashboard/phone-calls] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call history" },
      { status: 500 }
    );
  }
}
