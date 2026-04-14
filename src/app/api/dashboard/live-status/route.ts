import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildGovernedLivePlatforms,
  isValidLivePlatformKey,
  resolveLivePlatformsForStatus,
} from "@/lib/live-platform-governance";
import {
  getCurrentLiveSession,
  getNextScheduledLiveSession,
  syncDivinerLiveMirror,
} from "@/lib/live-sessions";

export const dynamic = "force-dynamic";

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id, is_live, live_platforms")
    .eq("user_id", user.id)
    .single();
  return data;
}

async function getGovernedPlatformsForDiviner(divinerId: string) {
  const admin = createAdminClient();
  const [{ data: registryRows }, { data: overrideRows }] = await Promise.all([
    admin
      .from("live_platform_registry")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("platform_key", { ascending: true }),
    admin
      .from("diviner_live_platform_overrides")
      .select("*")
      .eq("diviner_id", divinerId),
  ]);

  return buildGovernedLivePlatforms(registryRows ?? [], overrideRows ?? []);
}

export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const governedPlatforms = await getGovernedPlatformsForDiviner(diviner.id);
  const [currentSession, nextScheduledSession] = await Promise.all([
    getCurrentLiveSession(diviner.id),
    getNextScheduledLiveSession(diviner.id),
  ]);
  const livePlatforms = currentSession
    ? resolveLivePlatformsForStatus(governedPlatforms, [currentSession.platform])
    : [];

  return NextResponse.json({
    diviner: {
      id: diviner.id,
      is_live: !!currentSession,
      live_platforms: livePlatforms,
    },
    currentSession,
    nextScheduledSession,
  });
}

export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { is_live, live_platforms } = body;

  if (typeof is_live !== "boolean") {
    return NextResponse.json(
      { error: "is_live must be a boolean" },
      { status: 422 }
    );
  }

  if (
    live_platforms !== undefined &&
    (!Array.isArray(live_platforms) ||
      !live_platforms.every((p) => typeof p === "string"))
  ) {
    return NextResponse.json(
      { error: "live_platforms must be an array of strings" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const governedPlatforms = await getGovernedPlatformsForDiviner(diviner.id);
  const requestedLivePlatforms =
    live_platforms !== undefined
      ? (live_platforms as unknown[])
          .filter((value): value is string => typeof value === "string")
          .filter(isValidLivePlatformKey)
      : [];
  const resolvedPlatforms = resolveLivePlatformsForStatus(governedPlatforms, requestedLivePlatforms);

  if (is_live && resolvedPlatforms.length === 0) {
    return NextResponse.json(
      { error: "Select at least one allowed live platform before going live." },
      { status: 422 }
    );
  }

  const { data: platformConfigs } = await admin
    .from("stream_platform_configs")
    .select("platform, stream_url, display_name")
    .eq("diviner_id", diviner.id)
    .eq("is_enabled", true)
    .in("platform", is_live ? resolvedPlatforms : governedPlatforms.map((platform) => platform.platform_key));

  const configByPlatform = new Map(
    (platformConfigs ?? [])
      .filter((row) => isValidLivePlatformKey(row.platform))
      .map((row) => [
        row.platform,
        {
          stream_url: typeof row.stream_url === "string" ? row.stream_url : null,
          display_name: typeof row.display_name === "string" ? row.display_name : null,
        },
      ])
  );

  if (is_live) {
    const primaryPlatform = resolvedPlatforms[0];
    const activeConfig = configByPlatform.get(primaryPlatform);
    const currentSession = await getCurrentLiveSession(diviner.id);

    if (currentSession) {
      const { error } = await admin
        .from("live_sessions")
        .update({
          status: "live",
          platform: primaryPlatform,
          platform_url: activeConfig?.stream_url ?? currentSession.platform_url,
          title: currentSession.title ?? activeConfig?.display_name ?? null,
          started_at: currentSession.started_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSession.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const nextScheduledSession = await getNextScheduledLiveSession(diviner.id);

      if (nextScheduledSession) {
        const { error } = await admin
          .from("live_sessions")
          .update({
            status: "live",
            platform: primaryPlatform,
            platform_url: activeConfig?.stream_url ?? nextScheduledSession.platform_url,
            title: nextScheduledSession.title ?? activeConfig?.display_name ?? null,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextScheduledSession.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        const { error } = await admin.from("live_sessions").insert({
          diviner_id: diviner.id,
          platform: primaryPlatform,
          platform_url: activeConfig?.stream_url ?? null,
          title: activeConfig?.display_name ?? null,
          status: "live",
          started_at: new Date().toISOString(),
          check_in_enabled: true,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }
  } else {
    const currentSession = await getCurrentLiveSession(diviner.id);
    if (currentSession) {
      const { error } = await admin
        .from("live_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSession.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  try {
    const synced = await syncDivinerLiveMirror(diviner.id);
    const liveSessionPlatforms = synced.currentLiveSession ? [synced.currentLiveSession.platform] : [];
    return NextResponse.json({
      diviner: {
        id: synced.diviner.id,
        is_live: synced.diviner.is_live,
        live_platforms: liveSessionPlatforms,
      },
      currentSession: synced.currentLiveSession,
      nextScheduledSession: synced.nextScheduledLiveSession,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to synchronize live state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
