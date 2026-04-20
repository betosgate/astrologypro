/**
 * Resolve campaign destination to a URL at runtime using entity IDs.
 * Never trusts stored URLs — always resolves from current entity state.
 * Invalid destinations fall back to diviner profile or homepage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DestinationResolution {
  url: string;
  valid: boolean;
  reason?: string;
}

interface CampaignDestinationInput {
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_profile_id: string | null;
  destination_service_template_id: string | null;
  diviner_id: string;
}

/**
 * Resolve campaign destination to a redirect URL.
 * Validates entity state at runtime — survives username/slug changes.
 */
export async function resolveCampaignDestination(
  supabase: SupabaseClient,
  campaign: CampaignDestinationInput
): Promise<DestinationResolution> {
  // No destination set — fall back to diviner profile
  if (!campaign.destination_type) {
    const diviner = await getDiviner(supabase, campaign.diviner_id);
    return {
      url: diviner ? `/${diviner.username}` : "/",
      valid: false,
      reason: "No destination configured",
    };
  }

  // PROFILE destination
  if (campaign.destination_type === "PROFILE") {
    const profileId = campaign.destination_profile_id ?? campaign.diviner_id;
    const diviner = await getDiviner(supabase, profileId);
    if (!diviner || !diviner.is_active) {
      return { url: "/", valid: false, reason: "Diviner profile not found or inactive" };
    }
    return { url: `/${diviner.username}`, valid: true };
  }

  // SERVICE destination
  if (campaign.destination_type === "SERVICE") {
    // Get diviner username first (for fallback)
    const diviner = await getDiviner(supabase, campaign.diviner_id);
    const fallbackUrl = diviner ? `/${diviner.username}` : "/";

    if (!diviner || !diviner.is_active) {
      return { url: "/", valid: false, reason: "Diviner not found or inactive" };
    }

    if (!campaign.destination_service_template_id) {
      return {
        url: fallbackUrl,
        valid: false,
        reason: "No service template configured",
      };
    }

    // Get service template
    const { data: template } = await supabase
      .from("service_templates")
      .select("slug, is_active")
      .eq("id", campaign.destination_service_template_id)
      .maybeSingle();

    if (!template) {
      return { url: fallbackUrl, valid: false, reason: "Service template not found" };
    }
    if (!template.is_active) {
      return { url: fallbackUrl, valid: false, reason: "Service template inactive" };
    }

    // Check diviner still has this service enabled
    const { data: ds } = await supabase
      .from("diviner_services")
      .select("is_enabled, is_published")
      .eq("diviner_id", campaign.diviner_id)
      .eq("template_id", campaign.destination_service_template_id)
      .maybeSingle();

    if (!ds || !ds.is_enabled) {
      return {
        url: fallbackUrl,
        valid: false,
        reason: "Service not enabled for this diviner",
      };
    }

    // Note: we allow redirect even if not published — the service page may still render
    // (diviner controls publish state, campaign can still drive traffic)
    return {
      url: `/${diviner.username}/services/${template.slug}`,
      valid: true,
    };
  }

  return { url: "/", valid: false, reason: "Unknown destination type" };
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function getDiviner(supabase: SupabaseClient, divinerId: string) {
  const { data } = await supabase
    .from("diviners")
    .select("username, is_active")
    .eq("id", divinerId)
    .maybeSingle();
  return data;
}
