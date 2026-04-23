"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Plus, Eye, Users } from "lucide-react";

interface Affiliate {
  id: string;
  diviner_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  default_commission_type: string;
  default_commission_value: number;
  created_at: string;
}

interface Diviner {
  id: string;
  display_name: string;
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PAGE_SIZE = 20;

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDiviner, setFilterDiviner] = useState("");
  const [q, setQ] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const currentPage = cursorStack.length + 1;

  // Form state
  const [formDivinerId, setFormDivinerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCommType, setFormCommType] = useState("percentage");
  const [formCommValue, setFormCommValue] = useState("10");
  const [formProductType, setFormProductType] = useState("");

  const loadAffiliates = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterDiviner) params.set("diviner_id", filterDiviner);
    if (q) params.set("q", q);
    params.set("limit", String(PAGE_SIZE));
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/admin/affiliates?${params}`);
    if (res.ok) {
      const json = await res.json();
      setAffiliates(json.data ?? []);
      setNextCursor(json.nextCursor ?? null);
      setHasMore(json.hasMore ?? false);
    }
    setLoading(false);
  }, [filterStatus, filterDiviner, q]);

  useEffect(() => {
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
    loadAffiliates();
  }, [loadAffiliates]);

  useEffect(() => {
    fetch("/api/admin/diviners")
      .then((r) => r.json())
      .then((j) => setDiviners(j.diviners ?? []));
  }, []);

  function resetForm() {
    setFormDivinerId("");
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCommType("percentage");
    setFormCommValue("10");
    setFormProductType("");
  }

  async function handleCreate() {
    if (!formDivinerId || !formName || !formEmail) {
      toast.error("Diviner, name, and email are required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diviner_id: formDivinerId,
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
        default_commission_type: formCommType,
        default_commission_value: parseFloat(formCommValue) || 0,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      toast.success("Affiliate created");

      // Create a commission rule with the product_type scope if specified
      if (formProductType && created.data?.id) {
        await fetch(`/api/admin/affiliates/${created.data.id}/commission-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commission_type: formCommType,
            commission_value: parseFloat(formCommValue) || 0,
            product_type: formProductType,
            notes: `Applies to ${formProductType === "session" ? "sales/sessions" : "signups/subscriptions"} only`,
          }),
        }).catch(() => {});
      }

      setSheetOpen(false);
      resetForm();
      await loadAffiliates();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to create affiliate");
    }
    setSaving(false);
  }

  function goNextPage() {
    if (!nextCursor) return;
    // The current first item's cursor is the last item id on the current page
    const currentCursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined;
    setCursorStack((prev) => [...prev, nextCursor]);
    loadAffiliates(nextCursor);
  }

  function goPrevPage() {
    if (cursorStack.length <= 1) {
      // Go back to first page
      setCursorStack([]);
      loadAffiliates();
    } else {
      const newStack = cursorStack.slice(0, -1);
      setCursorStack(newStack);
      loadAffiliates(newStack[newStack.length - 1]);
    }
  }

  const divinerNameMap = Object.fromEntries(diviners.map((d) => [d.id, d.display_name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            All affiliate partners across all diviners.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 size-4" />
              Add Affiliate
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Affiliate</SheetTitle>
              <SheetDescription>Create an affiliate and assign them to a diviner.</SheetDescription>
            </SheetHeader>
            <div className="mt-2 space-y-4">
              <div className="space-y-2">
                <Label>Diviner</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formDivinerId}
                  onChange={(e) => setFormDivinerId(e.target.value)}
                >
                  <option value="">Select diviner…</option>
                  {diviners.map((d) => (
                    <option key={d.id} value={d.id}>{d.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 555 123 4567" />
              </div>
              <div className="space-y-2">
                <Label>Commission type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formCommType}
                  onChange={(e) => setFormCommType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{formCommType === "percentage" ? "Commission %" : "Fixed amount (cents)"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formCommValue}
                  onChange={(e) => setFormCommValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Commission applies to</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formProductType}
                  onChange={(e) => setFormProductType(e.target.value)}
                >
                  <option value="">All (signups + sales)</option>
                  <option value="session">Sales / Sessions only</option>
                  <option value="subscription">Signups / Subscriptions only</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Controls which transactions generate commissions for this affiliate.
                </p>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : "Create Affiliate"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary stat */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{affiliates.length}</p>
            <p className="text-xs text-muted-foreground">
              {affiliates.filter((a) => a.status === "active").length} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or email…"
          className="h-9 w-56"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={filterDiviner}
          onChange={(e) => setFilterDiviner(e.target.value)}
        >
          <option value="">All diviners</option>
          {diviners.map((d) => (
            <option key={d.id} value={d.id}>{d.display_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>{affiliates.length} result{affiliates.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : affiliates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No affiliates found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell className="font-medium">{aff.name}</TableCell>
                      <TableCell className="text-muted-foreground">{aff.email}</TableCell>
                      <TableCell>{divinerNameMap[aff.diviner_id] ?? aff.diviner_id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[aff.status] ?? "outline"}>{aff.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {aff.default_commission_type === "percentage"
                          ? `${aff.default_commission_value}%`
                          : `$${(aff.default_commission_value / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell>{fmtDate(aff.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8" asChild title="View">
                          <Link href={`/admin/affiliates/${aff.id}`}>
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination controls */}
          {(cursorStack.length > 0 || hasMore) && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cursorStack.length === 0}
                  onClick={goPrevPage}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={goNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
