#!/usr/bin/env node
/**
 * Migrate legacy campaign_affiliates rows into the new
 * diviner_service_affiliates + owner_type='affiliate' campaigns model.
 *
 * Part of Task 06 of the 2026-04-21 affiliate-service-assignment sprint.
 *
 * Usage:
 *   node scripts/migrate-campaign-affiliates.mjs           # dry-run (default)
 *   node scripts/migrate-campaign-affiliates.mjs --commit  # apply changes
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Guarantees:
 *   - Idempotent: re-running with --commit produces zero new rows on
 *     a second pass.
 *   - Non-destructive: never deletes from campaign_affiliates.
 *   - Skips legacy campaigns with destination_type=NULL (older model)
 *     and logs them in the summary.
 */

import { createClient } from "@supabase/supabase-js";

const COMMIT = process.argv.includes("--commit");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const UNAMBIGUOUS_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

async function generateCampaignCode(maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    let code = "cmp_";
    for (let j = 0; j < 8; j++) {
      code += UNAMBIGUOUS_CHARS[Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)];
    }
    const { data } = await client
      .from("affiliate_campaigns")
      .select("id")
      .eq("campaign_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate unique campaign_code after retries");
}

const summary = {
  legacyEnrollments: 0,
  scopeService: 0,
  scopeProfile: 0,
  assignmentsToCreate: 0,
  assignmentsExisting: 0,
  campaignsToCreate: 0,
  campaignsExisting: 0,
  clicksToBackfill: 0,
  conversionsToFlag: 0,
  skipped: [],
};

