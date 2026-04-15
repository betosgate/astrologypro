import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_PLANS = ["basic", "premium", "enterprise"] as const;

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list subscriptions for the user's workspaces ───────────────────────

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const sp = req.nextUrl.searchParams;
  const workspaceId = sp.get("workspace_id") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Find workspaces owned by this user
  const { data: workspaces } = await admin
    .from("mundane_workspaces")
    .select("id")
    .eq("owner_id", adminUser.id);

  const ownedIds = (workspaces ?? []).map((w: { id: string }) => w.id);

  if (ownedIds.length === 0) {
    return NextResponse.json({ subscriptions: [], total: 0, page, limit, hasMore: false });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_subscriptions")
    .select(
      "id, workspace_id, subscriber_email, subscriber_user_id, plan, status, access_level, subscribed_at, expires_at",
      { count: "exact" }
    )
    .in("workspace_id", ownedIds);

  if (workspaceId && ownedIds.includes(workspaceId)) {
    query = query.eq("workspace_id", workspaceId);
  }

  query = query
    .order("subscribed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return rfc9457(500, "Internal Server Error", error.message);

  return NextResponse.json({
    subscriptions: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

// ─── POST — add a subscriber ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const body = await req.json() as {
    workspace_id?: string;
    subscriber_email?: string;
    plan?: string;
    expires_at?: string | null;
  };

  if (!body.workspace_id) return rfc9457(422, "Validation Error", "workspace_id is required");
  if (!body.subscriber_email?.trim()) return rfc9457(422, "Validation Error", "subscriber_email is required");

  const emailLower = body.subscriber_email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return rfc9457(422, "Validation Error", "subscriber_email is not a valid email");
  }

  const plan = body.plan ?? "basic";
  if (!(VALID_PLANS as readonly string[]).includes(plan)) {
    return rfc9457(422, "Validation Error", `plan must be one of: ${VALID_PLANS.join(", ")}`);
  }

  const admin = createAdminClient();

  // Verify the workspace is owned by this admin
  const { data: workspace, error: wsError } = await admin
    .from("mundane_workspaces")
    .select("id")
    .eq("id", body.workspace_id)
    .eq("owner_id", adminUser.id)
    .single();

  if (wsError || !workspace) {
    return rfc9457(403, "Forbidden", "Workspace not found or access denied");
  }

  // Look up the auth user by email (optional — subscriber may not have an account yet)
  let subscriberUserId: string | null = null;
  const supabase = await createClient();
  const { data: userSearch } = await supabase.rpc("get_user_id_by_email" as never, {
    p_email: emailLower,
  } as never);
  if (userSearch) subscriberUserId = userSearch as string;

  const { data: subscription, error } = await admin
    .from("mundane_subscriptions")
    .upsert(
      {
        workspace_id: body.workspace_id,
        subscriber_email: emailLower,
        subscriber_user_id: subscriberUserId,
        plan,
        status: "active",
        access_level: "viewer",
        subscribed_at: new Date().toISOString(),
        expires_at: body.expires_at ?? null,
      },
      { onConflict: "workspace_id,subscriber_email" }
    )
    .select()
    .single();

  if (error) return rfc9457(500, "Internal Server Error", error.message);

  return NextResponse.json(subscription, { status: 201 });
}
