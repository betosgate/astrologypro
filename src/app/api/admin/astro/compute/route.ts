import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrDiviner } from "@/lib/require-admin-or-diviner";
import { callAstrologyApi } from "@/lib/astrology-api";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ASTROLOGY_API_BASE = "https://json.astrologyapi.com/v1";

// Extended allowlist for admin (includes all tool endpoints)
const ALLOWED_ENDPOINTS = [
  "western_horoscope",
  "natal_wheel_chart",
  "planets/tropical",
  "house_cusps/tropical",
  "birth_details",
  "astro_details",
  "sun_sign_prediction/daily",
  "sun_sign_prediction/weekly",
  "sun_sign_prediction/monthly",
  "sun_sign_prediction/yearly",
  // Solar Return
  "solar_return_details",
  "solar_return_planets",
  "solar_return_house_cusps",
  "solar_return_planet_aspects",
  "solar_return_planet_report",
  "solar_return_aspects_report",
  // Transits
  "tropical_transits/daily",
  "tropical_transits/weekly",
  "tropical_transits/monthly",
  "lunar_metrics",
  // Relationship
  "synastry_horoscope",
  "composite_horoscope",
  // Horary
  "horary_chart",
];

type AstrologyApiSettingRow = {
  id: string;
  key_name: string;
  key_value: string;
  secret_value: string | null;
  status: "active" | "inactive";
  created_at: string;
};

function buildBasicAuthHeader(accessKey: string, secretKey: string): string {
  return "Basic " + Buffer.from(`${accessKey}:${secretKey}`).toString("base64");
}

function isTrialLimitExceededError(message: string): boolean {
  return (
    message.includes("AstrologyAPI error 429") &&
    message.includes("TRIAL_REQUEST_LIMIT_EXCEEDED")
  );
}

async function callAstrologyApiWithSetting<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  setting: AstrologyApiSettingRow,
): Promise<T> {
  if (!setting.secret_value) {
    throw new Error(`AstrologyAPI secret missing for key ${setting.key_name}`);
  }

  const res = await fetch(`${ASTROLOGY_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildBasicAuthHeader(setting.key_value, setting.secret_value),
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

async function updateSettingStatusById(id: string, nextStatus: "active" | "inactive"): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("astro_system_settings")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(req: NextRequest) {
  // Admin OR registered diviner — the diviner-facing /admin/horoscope/session/
  // route depends on this endpoint for compute.
  const user = await requireAdminOrDiviner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, payload } = body as { endpoint: string; payload: Record<string, unknown> };

  if (!endpoint || !payload) {
    return NextResponse.json({ error: "endpoint and payload are required" }, { status: 400 });
  }

  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("astro_system_settings")
      .select("id, key_name, key_value, secret_value, status, created_at")
      .eq("type", "ASTROLOGY_API")
      .order("created_at", { ascending: true });

    if (error || !rows || rows.length === 0) {
      const result = await callAstrologyApi(endpoint, payload);
      return NextResponse.json(result);
    }

    const triedSecrets = new Set<string>();
    type RotationResult = {
      value: Record<string, unknown> | null;
      error: Error | null;
    };
    const tryWithRotation = async (
      candidates: AstrologyApiSettingRow[],
    ): Promise<RotationResult> => {
      let lastError: Error | null = null;

      for (const candidate of candidates) {
        if (!candidate.secret_value || triedSecrets.has(candidate.secret_value)) continue;
        triedSecrets.add(candidate.secret_value);

        try {
          if (candidate.status !== "active") {
            await updateSettingStatusById(candidate.id, "active");
            candidate.status = "active";
          }

          const value = await callAstrologyApiWithSetting<Record<string, unknown>>(
            endpoint,
            payload,
            candidate,
          );
          return { value, error: null };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          lastError = err instanceof Error ? err : new Error(message);

          if (!isTrialLimitExceededError(message)) {
            throw lastError;
          }

          await updateSettingStatusById(candidate.id, "inactive");
          candidate.status = "inactive";
        }
      }

      return { value: null, error: lastError };
    };

    const activeRows = (rows as AstrologyApiSettingRow[]).filter((row) => row.status === "active");
    const inactiveRows = (rows as AstrologyApiSettingRow[]).filter((row) => row.status !== "active");

    const activeAttempt = await tryWithRotation(activeRows);
    if (activeAttempt.value) {
      return NextResponse.json(activeAttempt.value);
    }

    if (inactiveRows.length > 0) {
      const { error: activateAllError } = await admin
        .from("astro_system_settings")
        .update({ status: "active" })
        .eq("type", "ASTROLOGY_API")
        .eq("status", "inactive")
        .in("id", inactiveRows.map((row) => row.id));

      if (activateAllError) {
        throw new Error(activateAllError.message);
      }

      inactiveRows.forEach((row) => {
        row.status = "active";
      });

      const inactiveAttempt = await tryWithRotation(inactiveRows);
      if (inactiveAttempt.value) {
        return NextResponse.json(inactiveAttempt.value);
      }

      throw inactiveAttempt.error ?? activeAttempt.error ?? new Error("All AstrologyAPI keys were exhausted");
    }

    throw activeAttempt.error ?? new Error("All AstrologyAPI keys were exhausted");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AstrologyAPI error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
