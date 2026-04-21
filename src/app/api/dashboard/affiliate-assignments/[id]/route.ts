/**
 * /api/dashboard/affiliate-assignments/[id]
 *
 * GET   — assignment detail + per-period KPIs
 * PATCH — update commission_value / commission_type / is_active / notes
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return diviner ? { user, diviner, admin } : null;
}

function periodStart(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

// ───────────────────────────────── GET ─────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const ctx = await getDiviner();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { diviner, admin } = ctx;

  // Own the assignment?
  const { data: assignment } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value, is_active, assigned_at, revoked_at, notes"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const fromTs = periodStart(period);

  // Affiliate name lookup
  const affTable =
    assignment.affiliate_type === "social_advocate"
      ? "social_advocates"
      : "diviner_affiliates";
  const { data: aff } = await admin
    .from(affTable)
    .select("id, name, email")
    .eq("id", assignment.affiliate_id)
    .maybeSingle();

  // Destination name
  let destinationName = "Profile";
  if (assignment.destination_type === "SERVICE" && assignment.destination_id) {
    const { data: tpl } = await admin
      .from("service_templates")
      .select("name")
      .eq("id", assignment.destination_id)
      .maybeSingle();
    destinationName = tpl?.name ?? "Service";
  }

  // Campaigns sourced from this assignment
  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id, name, status, campaign_code, created_at, start_date, end_date")
    .eq("source_assignment_id", id);

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  // Clicks + conversions scoped to this affiliate on matching destination/period
  const [clicksRes, conversionsRes] = await Promise.all([
    admin
      .from("campaign_clicks")
      .select("clicked_at, is_bot, is_unique_click, device_type, country_code, campaign_id")
      .eq("diviner_id", diviner.id)
      .eq("affiliate_id", assignment.affiliate_id)
      .eq(
        assignment.destination_type === "PROFILE"
          ? "destination_type"
          : "destination_id",
        assignment.destination_type === "PROFILE"
          ? "PROFILE"
          : (assignment.destination_id as string)
      )
      .gte("clicked_at", fromTs),
    campaignIds.length > 0
      ? admin
          .from("campaign_conversions")
          .select(
            "id, campaign_id, booking_id, converted_at, order_amount_cents, commission_amount_cents, reversed_at"
          )
          .in("campaign_id", campaignIds)
          .gte("converted_at", fromTs)
      : Promise.resolve({ data: [] }),
  ]);

  const clicks = (clicksRes.data ?? []) as Array<{
    clicked_at: string;
    is_bot: boolean | null;
    is_unique_click: boolean | null;
    campaign_id: string;
  }>;
  const conversions = (conversionsRes.data ?? []) as Array<{
    id: string;
    campaign_id: string;
    booking_id: string | null;
    converted_at: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
  }>;

  const humanClicks = clicks.filter((c) => !c.is_bot);
  const uniqueClicks = humanClicks.filter((c) => c.is_unique_click);

  // Daily bucket
  const dailyMap: Record<string, { clicks: number; conversions: number }> = {};
  for (const c of humanClicks) {
    const d = c.clicked_at.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { clicks: 0, conversions: 0 };
    dailyMap[d].clicks++;
  }
  for (const c of conversions) {
    const d = c.converted_at.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { clicks: 0, conversions: 0 };
    dailyMap[d].conversions++;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Per-campaign aggregate
  const campaignStats = (campaigns ?? []).map((c) => {
    const cid = c.id as string;
    const cClicks = humanClicks.filter((cc) => cc.campaign_id === cid).length;
    const cConvs = conversions.filter((cc) => cc.campaign_id === cid);
    const cCommission = cConvs.reduce(
      (s, r) => s + Number(r.commission_amount_cents ?? 0),
      0
    );
    return {
      id: cid,
      name: c.name as string,
      status: c.status as string,
      campaign_code: c.campaign_code as string | null,
      created_at: c.created_at as string,
      clicks: cClicks,
      conversions: cConvs.length,
      commission_cents: cCommission,
    };
  });

  const totalCommission = conversions.reduce(
    (s, r) => s + Number(r.commission_amount_cents ?? 0),
    0
  );

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      destination_type: assignment.destination_type,
      destination_id: assignment.destination_id,
      destination_name: destinationName,
      affiliate_id: assignment.affiliate_id,
      affiliate_type: assignment.affiliate_type,
      affiliate_name: aff?.name ?? "(unknown)",
      affiliate_email: aff?.email ?? null,
      commission_type: assignment.commission_type,
      commission_value: Number(assignment.commission_value),
      is_active: assignment.is_active,
      assigned_at: assignment.assigned_at,
      revoked_at: assignment.revoked_at,
      notes: assignment.notes,
    },
    kpis: {
      period,
      clicks: humanClicks.length,
      unique_clicks: uniqueClicks.length,
      conversions: conversions.length,
      commission_cents: totalCommission,
    },
    daily,
    campaigns: campaignStats,
    conversions: conversions.map((c) => ({
      id: c.id,
      booking_id: c.booking_id,
      converted_at: c.converted_at,
      order_amount_cents: Number(c.order_amount_cents ?? 0),
      commission_amount_cents: Number(c.commission_amount_cents ?? 0),
      reversed_at: c.reversed_at,
    })),
  });
}

// ───────────────────────────────── PATCH ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const ctx = await getDiviner();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { user, diviner, admin } = ctx;

  // Confirm ownership
  const { data: existing } = await admin
    .from("diviner_service_affiliates")
    .select("id, diviner_id, commission_type, commission_value, is_active")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    commission_type?: "percent" | "flat";
    commission_value?: number;
    is_active?: boolean;
    notes?: string | null;
  };

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.commission_type !== undefined) {
    if (body.commission_type !== "percent" && body.commission_type !== "flat") {
      return NextResponse.json(
        { error: "commission_type must be 'percent' or 'flat'" },
        { status: 422 }
      );
    }
    update.commission_type = body.commission_type;
  }
  if (body.commission_value !== undefined) {
    const v = Number(body.commission_value);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { error: "commission_value must be a non-negative number" },
        { status: 422 }
      );
    }
    const effType = body.commission_type ?? existing.commission_type;
    if (effType === "percent" && v > 100) {
      return NextResponse.json(
        { error: "percent commission_value must be ≤ 100" },
        { status: 422 }
      );
    }
    update.commission_value = v;
  }
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.is_active !== undefined) {
    update.is_active = body.is_active;
    if (body.is_active === false) {
      update.revoked_at = new Date().toISOString();
      update.revoked_by = user.id;
    } else {
      update.revoked_at = null;
      update.revoked_by = null;
    }
  }

  const { error: updateErr } = await admin
    .from("diviner_service_affiliates")
    .update(update)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
