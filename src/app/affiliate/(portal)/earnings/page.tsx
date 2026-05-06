// Affiliate earnings page.
// 2026-04-24: rewired onto System B (campaign_conversions). System A
// (affiliate_commissions + affiliate_payouts) retired — see
// docs/specs/affiliate-commission-system.md §9.
//
// Payout history section removed — payouts are deferred to Phase 2
// (Stripe Connect auto-split). "Total Earned" is the authoritative ledger
// until then.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Clock } from "lucide-react";
import { OffsetBanner } from "./_components/OffsetBanner";
import { PayoutHistoryTable } from "./_components/PayoutHistoryTable";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type EarningsCampaignSub = {
  name: string | null;
  owner_affiliate_type: "diviner_affiliate" | "social_advocate" | "general" | null;
  diviner: { display_name: string | null } | { display_name: string | null }[] | null;
  template: { name: string | null } | { name: string | null }[] | null;
};

function sourceLabel(
  campaign: EarningsCampaignSub | EarningsCampaignSub[] | null,
): string {
  const c = Array.isArray(campaign) ? campaign[0] : campaign;
  if (!c) return "Unknown";
  if (c.owner_affiliate_type === "general") {
    const t = Array.isArray(c.template) ? c.template[0] : c.template;
    return `General: ${t?.name ?? "Unknown template"}`;
  }
  const d = Array.isArray(c.diviner) ? c.diviner[0] : c.diviner;
  return `Diviner: ${d?.display_name ?? "Unknown"}`;
}

function statusBadge(status: "earned" | "reversed") {
  // v2 has only two conversion states. Pre-v2 approval-state keys
  // (pending / on_hold / approved / paid / rejected) are gone.
  const cls =
    status === "earned"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

export default async function AffiliateEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/earnings");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { account, junctionIds } = ctx;

  // Phase 2: fetch offset data for OffsetBanner
  const { data: offsetRow } = await admin
    .from("affiliate_accounts")
    .select("balance_offset_cents, balance_offset_last_changed_at")
    .eq("id", account.id)
    .maybeSingle();
  const offsetCents = Number((offsetRow as Record<string, unknown> | null)?.balance_offset_cents ?? 0);
  const offsetLastChangedAt = ((offsetRow as Record<string, unknown> | null)?.balance_offset_last_changed_at as string | null) ?? null;

  // Phase 1.5: query by affiliate_account_id (post-migration backfill
  // covers both per-diviner and general credits) instead of by
  // junctionIds (which would miss general conversions whose
  // affiliate_id IS NULL). Real columns are converted_at + reversal_reason
  // (not created_at + reversed_reason — those names don't exist).
  // Campaign sub-select pulls owner_affiliate_type + the destination
  // template name so the Source column can render the General/Diviner
  // label per spec §10 reporting touches.
  const { data: commissions } = await admin
    .from("campaign_conversions")
    .select(
      `id, affiliate_id, affiliate_account_id, booking_id,
       order_amount_cents, commission_amount_cents,
       rate_type_used, rate_value_used,
       reversed_at, reversal_reason, converted_at,
       campaign:affiliate_campaigns(
         name, owner_affiliate_type,
         diviner:diviners(display_name),
         template:service_templates!destination_service_template_id(name)
       )`,
    )
    .eq("affiliate_account_id", account.id)
    .order("converted_at", { ascending: false })
    .limit(50);

  let totalEarned = 0;
  let totalReversed = 0;
  for (const c of commissions ?? []) {
    const amt = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) totalReversed += amt;
    else totalEarned += amt;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Commissions across your {junctionIds.length} diviner partnership
          {junctionIds.length === 1 ? "" : "s"}
          {junctionIds.length > 0 ? " plus general-program credits." : " — general-program credits only."}
        </p>
      </header>

      {/* Phase 2: refund-after-payout offset alert */}
      <OffsetBanner
        offsetCents={offsetCents}
        offsetLastChangedAt={offsetLastChangedAt}
        nextCycleEstimateCents={Math.max(0, totalEarned - offsetCents)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalEarned)}</p>
            <p className="text-xs text-muted-foreground">
              Payouts will arrive once Stripe auto-split is enabled.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reversed</CardTitle>
            <Clock className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">
              {formatCents(totalReversed)}
            </p>
            <p className="text-xs text-muted-foreground">refunds + disputes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead className="text-right">Order amount</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(commissions as Array<{
                    id: string;
                    booking_id: string | null;
                    order_amount_cents: number | null;
                    commission_amount_cents: number | null;
                    rate_type_used: "percent" | "flat" | null;
                    rate_value_used: number | string | null;
                    reversed_at: string | null;
                    converted_at: string;
                    campaign: EarningsCampaignSub | EarningsCampaignSub[] | null;
                  }>).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.converted_at)}</TableCell>
                      <TableCell className="text-sm">{sourceLabel(c.campaign)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.booking_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(Number(c.order_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {c.rate_type_used === "percent"
                          ? `${Number(c.rate_value_used ?? 0)}%`
                          : c.rate_type_used === "flat"
                            ? formatCents(Math.round(Number(c.rate_value_used ?? 0) * 100))
                            : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(Number(c.commission_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell>{statusBadge(c.reversed_at ? "reversed" : "earned")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commissions yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Phase 2: payout history */}
      <PayoutHistoryTable />
    </div>
  );
}
