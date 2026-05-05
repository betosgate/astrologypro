import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/searched-toolkit/bulk-delete
 *
 * Body: { ids: string[] }
 *
 * Deletes selected astro_ai_responses rows from the admin searched-toolkit
 * archive. The UI loads the archive client-side, so bulk delete operates on
 * explicit ids rather than a broad "delete everything" flag.
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { ids?: unknown }
      | null;
    const ids = Array.isArray(body?.ids)
      ? Array.from(
        new Set(
          body.ids.filter(
            (id): id is string => typeof id === "string" && id.trim().length > 0,
          ),
        ),
      )
      : [];

    if (!ids.length) {
      return NextResponse.json(
        { error: "At least one record ID is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("astro_ai_responses")
      .delete()
      .in("id", ids)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deletedIds = (data ?? [])
      .map((row) => (row as { id?: unknown }).id)
      .filter((id): id is string => typeof id === "string");

    return NextResponse.json({
      status: "success",
      message: `${deletedIds.length} record${deletedIds.length === 1 ? "" : "s"} deleted successfully`,
      deletedIds,
      deletedCount: deletedIds.length,
    });
  } catch (err) {
    console.error("[admin/searched-toolkit/bulk-delete] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
