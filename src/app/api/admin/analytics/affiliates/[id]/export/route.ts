/**
 * GET /api/admin/analytics/affiliates/[id]/export
 *
 * Streams the conversion log for a single affiliate as CSV.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  csvResponse,
  dateStampUtc,
  checkExportRateLimit,
} from "@/lib/admin/csv-stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const COLUMNS = [
  "conversion_id",
  "booking_id",
  "converted_at",
  "campaign_id",
  "campaign_name",
  "order_amount_cents",
  "commission_amount_cents",
  "reversed_at",
] as const;

function getPeriodFrom(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/403",
        title: "Forbidden",
        status: 403,
        detail: "Admin role required",
      },
      { status: 403, headers: { "Content-Type": "application/problem+json" } },
    );
  }

  const rate = checkExportRateLimit(`affiliate-detail:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/429",
        title: "Too Many Requests",
        status: 429,
        detail: "Export rate limit exceeded",
      },
      {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const { id } = await params;
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "social_advocate") as
    | "social_advocate"
    | "diviner_affiliate";
  const period = url.searchParams.get("period") ?? "30d";
  const fromTs = getPeriodFrom(period);

  const admin = createAdminClient();
  const started = Date.now();

  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "id, booking_id, campaign_id, converted_at, order_amount_cents, commission_amount_cents, reversed_at",
    )
    .eq("affiliate_id", id)
    .eq("affiliate_type", type)
    .gte("converted_at", fromTs)
    .order("converted_at", { ascending: false });

  const rows = (conversions ?? []) as Array<{
    id: string;
    booking_id: string | null;
    campaign_id: string;
    converted_at: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
  }>;

  const campaignIds = [...new Set(rows.map((r) => r.campaign_id))];
  const campaignNameById = new Map<string, string>();
  if (campaignIds.length > 0) {
    const { data: campaigns } = await admin
      .from("affiliate_campaigns")
      .select("id, name")
      .in("id", campaignIds);
    for (const c of (campaigns ?? []) as Array<{ id: string; name: string | null }>) {
      campaignNameById.set(c.id, c.name ?? "(untitled)");
    }
  }

  async function* iter() {
    for (const r of rows) {
      yield {
        conversion_id: r.id,
        booking_id: r.booking_id,
        converted_at: r.converted_at,
        campaign_id: r.campaign_id,
        campaign_name: campaignNameById.get(r.campaign_id) ?? null,
        order_amount_cents: r.order_amount_cents ?? 0,
        commission_amount_cents: r.commission_amount_cents ?? 0,
        reversed_at: r.reversed_at,
      };
    }
  }

  const res = csvResponse(
    `affiliate-${id}-detail-${dateStampUtc()}.csv`,
    [...COLUMNS],
    iter(),
  );

  console.log(
    JSON.stringify({
      event: "admin_export",
      endpoint: "analytics/affiliates/[id]/export",
      user_id: user.id,
      affiliate_id: id,
      affiliate_type: type,
      period,
      row_count: rows.length,
      duration_ms: Date.now() - started,
    }),
  );

  return res;
}
