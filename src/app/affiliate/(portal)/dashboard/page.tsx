// Affiliate dashboard — lands here after login.
// Aggregates across ALL diviner partnerships for this affiliate.
//
// 2026-04-24: rewired onto System B (campaign_conversions + affiliate_campaigns).
// System A (affiliate_commissions + affiliate_referral_links) retired — see
// docs/specs/affiliate-commission-system.md §9.
//
// KPIs simplified: Phase 1 has no admin approval state machine, so
// "Pending vs Approved" go away. Total Earned = sum(commission_amount_cents)
// where reversed_at IS NULL. Paid column is Phase 2 (Stripe auto-split).

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { redirect } from "next/navigation";
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
import {
  MousePointerClick,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Users,
} from "lucide-react";
import { AffiliateMarketingKit } from "@/components/affiliate/marketing-kit";
import { fetchMarketingKitItems } from "@/lib/affiliate-marketing-kit";
import { StripeConnectPanel } from "../_components/StripeConnectPanel";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout already enforces auth + active account. If we end up here without
  // user, the layout short-circuits — but double-check as defense in depth.
  if (!user) redirect("/login?next=/affiliate");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { account, junctionIds } = ctx;

  // Phase 1.5: general products are available to every active affiliate
  // regardless of per-diviner partnerships (spec §10 decision #1).
  const marketingItems = await fetchMarketingKitItems(admin, account.id);

  // Short-circuit: zero partnerships. Still surface the Marketing Kit
  // when general programs are enabled — the affiliate has earning paths
  // even before any diviner invites them.
  if (junctionIds.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {account.name}
          </h1>
          <p className="text-muted-foreground">
            You don&rsquo;t have any diviner partnerships yet.
          </p>
        </header>
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-medium">No partnerships yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask a diviner you&rsquo;d like to work with to invite you, or open
              an invitation link you received by email.
            </p>
          </CardContent>
        </Card>
        {marketingItems.length > 0 && (
          <AffiliateMarketingKit items={marketingItems} />
        )}
      </div>
    );
  }

  // Aggregate conversions + campaigns across all junctions in parallel.
  // Clicks come from campaign_clicks joined via affiliate_id.
  const [
    { data: conversionRows },
    { data: campaignRows },
    { count: totalClicks },
  ] = await Promise.all([
    // Phase 1.5: conversions are now identified by affiliate_account_id
    // (always populated after the Task 01 backfill), which covers both
    // per-diviner credits and general credits in one filter.
    admin
      .from("campaign_conversions")
      .select("commission_amount_cents, reversed_at")
      .eq("affiliate_account_id", account.id),
    // Recent campaigns: union per-diviner + general. Two SELECTs, merged
    // client-side. Limit applied after the merge so we don't accidentally
    // hide one type behind the other's recency.
    Promise.all([
      junctionIds.length > 0
        ? admin
            .from("affiliate_campaigns")
            .select(
              "id, campaign_code, name, status, diviner_id, owner_affiliate_type, destination_service_template_id, created_at",
            )
            .eq("owner_affiliate_type", "diviner_affiliate")
            .in("owner_affiliate_id", junctionIds)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
      admin
        .from("affiliate_campaigns")
        .select(
          "id, campaign_code, name, status, diviner_id, owner_affiliate_type, destination_service_template_id, created_at",
        )
        .eq("owner_affiliate_type", "general")
        .eq("owner_affiliate_account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([per, gen]) => ({
      data: [
        ...((per.data ?? []) as Array<Record<string, unknown>>),
        ...((gen.data ?? []) as Array<Record<string, unknown>>),
      ]
        .sort((a, b) => {
          const at = (a.created_at as string) ?? "";
          const bt = (b.created_at as string) ?? "";
          return bt.localeCompare(at);
        })
        .slice(0, 5),
    })),
    // Clicks: filter by campaign_id (the caller's campaigns) instead of
    // affiliate_id, so we capture both per-diviner clicks (have
    // affiliate_id set) and general clicks (have affiliate_id=NULL per
    // Task 03's CHECK-compatibility coercion).
    admin
      .from("affiliate_campaigns")
      .select("id")
      .or(
        [
          junctionIds.length > 0
            ? `and(owner_affiliate_type.eq.diviner_affiliate,owner_affiliate_id.in.(${junctionIds.join(",")}))`
            : null,
          `and(owner_affiliate_type.eq.general,owner_affiliate_account_id.eq.${account.id})`,
        ]
          .filter(Boolean)
          .join(","),
      )
      .then(async ({ data }) => {
        const ids = (data ?? []).map((c) => c.id as string);
        if (ids.length === 0) return { count: 0 };
        const { count } = await admin
          .from("campaign_clicks")
          .select("id", { count: "exact", head: true })
          .in("campaign_id", ids);
        return { count: count ?? 0 };
      }),
  ]);

  let earnedCents = 0;
  let totalConversions = 0;
  for (const row of conversionRows ?? []) {
    if (row.reversed_at) continue;
    earnedCents += Number(row.commission_amount_cents ?? 0);
    totalConversions++;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {account.name}
          </h1>
          <p className="text-muted-foreground">
            Aggregated across {junctionIds.length} diviner partnership
            {junctionIds.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/affiliate/partnerships"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View partnerships <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      {/* Phase 2: Stripe Connect onboarding / status */}
      <StripeConnectPanel />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalClicks ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">{formatCents(earnedCents)}</p>
            <p className="text-xs text-muted-foreground">across all active conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Kit — Phase 1.5 general products, sourced from
          service_templates with affiliate_program_enabled=true. Each link
          carries a real cmp_<code> that credits this affiliate's account
          when the customer books. */}
      {marketingItems.length > 0 && (
        <AffiliateMarketingKit items={marketingItems} />
      )}

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Campaigns</CardTitle>
          <Link
            href="/affiliate/campaigns"
            className="text-sm font-medium text-primary hover:underline"
          >
            All campaigns
          </Link>
        </CardHeader>
        <CardContent>
          {campaignRows && campaignRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(campaignRows as Array<{
                  id: string;
                  name: string | null;
                  campaign_code: string;
                  status: string;
                }>).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.campaign_code}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {c.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No campaigns yet. Visit your partnerships page and create one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
