// Task 05 (2026-04-23): rehabilitated earnings page.
// Was: queried `affiliates` (legacy) + `commission_ledger_entries` and
//      `affiliate_payout_records` (dead schema, empty in prod) → redirected
//      every caller to /.
// Now: reads the live schema — affiliate_commissions + affiliate_payouts —
//      scoped to the caller's canonical account.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

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
import { TrendingUp, DollarSign, Clock } from "lucide-react";

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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    paid: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    reversed: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
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

  if (ctx.junctionIds.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">No commissions yet.</p>
        </header>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don&rsquo;t have any diviner partnerships yet, so no commissions
            have been recorded.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: commissions }, { data: payouts }] = await Promise.all([
    admin
      .from("affiliate_commissions")
      .select(
        "id, affiliate_id, diviner_id, order_reference, order_amount_cents, commission_amount_cents, status, approved_at, created_at, notes",
      )
      .in("affiliate_id", ctx.junctionIds)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("affiliate_payouts")
      .select(
        "id, affiliate_id, diviner_id, amount_cents, method, reference, notes, paid_at",
      )
      .in("affiliate_id", ctx.junctionIds)
      .order("paid_at", { ascending: false })
      .limit(50),
  ]);

  let totalApproved = 0;
  let totalPending = 0;
  let totalPaid = 0;
  for (const c of commissions ?? []) {
    const amt = Number(c.commission_amount_cents ?? 0);
    if (c.status === "paid") totalPaid += amt;
    else if (c.status === "pending" || c.status === "on_hold") totalPending += amt;
    else if (c.status === "approved") totalApproved += amt;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Commissions and payouts across your {ctx.junctionIds.length} diviner
          partnership{ctx.junctionIds.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalApproved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCents(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalPaid)}</p>
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
                    <TableHead>Order ref</TableHead>
                    <TableHead className="text-right">Order amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.order_reference ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(Number(c.order_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(Number(c.commission_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell>{statusBadge(c.status as string)}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts && payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paid_at as string)}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {p.method ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.reference ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(Number(p.amount_cents ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
