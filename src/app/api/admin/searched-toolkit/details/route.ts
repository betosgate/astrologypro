import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/searched-toolkit/details?id=[id]
 *
 * Fetches the full saved astro toolkit artifact from public.astro_ai_responses.
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid record ID format" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: record, error } = await admin
      .from("astro_ai_responses")
      .select(
        [
          "id",
          "user_id",
          "condition",
          "toolname",
          "ai_response",
          "json_condition",
          "chat_response",
          "chat_questions",
          "natal_chart",
          "form_data",
          "astro_api_data",
          "summary",
          "free_natal_wheel_chart",
          "free_natal_wheel_chart_transit",
          "free_natal_wheel_chart_self",
          "free_natal_wheel_chart_partner",
          "free_natal_wheel_chart_p2",
          "free_natal_wheel_chart_transit_p2",
          "response_share_url",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const savedRecord = record as Record<string, any>;
    let user_name = "Unknown";
    let user_email = "N/A";
    if (savedRecord.user_id) {
      const { data: userResult } = await admin.auth.admin.getUserById(savedRecord.user_id);
      const user = userResult?.user;
      if (user) {
        user_name = user.user_metadata?.name || "Unknown";
        user_email = user.email || "N/A";
      }
    }

    return NextResponse.json({
      status: "success",
      result: {
        ...savedRecord,
        user_name,
        user_email,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
