// Task 05 — GET /api/affiliate/partnerships
//
// List of diviner partnerships for the authenticated affiliate.
// Each row: junction (status, commission, timestamps) + diviner display info
// + commission-to-date (from affiliate_commissions sum).
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

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Junctions for this caller, with diviner display data
  const { data: junctions, error } = await admin
    .from("diviner_affiliates")
    .select(
      `id, diviner_id, status, default_commission_type, default_commission_value,
       notes, invited_at, accepted_at, created_at, updated_at,
       diviner:diviners ( id, username, display_name, avatar_url )`,
    )
    .eq("affiliate_account_id", ctx.account.id)
    .order("created_at", { ascending: false });

  if (error) return problem(500, "Database error", error.message);

  // Aggregate commission totals per junction
  const { data: commAgg } = await admin
    .from("affiliate_commissions")
    .select("affiliate_id, commission_amount_cents, status")
    .in("affiliate_id", ctx.junctionIds);

  const totalsByJunction = new Map<
    string,
    { total_cents: number; paid_cents: number; pending_cents: number; count: number }
  >();
  for (const row of commAgg ?? []) {
    const key = row.affiliate_id as string;
    const cur = totalsByJunction.get(key) ?? {
      total_cents: 0,
      paid_cents: 0,
      pending_cents: 0,
      count: 0,
    };
    const amount = Number(row.commission_amount_cents ?? 0);
    cur.total_cents += amount;
    cur.count++;
    if (row.status === "paid") cur.paid_cents += amount;
    else if (row.status === "pending" || row.status === "on_hold") cur.pending_cents += amount;
    totalsByJunction.set(key, cur);
  }

  type JunctionRow = {
    id: string;
    diviner_id: string;
    status: string;
    default_commission_type: string | null;
    default_commission_value: number | null;
    notes: string | null;
    invited_at: string | null;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
    diviner: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  const items = ((junctions ?? []) as unknown as JunctionRow[]).map((j) => {
    const totals = totalsByJunction.get(j.id) ?? {
      total_cents: 0,
      paid_cents: 0,
      pending_cents: 0,
      count: 0,
    };
    return {
      id: j.id,
      status: j.status,
      default_commission_type: j.default_commission_type,
      default_commission_value: j.default_commission_value,
      invited_at: j.invited_at,
      accepted_at: j.accepted_at,
      created_at: j.created_at,
      updated_at: j.updated_at,
      diviner: {
        id: j.diviner_id,
        username: j.diviner?.username ?? null,
        display_name: j.diviner?.display_name ?? "Unknown",
        avatar_url: j.diviner?.avatar_url ?? null,
      },
      totals,
    };
  });

  return NextResponse.json({ data: items });
}
