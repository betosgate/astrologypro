import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates/summary
// Returns aggregate stats for the authenticated diviner's affiliate network
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Resolve diviner record
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

  // Parallel queries
  const [affiliatesRes, commissionsRes, payoutsRes] = await Promise.all([
    admin
      .from("diviner_affiliates")
      .select("id, status")
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_commissions")
      .select("commission_amount_cents, status")
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_payouts")
      .select("amount_cents")
      .eq("diviner_id", diviner.id),
  ]);

  const affiliates = affiliatesRes.data ?? [];
  const commissions = commissionsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a) => a.status === "active").length;

  const totalCommissionsEarned = commissions.reduce(
    (sum, c) => sum + Number(c.commission_amount_cents),
    0
  );
  const pendingCommissions = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount_cents), 0);
  const approvedCommissions = commissions
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + Number(c.commission_amount_cents), 0);

  const totalPaid = payouts.reduce((sum, p) => sum + Number(p.amount_cents), 0);
  const pendingBalance = pendingCommissions + approvedCommissions - totalPaid;

  return NextResponse.json({
    data: {
      total_affiliates: totalAffiliates,
      active_affiliates: activeAffiliates,
      total_commissions_earned_cents: totalCommissionsEarned,
      total_paid_cents: totalPaid,
      pending_balance_cents: Math.max(0, pendingBalance),
    },
  });
}
