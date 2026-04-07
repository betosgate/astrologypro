import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BulkAction = "activate" | "suspend" | "archive" | "delete";

const TABLE_MAP: Record<string, string> = {
  diviner: "diviners",
  client: "clients",
  advocate: "social_advocates",
  community: "community_members",
  trainee: "trainees",
};

// ─── POST /api/admin/users/bulk ───────────────────────────────────────────────
// Applies an action to a list of user IDs.
// Body: { userIds: string[], action: 'activate' | 'suspend' | 'archive' | 'delete' }
// Returns: { succeeded: string[], failed: { id: string, reason: string }[] }

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userIds, action } = body as { userIds?: string[]; action?: BulkAction };

  const allowedActions: BulkAction[] = ["activate", "suspend", "archive", "delete"];
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds must be a non-empty array" }, { status: 422 });
  }
  if (!action || !allowedActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${allowedActions.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const userId of userIds) {
    try {
      // Determine which table this user belongs to
      let userTable: string | null = null;
      let userRole: string | null = null;
      let rowId: string | null = null;
      let originalRow: Record<string, unknown> | null = null;

      for (const [role, table] of Object.entries(TABLE_MAP)) {
        const { data } = await admin
          .from(table)
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          userTable = table;
          userRole = role;
          rowId = data.id;
          break;
        }
      }

      if (!userTable || !rowId || !userRole) {
        failed.push({ id: userId, reason: "Profile not found" });
        continue;
      }

      switch (action) {
        case "activate": {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: Record<string, any> = {};
          if (!["client", "community"].includes(userRole)) updates.is_active = true;
          if (Object.keys(updates).length > 0) {
            const { error } = await admin.from(userTable).update(updates).eq("id", rowId);
            if (error) { failed.push({ id: userId, reason: error.message }); continue; }
          }
          break;
        }
        case "suspend": {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: Record<string, any> = {};
          if (!["client", "community"].includes(userRole)) updates.is_active = false;
          if (Object.keys(updates).length > 0) {
            const { error } = await admin.from(userTable).update(updates).eq("id", rowId);
            if (error) { failed.push({ id: userId, reason: error.message }); continue; }
          }
          break;
        }
        case "archive":
        case "delete": {
          // Fetch the original row for archiving
          const { data: row, error: fetchErr } = await admin
            .from(userTable)
            .select("*")
            .eq("id", rowId)
            .maybeSingle();

          if (fetchErr || !row) {
            failed.push({ id: userId, reason: "Could not fetch profile row for archival" });
            continue;
          }
          originalRow = row as Record<string, unknown>;

          const { error: archiveErr } = await admin.from("deleted_users").insert({
            user_id: userId,
            original_role: userRole,
            original_row_id: rowId,
            original_table: userTable,
            original_data: originalRow,
            deleted_by: adminUser.email,
          });

          if (archiveErr) { failed.push({ id: userId, reason: archiveErr.message }); continue; }

          // Mark inactive
          if (!["client", "community"].includes(userRole)) {
            await admin.from(userTable).update({ is_active: false }).eq("id", rowId);
          }
          break;
        }
      }

      // Log to admin_activity_log
      await admin
        .from("admin_activity_log")
        .insert({
          admin_user_id: adminUser.email,
          target_user_id: userId,
          action_type: `bulk_${action}`,
          details: { action, userTable, rowId },
        })
        .maybeSingle();

      succeeded.push(userId);
    } catch (err) {
      failed.push({
        id: userId,
        reason: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
