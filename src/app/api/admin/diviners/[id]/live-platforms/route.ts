import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildGovernedLivePlatforms,
  isValidLivePlatformKey,
} from "@/lib/live-platform-governance";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const [{ data: registryRows, error: registryError }, { data: overrideRows, error: overrideError }] =
    await Promise.all([
      admin
        .from("live_platform_registry")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("platform_key", { ascending: true }),
      admin
        .from("diviner_live_platform_overrides")
        .select("*")
        .eq("diviner_id", id),
    ]);

  if (registryError || overrideError) {
    return NextResponse.json(
      { error: registryError?.message ?? overrideError?.message ?? "Failed to load live platform policy" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    platforms: buildGovernedLivePlatforms(registryRows ?? [], overrideRows ?? []),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidLivePlatformKey(body.platform_key)) {
    return NextResponse.json({ error: "Invalid platform key" }, { status: 422 });
  }

  const availabilityMode =
    body.availability_mode === "inherit" ||
    body.availability_mode === "force_enable" ||
    body.availability_mode === "force_disable"
      ? body.availability_mode
      : null;

  if (!availabilityMode) {
    return NextResponse.json({ error: "Invalid availability mode" }, { status: 422 });
  }

  const admin = createAdminClient();

  if (availabilityMode === "inherit") {
    const { error } = await admin
      .from("diviner_live_platform_overrides")
      .delete()
      .eq("diviner_id", id)
      .eq("platform_key", body.platform_key);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin
      .from("diviner_live_platform_overrides")
      .upsert(
        {
          diviner_id: id,
          platform_key: body.platform_key,
          availability_mode: availabilityMode,
          reason:
            typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null,
          set_by: adminUser.id,
          set_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "diviner_id,platform_key" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const [{ data: registryRows, error: registryError }, { data: overrideRows, error: overrideError }] =
    await Promise.all([
      admin
        .from("live_platform_registry")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("platform_key", { ascending: true }),
      admin
        .from("diviner_live_platform_overrides")
        .select("*")
        .eq("diviner_id", id),
    ]);

  if (registryError || overrideError) {
    return NextResponse.json(
      { error: registryError?.message ?? overrideError?.message ?? "Failed to refresh live platform policy" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    platforms: buildGovernedLivePlatforms(registryRows ?? [], overrideRows ?? []),
  });
}
