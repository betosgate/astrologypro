// migrated-to-canonical-accounts: 2026-04-23 (Task 06)
// Admin-facing list + create for diviner_affiliates. GET joins the canonical
// affiliate_accounts row and flattens to preserve the pre-refactor response
// shape. POST creates the junction via the canonical helper so admin-created
// affiliates end up with an affiliate_accounts row too (no silent bypass of
// the identity model).

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";
import { upsertAffiliateAccount } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates
// Query: diviner_id?, status?, q?, limit?, cursor?
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const divinerId = searchParams.get("diviner_id");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("diviner_affiliates")
    .select(
      `id, diviner_id, user_id, name, email, phone, status, notes,
       default_commission_type, default_commission_value,
       affiliate_account_id, invited_at, accepted_at, created_at, updated_at,
       account:affiliate_accounts (
         id, user_id, email, name, phone, avatar_url, status, tax_form_status
       )`
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (divinerId) query = query.eq("diviner_id", divinerId);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (cursor) query = query.lt("id", cursor);

  const { data: raw, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  type Row = {
    id: string;
    diviner_id: string;
    user_id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    notes: string | null;
    default_commission_type: string | null;
    default_commission_value: number | null;
    affiliate_account_id: string | null;
    invited_at: string | null;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
    account: {
      id: string;
      user_id: string | null;
      email: string;
      name: string;
      phone: string | null;
      avatar_url: string | null;
      status: string;
      tax_form_status: string;
    } | null;
  };
  const rows = (raw ?? []) as unknown as Row[];

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const items = page.map((r) => ({
    ...r,
    // Prefer canonical identity, fallback to legacy columns
    name: r.account?.name ?? r.name ?? "",
    email: r.account?.email ?? r.email ?? "",
    phone: r.account?.phone ?? r.phone ?? null,
    user_id: r.account?.user_id ?? r.user_id ?? null,
    avatar_url: r.account?.avatar_url ?? null,
    account_status: r.account?.status ?? null,
    tax_form_status: r.account?.tax_form_status ?? null,
  }));

  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/admin/affiliates
// Admin direct-add. Creates a canonical affiliate_accounts row AND the
// diviner_affiliates junction so the identity model isn't bypassed.
// Body: { diviner_id, name, email, phone?, notes?, default_commission_type?, default_commission_value? }
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const {
    diviner_id,
    name,
    email,
    phone,
    notes,
    default_commission_type,
    default_commission_value,
  } = body as Record<string, unknown>;

  if (
    typeof diviner_id !== "string" || diviner_id.trim() === "" ||
    typeof name !== "string" || name.trim() === "" ||
    typeof email !== "string" || email.trim() === ""
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "diviner_id, name, and email are required." },
      { status: 422 }
    );
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: default_commission_type,
      commissionValue: default_commission_value,
    });
  } catch (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Upsert canonical account (creates status='unclaimed' if new; reuses if exists)
  let account;
  try {
    const result = await upsertAffiliateAccount(admin, {
      email: (email as string).trim().toLowerCase(),
      name: (name as string).trim(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    });
    account = result.account;
  } catch (err) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Failed to resolve canonical account", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // Reject if the canonical account is blocked platform-wide
  if (account.status === "blocked") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Affiliate account is blocked platform-wide" },
      { status: 403 }
    );
  }

  // Insert junction — dual-writes legacy columns for pre-Task-06 readers
  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner_id.trim(),
    affiliate_account_id: account.id,
    name: (name as string).trim(),
    email: (email as string).trim().toLowerCase(),
    status: "active",
    created_by: user.id,
    accepted_at: new Date().toISOString(),
  };
  if (typeof phone === "string" && phone.trim()) insertPayload.phone = phone.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();
  if (typeof default_commission_type === "string") insertPayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") insertPayload.default_commission_value = default_commission_value;

  const { data, error } = await admin
    .from("diviner_affiliates")
    .insert(insertPayload)
    .select(
      "id, diviner_id, name, email, phone, status, default_commission_type, default_commission_value, affiliate_account_id, accepted_at, created_at"
    )
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { type: `https://httpstatuses.io/${status}`, title: status === 409 ? "Duplicate affiliate for this diviner" : "Database error", detail: error.message },
      { status }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
