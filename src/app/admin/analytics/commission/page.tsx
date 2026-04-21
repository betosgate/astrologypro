"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Clock, RotateCcw, CheckCircle2 } from "lucide-react";

interface MonthlyRow {
  affiliate_id: string;
  affiliate_type: "social_advocate" | "diviner_affiliate";
  affiliate_name: string;
  month: string;
  conversions: number;
  gmv_cents: number;
  commission_cents: number;
  paid_cents: number;
  outstanding_cents: number;
}

interface CommissionData {
  summary: {
    this_month_cents: number;
    all_time_cents: number;
    reversed_cents: number;
    paid_cents: number;
    outstanding_cents: number;
  };
  monthly: MonthlyRow[];
}

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminCommissionView() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/commission");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-lg font-semibold">Commission Financial View</h1>
        <p className="text-xs text-muted-foreground">
          Platform-wide commission liability and monthly rollups. "Paid" is 0
          until the payout module ships.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !data ? (
        <div className="py-24 text-center text-sm text-muted-foreground">No data</div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Kpi
              icon={DollarSign}
              label="This Month"
              value={fmtCents(data.summary.this_month_cents)}
            />
            <Kpi icon={Clock} label="All-time" value={fmtCents(data.summary.all_time_cents)} />
            <Kpi
              icon={CheckCircle2}
              label="Paid"
              value={fmtCents(data.summary.paid_cents)}
            />
            <Kpi
              icon={RotateCcw}
              label="Reversed"
              value={fmtCents(data.summary.reversed_cents)}
            />
          </div>

          <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/10">
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Outstanding liability</p>
                <p className="text-xs text-muted-foreground">
                  Total commission earned but not yet paid out.
                </p>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {fmtCents(data.summary.outstanding_cents)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Per-affiliate monthly rollup (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.monthly.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No conversions</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">GMV</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.monthly.map((r, i) => (
                        <TableRow key={`${r.affiliate_type}-${r.affiliate_id}-${r.month}-${i}`}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/analytics/affiliates/${r.affiliate_id}?type=${r.affiliate_type}`}
                              className="hover:underline"
                            >
                              {r.affiliate_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {r.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.month}</TableCell>
                          <TableCell className="text-right">{r.conversions}</TableCell>
                          <TableCell className="text-right">{fmtCents(r.gmv_cents)}</TableCell>
                          <TableCell className="text-right">{fmtCents(r.commission_cents)}</TableCell>
                          <TableCell className="text-right font-medium text-amber-700 dark:text-amber-400">
                            {fmtCents(r.outstanding_cents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
