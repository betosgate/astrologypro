import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/searched-toolkit/list
 * 
 * Lists all saved AI responses for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    // Master admin check
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch toolkit records.
    //
    // Why we also select `ai_response` here:
    //   The standalone `form_data` column is frequently empty for older
    //   rows because earlier toolkit save paths persisted form input
    //   only inside the AI artifact body (under `ai_response.formData`
    //   or `ai_response.form_data`). To match what the details endpoint
    //   exposes, we project that nested copy back into a top-level
    //   `form_data` field on each list row. We then drop the heavy
    //   `ai_response` blob to keep list payload size reasonable.
    const { data: records, error } = await admin
      .from("astro_ai_responses")
      .select("id, toolname, form_data, ai_response, created_at, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user details from Auth Admin
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();

    // Create a map of user_id -> { name, email }
    const userMap: Record<string, { name: string; email: string }> = {};
    if (!authError && authUsers?.users) {
      const users = authUsers.users as Array<{
        id: string;
        user_metadata?: Record<string, any> | null;
        email?: string | null;
      }>;

      users.forEach(u => {
        userMap[u.id] = {
          name: u.user_metadata?.name || "Unknown User",
          email: u.email || "No Email"
        };
      });
    }

    /**
     * Resolve the effective form_data for a list row.
     *
     * Resolution order:
     *   1. The `form_data` column when it carries actual content
     *      (i.e. a non-empty object/array).
     *   2. `ai_response.formData` — the camelCase shape the toolkit
     *      saves under (matches the details endpoint sample).
     *   3. `ai_response.form_data` — older snake_case variant.
     *   4. Empty object as last resort.
     *
     * We treat `{}` and `[]` from the column as "empty" because the
     * legacy save path defaulted them to empty objects when the real
     * data went into `ai_response`.
     */
    function resolveFormData(
      raw: unknown,
      aiResponse: unknown
    ): Record<string, unknown> | unknown[] {
      const isNonEmptyObject = (v: unknown): boolean =>
        !!v &&
        typeof v === "object" &&
        (Array.isArray(v) ? v.length > 0 : Object.keys(v as object).length > 0);

      if (isNonEmptyObject(raw)) {
        return raw as Record<string, unknown> | unknown[];
      }

      if (aiResponse && typeof aiResponse === "object") {
        const ai = aiResponse as Record<string, unknown>;
        if (isNonEmptyObject(ai.formData)) {
          return ai.formData as Record<string, unknown> | unknown[];
        }
        if (isNonEmptyObject(ai.form_data)) {
          return ai.form_data as Record<string, unknown> | unknown[];
        }
      }

      return {};
    }

    // Merge user info into records, derive form_data, drop ai_response
    // blob from list payload.
    const enrichedResults = records.map(r => {
      const row = r as Record<string, any>;
      const merged = {
        ...row,
        form_data: resolveFormData(row.form_data, row.ai_response),
        user_name: userMap[row.user_id]?.name || "Unknown",
        user_email: userMap[row.user_id]?.email || "N/A",
      };
      // Strip the heavy artifact body — list rows only need form_data.
      delete merged.ai_response;
      return merged;
    });

    return NextResponse.json({ status: "success", results: enrichedResults });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