async function main() {
  // 1. Load every campaign_affiliates row with its parent campaign
  const { data: enrollments, error: loadErr } = await client
    .from("campaign_affiliates")
    .select(
      `id, campaign_id, affiliate_id, affiliate_type, custom_commission_value, joined_at,
       affiliate_campaigns:campaign_id (
         id, diviner_id, name, description, status, start_date, end_date,
         commission_type, commission_value, channel, destination_type,
         destination_service_template_id, destination_profile_id, owner_type
       )`
    );
  if (loadErr) throw loadErr;

  summary.legacyEnrollments = (enrollments ?? []).length;

  for (const enrollment of enrollments ?? []) {
    const parent = Array.isArray(enrollment.affiliate_campaigns)
      ? enrollment.affiliate_campaigns[0]
      : enrollment.affiliate_campaigns;
    if (!parent) {
      summary.skipped.push({
        enrollment_id: enrollment.id,
        reason: "parent_campaign_missing",
      });
      continue;
    }
    if (!parent.destination_type) {
      summary.skipped.push({
        enrollment_id: enrollment.id,
        reason: "parent_campaign_has_no_destination",
      });
      continue;
    }
    if (parent.owner_type === "affiliate") {
      summary.skipped.push({
        enrollment_id: enrollment.id,
        reason: "already_affiliate_owned",
      });
      continue;
    }

    const scope = parent.destination_type; // 'SERVICE' | 'PROFILE'
    if (scope === "SERVICE") summary.scopeService++;
    else summary.scopeProfile++;

    const destinationId =
      scope === "SERVICE" ? parent.destination_service_template_id : null;

    // 2. Derive commission: enrollment.custom_commission_value wins
    const commissionValue =
      enrollment.custom_commission_value != null
        ? Number(enrollment.custom_commission_value)
        : Number(parent.commission_value);
    const commissionType = parent.commission_type ?? "percent";

    // 3. Upsert diviner_service_affiliates row
    let assignment;
    {
      // Build the existence query — PROFILE uses destination_id IS NULL
      let q = client
        .from("diviner_service_affiliates")
        .select("id")
        .eq("diviner_id", parent.diviner_id)
        .eq("destination_type", scope)
        .eq("affiliate_id", enrollment.affiliate_id)
        .eq("affiliate_type", enrollment.affiliate_type)
        .eq("is_active", true);
      if (destinationId) q = q.eq("destination_id", destinationId);
      else q = q.is("destination_id", null);
      const { data: existing } = await q.maybeSingle();

      if (existing) {
        summary.assignmentsExisting++;
        assignment = existing;
      } else {
        summary.assignmentsToCreate++;
        if (COMMIT) {
          const { data: ins, error: insErr } = await client
            .from("diviner_service_affiliates")
            .insert({
              diviner_id: parent.diviner_id,
              destination_type: scope,
              destination_id: destinationId,
              affiliate_id: enrollment.affiliate_id,
              affiliate_type: enrollment.affiliate_type,
              commission_type: commissionType,
              commission_value: commissionValue,
              is_active: true,
              notes: "migrated from campaign_affiliates (2026-04-21 sprint)",
            })
            .select("id")
            .single();
          if (insErr) throw insErr;
          assignment = ins;
        } else {
          assignment = { id: "[new-in-commit]" };
        }
      }
    }

    // 4. Clone the parent campaign as an owner_type='affiliate' campaign
    //    referencing this assignment. Use a deterministic lookup to keep
    //    this idempotent — source_assignment_id + name identifies the clone.
    const { data: existingClone } = await client
      .from("affiliate_campaigns")
      .select("id")
      .eq("source_assignment_id", assignment.id)
      .eq("name", `${parent.name} (migrated)`)
      .maybeSingle();

    if (existingClone) {
      summary.campaignsExisting++;
    } else {
      summary.campaignsToCreate++;
      if (COMMIT) {
        const code = await generateCampaignCode();
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          "https://astrologypro.com";
        const shareUrl = `${appUrl.replace(/\/$/, "")}/r/${code}`;

        const { data: newCamp, error: campErr } = await client
          .from("affiliate_campaigns")
          .insert({
            diviner_id: parent.diviner_id,
            name: `${parent.name} (migrated)`,
            description: parent.description,
            status: parent.status === "active" ? "active" : "paused",
            start_date: parent.start_date,
            end_date: parent.end_date,
            commission_type: commissionType,
            commission_value: commissionValue,
            channel: parent.channel ?? null,
            destination_type: scope,
            destination_service_template_id:
              scope === "SERVICE" ? destinationId : null,
            destination_profile_id:
              scope === "PROFILE" ? parent.destination_profile_id : null,
            owner_type: "affiliate",
            owner_affiliate_id: enrollment.affiliate_id,
            owner_affiliate_type: enrollment.affiliate_type,
            commission_value_snapshot: commissionValue,
            commission_type_snapshot: commissionType,
            source_assignment_id: assignment.id,
            campaign_code: code,
            share_url: shareUrl,
          })
          .select("id")
          .single();
        if (campErr) throw campErr;

        // tracking_links companion
        await client.from("tracking_links").insert({
          diviner_id: parent.diviner_id,
          code,
          destination_url: "/", // resolveCampaignDestination computes live
          campaign_id: newCamp.id,
          destination_type: scope,
          destination_entity_id:
            scope === "SERVICE" ? destinationId : parent.diviner_id,
          is_active: true,
        });
      }
    }
  }

  // 5. Backfill campaign_clicks.affiliate_id where the click is tied to a
  //    legacy enrolled affiliate. We infer from click.campaign_id + the
  //    legacy campaign_affiliates enrollment for that campaign (only one
  //    enrollment per campaign in the legacy model, so unambiguous).
  const { data: legacyClicks } = await client
    .from("campaign_clicks")
    .select("id, campaign_id")
    .is("affiliate_id", null)
    .in(
      "campaign_id",
      (enrollments ?? []).map((e) => e.campaign_id)
    );
  const enrollmentByCampaign = new Map();
  for (const e of enrollments ?? [])
    enrollmentByCampaign.set(e.campaign_id, e);

  for (const click of legacyClicks ?? []) {
    const e = enrollmentByCampaign.get(click.campaign_id);
    if (!e) continue;
    summary.clicksToBackfill++;
    if (COMMIT) {
      await client
        .from("campaign_clicks")
        .update({
          affiliate_id: e.affiliate_id,
          affiliate_type: e.affiliate_type,
          commission_value_snapshot: e.custom_commission_value,
          commission_type_snapshot: null, // unknown from legacy
        })
        .eq("id", click.id);
    }
  }

  // 6. Flag historical campaign_conversions
  const { data: legacyConvs } = await client
    .from("campaign_conversions")
    .select("id, campaign_id")
    .eq("commission_source", "campaign_assignment") // default from Task 01
    .in(
      "campaign_id",
      (enrollments ?? []).map((e) => e.campaign_id)
    );
  for (const c of legacyConvs ?? []) {
    // Only flag rows that are for the legacy campaigns we migrated
    const e = enrollmentByCampaign.get(c.campaign_id);
    if (!e) continue;
    summary.conversionsToFlag++;
    if (COMMIT) {
      await client
        .from("campaign_conversions")
        .update({ commission_source: "legacy_campaign_affiliates" })
        .eq("id", c.id);
    }
  }

  console.log(COMMIT ? "APPLIED" : "DRY-RUN — no changes written");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
