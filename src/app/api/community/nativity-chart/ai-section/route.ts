import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const AI_DAILY_LIMIT = 20;

type SectionType = "planets" | "houses" | "aspects" | "dharma" | "ascendant";

interface AiSectionPayload {
  section: SectionType;
  astroData: Record<string, unknown>;
  focusItem?: string;
}

interface AstroAiLambdaResponse {
  ai_response: string;
  prompt_tokens?: number;
  completion_tokens?: number;
}

function buildPrompt(section: SectionType, astroData: Record<string, unknown>, focusItem?: string): string {
  const base = JSON.stringify(astroData);

  switch (section) {
    case "planets":
      if (focusItem) {
        return `Interpret the placement of ${focusItem} in the natal chart based on the following birth chart data. Include the sign, house, degree, and any relevant aspects. Data: ${base}`;
      }
      return `Provide a comprehensive interpretation of all planetary placements in this natal chart. Describe each planet's sign, house, and key themes. Data: ${base}`;

    case "houses":
      if (focusItem) {
        return `Interpret House ${focusItem} in this natal chart — the sign on the cusp, ruling planet placement, and what life area it governs for this person. Data: ${base}`;
      }
      return `Provide interpretations for all 12 houses in this natal chart — for each house describe the sign on the cusp, its ruling planet, and the life area themes. Data: ${base}`;

    case "aspects":
      if (focusItem) {
        return `Interpret the astrological aspect "${focusItem}" found in this natal chart. Describe its psychological meaning and how it manifests in this person's life. Data: ${base}`;
      }
      return `Interpret the most significant aspects in this natal chart. Describe major conjunctions, trines, squares, oppositions, and sextiles and their psychological meaning. Data: ${base}`;

    case "dharma":
      return `Analyze the Dharma and Karma indicators in this natal chart. Include interpretation of the North Node (Rahu) and South Node (Ketu) positions, their signs and houses, and the soul's evolutionary direction. Also note Saturn's placement as a karma indicator. Data: ${base}`;

    case "ascendant":
      return `Interpret the Ascendant (Rising Sign), Midheaven, and Vertex in this natal chart. Describe how the Rising Sign shapes the outer personality and approach to life, what the Midheaven reveals about career and public life, and the Vertex's role as a fated point. Data: ${base}`;

    default:
      return `Provide an astrological interpretation based on the following natal chart data: ${base}`;
  }
}

// POST /api/community/nativity-chart/ai-section
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as AiSectionPayload;
  const { section, astroData, focusItem } = body;

  const allowedSections: SectionType[] = ["planets", "houses", "aspects", "dharma", "ascendant"];
  if (!section || !allowedSections.includes(section)) {
    return NextResponse.json(
      { error: "section must be one of: planets, houses, aspects, dharma, ascendant" },
      { status: 422 }
    );
  }
  if (!astroData || typeof astroData !== "object") {
    return NextResponse.json({ error: "astroData is required" }, { status: 422 });
  }

  // Check and increment rate limit (max 20 calls per user per day)
  const adminClient = createAdminClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: usageRow } = await adminClient
    .from("ai_interpretation_usage")
    .select("id, call_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .single();

  const currentCount = usageRow?.call_count ?? 0;

  if (currentCount >= AI_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `Daily AI interpretation limit reached (${AI_DAILY_LIMIT} calls per day). Try again tomorrow.`,
      },
      { status: 429 }
    );
  }

  // Upsert usage counter
  if (usageRow) {
    await adminClient
      .from("ai_interpretation_usage")
      .update({ call_count: currentCount + 1 })
      .eq("id", usageRow.id);
  } else {
    await adminClient.from("ai_interpretation_usage").insert({
      user_id: user.id,
      usage_date: today,
      call_count: 1,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrologypro.com";
  const configRes = await fetch(`${baseUrl}/api/astro/fetch-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys: ["ASTRO_AI_API_URL"] }),
  });
  const config = await configRes.json().catch(() => ({}));
  const aiUrl = config?.ASTRO_AI_API_URL;

  if (!aiUrl) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const userPrompt = buildPrompt(section, astroData, focusItem);

  const lambdaBody = {
    condition: {
      system_content:
        "Provide a deeply personalized response speaking directly to your astrology client. Interpret using Placidus house system. give response only in json format",
      user_content: `Generate details based on given json ${userPrompt}`,
    },
    toolname: "other",
    json: astroData,
  };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://astrologypro.com";

  try {
    const res = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(lambdaBody),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `AI API error ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as AstroAiLambdaResponse;

    // Strip markdown code fences if present
    let raw = data.ai_response ?? "";
    if (raw.startsWith("```json")) {
      raw = raw.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (raw.startsWith("```")) {
      raw = raw.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    // Attempt to parse as JSON; fall back to returning raw string
    let interpretation: unknown;
    try {
      interpretation = JSON.parse(raw);
    } catch {
      interpretation = raw;
    }

    return NextResponse.json({
      interpretation,
      usage: { today: currentCount + 1, limit: AI_DAILY_LIMIT },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
