// GET /api/affiliate/links — share URLs the caller can use to refer
// business. Backed by `affiliate_campaigns` in System B.
//
// 2026-04-24: rewired off `affiliate_referral_links` (deleted). Each row
// now represents an affiliate-owned campaign. The `share_url` field
// points at `/r/<campaign_code>`, which `/r/[code]` resolves to the
// campaign's destination with `?ref=<campaign_code>` stamped.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

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
    .from("affiliate_campaigns")
    .select(
      "id, owner_affiliate_id, diviner_id, campaign_code, name, status, destination_type, destination_service_template_id, created_at",
    )
    .eq("owner_affiliate_type", "diviner_affiliate")
    .in("owner_affiliate_id", ctx.junctionIds)
    .order("created_at", { ascending: false });

  if (error) return problem(500, "Database error", error.message);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const rows = (data ?? []).map((c) => ({
    id: c.id,
    campaign_code: c.campaign_code,
    name: c.name,
    status: c.status,
    diviner_id: c.diviner_id,
    destination_type: c.destination_type,
    destination_service_template_id: c.destination_service_template_id,
    share_url: `${appUrl}/r/${c.campaign_code}`,
    created_at: c.created_at,
  }));

  return NextResponse.json({ data: rows });
}
