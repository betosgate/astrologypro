import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Default scoring model ID seeded in 20260414000012_mundane_scoring.sql
const DEFAULT_SCORING_MODEL_ID = "sm100000-0000-0000-0000-000000000001";

// Weight per event hit within the 7-day window
const EVENT_WEIGHT = 0.5;

/**
 * GET /api/cron/scoring-digest
 *
 * Runs weekly on Mondays at 3am. Computes entity stress scores for all
 * watched entities based on mundane astro events in the past 7 days.
 *
 * Score = min(10, event_count * EVENT_WEIGHT), rounded to 2 decimal places.
 * Upserts into entity_stress_scores for today's date.
 * Logs run to cron_run_log.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const jobName = "scoring-digest";
  const startedAt = new Date().toISOString();

  const { data: runLog } = await admin
    .from("cron_run_log")
    .insert({ job_name: jobName, started_at: startedAt, status: "running" })
    .select("id")
    .single();
  const runLogId = runLog?.id ?? null;

  try {
    const today = new Date();
    const scoreDate = today.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000).toISOString();

    // Fetch all watchlists to collect unique entity_ids
    const { data: watchlists, error: wlErr } = await admin
      .from("mundane_watchlists")
      .select("entity_ids");

    if (wlErr) throw new Error(`watchlists query failed: ${wlErr.message}`);

    // Flatten and deduplicate entity_ids from all watchlists
    const entityIdSet = new Set<string>();
    for (const wl of watchlists ?? []) {
      const ids = (wl.entity_ids as string[] | null) ?? [];
      for (const id of ids) {
        if (id) entityIdSet.add(id);
      }
    }

    const entityIds = Array.from(entityIdSet);

    if (entityIds.length === 0) {
      const result = { entities_scored: 0, score_date: scoreDate };
      if (runLogId) {
        await admin
          .from("cron_run_log")
          .update({ finished_at: new Date().toISOString(), status: "success", result })
          .eq("id", runLogId);
      }
      return NextResponse.json(result);
    }

    // Count recent mundane events (last 7 days)
    const { count: recentEventCount, error: evtErr } = await admin
      .from("mundane_astro_events")
      .select("id", { count: "exact", head: true })
      .gte("event_datetime_utc", sevenDaysAgo);

    if (evtErr) throw new Error(`events query failed: ${evtErr.message}`);

    const eventCount = recentEventCount ?? 0;

    // Compute a single global score for this window and upsert for each entity.
    // Per the spec: score = min(10, event_count * weight).
    const rawScore = Math.min(10, eventCount * EVENT_WEIGHT);
    const score = Math.round(rawScore * 100) / 100;

    const contributing_factors = [
      {
        factor: "mundane_event_count_7d",
        value: eventCount,
        weight: EVENT_WEIGHT,
        contribution: rawScore,
      },
    ];

    let entitiesScored = 0;

    // Upsert in chunks to avoid payload limits
    const CHUNK = 50;
    for (let i = 0; i < entityIds.length; i += CHUNK) {
      const chunk = entityIds.slice(i, i + CHUNK);
      const rows = chunk.map((entity_id) => ({
        entity_id,
        scoring_model_id: DEFAULT_SCORING_MODEL_ID,
        score_date: scoreDate,
        stress_score: score,
        contributing_factors,
      }));

      const { error: upsertErr } = await admin
        .from("entity_stress_scores")
        .upsert(rows, {
          onConflict: "entity_id,scoring_model_id,score_date",
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        console.error("[scoring-digest] upsert error:", upsertErr.message);
        // Continue — partial success is acceptable
      } else {
        entitiesScored += chunk.length;
      }
    }

    console.log(
      `[scoring-digest] score_date=${scoreDate} event_count=${eventCount} score=${score} entities_scored=${entitiesScored}`
    );

    const result = { entities_scored: entitiesScored, score_date: scoreDate, score };

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({ finished_at: new Date().toISOString(), status: "success", result })
        .eq("id", runLogId);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[scoring-digest] fatal:", message);

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error_message: message,
        })
        .eq("id", runLogId);
    }

    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: message,
      },
      { status: 500 }
    );
  }
}
