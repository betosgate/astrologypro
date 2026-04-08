import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/astro-decan/fetch-planet-signs
 *
 * Returns every planet/sign combination stored in `astro_decan_new_infos`,
 * ordered by planet then signs (with `id` as a deterministic tie-breaker).
 *
 * Replaces the legacy NestJS `astro_decan_new_infos/fetch-planet-signs`
 * endpoint. The table is reference content (read-only seed data) so this
 * route is intentionally public — RLS allows public SELECT on the table.
 *
 * Response (success): { status: "success", message, results: [{ planet, signs }] }
 * Response (error):   { status: "error", message } with HTTP 500
 *
 * Behaviour matches the spec in
 * `tasks/08.04.2026/astro-toolkit/astro_decan_info_api_logic.md`.
 */
export async function GET() {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("astro_decan_new_infos")
      .select("planet, signs")
      .order("planet", { ascending: true })
      .order("signs", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("[astro-decan/fetch-planet-signs] query error:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Something went wrong",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Planet signs fetched successfully",
      results: data ?? [],
    });
  } catch (err) {
    console.error("[astro-decan/fetch-planet-signs] unhandled error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
