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
 *   ASTRO_AI_API_URL           — Lambda URL for AI horoscope (new_astrology_api_url)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemConfigValue } from "@/lib/astro/system-settings";

const ASTROLOGY_API_BASE = "https://json.astrologyapi.com/v1";

function buildBasicAuthHeader(accessKey: string, secretKey: string): string {
  return "Basic " + Buffer.from(`${accessKey}:${secretKey}`).toString("base64");
}

/**
 * Fetch resolved configuration from the centralised fetch-config API.
 */
async function fetchConfigFromApi<T = any>(keys: string[]): Promise<T | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrologypro.com";
  const url = `${baseUrl}/api/astro/fetch-config`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    });

    if (!res.ok) {
      console.error(`[astrology-api] fetch-config failed with status ${res.status} at ${url}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[astrology-api] Exception during fetch-config at ${url}:`, err);
    return null;
  }
}

async function getAstrologyApiAuth(): Promise<{ access_key: string; secret_key: string } | null> {
  const config = await fetchConfigFromApi<{ ASTROLOGY_API: { access_key: string; secret_key: string } }>(["ASTROLOGY_API"]);
  if (!config?.ASTROLOGY_API) {
    console.warn(`[astrology-api] ASTROLOGY_API key missing in fetch-config response`);
    return null;
  }

  console.log("ASTROLOGY_API", config.ASTROLOGY_API);

  return config.ASTROLOGY_API;
}

async function getAstroAiUrl(): Promise<string | null> {
  const config = await fetchConfigFromApi<{ ASTRO_AI_API_URL: string }>(["ASTRO_AI_API_URL"]);
  return config?.ASTRO_AI_API_URL ?? null;
}

/**
 * POST to json.astrologyapi.com/v1/<endpoint>
 * Ported from Angular getHttpHoroscopePost().
 *
 * Key selection: Fetched from /api/astro/fetch-config which resolves active keys
 * from astro_system_settings with legacy fallbacks.
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
  console.log("url--------->>", url);
  console.log("Body--------->>", body);


  // Get credentials from the centralised config API
  console.log(`[astrology-api] Requesting credentials for endpoint: ${endpoint}`);
  const auth = await getAstrologyApiAuth();

  if (!auth) {
    console.error("[astrology-api] CRITICAL: fetch-config returned null or failed. Cannot proceed with API call.");
    throw new Error("AstrologyAPI credentials not configured (fetch-config failed)");
  }

  if (!auth.access_key || !auth.secret_key) {
    console.error("[astrology-api] CRITICAL: fetch-config returned object but keys are missing:", auth);
    throw new Error("AstrologyAPI credentials incomplete in fetch-config response");
  }

  console.log(`[astrology-api] Credentials obtained successfully. AccessKey prefix: ${auth.access_key}`);
  console.log(`[astrology-api] Credentials obtained successfully. SecretKey prefix: ${auth.secret_key}`);

  const authHeader = buildBasicAuthHeader(auth.access_key, auth.secret_key);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "Accept-Language": "en",
    },
    body: JSON.stringify(body),
  });

  console.log("res--------->>123", res);

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
  // Get AI URL from the centralised config API
  const aiUrl = await getAstroAiUrl();

  if (!aiUrl) {
    throw new Error(
      "ASTRO_AI_API_URL is not configured (fetch-config returned null)"
    );
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
    "https://astrologypro.com";

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
    p_day: person1.day,
    p_month: person1.month,
    p_year: person1.year,
    p_hour: person1.hour,
    p_min: person1.min,
    p_lat: person1.lat,
    p_lon: person1.lon,
    p_tzone: person1.tzone,
    s_day: person2.day,
    s_month: person2.month,
    s_year: person2.year,
    s_hour: person2.hour,
    s_min: person2.min,
    s_lat: person2.lat,
    s_lon: person2.lon,
    s_tzone: person2.tzone,
  });
}

/** POST natal_wheel_chart (svg chart) */
export async function getNatalWheelChart(birth: BirthData) {
  return callAstrologyApi("natal_wheel_chart", birth as unknown as Record<string, unknown>);
}
