/**
 * Ported from Angular ApiservicesService.getHttpHoroscopePost / getHttpNewHoroscopePost
 *
 * Server-side client for two external astrology APIs used in the Angular app:
 *
 *   1. AstrologyAPI   — https://json.astrologyapi.com/v1/
 *      Basic auth with access_key:secret_key (stored in env or Supabase astro_tool_kit)
 *      Called by: western_horoscope, synastry_horoscope, natal chart endpoints, etc.
 *
 *   2. AI Horoscope Lambda — process.env.ASTRO_AI_API_URL
 *      No auth, POST with condition object, returns { ai_response: string }
 *      Called by: all AI-narrated horoscope interpretations
 *
 * Required env vars:
 *   ASTROLOGY_API_ACCESS_KEY   — access_key for json.astrologyapi.com
 *   ASTROLOGY_API_SECRET_KEY   — secret_key for json.astrologyapi.com
 *   ASTRO_AI_API_URL           — Lambda URL for AI horoscope (new_astrology_api_url)
 */

import { createAdminClient } from "@/lib/supabase/admin";

const ASTROLOGY_API_BASE = "https://json.astrologyapi.com/v1";

// ---------------------------------------------------------------------------
// DB-backed key rotation (least-recently-used active key)
// Falls back to env vars if no DB keys are available.
// ---------------------------------------------------------------------------

interface DbApiKey {
  id: string;
  access_key: string;
  secret_key: string;
}

/**
 * Fetch the least-recently-used active key from astrology_api_keys.
 * After selection, updates last_used_at and increments requests_today.
 * Returns null if no active keys exist.
 */
async function getDbKey(): Promise<DbApiKey | null> {
  try {
    const admin = createAdminClient();

    // Pick the active key with the oldest (or null) last_used_at
    const { data, error } = await admin
      .from("astrology_api_keys")
      .select("id, access_key, secret_key")
      .eq("is_active", true)
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Fire-and-forget usage tracking: read current count, increment, update
    admin
      .from("astrology_api_keys")
      .select("requests_today")
      .eq("id", data.id)
      .single()
      .then(({ data: row }) => {
        const current = (row as Record<string, unknown> | null)?.requests_today as number ?? 0;
        admin
          .from("astrology_api_keys")
          .update({
            requests_today: current + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .then(() => { /* fire-and-forget */ });
      });

    return data as DbApiKey;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AstrologyAPI.com client (Basic auth)
// ---------------------------------------------------------------------------

function buildBasicAuthHeader(accessKey: string, secretKey: string): string {
  return "Basic " + Buffer.from(`${accessKey}:${secretKey}`).toString("base64");
}

function getEnvBasicAuthHeader(): string {
  const accessKey = process.env.ASTROLOGY_API_ACCESS_KEY ?? "";
  const secretKey = process.env.ASTROLOGY_API_SECRET_KEY ?? "";
  return buildBasicAuthHeader(accessKey, secretKey);
}

/**
 * POST to json.astrologyapi.com/v1/<endpoint>
 * Ported from Angular getHttpHoroscopePost().
 *
 * Key selection: DB-backed round-robin (least-recently-used) with env var fallback.
 *
 * @param endpoint  e.g. "western_horoscope", "synastry_horoscope"
 * @param body      request payload
 * @returns parsed JSON response
 */
export async function callAstrologyApi<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${ASTROLOGY_API_BASE}/${endpoint}`;

  // Try DB key first, fall back to env
  const dbKey = await getDbKey();
  const authHeader = dbKey
    ? buildBasicAuthHeader(dbKey.access_key, dbKey.secret_key)
    : getEnvBasicAuthHeader();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "Accept-Language": "en",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AstrologyAPI error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// AI Horoscope Lambda client
// ---------------------------------------------------------------------------

export interface AstroAiCondition {
  system_content: string;
  [key: string]: unknown;
}

export interface AstroAiBody {
  condition: AstroAiCondition;
  [key: string]: unknown;
}

export interface AstroAiResponse {
  ai_response: string;
  [key: string]: unknown;
}

/**
 * POST to the AI horoscope Lambda endpoint.
 * Ported from Angular getHttpNewHoroscopePost().
 *
 * Appends the standard Placidus system prompt and optional area-of-inquiry
 * before sending to the Lambda.
 *
 * @param body           request body with condition.system_content
 * @param areaOfInquiry  optional user-provided focus area (appended to system_content)
 */
export async function callAstroAiApi(
  body: AstroAiBody,
  areaOfInquiry?: string
): Promise<AstroAiResponse> {
  const aiUrl = process.env.ASTRO_AI_API_URL;

  if (!aiUrl) {
    throw new Error("ASTRO_AI_API_URL is not configured");
  }

  // Mirror Angular's system_content injection
  const enriched = { ...body };
  if (enriched.condition?.system_content) {
    enriched.condition = {
      ...enriched.condition,
      system_content:
        enriched.condition.system_content +
        ". Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client's unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.",
    };

    if (areaOfInquiry?.trim()) {
      const trimmed = areaOfInquiry.trim();
      enriched.condition = {
        ...enriched.condition,
        system_content:
          enriched.condition.system_content +
          `\n\nThe user has provided a specific "Area of Inquiry": "${trimmed}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client's stated area of inquiry.`,
      };
    }
  }

  // Lambda Function URL requires an Origin header — without it, it returns 403 Forbidden.
  // Angular sends this automatically as a browser app; we must add it explicitly server-side.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.backofficeportal.divineinfinitebeing.com";

  let lastError: unknown;
  const maxRetries = 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log("Calling Astro AI API with details:", {
        url: aiUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          Host: aiUrl
        },
        body: enriched,
      });

      const res = await fetch(aiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          Host: aiUrl
        },
        body: JSON.stringify(enriched),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Astro AI API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as AstroAiResponse;
      console.log("Astro AI API success response:", data);

      // Strip markdown code fences if present (matches Angular post-processing)
      if (data.ai_response?.startsWith("```json")) {
        data.ai_response = data.ai_response
          .replace(/^```json\s*/, "")
          .replace(/```$/, "")
          .trim();
      }

      return data;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed for Astro AI API:`, error);
      if (attempt < maxRetries) {
        // Wait 10 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  throw lastError || new Error("Astro AI API failed after maximum retries");
}

// ---------------------------------------------------------------------------
// Common birth data shape used across all horoscope endpoints
// ---------------------------------------------------------------------------

export interface BirthData {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;  // UTC offset e.g. -5
}

// ---------------------------------------------------------------------------
// Typed wrappers for the most common AstrologyAPI endpoints
// ---------------------------------------------------------------------------

/** POST western_horoscope */
export async function getWesternHoroscope(birth: BirthData) {
  return callAstrologyApi("western_horoscope", birth as unknown as Record<string, unknown>);
}

/** POST synastry_horoscope — requires two birth data objects */
export async function getSynastryHoroscope(
  person1: BirthData,
  person2: BirthData
) {
  return callAstrologyApi("synastry_horoscope", {
    ...person1,
    p_day: person2.day,
    p_month: person2.month,
    p_year: person2.year,
    p_hour: person2.hour,
    p_min: person2.min,
    p_lat: person2.lat,
    p_lon: person2.lon,
    p_tzone: person2.tzone,
  });
}

/** POST natal_wheel_chart (svg chart) */
export async function getNatalWheelChart(birth: BirthData) {
  return callAstrologyApi("natal_wheel_chart", birth as unknown as Record<string, unknown>);
}
