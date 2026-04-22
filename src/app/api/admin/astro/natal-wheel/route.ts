import { NextRequest, NextResponse } from "next/server";
import { requireAstroToolkitAccess } from "@/lib/astro-toolkit-access";
import { listActiveAstroSettings } from "@/lib/astro/system-settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FREE_ASTRO_URL = "https://json.freeastrologyapi.com/western/natal-wheel-chart";

type FreeAstroSettingRow = {
  id: string;
  key_name: string;
  key_value: string;
  status: "active" | "inactive";
  created_at: string;
};

/**
 * Fetches every active FreeAstrologyAPI key.
 *
 * Reads from astro_system_settings (type=FREEASTROLOGY_API) first via the
 * helper, which transparently falls back to the legacy
 * `FREEASTROLOGY_API_KEYS` comma-delimited env var when the new table is
 * empty. Once the cutover is complete and every environment has rows in
 * astro_system_settings, the env var can be removed.
 */
async function getFreeAstroKeys(): Promise<string[]> {
  const keys = await listActiveAstroSettings("FREEASTROLOGY_API");
  return keys.map((row) => row.key_value).filter(Boolean);
}

function formatFreeAstroError(status: number, bodyText: string, keyIndex?: number) {
  const keyLabel = keyIndex == null ? "" : ` [key ${keyIndex + 1}]`;
  return `FreeAstrologyAPI error ${status}${keyLabel}: ${bodyText}`;
}

function isFreeAstroLimitExceeded(message: string): boolean {
  return (
    message.includes("FreeAstrologyAPI error 429") &&
    message.includes("Limit Exceeded")
  );
}

async function toggleFreeAstroStatusByKeyValue(keyValue: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_system_settings")
    .select("id, status")
    .eq("type", "FREEASTROLOGY_API")
    .eq("key_value", keyValue)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "FreeAstrology setting not found");
  }

  const nextStatus = data.status === "active" ? "inactive" : "active";
  const { error: updateError } = await admin
    .from("astro_system_settings")
    .update({ status: nextStatus })
    .eq("id", data.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAstroToolkitAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // Expected: { hours, minutes, date, month, year, latitude, longitude, timezone }
  const { hours, minutes, date, month, year, latitude, longitude, timezone } = body;

  if (hours === undefined || minutes === undefined || !date || !month || !year || latitude === undefined || longitude === undefined || timezone === undefined) {
    return NextResponse.json({ error: "Missing required birth data fields" }, { status: 400 });
  }

  const apiKeys = await getFreeAstroKeys();
  if (apiKeys.length === 0) {
    return NextResponse.json(
      {
        error:
          "No active FreeAstrologyAPI keys configured. Add a row of type=FREEASTROLOGY_API at /admin/astro-system-settings or set the FREEASTROLOGY_API_KEYS env var.",
      },
      { status: 500 }
    );
  }

  const payload = { hours, minutes, date, month, year, latitude, longitude, timezone };

  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("astro_system_settings")
      .select("id, key_name, key_value, status, created_at")
      .eq("type", "FREEASTROLOGY_API")
      .order("created_at", { ascending: true });

    const keyedRows = (rows as FreeAstroSettingRow[] | null) ?? [];
    const triedKeys = new Set<string>();

    const tryWithRotation = async (candidates: FreeAstroSettingRow[]) => {
      let lastError: Error | null = null;

      for (let index = 0; index < candidates.length; index++) {
        const candidate = candidates[index];
        if (!candidate?.key_value || triedKeys.has(candidate.key_value)) continue;
        triedKeys.add(candidate.key_value);

        try {
          if (candidate.status !== "active") {
            await toggleFreeAstroStatusByKeyValue(candidate.key_value);
            candidate.status = "active";
          }

          const res = await fetch(FREE_ASTRO_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "x-api-key": candidate.key_value,
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            return { results: { output: data?.output ?? data } };
          }

          const text = await res.text();
          const message = formatFreeAstroError(res.status, text, index);
          lastError = new Error(message);

          if ((res.status === 429 && isFreeAstroLimitExceeded(message)) || res.status === 401 || res.status === 403) {
            await toggleFreeAstroStatusByKeyValue(candidate.key_value);
            candidate.status = "inactive";
            continue;
          }

          throw lastError;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          lastError = err instanceof Error ? err : new Error(message);

          if (isFreeAstroLimitExceeded(message)) {
            await toggleFreeAstroStatusByKeyValue(candidate.key_value);
            candidate.status = "inactive";
            continue;
          }

          throw lastError;
        }
      }

      return { __rotation_error: lastError } as const;
    };

    if (keyedRows.length > 0) {
      const activeRows = keyedRows.filter((row) => row.status === "active");
      const inactiveRows = keyedRows.filter((row) => row.status !== "active");

      const activeAttempt = await tryWithRotation(activeRows);
      if (!("__rotation_error" in activeAttempt)) {
        return NextResponse.json(activeAttempt);
      }

      if (inactiveRows.length > 0) {
        const { error: activateAllError } = await admin
          .from("astro_system_settings")
          .update({ status: "active" })
          .eq("type", "FREEASTROLOGY_API")
          .eq("status", "inactive")
          .in("id", inactiveRows.map((row) => row.id));

        if (activateAllError) {
          throw new Error(activateAllError.message);
        }

        inactiveRows.forEach((row) => {
          row.status = "active";
        });

        const inactiveAttempt = await tryWithRotation(inactiveRows);
        if (!("__rotation_error" in inactiveAttempt)) {
          return NextResponse.json(inactiveAttempt);
        }

        throw inactiveAttempt.__rotation_error ?? activeAttempt.__rotation_error ?? new Error("All FreeAstrologyAPI keys were exhausted");
      }

      throw activeAttempt.__rotation_error ?? new Error("All FreeAstrologyAPI keys were exhausted");
    }

    const attempted = new Set<string>();
    let lastError: string | null = null;

    for (let index = 0; index < apiKeys.length; index++) {
      const apiKey = apiKeys[index];
      if (attempted.has(apiKey)) continue;
      attempted.add(apiKey);

      const res = await fetch(FREE_ASTRO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ results: { output: data?.output ?? data } });
      }

      const text = await res.text();
      lastError = formatFreeAstroError(res.status, text, index);

      if (res.status === 401 || res.status === 403 || res.status === 429) {
        continue;
      }

      throw new Error(lastError);
    }

    throw new Error(lastError ?? "FreeAstrologyAPI request failed");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Natal wheel error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
