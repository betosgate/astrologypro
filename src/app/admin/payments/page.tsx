"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

type Payment = {
  id: string;
  client_name: string | null;
  client_email: string | null;
  service_name: string | null;
  scheduled_at: string | null;
  amount_charged: number;
  stripe_payment_id: string | null;
  status: string | null;
  created_at: string;
  diviner_id: string | null;
};

type Response = { payments: Payment[]; total: number; page: number; hasMore: boolean };

function fmtAmount(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function load(p: number) {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?page=${p}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          All completed booking payments. {data ? `${data.total} total.` : ""}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No payment records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Page {data.page} — {data.payments.length} of {data.total} payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Client</th>
                      <th className="px-4 py-2 text-left font-medium">Service</th>
                      <th className="px-4 py-2 text-left font-medium">Amount</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Stripe ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground">{fmtDate(p.created_at)}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium">{p.client_name ?? "—"}</div>
                          {p.client_email && <div className="text-xs text-muted-foreground">{p.client_email}</div>}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{p.service_name ?? "—"}</td>
                        <td className="px-4 py-2 font-medium tabular-nums">{fmtAmount(p.amount_charged)}</td>
                        <td className="px-4 py-2">
                          <Badge variant={p.status === "confirmed" || p.status === "completed" ? "default" : "secondary"} className="text-xs capitalize">
                            {p.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                          {p.stripe_payment_id ? p.stripe_payment_id.slice(0, 20) + "…" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
