import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  PLANETS,
  hasIngressed,
  stationsRetrograde,
  stationsDirect,
  findExactAspects,
} from "@/lib/ephemeris";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/generate-astro-events
 *
 * Runs daily at 2am. Generates mundane astro events for the next 30 days
 * if not already present. Inserts into mundane_astro_events with ON CONFLICT
 * DO NOTHING semantics (idempotent).
 *
 * Logs run to cron_run_log.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const jobName = "generate-astro-events";
  const startedAt = new Date().toISOString();

  // Insert run log entry
  const { data: runLog } = await admin
    .from("cron_run_log")
    .insert({ job_name: jobName, started_at: startedAt, status: "running" })
    .select("id")
    .single();
  const runLogId = runLog?.id ?? null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today.getTime() + 30 * 86_400_000);

    const from = today.toISOString().slice(0, 10);
    const to = windowEnd.toISOString().slice(0, 10);

    const eventsToInsert: {
      title: string;
      event_type: string;
      planet_primary: string | null;
      planet_secondary: string | null;
      sign: string | null;
      event_datetime_utc: string;
      notes: string | null;
      is_verified: boolean;
    }[] = [];

    // Walk day by day for the 30-day window
    for (let d = 0; d < 30; d++) {
      const date = new Date(today.getTime() + d * 86_400_000);
      const dateISO = date.toISOString();

      // --- Sign ingresses ---
      for (const planet of PLANETS) {
        const ingressSign = hasIngressed(planet, date);
        if (ingressSign) {
          eventsToInsert.push({
            title: `${capitalize(planet)} enters ${capitalize(ingressSign)}`,
            event_type: "ingress",
            planet_primary: capitalize(planet),
            planet_secondary: null,
            sign: capitalize(ingressSign),
            event_datetime_utc: dateISO,
            notes: null,
            is_verified: true,
          });
        }
      }

      // --- Retrograde stations ---
      for (const planet of PLANETS) {
        if (stationsRetrograde(planet, date)) {
          eventsToInsert.push({
            title: `${capitalize(planet)} stations retrograde`,
            event_type: "retrograde",
            planet_primary: capitalize(planet),
            planet_secondary: null,
            sign: null,
            event_datetime_utc: dateISO,
            notes: null,
            is_verified: true,
          });
        }
      }

      // --- Direct stations ---
      for (const planet of PLANETS) {
        if (stationsDirect(planet, date)) {
          eventsToInsert.push({
            title: `${capitalize(planet)} stations direct`,
            event_type: "direct",
            planet_primary: capitalize(planet),
            planet_secondary: null,
            sign: null,
            event_datetime_utc: dateISO,
            notes: null,
            is_verified: true,
          });
        }
      }

      // --- Exact aspects ---
      const aspects = findExactAspects(date);
      for (const aspect of aspects) {
        const p1 = capitalize(aspect.planet1);
        const p2 = capitalize(aspect.planet2);
        const aspName = capitalize(aspect.aspect);
        eventsToInsert.push({
          title: `${p1} ${aspName} ${p2}`,
          event_type: aspect.aspect === "conjunction" ? "conjunction" : aspect.aspect === "opposition" ? "opposition" : "custom",
          planet_primary: p1,
          planet_secondary: p2,
          sign: null,
          event_datetime_utc: dateISO,
          notes: `Orb: ${aspect.orb.toFixed(2)}°`,
          is_verified: true,
        });
      }
    }

    let generated = 0;
    let skipped = 0;

    // Batch insert in chunks of 50 to avoid payload limits
    const CHUNK = 50;
    for (let i = 0; i < eventsToInsert.length; i += CHUNK) {
      const chunk = eventsToInsert.slice(i, i + CHUNK);
      const { data, error } = await admin
        .from("mundane_astro_events")
        .upsert(chunk, {
          onConflict: "title,event_datetime_utc",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        console.error("[generate-astro-events] upsert error:", error);
        // Continue — partial success is acceptable
      }

      generated += data?.length ?? 0;
      skipped += chunk.length - (data?.length ?? 0);
    }

    console.log(
      `[generate-astro-events] window=${from}/${to} generated=${generated} skipped=${skipped}`
    );

    const result = { generated, skipped, window: { from, to } };

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({ finished_at: new Date().toISOString(), status: "success", result })
        .eq("id", runLogId);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-astro-events] fatal:", message);

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
