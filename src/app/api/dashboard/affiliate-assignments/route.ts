/**
 * /api/dashboard/affiliate-assignments
 *
 * GET  — list the authenticated diviner's assignments + 30d KPIs
 * POST — create a new assignment (validated against an owned service
 *        for SERVICE scope)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// ───────────────────────────────── GET ─────────────────────────────────────
export async function GET() {
  const ctx = await getDiviner();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { diviner, admin } = ctx;

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Load assignments (active + inactive; UI filters)
  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value, is_active, assigned_at, revoked_at, notes"
    )
    .eq("diviner_id", diviner.id)
    .order("assigned_at", { ascending: false });

  const rows = assignments ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ assignments: [] });
  }

  // Resolve affiliate display info + destination labels, and aggregate KPIs
  // strictly through the campaign -> source_assignment_id chain so the
  // numbers attached to each assignment row belong ONLY to campaigns that
  // were created under that assignment.
  const affIds = [...new Set(rows.map((r) => r.affiliate_id as string))];
  const tplIds = [
    ...new Set(
      rows
        .filter((r) => r.destination_type === "SERVICE" && r.destination_id)
        .map((r) => r.destination_id as string)
    ),
  ];
  const assignmentIds = rows.map((r) => r.id as string);

  const [advocatesRes, divAffRes, templatesRes, campaignsRes] =
    await Promise.all([
      affIds.length > 0
        ? admin.from("social_advocates").select("id, name, email").in("id", affIds)
        : Promise.resolve({ data: [] }),
      affIds.length > 0
        ? admin.from("diviner_affiliates").select("id, name, email").in("id", affIds)
        : Promise.resolve({ data: [] }),
      tplIds.length > 0
        ? admin.from("service_templates").select("id, name").in("id", tplIds)
        : Promise.resolve({ data: [] }),
      admin
        .from("affiliate_campaigns")
        .select("id, source_assignment_id")
        .eq("diviner_id", diviner.id)
        .eq("owner_type", "affiliate")
        .in("source_assignment_id", assignmentIds),
    ]);

  const nameByAff = new Map<string, { name: string; email: string; type: "social_advocate" | "diviner_affiliate" }>();
  for (const a of (advocatesRes.data ?? []) as Array<{ id: string; name: string; email: string }>) {
    nameByAff.set(a.id, { name: a.name, email: a.email, type: "social_advocate" });
  }
  for (const a of (divAffRes.data ?? []) as Array<{ id: string; name: string; email: string }>) {
    if (!nameByAff.has(a.id))
      nameByAff.set(a.id, { name: a.name, email: a.email, type: "diviner_affiliate" });
  }
  const templateName = new Map<string, string>(
    (templatesRes.data ?? []).map((t: { id: string; name: string }) => [t.id, t.name])
  );

  const campaignRows = (campaignsRes.data ?? []) as Array<{
    id: string;
    source_assignment_id: string | null;
  }>;
  const campaignsByAssignment = new Map<string, string[]>();
  const assignmentByCampaign = new Map<string, string>();
  for (const c of campaignRows) {
    if (!c.source_assignment_id) continue;
    assignmentByCampaign.set(c.id, c.source_assignment_id);
    const arr = campaignsByAssignment.get(c.source_assignment_id) ?? [];
    arr.push(c.id);
    campaignsByAssignment.set(c.source_assignment_id, arr);
  }
  const campaignIds = campaignRows.map((c) => c.id);

  // Aggregate clicks/conversions per campaign, then fold into per-assignment
  // totals. Assignments with zero campaigns still appear with zero KPIs.
  const clicksByCampaign = new Map<string, { clicks: number; unique: number }>();
  const convByCampaign = new Map<string, { count: number; commission: number }>();

  if (campaignIds.length > 0) {
    const [clicksRes, conversionsRes] = await Promise.all([
      admin
        .from("campaign_clicks")
        .select("campaign_id, is_bot, is_unique_click")
        .in("campaign_id", campaignIds)
        .gte("clicked_at", since30d),
      admin
        .from("campaign_conversions")
        .select("campaign_id, commission_amount_cents, reversed_at")
        .in("campaign_id", campaignIds)
        .gte("converted_at", since30d),
    ]);

    for (const c of (clicksRes.data ?? []) as Array<{
      campaign_id: string;
      is_bot: boolean | null;
      is_unique_click: boolean | null;
    }>) {
      if (c.is_bot) continue;
      const entry = clicksByCampaign.get(c.campaign_id) ?? { clicks: 0, unique: 0 };
      entry.clicks++;
      if (c.is_unique_click) entry.unique++;
      clicksByCampaign.set(c.campaign_id, entry);
    }

    for (const c of (conversionsRes.data ?? []) as Array<{
      campaign_id: string;
      commission_amount_cents: number | null;
      reversed_at: string | null;
    }>) {
      if (c.reversed_at) continue;
      const entry = convByCampaign.get(c.campaign_id) ?? { count: 0, commission: 0 };
      entry.count++;
      entry.commission += Number(c.commission_amount_cents ?? 0);
      convByCampaign.set(c.campaign_id, entry);
    }
  }

  const enriched = rows.map((r) => {
    const aff = nameByAff.get(r.affiliate_id as string);
    const assignmentCampaigns = campaignsByAssignment.get(r.id as string) ?? [];

    let clicks = 0, unique = 0, conversions = 0, commissionCents = 0;
    for (const cid of assignmentCampaigns) {
      const k = clicksByCampaign.get(cid);
      if (k) {
        clicks += k.clicks;
        unique += k.unique;
      }
      const cv = convByCampaign.get(cid);
      if (cv) {
        conversions += cv.count;
        commissionCents += cv.commission;
      }
    }

    return {
      id: r.id,
      destination_type: r.destination_type,
      destination_id: r.destination_id,
      destination_name:
        r.destination_type === "PROFILE"
          ? "Profile"
          : templateName.get(r.destination_id as string) ?? "Service",
      affiliate_id: r.affiliate_id,
      affiliate_type: r.affiliate_type,
      affiliate_name: aff?.name ?? "(unknown)",
      affiliate_email: aff?.email ?? null,
      commission_type: r.commission_type,
      commission_value: Number(r.commission_value),
      is_active: r.is_active,
      assigned_at: r.assigned_at,
      revoked_at: r.revoked_at,
      notes: r.notes,
      kpis_30d: {
        clicks,
        unique_clicks: unique,
        conversions,
        commission_cents: commissionCents,
      },
    };
  });

  return NextResponse.json({ assignments: enriched });
}

// ───────────────────────────────── POST ────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await getDiviner();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { user, diviner, admin } = ctx;

  const body = (await req.json().catch(() => ({}))) as {
    destination_type?: "PROFILE" | "SERVICE";
    destination_id?: string | null;
    affiliate_id?: string;
    affiliate_type?: "diviner_affiliate" | "social_advocate";
    commission_type?: "percent" | "flat";
    commission_value?: number;
    notes?: string | null;
  };

  const destinationType = body.destination_type;
  const destinationId =
    destinationType === "PROFILE" ? null : body.destination_id ?? null;
  const affiliateId = body.affiliate_id;
  const affiliateType = body.affiliate_type;
  const commissionType = body.commission_type ?? "percent";
  const commissionValue = Number(body.commission_value);

  // Validation
  if (destinationType !== "PROFILE" && destinationType !== "SERVICE") {
    return NextResponse.json(
      { error: "destination_type must be 'PROFILE' or 'SERVICE'" },
      { status: 422 }
    );
  }
  if (destinationType === "SERVICE" && !destinationId) {
    return NextResponse.json(
      { error: "destination_id is required for SERVICE scope" },
      { status: 422 }
    );
  }
  if (!affiliateId) {
    return NextResponse.json({ error: "affiliate_id is required" }, { status: 422 });
  }
  if (affiliateType !== "diviner_affiliate" && affiliateType !== "social_advocate") {
    return NextResponse.json(
      { error: "affiliate_type must be 'diviner_affiliate' or 'social_advocate'" },
      { status: 422 }
    );
  }
  if (commissionType !== "percent" && commissionType !== "flat") {
    return NextResponse.json(
      { error: "commission_type must be 'percent' or 'flat'" },
      { status: 422 }
    );
  }
  if (!Number.isFinite(commissionValue) || commissionValue < 0) {
    return NextResponse.json(
      { error: "commission_value must be a non-negative number" },
      { status: 422 }
    );
  }
  if (commissionType === "percent" && commissionValue > 100) {
    return NextResponse.json(
      { error: "percent commission_value must be ≤ 100" },
      { status: 422 }
    );
  }

  // For SERVICE scope: verify the diviner owns/has-enabled this service
  if (destinationType === "SERVICE") {
    const { data: divService } = await admin
      .from("diviner_services")
      .select("id, is_enabled")
      .eq("diviner_id", diviner.id)
      .eq("service_template_id", destinationId!)
      .maybeSingle();
    if (!divService || divService.is_enabled === false) {
      return NextResponse.json(
        { error: "Service is not enabled for this diviner" },
        { status: 422 }
      );
    }
  }

  // Verify the affiliate exists
  const affTable =
    affiliateType === "social_advocate" ? "social_advocates" : "diviner_affiliates";
  const { data: affRow } = await admin
    .from(affTable)
    .select("id")
    .eq("id", affiliateId)
    .maybeSingle();
  if (!affRow) {
    return NextResponse.json(
      { error: "Affiliate not found" },
      { status: 404 }
    );
  }

  // Duplicate active assignment? (the partial unique index enforces this
  // at the DB level; we pre-check for a nicer error.)
  const { data: existing } = await admin
    .from("diviner_service_affiliates")
    .select("id")
    .eq("diviner_id", diviner.id)
    .eq("destination_type", destinationType)
    .eq("affiliate_id", affiliateId)
    .eq("affiliate_type", affiliateType)
    .eq("is_active", true)
    .match(destinationId ? { destination_id: destinationId } : {})
    .is(destinationId ? "destination_id" : "destination_id", destinationId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "This affiliate is already assigned to this scope" },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertErr } = await admin
    .from("diviner_service_affiliates")
    .insert({
      diviner_id: diviner.id,
      destination_type: destinationType,
      destination_id: destinationId,
      affiliate_id: affiliateId,
      affiliate_type: affiliateType,
      commission_type: commissionType,
      commission_value: commissionValue,
      is_active: true,
      assigned_by: user.id,
      notes: body.notes ?? null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create assignment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
