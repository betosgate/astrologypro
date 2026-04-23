// migrated-to-canonical-accounts: 2026-04-23 (Task 06)
// Admin-facing per-affiliate detail route. GET joins affiliate_accounts for
// canonical identity fields. PATCH preserves the legacy write-path (dual-
// writes diviner_affiliates.{name,email,phone}) AND mirrors identity updates
// to affiliate_accounts so the canonical row stays in sync. Junction-only
// fields (status, notes, default_commission_*) only write to the junction.

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_affiliates")
    .select(
      `id, diviner_id, user_id, name, email, phone, status, notes,
       default_commission_type, default_commission_value, created_by,
       affiliate_account_id, invited_at, accepted_at,
       created_at, updated_at,
       account:affiliate_accounts (
         id, user_id, email, name, phone, avatar_url, status, tax_form_status
       )`
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const row = data as unknown as {
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
    created_by: string | null;
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

  // Flatten canonical fields into top-level (prefer account, fallback to legacy)
  const flat = {
    ...row,
    name: row.account?.name ?? row.name ?? "",
    email: row.account?.email ?? row.email ?? "",
    phone: row.account?.phone ?? row.phone ?? null,
    user_id: row.account?.user_id ?? row.user_id ?? null,
    avatar_url: row.account?.avatar_url ?? null,
    account_status: row.account?.status ?? null,
    tax_form_status: row.account?.tax_form_status ?? null,
  };

  return NextResponse.json({ data: flat });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
    status,
    notes,
    default_commission_type,
    default_commission_value,
    name,
    email,
    phone,
  } = body as Record<string, unknown>;

  const allowedStatuses = ["pending", "active", "suspended", "blocked"];
  const allowedCommissionTypes = ["percentage", "fixed"];

  if (status !== undefined && !allowedStatuses.includes(status as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid status value" },
      { status: 422 }
    );
  }
  if (default_commission_type !== undefined && !allowedCommissionTypes.includes(default_commission_type as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid commission type" },
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

  // Split writes:
  //   junctionUpdate → columns on diviner_affiliates
  //   accountUpdate  → canonical columns on affiliate_accounts
  // Legacy identity columns (diviner_affiliates.{name,email,phone}) are
  // dual-written for back-compat during the one-release transition window.
  const junctionUpdate: Record<string, unknown> = {};
  const accountUpdate: Record<string, unknown> = {};

  if (typeof status === "string") junctionUpdate.status = status;
  if (typeof notes === "string") junctionUpdate.notes = notes.trim() || null;
  if (typeof default_commission_type === "string") junctionUpdate.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") junctionUpdate.default_commission_value = default_commission_value;

  if (typeof name === "string" && name.trim()) {
    junctionUpdate.name = name.trim();
    accountUpdate.name = name.trim();
  }
  if (typeof email === "string" && email.trim()) {
    const normalized = email.trim().toLowerCase();
    junctionUpdate.email = normalized;
    accountUpdate.email = normalized;
  }
  if (typeof phone === "string") {
    junctionUpdate.phone = phone.trim() || null;
    accountUpdate.phone = phone.trim() || null;
  }

  if (Object.keys(junctionUpdate).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "No updatable fields provided" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Look up the canonical account id so we can mirror identity updates
  const { data: existing } = await admin
    .from("diviner_affiliates")
    .select("affiliate_account_id")
    .eq("id", id)
    .single();

  // Apply junction update
  const { data, error } = await admin
    .from("diviner_affiliates")
    .update(junctionUpdate)
    .eq("id", id)
    .select(
      `id, diviner_id, name, email, phone, status, notes,
       default_commission_type, default_commission_value, updated_at,
       affiliate_account_id`
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error?.message },
      { status: 500 }
    );
  }

  // Mirror identity fields to the canonical account (if any were supplied)
  if (existing?.affiliate_account_id && Object.keys(accountUpdate).length > 0) {
    const { error: accErr } = await admin
      .from("affiliate_accounts")
      .update(accountUpdate)
      .eq("id", existing.affiliate_account_id);
    if (accErr) {
      console.error("[admin/affiliates/patch] canonical account update failed:", {
        junction_id: id,
        account_id: existing.affiliate_account_id,
        error: accErr.message,
      });
      // Junction already updated; fall through with a warning field so the
      // caller can surface it. Dual-write window makes this non-fatal.
      return NextResponse.json({
        data,
        warning: "Junction updated but canonical account mirror failed: " + accErr.message,
      });
    }
  }

  return NextResponse.json({ data });
}
