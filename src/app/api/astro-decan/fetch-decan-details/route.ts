import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/astro-decan/fetch-decan-details
 *
 * Returns the full astro_decan_new_infos row for the given (planet, signs)
 * pair. Replaces the legacy NestJS endpoint
 * `astro_decan_new_infos/fetch-decan-details` documented in
 * `tasks/08.04.2026/astro-toolkit/decan_info_find_api.md`.
 *
 * Request body:
 *   { signs: string, planet: string }
 *
 * Response (200):
 *   { status: "success", message, results: { … full row … } }
 *
 * Response (400 invalid body / missing fields):
 *   { status: "error", message }
 *
 * Response (404 not found):
 *   { status: "error", message: "Decan not found" }
 *
 * Response (500 unhandled):
 *   { status: "error", message }
 *
 * Public — RLS on astro_decan_new_infos allows public SELECT (reference content).
 */
export async function POST(req: NextRequest) {
  let body: { signs?: unknown; planet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const signs = typeof body.signs === "string" ? body.signs.trim() : "";
  const planet = typeof body.planet === "string" ? body.planet.trim() : "";

  if (!signs || !planet) {
    return NextResponse.json(
      {
        status: "error",
        message: "Both 'signs' and 'planet' are required (non-empty strings)",
      },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("astro_decan_new_infos")
      .select(
        "id, mongo_id, planet, signs, decan, tarot_name, tarot_card_big_image, tarot_card_thumb_image, greek_daemon, planet_sign_short_desc, planet_sign_long_desc, tarot_short_desc, tarot_long_desc, daemon_short_desc, daemon_long_desc, decan_img, created_at, updated_at",
      )
      .eq("planet", planet)
      .eq("signs", signs)
      .maybeSingle();

    if (error) {
      console.error("[astro-decan/fetch-decan-details] query error:", error);
      return NextResponse.json(
        { status: "error", message: "Something went wrong" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { status: "error", message: "Decan not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Decan details fetched successfully",
      results: data,
    });
  } catch (err) {
    console.error("[astro-decan/fetch-decan-details] unhandled error:", err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong" },
      { status: 500 },
    );
  }
}
