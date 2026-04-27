"use client";

// /admin/reports/affiliates/by-diviner
// Platform commission activity grouped by `affiliate_campaigns.diviner_id`.
// Reads from /api/admin/reports/affiliates/by-diviner.
//
// Spec: docs/specs/affiliate-commission-system.md §6.1

import { useEffect, useState, useCallback } from "react";
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
import { Loader2 } from "lucide-react";
import { ReportsTabs } from "../_components/reports-tabs";
import { PeriodSelect, type Period } from "../_components/period-select";

interface Row {
  diviner_id: string;
  display_name: string | null;
  username: string | null;
  clicks: number;
  conversions: number;
  earned_cents: number;
  reversed_cents: number;
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AdminReportsByDivinerPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/affiliates/by-diviner?period=${period}`,
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
          Affiliate revenue by diviner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each diviner&rsquo;s share of platform-wide affiliate activity for
          the selected period.
        </p>
      </header>

      <ReportsTabs />

      <div className="flex justify-end">
        <PeriodSelect value={period} onChange={setPeriod} disabled={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By diviner</CardTitle>
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
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Reversed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.diviner_id}>
                      <TableCell>
                        <div className="font-medium">
                          {r.display_name ?? r.username ?? r.diviner_id}
                        </div>
                        {r.username && r.display_name && (
                          <div className="font-mono text-xs text-muted-foreground">
                            @{r.username}
                          </div>
                        )}
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
