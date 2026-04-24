// Task 05 — GET /api/affiliate/me
//
// Returns the caller's canonical affiliate account + partnership count.
// Used by portal pages that need quick account context.
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  return NextResponse.json({
    data: {
      id: ctx.account.id,
      email: ctx.account.email,
      name: ctx.account.name,
      phone: ctx.account.phone,
      avatar_url: ctx.account.avatar_url,
      timezone: ctx.account.timezone,
      status: ctx.account.status,
      tax_form_status: ctx.account.tax_form_status,
      payout_method: ctx.account.payout_method,
      notification_prefs: ctx.account.notification_prefs,
      partnership_count: ctx.junctionIds.length,
    },
  });
}
