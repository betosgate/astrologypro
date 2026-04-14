import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const SERVICE_AREA_MODES = ["local", "multi_region", "remote_global"] as const;

function normalizeString(value: unknown, maxLength?: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeUrlArray(value: unknown) {
  return normalizeStringArray(value).filter((entry) => {
    try {
      const url = new URL(entry);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });
}

function normalizeSeoPayload(body: Record<string, unknown>) {
  const seoServiceAreaMode = normalizeString(body.seo_service_area_mode);
  if (
    seoServiceAreaMode &&
    !SERVICE_AREA_MODES.includes(seoServiceAreaMode as (typeof SERVICE_AREA_MODES)[number])
  ) {
    throw new Error("Invalid seo_service_area_mode");
  }

  const seoOgImageUrl = normalizeString(body.seo_og_image_url);
  if (seoOgImageUrl) {
    try {
      new URL(seoOgImageUrl);
    } catch {
      throw new Error("seo_og_image_url must be a valid URL");
    }
  }

  const updates = {
    seo_city: normalizeString(body.seo_city, 120),
    seo_region: normalizeString(body.seo_region, 120),
    seo_country: normalizeString(body.seo_country, 120),
    seo_country_code: normalizeString(body.seo_country_code, 2)?.toUpperCase() ?? null,
    seo_service_area_mode: seoServiceAreaMode,
    seo_service_areas: normalizeStringArray(body.seo_service_areas),
    seo_is_remote_global: body.seo_is_remote_global === true,
    seo_languages: normalizeStringArray(body.seo_languages),
    seo_credentials: normalizeStringArray(body.seo_credentials),
    seo_awards: normalizeStringArray(body.seo_awards),
    seo_years_experience:
      typeof body.seo_years_experience === "number"
        ? Math.max(0, Math.min(80, Math.floor(body.seo_years_experience)))
        : null,
    seo_same_as_urls: normalizeUrlArray(body.seo_same_as_urls),
    seo_press_mentions: normalizeUrlArray(body.seo_press_mentions),
    seo_title_override: normalizeString(body.seo_title_override, 70),
    seo_description_override: normalizeString(body.seo_description_override, 160),
    seo_h1_override: normalizeString(body.seo_h1_override, 120),
    seo_primary_keyword: normalizeString(body.seo_primary_keyword, 80),
    seo_secondary_keywords: normalizeStringArray(body.seo_secondary_keywords),
    seo_og_image_url: seoOgImageUrl,
    seo_show_aggregate_rating: body.seo_show_aggregate_rating !== false,
    seo_show_testimonials_in_schema: body.seo_show_testimonials_in_schema !== false,
  };

  if (updates.seo_city && !updates.seo_country) {
    throw new Error("seo_country is required when seo_city is set");
  }
  if (updates.seo_service_area_mode === "local" && !updates.seo_city) {
    throw new Error("seo_city is required when seo_service_area_mode is local");
  }

  return updates;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diviners")
    .select(`
      id,
      seo_city,
      seo_region,
      seo_country,
      seo_country_code,
      seo_service_area_mode,
      seo_service_areas,
      seo_is_remote_global,
      seo_languages,
      seo_credentials,
      seo_awards,
      seo_years_experience,
      seo_same_as_urls,
      seo_press_mentions,
      seo_title_override,
      seo_description_override,
      seo_h1_override,
      seo_primary_keyword,
      seo_secondary_keywords,
      seo_og_image_url,
      seo_show_aggregate_rating,
      seo_show_testimonials_in_schema
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Diviner not found" }, { status: 404 });
  }

  return NextResponse.json({ seo: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updates = normalizeSeoPayload(body);
    const admin = createAdminClient();
    const { data: divinerRow, error: divinerError } = await admin
      .from("diviners")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (divinerError || !divinerRow) {
      return NextResponse.json(
        { error: divinerError?.message ?? "Diviner not found" },
        { status: 404 },
      );
    }

    const { data, error } = await admin
      .from("diviners")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        seo_city,
        seo_region,
        seo_country,
        seo_country_code,
        seo_service_area_mode,
        seo_service_areas,
        seo_is_remote_global,
        seo_languages,
        seo_credentials,
        seo_awards,
        seo_years_experience,
        seo_same_as_urls,
        seo_press_mentions,
        seo_title_override,
        seo_description_override,
        seo_h1_override,
        seo_primary_keyword,
        seo_secondary_keywords,
        seo_og_image_url,
        seo_show_aggregate_rating,
        seo_show_testimonials_in_schema
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await admin.from("admin_user_notes").insert({
      note: `Diviner SEO settings updated: ${JSON.stringify(updates)}`,
      role: "diviner",
      created_by: adminUser.email ?? "admin",
      user_id: divinerRow.user_id,
    });

    return NextResponse.json({ seo: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update SEO settings" },
      { status: 422 },
    );
  }
}
