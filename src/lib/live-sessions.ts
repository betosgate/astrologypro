import { createAdminClient } from "@/lib/supabase/admin";
import { isValidLivePlatformKey, type LivePlatformKey } from "@/lib/live-platform-governance";

export interface LiveSessionRecord {
  id: string;
  diviner_id: string;
  platform: LivePlatformKey;
  platform_url: string | null;
  title: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  check_in_enabled: boolean;
  check_in_form_title: string | null;
  check_in_form_subtitle: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeLiveSession(
  row: Record<string, unknown> | null | undefined
): LiveSessionRecord | null {
  if (!row || !isValidLivePlatformKey(row.platform)) {
    return null;
  }

  const status =
    row.status === "scheduled" ||
    row.status === "live" ||
    row.status === "ended" ||
    row.status === "cancelled"
      ? row.status
      : null;

  if (!status || typeof row.id !== "string" || typeof row.diviner_id !== "string") {
    return null;
  }

  return {
    id: row.id,
    diviner_id: row.diviner_id,
    platform: row.platform,
    platform_url: typeof row.platform_url === "string" ? row.platform_url : null,
    title: typeof row.title === "string" ? row.title : null,
    status,
    scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
    started_at: typeof row.started_at === "string" ? row.started_at : null,
    ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
    check_in_enabled: row.check_in_enabled === true,
    check_in_form_title:
      typeof row.check_in_form_title === "string" ? row.check_in_form_title : null,
    check_in_form_subtitle:
      typeof row.check_in_form_subtitle === "string" ? row.check_in_form_subtitle : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

export async function getCurrentLiveSession(divinerId: string): Promise<LiveSessionRecord | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_sessions")
    .select(
      "id, diviner_id, platform, platform_url, title, status, scheduled_at, started_at, ended_at, check_in_enabled, check_in_form_title, check_in_form_subtitle, created_at, updated_at"
    )
    .eq("diviner_id", divinerId)
    .eq("status", "live")
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizeLiveSession(data as Record<string, unknown> | null);
}

export async function getNextScheduledLiveSession(
  divinerId: string
): Promise<LiveSessionRecord | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_sessions")
    .select(
      "id, diviner_id, platform, platform_url, title, status, scheduled_at, started_at, ended_at, check_in_enabled, check_in_form_title, check_in_form_subtitle, created_at, updated_at"
    )
    .eq("diviner_id", divinerId)
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return normalizeLiveSession(data as Record<string, unknown> | null);
}

export async function syncDivinerLiveMirror(divinerId: string) {
  const admin = createAdminClient();
  const [currentLiveSession, nextScheduledLiveSession] = await Promise.all([
    getCurrentLiveSession(divinerId),
    getNextScheduledLiveSession(divinerId),
  ]);

  const { data, error } = await admin
    .from("diviners")
    .update({
      is_live: !!currentLiveSession,
      live_platforms: currentLiveSession ? [currentLiveSession.platform] : [],
      next_live_at: currentLiveSession?.scheduled_at ?? nextScheduledLiveSession?.scheduled_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", divinerId)
    .select("id, is_live, live_platforms, next_live_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    diviner: data,
    currentLiveSession,
    nextScheduledLiveSession,
  };
}
