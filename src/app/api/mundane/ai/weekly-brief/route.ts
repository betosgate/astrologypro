import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/503", title: "AI service not configured", status: 503 },
      { status: 503 }
    );
  }

  const admin = createAdminClient();

  // Get user's watchlist
  const { data: watchlist } = await admin
    .from("mundane_watchlists")
    .select("entity_ids, leader_ids")
    .eq("user_id", user.id)
    .maybeSingle();

  const entityIds: string[] = watchlist?.entity_ids ?? [];
  const leaderIds: string[] = watchlist?.leader_ids ?? [];

  // Fetch watched entities
  let entities: Array<{ id: string; name: string; entity_type: string; region: string | null }> = [];
  if (entityIds.length > 0) {
    const { data } = await admin
      .from("mundane_entities")
      .select("id, name, entity_type, region")
      .in("id", entityIds);
    entities = data ?? [];
  }

  // Fetch watched leaders
  let leaders: Array<{ id: string; full_name: string; office_title: string | null }> = [];
  if (leaderIds.length > 0) {
    const { data } = await admin
      .from("mundane_leaders")
      .select("id, full_name, office_title")
      .in("id", leaderIds);
    leaders = data ?? [];
  }

  // Fetch upcoming astro events (next 7 days)
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  const { data: astroEvents } = await admin
    .from("mundane_astro_events")
    .select("id, title, event_type, event_datetime_utc, planet_primary, planet_secondary, sign")
    .gte("event_datetime_utc", now.toISOString())
    .lte("event_datetime_utc", weekLater.toISOString())
    .order("event_datetime_utc", { ascending: true })
    .limit(20);

  // Fetch open forecasts (up to 10)
  const { data: forecasts } = await admin
    .from("mundane_forecasts")
    .select("id, title, outcome_status, confidence_level, forecast_period_start, forecast_period_end")
    .eq("outcome_status", "open")
    .order("forecast_period_start", { ascending: false })
    .limit(10);

  // Build context string for Claude
  const entityList =
    entities.length > 0
      ? entities.map((e) => `- ${e.name} (${e.entity_type}${e.region ? ", " + e.region : ""})`).join("\n")
      : "No watched entities.";

  const leaderList =
    leaders.length > 0
      ? leaders.map((l) => `- ${l.full_name}${l.office_title ? " (" + l.office_title + ")" : ""}`).join("\n")
      : "No watched leaders.";

  const eventList =
    astroEvents && astroEvents.length > 0
      ? astroEvents
          .map((ev: { title: string; event_type: string; event_datetime_utc: string; planet_primary?: string | null; planet_secondary?: string | null; sign?: string | null }) => {
            const dateStr = new Date(ev.event_datetime_utc).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const planets = [ev.planet_primary, ev.planet_secondary].filter(Boolean).join("/");
            return `- ${dateStr}: ${ev.title}${planets ? " [" + planets + (ev.sign ? " in " + ev.sign : "") + "]" : ""}`;
          })
          .join("\n")
      : "No upcoming astro events in the next 7 days.";

  const forecastList =
    forecasts && forecasts.length > 0
      ? forecasts
          .map(
            (f: { title: string; confidence_level: string | null; forecast_period_start: string }) =>
              `- ${f.title} (confidence: ${f.confidence_level ?? "unknown"}, from ${f.forecast_period_start})`
          )
          .join("\n")
      : "No open forecasts.";

  const prompt = `Generate a weekly mundane astrology brief for the astrologer. Today is ${now.toDateString()}.

Watched Entities:
${entityList}

Watched Leaders:
${leaderList}

Upcoming Astrological Events (next 7 days):
${eventList}

Open Forecasts to monitor:
${forecastList}

Format your response as:
1) Key themes this week
2) Entity-specific watches
3) Forecast check-ins

Be concise, specific, and professionally astrological in tone.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const brief =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    const entitiesCovered = entities.map((e) => e.name);

    return NextResponse.json({
      brief,
      generated_at: new Date().toISOString(),
      entities_covered: entitiesCovered,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json(
      { type: "https://httpstatuses.com/502", title: "AI Service Error", status: 502, detail: message },
      { status: 502 }
    );
  }
}
