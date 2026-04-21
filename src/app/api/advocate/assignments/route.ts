/**
 * GET /api/advocate/assignments
 *
 * Returns every diviner_service_affiliates row where the authenticated
 * user is the affiliate, plus 30d KPIs from campaigns they created under
 * each assignment. Used by /advocate/assignments page.
 *
 * Affiliate identity resolution: looks the user up in social_advocates
 * first, then diviner_affiliates. The union table we check for assignments
 * uses whichever ID the user maps to.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function resolveAffiliate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();

  const { data: advocate } = await admin
    .from("social_advocates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (advocate)
    return {
      user,
      admin,
      affiliateId: advocate.id as string,
      affiliateType: "social_advocate" as const,
    };

  const { data: divAff } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (divAff)
    return {
      user,
      admin,
      affiliateId: divAff.id as string,
      affiliateType: "diviner_affiliate" as const,
    };

  return null;
}

export async function GET() {
  const ctx = await resolveAffiliate();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin, affiliateId, affiliateType } = ctx;

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, commission_type, commission_value, is_active, assigned_at, revoked_at, notes"
    )
    .eq("affiliate_id", affiliateId)
    .eq("affiliate_type", affiliateType)
    .order("assigned_at", { ascending: false });

  const rows = assignments ?? [];
  if (rows.length === 0)
    return NextResponse.json({
      affiliate: { id: affiliateId, type: affiliateType },
      assignments: [],
    });

  const divinerIds = [...new Set(rows.map((r) => r.diviner_id as string))];
  const tplIds = [
    ...new Set(
      rows
        .filter((r) => r.destination_type === "SERVICE" && r.destination_id)
        .map((r) => r.destination_id as string)
    ),
  ];

  const [divinersRes, templatesRes, campaignsRes] = await Promise.all([
    divinerIds.length > 0
      ? admin
          .from("diviners")
          .select("id, username, display_name, avatar_url")
          .in("id", divinerIds)
      : Promise.resolve({ data: [] }),
    tplIds.length > 0
      ? admin.from("service_templates").select("id, name").in("id", tplIds)
      : Promise.resolve({ data: [] }),
    admin
      .from("affiliate_campaigns")
      .select("id, source_assignment_id, status, campaign_code")
      .eq("owner_type", "affiliate")
      .eq("owner_affiliate_id", affiliateId)
      .eq("owner_affiliate_type", affiliateType),
  ]);

  const divinerById = new Map(
    ((divinersRes.data ?? []) as Array<{
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    }>).map((d) => [d.id, d])
  );
  const templateNameById = new Map(
    ((templatesRes.data ?? []) as Array<{ id: string; name: string }>).map(
      (t) => [t.id, t.name]
    )
  );
  const campaignsByAssignment = new Map<
    string,
    Array<{ id: string; status: string; campaign_code: string | null }>
  >();
  for (const c of (campaignsRes.data ?? []) as Array<{
    id: string;
    source_assignment_id: string;
    status: string;
    campaign_code: string | null;
  }>) {
    const aid = c.source_assignment_id;
    if (!campaignsByAssignment.has(aid)) campaignsByAssignment.set(aid, []);
    campaignsByAssignment.get(aid)!.push({
      id: c.id,
      status: c.status,
      campaign_code: c.campaign_code,
    });
  }

  // Click + conversion KPIs per assignment (via the campaigns)
  const campaignIds = (campaignsRes.data ?? []).map((c) => c.id);
  const [clicksRes, convRes] = await Promise.all([
    campaignIds.length > 0
      ? admin
          .from("campaign_clicks")
          .select("campaign_id, is_bot, is_unique_click")
          .in("campaign_id", campaignIds)
          .gte("clicked_at", since30d)
      : Promise.resolve({ data: [] }),
    campaignIds.length > 0
      ? admin
          .from("campaign_conversions")
          .select("campaign_id, commission_amount_cents")
          .in("campaign_id", campaignIds)
          .gte("converted_at", since30d)
      : Promise.resolve({ data: [] }),
  ]);

  const clicksByCampaign = new Map<string, { clicks: number; unique: number }>();
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
  const convByCampaign = new Map<string, { count: number; commission: number }>();
  for (const c of (convRes.data ?? []) as Array<{
    campaign_id: string;
    commission_amount_cents: number | null;
  }>) {
    const entry = convByCampaign.get(c.campaign_id) ?? { count: 0, commission: 0 };
    entry.count++;
    entry.commission += Number(c.commission_amount_cents ?? 0);
    convByCampaign.set(c.campaign_id, entry);
  }

  const enriched = rows.map((r) => {
    const diviner = divinerById.get(r.diviner_id as string);
    const campaigns = campaignsByAssignment.get(r.id as string) ?? [];
    let clicks = 0, unique = 0, conversions = 0, commission = 0;
    for (const c of campaigns) {
      const k = clicksByCampaign.get(c.id);
      if (k) {
        clicks += k.clicks;
        unique += k.unique;
      }
      const cv = convByCampaign.get(c.id);
      if (cv) {
        conversions += cv.count;
        commission += cv.commission;
      }
    }
    return {
      id: r.id,
      diviner_id: r.diviner_id,
      diviner_username: diviner?.username ?? null,
      diviner_display_name: diviner?.display_name ?? null,
      diviner_avatar_url: diviner?.avatar_url ?? null,
      destination_type: r.destination_type,
      destination_id: r.destination_id,
      destination_name:
        r.destination_type === "PROFILE"
          ? "Profile"
          : templateNameById.get(r.destination_id as string) ?? "Service",
      commission_type: r.commission_type,
      commission_value: Number(r.commission_value),
      is_active: r.is_active,
      assigned_at: r.assigned_at,
      revoked_at: r.revoked_at,
      notes: r.notes,
      campaigns_count: campaigns.length,
      kpis_30d: {
        clicks,
        unique_clicks: unique,
        conversions,
        commission_cents: commission,
      },
      campaigns,
    };
  });

  return NextResponse.json({
    affiliate: { id: affiliateId, type: affiliateType },
    assignments: enriched,
  });
}
