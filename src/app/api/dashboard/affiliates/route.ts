// migrated-to-canonical-accounts: 2026-04-23
// Task 02 — direct-add POST removed. Every affiliate relationship now requires
// an explicit invite + accept flow. See POST /api/dashboard/affiliates/invite.
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/02-invite-flow-refactor.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates
// Returns the authenticated diviner's affiliates, paginated.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  // Resolve diviner record for this user
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  let query = admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_at, updated_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// NOTE: Task 06 will rewrite GET to JOIN affiliate_accounts for canonical
// identity (name/email/phone/avatar/status). For Task 02 the GET shape is
// preserved — existing UI keeps working against legacy columns.
