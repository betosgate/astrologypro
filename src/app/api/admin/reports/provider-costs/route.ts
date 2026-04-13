import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Cost rates per provider ─────────────────────────────────────────────────

const DAILY_COST_PER_PARTICIPANT_MIN = 0.004;
const CHIME_VIDEO_COST_PER_PARTICIPANT_MIN = 0.0017;
const PARTICIPANTS_PER_SESSION = 2;

const TWILIO_COST_PER_MIN = 0.0085;
const CHIME_PSTN_COST_PER_MIN = 0.002;

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoProviderStats {
  sessions: number;
  totalMinutes: number;
  estimatedCost: number;
  costPerMinute: number;
}

interface PhoneProviderStats {
  sessions: number;
  totalMinutes: number;
  totalCost: number;
  costPerMinute: number;
}

interface Savings {
  amount: number;
  percent: number;
}

interface PhoneSessionRow {
  provider: string;
  count: number;
  totalPlatformCost: number;
  totalCharged: number;
  avgDuration: number;
}

interface MonthlyCostRow {
  month: string;
  dailyCost: number;
  chimeCost: number;
  twilioCost: number;
  chimePhoneCost: number;
}

interface ProviderCostResponse {
  video: {
    daily: VideoProviderStats;
    chime: VideoProviderStats;
    savings: Savings;
  };
  phone: {
    twilio: PhoneProviderStats;
    chime: PhoneProviderStats;
    savings: Savings;
  };
  phoneSessions: PhoneSessionRow[];
  monthlyCosts: MonthlyCostRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPeriodDate(period: string): string | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case "1y":
      return new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      ).toISOString();
    case "all":
    default:
      return null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── GET /api/admin/reports/provider-costs ───────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/403",
        title: "Forbidden",
        status: 403,
        detail: "Admin authentication required",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";
  const sinceDate = getPeriodDate(period);

  const admin = createAdminClient();

  // ─── Video sessions from bookings ────────────────────────────────────────

  let videoQuery = admin
    .from("bookings")
    .select("video_provider, actual_duration_minutes, created_at")
    .eq("status", "completed")
    .not("actual_duration_minutes", "is", null);

  if (sinceDate) {
    videoQuery = videoQuery.gte("created_at", sinceDate);
  }

  const { data: videoRows, error: videoError } = await videoQuery;

  if (videoError) {
    return NextResponse.json(
      { error: videoError.message },
      { status: 500 }
    );
  }

  // Aggregate video stats by provider
  let dailySessions = 0;
  let dailyMinutes = 0;
  let chimeSessions = 0;
  let chimeMinutes = 0;

  for (const row of videoRows ?? []) {
    const mins = Number(row.actual_duration_minutes) || 0;
    const provider = (row.video_provider ?? "daily").toLowerCase();

    if (provider === "chime") {
      chimeSessions++;
      chimeMinutes += mins;
    } else {
      // Default to daily for null or 'daily'
      dailySessions++;
      dailyMinutes += mins;
    }
  }

  const dailyEstCost = round2(
    dailyMinutes * PARTICIPANTS_PER_SESSION * DAILY_COST_PER_PARTICIPANT_MIN
  );
  const chimeEstCost = round2(
    chimeMinutes * PARTICIPANTS_PER_SESSION * CHIME_VIDEO_COST_PER_PARTICIPANT_MIN
  );

  // Calculate savings: what Chime sessions would have cost on Daily
  const chimeOnDailyCost = round2(
    chimeMinutes * PARTICIPANTS_PER_SESSION * DAILY_COST_PER_PARTICIPANT_MIN
  );
  const videoSavingsAmount = round2(chimeOnDailyCost - chimeEstCost);
  const videoSavingsPercent =
    chimeOnDailyCost > 0
      ? Math.round((videoSavingsAmount / chimeOnDailyCost) * 100)
      : 0;

  const videoStats = {
    daily: {
      sessions: dailySessions,
      totalMinutes: dailyMinutes,
      estimatedCost: dailyEstCost,
      costPerMinute: DAILY_COST_PER_PARTICIPANT_MIN,
    } as VideoProviderStats,
    chime: {
      sessions: chimeSessions,
      totalMinutes: chimeMinutes,
      estimatedCost: chimeEstCost,
      costPerMinute: CHIME_VIDEO_COST_PER_PARTICIPANT_MIN,
    } as VideoProviderStats,
    savings: {
      amount: videoSavingsAmount,
      percent: videoSavingsPercent,
    } as Savings,
  };

  // ─── Phone sessions ─────────────────────────────────────────────────────

  let phoneQuery = admin
    .from("phone_sessions")
    .select(
      "phone_provider, platform_cost, amount_charged, duration_seconds, created_at"
    );

  if (sinceDate) {
    phoneQuery = phoneQuery.gte("created_at", sinceDate);
  }

  const { data: phoneRows, error: phoneError } = await phoneQuery;

  if (phoneError) {
    return NextResponse.json(
      { error: phoneError.message },
      { status: 500 }
    );
  }

  let twilioSessions = 0;
  let twilioMinutes = 0;
  let twilioPlatformCost = 0;
  let twilioCharged = 0;
  let twilioTotalDuration = 0;

  let chimePhoneSessions = 0;
  let chimePhoneMinutes = 0;
  let chimePhonePlatformCost = 0;
  let chimePhoneCharged = 0;
  let chimePhoneTotalDuration = 0;

  for (const row of phoneRows ?? []) {
    const durationSec = Number(row.duration_seconds) || 0;
    const mins = durationSec / 60;
    const cost = Number(row.platform_cost) || 0;
    const charged = Number(row.amount_charged) || 0;
    const provider = (row.phone_provider ?? "twilio").toLowerCase();

    if (provider === "chime") {
      chimePhoneSessions++;
      chimePhoneMinutes += mins;
      chimePhonePlatformCost += cost;
      chimePhoneCharged += charged;
      chimePhoneTotalDuration += durationSec;
    } else {
      twilioSessions++;
      twilioMinutes += mins;
      twilioPlatformCost += cost;
      twilioCharged += charged;
      twilioTotalDuration += durationSec;
    }
  }

  // Calculate phone savings: what Chime sessions would have cost on Twilio
  const chimeOnTwilioCost = round2(chimePhoneMinutes * TWILIO_COST_PER_MIN);
  const phoneSavingsAmount = round2(chimeOnTwilioCost - round2(chimePhonePlatformCost));
  const phoneSavingsPercent =
    chimeOnTwilioCost > 0
      ? Math.round((phoneSavingsAmount / chimeOnTwilioCost) * 100)
      : 0;

  const phoneStats = {
    twilio: {
      sessions: twilioSessions,
      totalMinutes: round2(twilioMinutes),
      totalCost: round2(twilioPlatformCost),
      costPerMinute: TWILIO_COST_PER_MIN,
    } as PhoneProviderStats,
    chime: {
      sessions: chimePhoneSessions,
      totalMinutes: round2(chimePhoneMinutes),
      totalCost: round2(chimePhonePlatformCost),
      costPerMinute: CHIME_PSTN_COST_PER_MIN,
    } as PhoneProviderStats,
    savings: {
      amount: phoneSavingsAmount,
      percent: phoneSavingsPercent,
    } as Savings,
  };

  // ─── Phone session breakdown table ──────────────────────────────────────

  const phoneSessions: PhoneSessionRow[] = [];

  if (twilioSessions > 0) {
    phoneSessions.push({
      provider: "twilio",
      count: twilioSessions,
      totalPlatformCost: round2(twilioPlatformCost),
      totalCharged: round2(twilioCharged),
      avgDuration: twilioSessions > 0 ? Math.round(twilioTotalDuration / twilioSessions / 60) : 0,
    });
  }

  if (chimePhoneSessions > 0) {
    phoneSessions.push({
      provider: "chime",
      count: chimePhoneSessions,
      totalPlatformCost: round2(chimePhonePlatformCost),
      totalCharged: round2(chimePhoneCharged),
      avgDuration:
        chimePhoneSessions > 0
          ? Math.round(chimePhoneTotalDuration / chimePhoneSessions / 60)
          : 0,
    });
  }

  // ─── Monthly cost trend ─────────────────────────────────────────────────
  // Group all video + phone rows by month

  const monthlyMap = new Map<
    string,
    { dailyCost: number; chimeCost: number; twilioCost: number; chimePhoneCost: number }
  >();

  for (const row of videoRows ?? []) {
    const month = (row.created_at as string).slice(0, 7); // "YYYY-MM"
    const mins = Number(row.actual_duration_minutes) || 0;
    const provider = (row.video_provider ?? "daily").toLowerCase();

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { dailyCost: 0, chimeCost: 0, twilioCost: 0, chimePhoneCost: 0 });
    }
    const entry = monthlyMap.get(month)!;

    if (provider === "chime") {
      entry.chimeCost += mins * PARTICIPANTS_PER_SESSION * CHIME_VIDEO_COST_PER_PARTICIPANT_MIN;
    } else {
      entry.dailyCost += mins * PARTICIPANTS_PER_SESSION * DAILY_COST_PER_PARTICIPANT_MIN;
    }
  }

  for (const row of phoneRows ?? []) {
    const month = (row.created_at as string).slice(0, 7);
    const cost = Number(row.platform_cost) || 0;
    const provider = (row.phone_provider ?? "twilio").toLowerCase();

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { dailyCost: 0, chimeCost: 0, twilioCost: 0, chimePhoneCost: 0 });
    }
    const entry = monthlyMap.get(month)!;

    if (provider === "chime") {
      entry.chimePhoneCost += cost;
    } else {
      entry.twilioCost += cost;
    }
  }

  const monthlyCosts: MonthlyCostRow[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      dailyCost: round2(data.dailyCost),
      chimeCost: round2(data.chimeCost),
      twilioCost: round2(data.twilioCost),
      chimePhoneCost: round2(data.chimePhoneCost),
    }));

  // ─── Response ───────────────────────────────────────────────────────────

  const response: ProviderCostResponse = {
    video: videoStats,
    phone: phoneStats,
    phoneSessions,
    monthlyCosts,
  };

  return NextResponse.json(response);
}
