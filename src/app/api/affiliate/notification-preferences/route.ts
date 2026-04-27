// PATCH /api/affiliate/notification-preferences
//
// Persists the affiliate's per-kind per-channel notification toggles
// into `affiliate_accounts.notification_prefs` (JSONB). The merge is
// shallow per-kind: keys not in the request are left untouched.
//
// Body: { prefs: Record<kind, { email: boolean; in_app: boolean }> }
//
// Spec: docs/specs/affiliate-commission-system.md §3.6 + §7

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

const VALID_KINDS = new Set([
  "affiliate.assigned",
  "affiliate.rate_changed",
  "affiliate.revoked",
  "affiliate.conversion",
  "affiliate.reversal",
  "admin.override.assignment_revoked",
  "admin.override.campaign_archived",
]);

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

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
  const b = (body ?? {}) as Record<string, unknown>;
  const incoming = b.prefs;
  if (!incoming || typeof incoming !== "object") {
    return problem(422, "Validation error", "prefs object is required");
  }

  // Validate + sanitize: only known kinds, each with boolean email/in_app.
  const sanitized: Record<string, { email: boolean; in_app: boolean }> = {};
  for (const [kind, value] of Object.entries(
    incoming as Record<string, unknown>,
  )) {
    if (!VALID_KINDS.has(kind)) continue;
    if (!value || typeof value !== "object") continue;
    const v = value as { email?: unknown; in_app?: unknown };
    sanitized[kind] = {
      email: Boolean(v.email),
      in_app: Boolean(v.in_app),
    };
  }

  // Merge with existing prefs so unrelated keys aren't wiped.
  const merged: Record<string, unknown> = {
    ...((ctx.account.notification_prefs as Record<string, unknown>) ?? {}),
    ...sanitized,
  };

  const { error } = await admin
    .from("affiliate_accounts")
    .update({
      notification_prefs: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.account.id);

  if (error) return problem(500, "Database error", error.message);

  return NextResponse.json({ data: { prefs: merged } });
}
