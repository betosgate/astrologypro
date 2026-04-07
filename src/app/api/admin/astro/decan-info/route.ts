import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callAstroAiApi } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// GET  /api/admin/astro/decan-info
// Returns distinct planet+sign_name pairs that have decan data.
// Used by the frontend to decide which planets show the decan icon.
// ---------------------------------------------------------------------------

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_decan_info")
    .select("planet, sign_name")
    .eq("is_active", true)
    .order("sign_name")
    .order("planet");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate to unique planet+sign pairs
  const seen = new Set<string>();
  const pairs: { planet: string; sign_name: string }[] = [];
  for (const row of data ?? []) {
    const key = `${row.planet}|${row.sign_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ planet: row.planet, sign_name: row.sign_name });
    }
  }

  return NextResponse.json({ results: pairs });
}

// ---------------------------------------------------------------------------
// POST /api/admin/astro/decan-info
// Fetch decan details for a planet+sign. If AI descriptions are missing,
// generate them via the AI API and persist back to the database.
// ---------------------------------------------------------------------------

interface DecanRow {
  id: string;
  sign_id: string | null;
  sign_name: string;
  planet: string;
  tarot_name: string | null;
  greek_daemon: string | null;
  decan: number;
  description: string | null;
  decan_img: string | null;
  is_active: boolean;
  planet_sign_short_desc: string | null;
  planet_sign_long_desc: string | null;
  daemon_short_desc: string | null;
  daemon_long_desc: string | null;
  tarot_short_desc: string | null;
  tarot_long_desc: string | null;
}

function ordinalDecan(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : "3rd";
}

/**
 * Call the AI Lambda, parse the JSON response with short_format / long_format.
 * Returns null on failure (non-fatal).
 */
async function generateAiContent(
  systemContent: string,
  userContent: string
): Promise<{ short_format: string; long_format: string } | null> {
  try {
    const result = await callAstroAiApi({
      condition: {
        system_content: systemContent,
        user_content: userContent,
      },
      toolname: "other",
      json: [],
    });

    const raw = result?.ai_response;
    let parsed: Record<string, unknown> | null = null;
    if (typeof raw === "string") {
      try { parsed = JSON.parse(raw); } catch { /* not valid JSON */ }
    } else if (typeof raw === "object" && raw !== null) {
      parsed = raw as Record<string, unknown>;
    }
    if (parsed) {
      return {
        short_format: (parsed.short_format as string) ?? "",
        long_format: (parsed.long_format as string) ?? "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { signs, planet } = body as { signs: string; planet: string };

  if (!signs || !planet) {
    return NextResponse.json({ error: "signs and planet are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch all decan rows for this planet+sign
  const { data: rows, error } = await admin
    .from("astro_decan_info")
    .select("*")
    .ilike("sign_name", signs)
    .ilike("planet", planet)
    .order("decan");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const typedRows = rows as unknown as DecanRow[];
  const systemContent = "give response only in json format as a whole , nothing else answer as astrologer not AI BOT";

  // For each decan row, check if descriptions are missing and generate if needed
  const enrichedRows = await Promise.all(
    typedRows.map(async (row) => {
      const decanLabel = ordinalDecan(row.decan);
      const needsPlanet = !row.planet_sign_short_desc || !row.planet_sign_long_desc;
      const needsDaemon = (!row.daemon_short_desc || !row.daemon_long_desc) && row.greek_daemon;
      const needsTarot = (!row.tarot_short_desc || !row.tarot_long_desc) && row.tarot_name;

      // If everything is already cached, return as-is
      if (!needsPlanet && !needsDaemon && !needsTarot) {
        return row;
      }

      // Fire AI calls in parallel for missing content
      const [planetAi, daemonAi, tarotAi] = await Promise.all([
        needsPlanet
          ? generateAiContent(
              systemContent,
              `What does it mean when you have ${planet} in the ${decanLabel} decan of ${signs} in astrology , give me response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`
            )
          : null,
        needsDaemon
          ? generateAiContent(
              systemContent,
              `Explain the Greek daemon ${row.greek_daemon} as the spirit of the decan in relation to the ${decanLabel} decan of ${signs} in astrology. Give response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`
            )
          : null,
        needsTarot
          ? generateAiContent(
              systemContent,
              `Using the Crowley's thoth decks attributions, without referencing his deck directly, explain the ${row.tarot_name} as it would relate to the ${decanLabel} decan of ${signs} in astrology. Give response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`
            )
          : null,
      ]);

      // Build the update payload with only newly generated fields
      const updates: Record<string, string> = {};
      if (planetAi) {
        updates.planet_sign_short_desc = planetAi.short_format;
        updates.planet_sign_long_desc = planetAi.long_format;
      }
      if (daemonAi) {
        updates.daemon_short_desc = daemonAi.short_format;
        updates.daemon_long_desc = daemonAi.long_format;
      }
      if (tarotAi) {
        updates.tarot_short_desc = tarotAi.short_format;
        updates.tarot_long_desc = tarotAi.long_format;
      }

      // Persist to DB if we have any updates
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await admin
          .from("astro_decan_info")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", row.id);

        if (updateErr) {
          console.error(`Failed to persist decan AI content for ${row.id}:`, updateErr.message);
        }
      }

      // Return the enriched row (merge cached + new)
      return {
        ...row,
        ...(planetAi
          ? { planet_sign_short_desc: planetAi.short_format, planet_sign_long_desc: planetAi.long_format }
          : {}),
        ...(daemonAi
          ? { daemon_short_desc: daemonAi.short_format, daemon_long_desc: daemonAi.long_format }
          : {}),
        ...(tarotAi
          ? { tarot_short_desc: tarotAi.short_format, tarot_long_desc: tarotAi.long_format }
          : {}),
      };
    })
  );

  return NextResponse.json({ results: enrichedRows });
}
