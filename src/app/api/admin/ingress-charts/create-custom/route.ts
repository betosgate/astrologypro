import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { runIngressMongoImport } from "../import-mongo/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const CREATE_API_CONFIG_KEY = "ingress_charts_create_api_url";
const IMPORT_DELAY_MS = 15 * 60 * 1000;
const POLL_TIMEOUT_MS = 60 * 60 * 1000;

type CityPayload = {
  label: string;
  lat: number;
  lng: number;
  timezone?: {
    name?: string;
    offset_string?: string;
    utcOffset?: string;
  };
};

type CreateBody = {
  startDate?: unknown;
  endDate?: unknown;
  sectors?: unknown;
  city?: unknown;
};

type PollJob = {
  startedAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  running: boolean;
};

const activeJobs = new Map<string, PollJob>();

function scalarString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function isCityPayload(value: unknown): value is CityPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CityPayload).label === "string" &&
    typeof (value as CityPayload).lat === "number" &&
    typeof (value as CityPayload).lng === "number"
  );
}

async function fetchIngressCreateApiUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrologypro.com";
  const url = `${baseUrl}/api/astro/fetch-config`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: [CREATE_API_CONFIG_KEY] }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`fetch-config API returned status ${res.status}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const createApiUrl = scalarString(data[CREATE_API_CONFIG_KEY]);

    if (!createApiUrl) {
      const keysPresent = Object.keys(data).join(", ");
      throw new Error(
        `Ingress chart create API URL missing in fetch-config response. Keys received: [${keysPresent}]`,
      );
    }

    return createApiUrl;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`fetchIngressCreateApiUrl failed: ${message}`);
  }
}

function buildJobKey(startDate: string, endDate: string, sectors: string[], city: CityPayload) {
  return JSON.stringify({
    startDate,
    endDate,
    sectors: [...sectors].sort(),
    city: city.label,
    lat: city.lat,
    lng: city.lng,
  });
}

function scheduleImportPolling(jobKey: string) {
  const existing = activeJobs.get(jobKey);
  if (existing) return { alreadyScheduled: true };

  const job: PollJob = {
    startedAt: Date.now(),
    timer: null,
    running: false,
  };

  async function tick() {
    const current = activeJobs.get(jobKey);
    if (!current || current.running) return;

    current.running = true;

    try {
      const result = await runIngressMongoImport({ dry_run: false });
      if (result.inserted > 0 || Date.now() - current.startedAt >= POLL_TIMEOUT_MS) {
        activeJobs.delete(jobKey);
        return;
      }
    } catch (err) {
      console.error("[ingress-charts/create-custom] background import failed:", err);
      if (Date.now() - current.startedAt >= POLL_TIMEOUT_MS) {
        activeJobs.delete(jobKey);
        return;
      }
    } finally {
      current.running = false;
    }

    const latest = activeJobs.get(jobKey);
    if (latest) latest.timer = setTimeout(tick, IMPORT_DELAY_MS);
  }

  job.timer = setTimeout(tick, IMPORT_DELAY_MS);
  activeJobs.set(jobKey, job);
  return { alreadyScheduled: false };
}

function startIngressChartCalculation(createApiUrl: string, payload: Record<string, unknown>) {
  void fetch(createApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch((err) => {
    console.error("[ingress-charts/create-custom] external calculation failed:", err);
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const startDate = scalarString(body.startDate);
  const endDate = scalarString(body.endDate);
  const sectors = Array.isArray(body.sectors)
    ? body.sectors.map((item) => scalarString(item)).filter((item): item is string => !!item)
    : [];
  const city = body.city;

  if (!startDate || !isDateOnly(startDate)) {
    return NextResponse.json({ error: "Start Date is required." }, { status: 400 });
  }

  if (!endDate || !isDateOnly(endDate)) {
    return NextResponse.json({ error: "End Date is required." }, { status: 400 });
  }

  const minEndDate = addDays(startDate, 14);

  if (endDate < minEndDate) {
    return NextResponse.json(
      { error: "End Date must be at least 2 weeks after Start Date." },
      { status: 400 },
    );
  }

  if (sectors.length === 0) {
    return NextResponse.json({ error: "Select at least one sector." }, { status: 400 });
  }

  if (!isCityPayload(city)) {
    return NextResponse.json({ error: "Select a city from the autocomplete list." }, { status: 400 });
  }

  try {
    const jobKey = buildJobKey(startDate, endDate, sectors, city);
    if (activeJobs.has(jobKey)) {
      return NextResponse.json({
        ok: true,
        scheduled: true,
        already_scheduled: true,
        message:
          "Ingress chart calculation is already running for this request.",
      });
    }

    const createApiUrl = await fetchIngressCreateApiUrl();
    const userName =
      scalarString(user.user_metadata?.full_name) ??
      scalarString(user.user_metadata?.name) ??
      scalarString(user.email) ??
      "Admin";

    const payload = {
      steps: ["createCustomIngressChart"],
      START_DATE: startDate,
      END_DATE: endDate,
      user_id: user.id,
      user_name: userName,
      user_email: user.email ?? "",
      sector_focus: sectors,
      TARGET_LOCATIONS: [
        {
          name: city.label,
          type: "city",
          lat: city.lat,
          lon: city.lng,
          tz: city.timezone?.name ?? city.timezone?.utcOffset ?? city.timezone?.offset_string ?? "",
        },
      ],
      is_social_advo: true,
    };

    startIngressChartCalculation(createApiUrl, payload);
    const poll = scheduleImportPolling(jobKey);

    return NextResponse.json({
      ok: true,
      scheduled: true,
      already_scheduled: poll.alreadyScheduled,
      message:
        "Ingress chart calculation started. Charts will be imported after the calculation window.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
