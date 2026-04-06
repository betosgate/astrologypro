import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const email = sp.get("email")?.trim() ?? "";
  const userId = sp.get("user_id")?.trim() ?? "";
  // cursor-based pagination: cursor is the sent_at of the last item
  const cursor = sp.get("cursor") ?? "";

  if (!email && !userId) {
    return NextResponse.json(
      { error: "Provide email or user_id query param" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve user_id from email if needed
  let resolvedUserId: string | null = userId || null;

  if (!resolvedUserId && email) {
    // Look up the user by email via the auth admin API
    const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1 });
    // We can't filter by email in listUsers efficiently — use a direct query to
    // community_members which stores the email
    const { data: member } = await admin
      .from("community_members")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();

    resolvedUserId = member?.user_id ?? null;
  }

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("email_send_log")
    .select("id, email_to, template_name, subject, metadata, sent_at")
    .order("sent_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (resolvedUserId) {
    query = query.eq("user_id", resolvedUserId);
  } else {
    // Fall back to email_to match
    query = query.ilike("email_to", email);
  }

  if (cursor) {
    query = query.lt("sent_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1].sent_at : null;

  return NextResponse.json({ items, hasMore, nextCursor });
}
