/**
 * Shared aggregation helper for the admin campaign leaderboard.
 *
 * Used by:
 *   - GET /api/admin/analytics/campaigns          (JSON)
 *   - GET /api/admin/analytics/campaigns/export   (CSV)
 *
 * Keeping it here prevents the two endpoints from drifting.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Range = "7d" | "30d" | "90d" | "all";
export type OwnerType = "all" | "diviner" | "affiliate";
export type StatusFilter = "all" | "active" | "paused" | "archived";
export type SortKey =
  | "clicks"
  | "conversions"
  | "commission"
  | "revenue"
  | "ctr"
  | "cvr"
  | "views";
export type Order = "asc" | "desc";

export interface LeaderboardFilters {
  range: Range;
  owner_type: OwnerType;
  status: StatusFilter;
  search: string;
  sort: SortKey;
  order: Order;
  limit: number;
  offset: number;
}

export interface LeaderboardRow {
  campaign_id: string;
  campaign_name: string;
  campaign_code: string;
  owner_type: "diviner" | "affiliate";
  diviner_id: string | null;
  diviner_username: string | null;
  owner_affiliate_id: string | null;
  owner_affiliate_type: "diviner_affiliate" | "social_advocate" | null;
  owner_affiliate_username: string | null;
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_label: string;
  status: string;
  clicks: number;
  unique_clicks: number;
  views: number;
  conversions: number;
  ctr: number;
  cvr: number;
  order_revenue_cents: number;
  commission_cents: number;
  created_at: string;
}

export function rangeToSinceIso(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function buildCampaignLeaderboard(
  admin: SupabaseClient,
  filters: LeaderboardFilters,
): Promise<{ rows: LeaderboardRow[]; total: number }> {
  const sinceIso = rangeToSinceIso(filters.range);

  // ── 1. Load the candidate campaign set. Filters applied in SQL where
  //      possible so we don't over-fetch from Supabase.
  let q = admin
    .from("affiliate_campaigns")
    .select(
      `id, name, campaign_code, status, created_at, owner_type, diviner_id,
       owner_affiliate_id, owner_affiliate_type, destination_type,
       destination_service_template_id`,
    );
  if (filters.owner_type !== "all") q = q.eq("owner_type", filters.owner_type);
  if (filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    q = q.or(`name.ilike.${pattern},campaign_code.ilike.${pattern}`);
  }
  const { data: campaignsData, error: campaignsErr } = await q;
  if (campaignsErr) throw campaignsErr;

  const campaigns = (campaignsData ?? []) as Array<{
    id: string;
    name: string | null;
    campaign_code: string | null;
    status: string;
    created_at: string;
    owner_type: "diviner" | "affiliate";
    diviner_id: string | null;
    owner_affiliate_id: string | null;
    owner_affiliate_type: "diviner_affiliate" | "social_advocate" | null;
    destination_type: "PROFILE" | "SERVICE" | null;
    destination_service_template_id: string | null;
  }>;

  if (campaigns.length === 0) return { rows: [], total: 0 };

  const campaignIds = campaigns.map((c) => c.id);
  const campaignCodes = campaigns
    .map((c) => c.campaign_code)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  // ── 2. Aggregate clicks / views / conversions in parallel.
  const [clicksRes, viewsRes, conversionsRes] = await Promise.all([
    (async () => {
      let cq = admin
        .from("campaign_clicks")
        .select("campaign_id, is_bot, is_unique_click")
        .in("campaign_id", campaignIds);
      if (sinceIso) cq = cq.gte("clicked_at", sinceIso);
      return cq;
    })(),
    campaignCodes.length > 0
      ? (async () => {
          let vq = admin
            .from("page_views")
            .select("ref_code")
            .in("ref_code", campaignCodes);
          if (sinceIso) vq = vq.gte("created_at", sinceIso);
          return vq;
        })()
      : Promise.resolve({ data: [] as Array<{ ref_code: string | null }>, error: null }),
    (async () => {
      let qq = admin
        .from("campaign_conversions")
        .select("campaign_id, order_amount_cents, commission_amount_cents, reversed_at")
        .in("campaign_id", campaignIds);
      if (sinceIso) qq = qq.gte("converted_at", sinceIso);
      return qq;
    })(),
  ]);

  if ("error" in clicksRes && clicksRes.error) throw clicksRes.error;
  if ("error" in viewsRes && viewsRes.error) throw viewsRes.error;
  if ("error" in conversionsRes && conversionsRes.error) throw conversionsRes.error;

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

  const viewsByCode = new Map<string, number>();
  for (const v of (viewsRes.data ?? []) as Array<{ ref_code: string | null }>) {
    if (!v.ref_code) continue;
    viewsByCode.set(v.ref_code, (viewsByCode.get(v.ref_code) ?? 0) + 1);
  }

  const convByCampaign = new Map<
    string,
    { conversions: number; revenue: number; commission: number }
  >();
  for (const c of (conversionsRes.data ?? []) as Array<{
    campaign_id: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
  }>) {
    if (c.reversed_at) continue;
    const entry =
      convByCampaign.get(c.campaign_id) ?? { conversions: 0, revenue: 0, commission: 0 };
    entry.conversions++;
    entry.revenue += Number(c.order_amount_cents ?? 0);
    entry.commission += Number(c.commission_amount_cents ?? 0);
    convByCampaign.set(c.campaign_id, entry);
  }

  // ── 3. Resolve diviner usernames + affiliate owner usernames + service
  //      template names for display. One lookup per entity type.
  const divinerIds = Array.from(
    new Set(campaigns.map((c) => c.diviner_id).filter(Boolean) as string[]),
  );
  const templateIds = Array.from(
    new Set(
      campaigns
        .map((c) => c.destination_service_template_id)
        .filter(Boolean) as string[],
    ),
  );
  const advocateIds = Array.from(
    new Set(
      campaigns
        .filter((c) => c.owner_affiliate_type === "social_advocate" && c.owner_affiliate_id)
        .map((c) => c.owner_affiliate_id!) as string[],
    ),
  );
  const divAffIds = Array.from(
    new Set(
      campaigns
        .filter((c) => c.owner_affiliate_type === "diviner_affiliate" && c.owner_affiliate_id)
        .map((c) => c.owner_affiliate_id!) as string[],
    ),
  );

  const [divinersRes, templatesRes, advocatesRes, divAffRes] = await Promise.all([
    divinerIds.length > 0
      ? admin.from("diviners").select("id, username, display_name").in("id", divinerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; username: string | null; display_name: string | null }>, error: null }),
    templateIds.length > 0
      ? admin.from("service_templates").select("id, name").in("id", templateIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
    advocateIds.length > 0
      ? admin.from("social_advocates").select("id, name, email").in("id", advocateIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; email: string | null }>, error: null }),
    divAffIds.length > 0
      ? admin.from("diviner_affiliates").select("id, name, email").in("id", divAffIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; email: string | null }>, error: null }),
  ]);

  const divinerLookup = new Map<string, { username: string | null; name: string | null }>();
  for (const d of (divinersRes.data ?? []) as Array<{ id: string; username: string | null; display_name: string | null }>) {
    divinerLookup.set(d.id, { username: d.username, name: d.display_name });
  }
  const templateLookup = new Map<string, string>();
  for (const t of (templatesRes.data ?? []) as Array<{ id: string; name: string }>) {
    templateLookup.set(t.id, t.name);
  }
  const affiliateLookup = new Map<string, { label: string }>();
  for (const a of (advocatesRes.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    affiliateLookup.set(`social_advocate:${a.id}`, { label: a.name ?? a.email ?? a.id });
  }
  for (const a of (divAffRes.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    affiliateLookup.set(`diviner_affiliate:${a.id}`, { label: a.name ?? a.email ?? a.id });
  }

  // ── 4. Shape rows.
  const rows: LeaderboardRow[] = campaigns.map((c) => {
    const clickStats = clicksByCampaign.get(c.id) ?? { clicks: 0, unique: 0 };
    const views = c.campaign_code ? viewsByCode.get(c.campaign_code) ?? 0 : 0;
    const convStats = convByCampaign.get(c.id) ?? {
      conversions: 0,
      revenue: 0,
      commission: 0,
    };
    const ctr = views > 0 ? clickStats.clicks / views : 0;
    const cvr = clickStats.clicks > 0 ? convStats.conversions / clickStats.clicks : 0;

    const divinerEntry = c.diviner_id ? divinerLookup.get(c.diviner_id) ?? null : null;
    const ownerAffEntry =
      c.owner_affiliate_id && c.owner_affiliate_type
        ? affiliateLookup.get(`${c.owner_affiliate_type}:${c.owner_affiliate_id}`) ?? null
        : null;
    const destinationLabel =
      c.destination_type === "SERVICE" && c.destination_service_template_id
        ? templateLookup.get(c.destination_service_template_id) ?? "Service"
        : c.destination_type === "PROFILE"
          ? "Profile"
          : "—";

    return {
      campaign_id: c.id,
      campaign_name: c.name ?? "(untitled)",
      campaign_code: c.campaign_code ?? "",
      owner_type: c.owner_type,
      diviner_id: c.diviner_id,
      diviner_username: divinerEntry?.username ?? null,
      owner_affiliate_id: c.owner_affiliate_id,
      owner_affiliate_type: c.owner_affiliate_type,
      owner_affiliate_username: ownerAffEntry?.label ?? null,
      destination_type: c.destination_type,
      destination_label: destinationLabel,
      status: c.status,
      clicks: clickStats.clicks,
      unique_clicks: clickStats.unique,
      views,
      conversions: convStats.conversions,
      ctr,
      cvr,
      order_revenue_cents: convStats.revenue,
      commission_cents: convStats.commission,
      created_at: c.created_at,
    };
  });

  // ── 5. Deterministic sort (tie-breaker on id — Hard Law #16).
  const sorted = rows.sort((a, b) => {
    const cmp = compareBySort(a, b, filters.sort);
    const base = filters.order === "asc" ? cmp : -cmp;
    if (base !== 0) return base;
    return a.campaign_id.localeCompare(b.campaign_id);
  });

  const total = sorted.length;
  const paged = sorted.slice(filters.offset, filters.offset + filters.limit);
  return { rows: paged, total };
}

function compareBySort(a: LeaderboardRow, b: LeaderboardRow, sort: SortKey): number {
  switch (sort) {
    case "clicks":
      return a.clicks - b.clicks;
    case "conversions":
      return a.conversions - b.conversions;
    case "commission":
      return a.commission_cents - b.commission_cents;
    case "revenue":
      return a.order_revenue_cents - b.order_revenue_cents;
    case "ctr":
      return a.ctr - b.ctr;
    case "cvr":
      return a.cvr - b.cvr;
    case "views":
      return a.views - b.views;
    default:
      return 0;
  }
}
