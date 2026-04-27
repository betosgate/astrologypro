// Task 05 — PATCH /api/affiliate/profile
//
// Allows the authenticated affiliate to update their canonical profile
// fields: name, phone, avatar_url, timezone. payout_method + payout_details
// are editable too — details stored as JSONB. email is NOT editable here
// (tied to auth.users; requires a separate flow). user_id is immutable from
// this endpoint (guarded by trigger).
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.io/${status}`, title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

const PAYOUT_METHODS = new Set(["bank", "paypal", "check", "other"]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const b = body as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  if (typeof b.name === "string") {
    const trimmed = b.name.trim();
    if (!trimmed) return problem(422, "Validation error", "name cannot be empty");
    update.name = trimmed;
  }
  if (b.phone !== undefined) {
    update.phone = typeof b.phone === "string" && b.phone.trim() ? b.phone.trim() : null;
  }
  if (b.avatar_url !== undefined) {
    update.avatar_url =
      typeof b.avatar_url === "string" && b.avatar_url.trim() ? b.avatar_url.trim() : null;
  }
  if (b.timezone !== undefined) {
    update.timezone =
      typeof b.timezone === "string" && b.timezone.trim() ? b.timezone.trim() : null;
  }
  if (b.payout_method !== undefined) {
    if (b.payout_method === null) update.payout_method = null;
    else if (typeof b.payout_method === "string" && PAYOUT_METHODS.has(b.payout_method)) {
      update.payout_method = b.payout_method;
    } else {
      return problem(
        422,
        "Validation error",
        "payout_method must be one of bank, paypal, check, other",
      );
    }
  }
  if (b.payout_details !== undefined) {
    if (b.payout_details === null || typeof b.payout_details === "object") {
      update.payout_details = b.payout_details;
    } else {
      return problem(422, "Validation error", "payout_details must be an object or null");
    }
  }

  if (Object.keys(update).length === 0) {
    return problem(422, "No updatable fields provided");
  }

  const { data, error } = await admin
    .from("affiliate_accounts")
    .update(update)
    .eq("id", ctx.account.id)
    .select(
      "id, email, name, phone, avatar_url, timezone, payout_method, tax_form_status, status",
    )
    .single();

  if (error) return problem(500, "Database error", error.message);

  return NextResponse.json({ data });
}
