import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
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

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    payable: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    reversed: "bg-muted text-muted-foreground",
    recorded: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

interface LedgerRow {
  id: string;
  order_amount_cents: number;
  commission_amount_cents: number;
  status: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  approved_at: string | null;
  created_at: string;
}

interface PayoutRow {
  id: string;
  amount_cents: number;
  currency: string;
  payout_method: string | null;
  reference_number: string | null;
  notes: string | null;
  status: string;
  paid_at: string;
}

export default async function AffiliateEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  // Verify affiliate membership
  const { data: affiliateRecord } = await admin
    .from("affiliates")
    .select("id, name, email, diviner_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!affiliateRecord) {
    redirect("/");
  }

  // Load ledger entries (first page, 50)
  const { data: ledgerRows } = await admin
    .from("commission_ledger_entries")
    .select(
      "id, order_amount_cents, commission_amount_cents, status, description, period_start, period_end, approved_at, created_at"
    )
    .eq("affiliate_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  // Load payout history
  const { data: payoutRows } = await admin
    .from("affiliate_payout_records")
    .select(
      "id, amount_cents, currency, payout_method, reference_number, notes, status, paid_at"
    )
    .eq("affiliate_user_id", user.id)
    .order("paid_at", { ascending: false })
    .limit(50);

  const ledger: LedgerRow[] = (ledgerRows ?? []) as LedgerRow[];
  const payouts: PayoutRow[] = (payoutRows ?? []) as PayoutRow[];

  // Compute summary
  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;

  ledger.forEach((row) => {
    const amount = Number(row.commission_amount_cents);
    totalEarned += amount;
    if (row.status === "paid") totalPaid += amount;
    else if (["pending", "approved", "payable"].includes(row.status)) totalPending += amount;
  });

  // Also count actual payouts
  const totalPaidOut = payouts.reduce((s, p) => s + Number(p.amount_cents), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">
          Your commission history and payout records.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalEarned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCents(totalPending)}</p>
            <p className="text-xs text-muted-foreground">awaiting approval or payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">{formatCents(totalPaidOut)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>
            {ledger.length} entr{ledger.length !== 1 ? "ies" : "y"} (most recent 50)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ledger.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commission entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateStr(entry.created_at)}
                      </TableCell>
                      <TableCell>{formatCents(entry.order_amount_cents)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCents(entry.commission_amount_cents)}
                      </TableCell>
                      <TableCell>{statusBadge(entry.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {entry.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Payments received from your diviner.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateStr(payout.paid_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCents(payout.amount_cents)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payout.payout_method ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.reference_number ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(payout.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Contact your diviner for payment questions or account updates.
      </p>
    </div>
  );
}
