import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildGovernedLivePlatforms,
  isValidLivePlatformKey,
  resolveLivePlatformsForStatus,
} from "@/lib/live-platform-governance";

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
  const livePlatforms = Array.isArray(diviner.live_platforms)
    ? resolveLivePlatformsForStatus(
        governedPlatforms,
        diviner.live_platforms.filter((value): value is string => typeof value === "string")
      )
    : [];

  return NextResponse.json({
    diviner: {
      id: diviner.id,
      is_live: diviner.is_live === true,
      live_platforms: livePlatforms,
    },
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

  const updates: Record<string, unknown> = { is_live };
  if (live_platforms !== undefined) {
    const governedPlatforms = await getGovernedPlatformsForDiviner(diviner.id);
    const requestedLivePlatforms = (live_platforms as unknown[])
      .filter((value): value is string => typeof value === "string")
      .filter(isValidLivePlatformKey);
    const resolvedPlatforms = resolveLivePlatformsForStatus(governedPlatforms, requestedLivePlatforms);
    updates.live_platforms = resolvedPlatforms;
  } else if (!is_live) {
    // When going offline, clear live_platforms
    updates.live_platforms = [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diviners")
    .update(updates)
    .eq("id", diviner.id)
    .select("id, is_live, live_platforms")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ diviner: data });
}
