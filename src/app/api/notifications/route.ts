import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Returns the authenticated user's notifications, newest first, limited to 20.
 * Query: ?unread_only=true  (default: false — returns all)
 * Response: { notifications: Notification[], unread_count: number }
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = req.nextUrl.searchParams.get("unread_only") === "true";
  const admin = createAdminClient();

  // Build the list query
  let listQuery = admin
    .from("notifications")
    .select("id, title, body, type, action_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (unreadOnly) {
    listQuery = listQuery.eq("is_read", false);
  }

  const { data: notifications, error } = await listQuery;

  if (error) {
    console.error("[GET /api/notifications]", error.message);
    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }

  // Count unread separately so the badge is always accurate even when listing all
  const { count: unread_count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return NextResponse.json({ notifications: notifications ?? [], unread_count: unread_count ?? 0 });
}

/**
 * POST /api/notifications
 * Creates a notification. In production this should be called only from server-side
 * helpers (service_role key). The endpoint validates the session and writes via the
 * admin client so it can insert for any user_id.
 *
 * Body: { user_id, title, body?, type?, action_url? }
 * Response: { notification }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    user_id?: string;
    title?: string;
    body?: string;
    type?: string;
    action_url?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 422 });
  }

  const { user_id, title, body: notifBody, type = "info", action_url } = body;

  if (!user_id || typeof user_id !== "string") {
    return NextResponse.json({ error: "user_id is required." }, { status: 422 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required." }, { status: 422 });
  }

  const VALID_TYPES = ["info", "success", "warning", "error", "training", "ritual", "billing", "system"];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}.` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: notification, error } = await admin
    .from("notifications")
    .insert({
      user_id,
      title: title.slice(0, 255),
      body: notifBody ?? null,
      type,
      action_url: action_url ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/notifications]", error.message);
    return NextResponse.json(
      { error: "Failed to create notification." },
      { status: 500 }
    );
  }

  return NextResponse.json({ notification }, { status: 201 });
}
