import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/cron/alert-check
 *
 * Runs every 30 minutes. Checks all active mundane alert rules and creates
 * in-app notifications when trigger conditions are met, suppressing
 * duplicate notifications within a 24-hour window per rule/user.
 *
 * Logs run to cron_run_log.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const jobName = "alert-check";
  const startedAt = new Date().toISOString();

  const { data: runLog } = await admin
    .from("cron_run_log")
    .insert({ job_name: jobName, started_at: startedAt, status: "running" })
    .select("id")
    .single();
  const runLogId = runLog?.id ?? null;

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3_600_000).toISOString();

    // Fetch all active, non-muted alert rules
    const { data: rules, error: rulesErr } = await admin
      .from("mundane_alert_rules")
      .select("id, user_id, name, rule_type, conditions, priority")
      .eq("is_active", true)
      .or(`muted_until.is.null,muted_until.lt.${now.toISOString()}`);

    if (rulesErr) throw new Error(`alert rules query failed: ${rulesErr.message}`);

    const activeRules = rules ?? [];
    if (activeRules.length === 0) {
      const result = { checked: 0, triggered: 0 };
      if (runLogId) {
        await admin
          .from("cron_run_log")
          .update({ finished_at: new Date().toISOString(), status: "success", result })
          .eq("id", runLogId);
      }
      return NextResponse.json(result);
    }

    // Fetch recent astro events (last 24h) once for reuse across rules
    const { data: recentEvents, error: eventsErr } = await admin
      .from("mundane_astro_events")
      .select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc")
      .gte("event_datetime_utc", twentyFourHoursAgo)
      .order("event_datetime_utc", { ascending: false })
      .limit(200);

    if (eventsErr) throw new Error(`events query failed: ${eventsErr.message}`);

    const events = recentEvents ?? [];

    let triggered = 0;

    for (const rule of activeRules) {
      // Check if a notification already exists for this rule/user in last 24h
      const { count: recentCount, error: recentErr } = await admin
        .from("mundane_alert_notifications")
        .select("id", { count: "exact", head: true })
        .eq("alert_rule_id", rule.id)
        .eq("user_id", rule.user_id)
        .gte("triggered_at", twentyFourHoursAgo);

      if (recentErr) {
        console.error(`[alert-check] recent check failed for rule ${rule.id}:`, recentErr.message);
        continue;
      }

      if ((recentCount ?? 0) > 0) {
        // Already notified within the last 24h — skip
        continue;
      }

      // Evaluate whether this rule's conditions are met by recent events
      const matched = evaluateRule(rule.rule_type, rule.conditions, events);
      if (!matched) continue;

      // Insert notification
      const { error: insertErr } = await admin
        .from("mundane_alert_notifications")
        .insert({
          user_id: rule.user_id,
          alert_rule_id: rule.id,
          title: `Alert: ${rule.name}`,
          message: matched.message,
          entity_id: matched.entity_id ?? null,
          priority: rule.priority,
          is_read: false,
          triggered_at: now.toISOString(),
        });

      if (insertErr) {
        console.error(`[alert-check] notification insert failed for rule ${rule.id}:`, insertErr.message);
        continue;
      }

      triggered++;
    }

    console.log(
      `[alert-check] checked=${activeRules.length} triggered=${triggered}`
    );

    const result = { checked: activeRules.length, triggered };

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({ finished_at: new Date().toISOString(), status: "success", result })
        .eq("id", runLogId);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[alert-check] fatal:", message);

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

// ---------------------------------------------------------------------------
// Rule evaluation helpers
// ---------------------------------------------------------------------------

interface AstroEvent {
  id: string;
  title: string;
  event_type: string;
  planet_primary: string | null;
  planet_secondary: string | null;
  sign: string | null;
  event_datetime_utc: string;
}

interface MatchResult {
  message: string;
  entity_id?: string;
}

function evaluateRule(
  ruleType: string,
  conditions: Record<string, unknown>,
  events: AstroEvent[]
): MatchResult | null {
  if (events.length === 0) return null;

  switch (ruleType) {
    case "eclipse_on_entity": {
      const eclipses = events.filter(
        (e) => e.event_type === "eclipse" || e.title.toLowerCase().includes("eclipse")
      );
      if (eclipses.length === 0) return null;
      const entity_id = conditions.entity_id as string | undefined;
      return {
        message: `Eclipse detected: ${eclipses[0].title}. Check entity positions.`,
        entity_id,
      };
    }

    case "ingress_angular": {
      const planet = (conditions.planet as string | undefined)?.toLowerCase();
      const ingresses = events.filter(
        (e) =>
          e.event_type === "ingress" &&
          (!planet || e.planet_primary?.toLowerCase() === planet)
      );
      if (ingresses.length === 0) return null;
      return {
        message: `Ingress detected: ${ingresses[0].title}`,
      };
    }

    case "leader_chart_hit": {
      // Trigger if there are any conjunction events
      const conjunctions = events.filter((e) => e.event_type === "conjunction");
      if (conjunctions.length === 0) return null;
      return {
        message: `Transit conjunction: ${conjunctions[0].title}. Review leader chart impacts.`,
      };
    }

    case "event_cluster": {
      // Trigger if there are 3+ events in the window
      const threshold = (conditions.threshold as number | undefined) ?? 3;
      if (events.length < threshold) return null;
      return {
        message: `Event cluster detected: ${events.length} events in the past 24 hours.`,
      };
    }

    case "forecast_window_open": {
      // This rule type is driven externally — no automatic trigger from events
      return null;
    }

    case "custom":
    default: {
      // Custom rules: trigger if there are any recent events
      if (events.length === 0) return null;
      return {
        message: `Alert condition met: ${events.length} astro event(s) detected in the last 24 hours.`,
      };
    }
  }
}
