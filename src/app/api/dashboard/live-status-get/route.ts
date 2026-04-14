import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildGovernedLivePlatforms,
  resolveLivePlatformsForStatus,
} from "@/lib/live-platform-governance";
import { getCurrentLiveSession, getNextScheduledLiveSession } from "@/lib/live-sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diviners")
    .select("id, is_live, live_platforms")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const [{ data: registryRows }, { data: overrideRows }] = await Promise.all([
    admin
      .from("live_platform_registry")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("platform_key", { ascending: true }),
    admin
      .from("diviner_live_platform_overrides")
      .select("*")
      .eq("diviner_id", data.id),
  ]);
  const governedPlatforms = buildGovernedLivePlatforms(registryRows ?? [], overrideRows ?? []);
  const [currentSession, nextScheduledSession] = await Promise.all([
    getCurrentLiveSession(data.id),
    getNextScheduledLiveSession(data.id),
  ]);
  const livePlatforms = currentSession
    ? resolveLivePlatformsForStatus(governedPlatforms, [currentSession.platform])
    : [];

  return NextResponse.json({
    diviner: {
      id: data.id,
      is_live: !!currentSession,
      live_platforms: livePlatforms,
    },
    currentSession,
    nextScheduledSession,
  });
}
