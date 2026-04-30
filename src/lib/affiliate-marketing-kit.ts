// src/lib/affiliate-marketing-kit.ts
//
// Server-side helpers for the affiliate Marketing Kit (Phase 1.5).
// Lists enabled general service_templates and lazily ensures the calling
// account has a `status='active'` general campaign for each one, so the
// Marketing Kit always has a real campaign code to embed in share URLs.
//
// Spec: docs/specs/affiliate-commission-system.md §10 Phase 1.5 + §6.3
// Task: docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/05-affiliate-ui.md

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCampaignCode } from "@/lib/campaign-code";

export type MarketingKitTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  commission_type: "percent" | "flat" | null;
  commission_value: number | null;
};

export type MarketingKitItem = {
  template: MarketingKitTemplate;
  campaignCode: string;
  /** Tracked URL — fires through /r/<code>. The link the affiliate shares. */
  shareUrl: string;
  /** Un-tracked URL for affiliate self-preview. Doesn't log a click. */
  previewUrl: string;
  /**
   * Display rate value. Equals `commission_value` when set, or 10 (the
   * platform default per spec §10 Phase 1.5 decision #3) when NULL.
   * Matches the value `resolveStampForBooking` would stamp.
   */
  effectiveRate: number;
  /**
   * Rate unit. Mirrors `service_templates.commission_type`; defaults to
   * 'percent' when NULL, matching Task 02's stamp resolver fallback.
   */
  effectiveRateType: "percent" | "flat";
  /**
   * True when the rate value AND/OR type came from defaults (admin enabled
   * the program but didn't set explicit values). Used by the UI to badge
   * the rate as "default".
   */
  isDefaultRate: boolean;
};

const APP_BASE_FALLBACK = "https://astrologypro.com";

function getAppBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    APP_BASE_FALLBACK
  ).replace(/\/$/, "");
}

/**
 * Resolve enabled general templates → Marketing Kit items keyed off real
 * campaign codes. Lazy-creates a general campaign per (account, template)
 * pair the first time it's accessed.
 *
 * Race acceptance per spec: two concurrent calls may produce two campaigns
 * for the same pair. The display de-dupes by template, and both codes
 * credit the same account, so this is functionally fine.
 */
export async function fetchMarketingKitItems(
  admin: SupabaseClient,
  accountId: string,
): Promise<MarketingKitItem[]> {
  const { data: templates } = await admin
    .from("service_templates")
    .select(
      "id, name, slug, description, category, image_url, commission_type, commission_value",
    )
    .eq("is_general", true)
    .eq("affiliate_program_enabled", true)
    .order("name");

  const tList = (templates ?? []) as unknown as MarketingKitTemplate[];
  if (tList.length === 0) return [];

  // Existing active general campaigns owned by this account.
  const { data: existing } = await admin
    .from("affiliate_campaigns")
    .select("id, campaign_code, destination_service_template_id")
    .eq("owner_affiliate_account_id", accountId)
    .eq("owner_affiliate_type", "general")
    .eq("status", "active");

  const campaignByTemplate = new Map<string, { campaign_code: string }>();
  for (const c of existing ?? []) {
    const tid = c.destination_service_template_id as string | null;
    const code = c.campaign_code as string | null;
    if (!tid || !code) continue;
    if (!campaignByTemplate.has(tid)) {
      campaignByTemplate.set(tid, { campaign_code: code });
    }
  }

  // Lazy-create for templates without an existing campaign.
  const missing = tList.filter((t) => !campaignByTemplate.has(t.id));
  for (const t of missing) {
    const created = await createGeneralCampaignForKit(admin, accountId, t);
    if (created) {
      campaignByTemplate.set(t.id, { campaign_code: created.campaign_code });
    }
  }

  const appBase = getAppBase();

  return tList
    .filter((t) => campaignByTemplate.has(t.id))
    .map<MarketingKitItem>((t) => {
      const code = campaignByTemplate.get(t.id)!.campaign_code;
      const valueSet = t.commission_value != null;
      const typeSet = t.commission_type != null;
      // Match Task 02's stamp resolver fallbacks exactly: type defaults to
      // 'percent', value defaults to 10. Display flags as "default" when
      // either side fell back.
      const effectiveRateType: "percent" | "flat" =
        (t.commission_type as "percent" | "flat" | null) ?? "percent";
      const effectiveRate = valueSet ? Number(t.commission_value) : 10;
      return {
        template: t,
        campaignCode: code,
        shareUrl: `${appBase}/r/${code}`,
        // Un-tracked preview goes to the public general-product page.
        // /services/<slug> is the live route for general templates;
        // /readings/<slug> is a separate marketing-landing tree that
        // doesn't carry the `general-` prefix.
        previewUrl: `${appBase}/services/${t.slug}`,
        effectiveRate,
        effectiveRateType,
        isDefaultRate: !valueSet || !typeSet,
      };
    });
}

/**
 * Insert a Marketing-Kit-spawned general campaign + matching tracking_link.
 * Mirrors the insert shape of POST /api/affiliate/general-campaigns but
 * with no rate-limiting (caller is server-side rendering, not a user
 * action) and a generated default name.
 *
 * Returns null on failure so the caller can skip the bad row rather than
 * 500-ing the whole Marketing Kit render.
 */
async function createGeneralCampaignForKit(
  admin: SupabaseClient,
  accountId: string,
  template: MarketingKitTemplate,
): Promise<{ id: string; campaign_code: string } | null> {
  let campaignCode: string;
  try {
    campaignCode = await generateCampaignCode(admin);
  } catch (err) {
    console.error("[marketing-kit] generateCampaignCode failed", err);
    return null;
  }

  const appBase = getAppBase();
  const shareUrl = `${appBase}/r/${campaignCode}`;
  const now = new Date().toISOString();
  const defaultName = `${template.name} — Marketing Kit`.slice(0, 120);

  const { data: inserted, error: insertErr } = await admin
    .from("affiliate_campaigns")
    .insert({
      diviner_id: null,
      name: defaultName,
      description: null,
      status: "active",
      commission_type: "percentage",
      commission_value: 0,
      owner_type: "affiliate",
      owner_affiliate_id: null,
      owner_affiliate_type: "general",
      owner_affiliate_account_id: accountId,
      source_assignment_id: null,
      destination_type: "SERVICE",
      destination_profile_id: null,
      destination_service_template_id: template.id,
      campaign_code: campaignCode,
      share_url: shareUrl,
      channel: "marketing_kit",
      start_date: now,
      end_date: null,
    })
    .select("id, campaign_code")
    .single();

  if (insertErr || !inserted) {
    console.error("[marketing-kit] campaign insert failed", {
      template_id: template.id,
      account_id: accountId,
      error: insertErr?.message,
    });
    return null;
  }

  const { error: linkErr } = await admin.from("tracking_links").insert({
    diviner_id: null,
    code: campaignCode,
    destination_url: `${appBase}/`,
    campaign_id: inserted.id,
    destination_type: "SERVICE",
    destination_entity_id: template.id,
    is_active: true,
  });
  if (linkErr) {
    console.error("[marketing-kit] tracking_link insert failed", {
      campaign_id: inserted.id,
      error: linkErr.message,
    });
    // Non-fatal — campaign exists and /r/[code] resolves via campaign lookup.
  }

  return {
    id: inserted.id as string,
    campaign_code: inserted.campaign_code as string,
  };
}
