// migrated-to-canonical-accounts: 2026-04-23
// GET /api/affiliate/links — referral links across ALL of the caller's
// diviner partnerships.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

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

export async function GET() {
  if (!isAffiliateIdentityV2Enabled()) return problem(503, "Feature not available");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await admin
    .from("affiliate_referral_links")
    .select(
      "id, affiliate_id, diviner_id, slug, url, product_id, product_type, clicks, conversions, is_active, created_at",
    )
    .in("affiliate_id", ctx.junctionIds)
    .order("created_at", { ascending: false });

  if (error) return problem(500, "Database error", error.message);

  return NextResponse.json({ data: data ?? [] });
}
