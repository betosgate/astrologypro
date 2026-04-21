/**
 * Shared helper for generating unique affiliate_campaigns.campaign_code values.
 * Used by both the diviner campaign create route and the affiliate
 * create-campaign route (Task 05 of the 2026-04-21 affiliate sprint).
 *
 * Format: `cmp_` + 8 chars from an unambiguous alphabet (no 0/O/1/l/I).
 * Collision strategy: retry up to maxRetries times; throw on persistent
 * collision (caller handles).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const UNAMBIGUOUS_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export async function generateCampaignCode(
  admin: SupabaseClient,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = "cmp_";
    for (let i = 0; i < 8; i++) {
      code += UNAMBIGUOUS_CHARS[Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)];
    }
    const { data } = await admin
      .from("affiliate_campaigns")
      .select("id")
      .eq("campaign_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique campaign code after retries");
}
