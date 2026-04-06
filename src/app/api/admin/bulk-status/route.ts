import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ROLE_TABLE_MAP: Record<string, string> = {
  diviner:   "diviners",
  client:    "clients",
  advocate:  "social_advocates",
  community: "community_members",
  trainee:   "trainees",
};

// ─── POST /api/admin/bulk-status ─────────────────────────────────────────────
// Body: { user_ids: string[], status: 'active' | 'blocked', role?: string }
//
// If status === 'blocked': bans the auth user (sets banned_until to far future)
// If status === 'active': lifts the ban AND activates the profile row
// role is optional — when provided, scopes the profile update to that table only

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { user_ids?: unknown; status?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const user_ids: string[] = Array.isArray(body.user_ids)
    ? (body.user_ids as string[]).filter((id) => typeof id === "string" && id.trim())
    : [];
  const status = body.status === "active" || body.status === "blocked" ? body.status : null;
  const role   = typeof body.role === "string" ? body.role : null;

  if (user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required and must not be empty" }, { status: 422 });
  }
  if (!status) {
    return NextResponse.json({ error: "status must be 'active' or 'blocked'" }, { status: 422 });
  }

  const admin = createAdminClient();
  let updated = 0;
  let failed  = 0;

  // Determine which tables to update profile rows in
  const tablesToUpdate: string[] = role && ROLE_TABLE_MAP[role]
    ? [ROLE_TABLE_MAP[role]]
    : Object.values(ROLE_TABLE_MAP);

  if (status === "blocked") {
    // Ban via Supabase Auth admin API, then deactivate profile rows
    const bannedUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100).toISOString(); // ~100 years

    for (const userId of user_ids) {
      try {
        const { error } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: "876000h", // 100 years
        });
        if (error) throw error;

        // Deactivate profile rows in relevant tables
        for (const table of tablesToUpdate) {
          if (table === "clients" || table === "community_members") continue; // no is_active column
          await admin.from(table).update({ is_active: false }).eq("user_id", userId);
        }

        updated++;
      } catch (err) {
        console.error(`[bulk-status] Failed to block user ${userId}:`, err);
        failed++;
      }
    }
  } else {
    // Unban via Supabase Auth admin API, then re-activate profile rows
    for (const userId of user_ids) {
      try {
        const { error } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) throw error;

        // Re-activate profile rows in relevant tables
        for (const table of tablesToUpdate) {
          if (table === "clients" || table === "community_members") continue;
          await admin.from(table).update({ is_active: true }).eq("user_id", userId);
        }

        updated++;
      } catch (err) {
        console.error(`[bulk-status] Failed to unblock user ${userId}:`, err);
        failed++;
      }
    }
  }

  // Log to admin activity log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: null,
    action_type:   `bulk_${status}`,
    details: {
      user_count: user_ids.length,
      updated,
      failed,
      role: role ?? "all",
    },
  }).maybeSingle();

  return NextResponse.json({ updated, failed });
}
