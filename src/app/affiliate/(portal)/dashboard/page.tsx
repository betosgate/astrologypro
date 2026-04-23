// Task 05 (2026-04-23): rehabilitated affiliate dashboard.
// Was: queried diviner_affiliates.user_id (always null → broken for everyone).
// Now: reads via resolveAffiliateForCaller (canonical account → all junctions).
//
// Aggregates across ALL diviner partnerships for this affiliate.
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

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
  Clock,
  DollarSign,
  ArrowRight,
  Users,
} from "lucide-react";

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

  // Short-circuit: zero partnerships
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
      </div>
    );
  }

  // Aggregate commissions + links across all junctions in parallel
  const [{ data: commissionRows }, { data: linkRows }] = await Promise.all([
    admin
      .from("affiliate_commissions")
      .select("commission_amount_cents, status")
      .in("affiliate_id", junctionIds),
    admin
      .from("affiliate_referral_links")
      .select("id, slug, url, product_type, clicks, conversions, is_active, diviner_id")
      .in("affiliate_id", junctionIds)
      .order("clicks", { ascending: false })
      .limit(5),
  ]);

  let pendingCents = 0;
  let approvedCents = 0;
  let paidCents = 0;
  let totalConversions = 0;
  for (const row of commissionRows ?? []) {
    const amount = Number(row.commission_amount_cents ?? 0);
    totalConversions++;
    const s = row.status as string;
    if (s === "pending" || s === "on_hold") pendingCents += amount;
    else if (s === "approved") approvedCents += amount;
    else if (s === "paid") paidCents += amount;
  }

  const totalClicks = (linkRows ?? []).reduce(
    (sum, l) => sum + Number(l.clicks ?? 0),
    0,
  );

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

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
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
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="size-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCents(pendingCents + approvedCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              Approved: {formatCents(approvedCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(paidCents)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Performing Links</CardTitle>
          <Link
            href="/affiliate/links"
            className="text-sm font-medium text-primary hover:underline"
          >
            All links
          </Link>
        </CardHeader>
        <CardContent>
          {linkRows && linkRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkRows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.slug}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.product_type ?? "general"}
                    </TableCell>
                    <TableCell className="text-right">{l.clicks}</TableCell>
                    <TableCell className="text-right">{l.conversions}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.is_active ? "Active" : "Inactive"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referral links yet. Visit your partnerships page to generate one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
