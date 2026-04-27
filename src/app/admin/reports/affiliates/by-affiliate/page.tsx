"use client";

// /admin/reports/affiliates/by-affiliate
// Platform commission activity grouped by affiliate_account (multi-junction
// roll-up). Reads from /api/admin/reports/affiliates/by-affiliate.
//
// Spec: docs/specs/affiliate-commission-system.md §6.1

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ReportsTabs } from "../_components/reports-tabs";
import { PeriodSelect, type Period } from "../_components/period-select";

interface Row {
  account_id: string;
  name: string | null;
  email: string;
  status: string;
  clicks: number;
  conversions: number;
  earned_cents: number;
  reversed_cents: number;
  junction_count: number;
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AdminReportsByAffiliatePage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/affiliates/by-affiliate?period=${period}`,
      );
      if (res.ok) {
        const j = await res.json();
        setRows((j.data?.rows as Row[]) ?? []);
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          By affiliate (account roll-up)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each row aggregates one canonical affiliate account across all of
          their diviner partnerships.
        </p>
      </header>

      <ReportsTabs />

      <div className="flex justify-end">
        <PeriodSelect value={period} onChange={setPeriod} disabled={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No affiliate activity in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Account status</TableHead>
                    <TableHead className="text-right">Partnerships</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Reversed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        <div className="font-medium">
                          {r.name ?? r.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "active"
                              ? "default"
                              : r.status === "blocked"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.junction_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.conversions}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {fmtCents(r.earned_cents)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtCents(r.reversed_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
