import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch mundane_access rows with email lookup via RPC or direct join on auth.users
  const { data, error } = await admin
    .from("mundane_access")
    .select("id, user_id, access_level, granted_by, granted_at, notes")
    .order("granted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json({ access: [] });
  }

  // Look up emails for all user_ids
  const userIds = [...new Set(data.map((r) => r.user_id))];
  const authRes = await admin.rpc("get_auth_users_by_ids", { user_ids: userIds });
  const emailMap: Record<string, string> = {};
  for (const u of (authRes.data ?? []) as Array<{ user_id: string; email: string }>) {
    emailMap[u.user_id] = u.email ?? "";
  }

  // Look up granter emails
  const granterIds = [...new Set(data.map((r) => r.granted_by).filter(Boolean))];
  let granterEmailMap: Record<string, string> = {};
  if (granterIds.length > 0) {
    const granterRes = await admin.rpc("get_auth_users_by_ids", {
      user_ids: granterIds as string[],
    });
    for (const u of (granterRes.data ?? []) as Array<{ user_id: string; email: string }>) {
      granterEmailMap[u.user_id] = u.email ?? "";
    }
  }

  const access = data.map((row) => ({
    ...row,
    user_email: emailMap[row.user_id] ?? "",
    granted_by_email: row.granted_by ? granterEmailMap[row.granted_by] ?? "" : null,
  }));

  return NextResponse.json({ access });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, access_level, notes } = body;

  if (!email || !access_level) {
    return NextResponse.json(
      { error: "email and access_level are required" },
      { status: 422 }
    );
  }

  if (!["read", "write"].includes(access_level)) {
    return NextResponse.json(
      { error: "access_level must be 'read' or 'write'" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Find user by email using auth.users
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1 });
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  // Use direct lookup via RPC if available, else fall back to listUsers search
  // We need to find the user by email — use Supabase auth admin API
  const { data: { users: allUsers }, error: searchErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  void users; // used above for error checking only
  if (searchErr) return NextResponse.json({ error: searchErr.message }, { status: 500 });

  const targetUser = allUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!targetUser) {
    return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  const { data, error } = await admin
    .from("mundane_access")
    .upsert(
      {
        user_id: targetUser.id,
        access_level,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        notes: notes ?? null,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
