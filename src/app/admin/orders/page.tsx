"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

type Order = {
  id: string;
  booking_id: string | null;
  client_id: string | null;
  diviner_id: string | null;
  service_type: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  stripe_payment_intent_id: string | null;
  invoice_email_sent: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "outline",
  refunded: "secondary",
  failed: "destructive",
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
  }

  const total = items.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">{items.length} orders · Total: ${(total / 100).toFixed(2)}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        {(filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {previewItem && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">Order Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className="font-medium">ID: </span>{previewItem.id}</div>
              <div><span className="font-medium">Booking ID: </span>{previewItem.booking_id ?? "—"}</div>
              <div><span className="font-medium">Client ID: </span>{previewItem.client_id ?? "—"}</div>
              <div><span className="font-medium">Diviner ID: </span>{previewItem.diviner_id ?? "—"}</div>
              <div><span className="font-medium">Service Type: </span>{previewItem.service_type ?? "—"}</div>
              <div><span className="font-medium">Amount: </span>{previewItem.amount != null ? `${(previewItem.amount / 100).toFixed(2)} ${previewItem.currency?.toUpperCase()}` : "—"}</div>
              <div><span className="font-medium">Status: </span><Badge variant={STATUS_COLORS[previewItem.status] ?? "outline"}>{previewItem.status}</Badge></div>
              <div><span className="font-medium">Stripe PI: </span><span className="font-mono text-xs">{previewItem.stripe_payment_intent_id ?? "—"}</span></div>
              <div><span className="font-medium">Invoice Sent: </span>{previewItem.invoice_email_sent ? "Yes" : "No"}</div>
              <div><span className="font-medium">Created: </span>{new Date(previewItem.created_at).toLocaleString()}</div>
              <div className="sm:col-span-2"><span className="font-medium">Notes: </span>{previewItem.notes ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{order.service_type ?? "Unknown service"}</span>
                      <Badge variant={STATUS_COLORS[order.status] ?? "outline"}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.amount != null ? `$${(order.amount / 100).toFixed(2)} ${order.currency?.toUpperCase()}` : "—"}
                      {order.stripe_payment_intent_id && <span className="ml-2 font-mono text-xs">{order.stripe_payment_intent_id}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openPreview(order.id)}>
                    <Eye className="size-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
