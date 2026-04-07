"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type TarotSpread = {
  id: string;
  name: string;
  card_count: number | null;
  priority: number | null;
  is_active: boolean;
  created_at: string;
};

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function TarotSpreadsListPage() {
  const router = useRouter();
  const [allSpreads, setAllSpreads] = useState<TarotSpread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function loadSpreads() {
    setLoading(true);
    const res = await fetch("/api/admin/tarot/spreads");
    if (res.ok) setAllSpreads(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadSpreads(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tarot/spreads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to delete spread");
      return;
    }
    toast.success("Spread deleted");
    setAllSpreads((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleToggleStatus(spread: TarotSpread) {
    const next = !spread.is_active;
    // Optimistic update
    setAllSpreads((prev) => prev.map((s) => s.id === spread.id ? { ...s, is_active: next } : s));
    const res = await fetch(`/api/admin/tarot/spreads/${spread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) {
      // Revert
      setAllSpreads((prev) => prev.map((s) => s.id === spread.id ? { ...s, is_active: spread.is_active } : s));
      toast.error("Failed to update status");
    } else {
      toast.success(`Spread marked ${next ? "active" : "inactive"}`);
    }
  }

  const filtered = allSpreads.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tarot" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Tarot
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Tarot Spreads</h1>
          <Button asChild size="sm">
            <Link href="/admin/tarot/spreads/new">New Spread</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spreads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Search by name</Label>
              <Input
                placeholder="Spread name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-48"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setPage(1); }}>Reset</Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No spreads found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spread Name</TableHead>
                    <TableHead>Card Count</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.card_count ?? "—"}</TableCell>
                      <TableCell>{s.priority ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={s.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(s.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/tarot/spreads/${s.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(s)}
                          >
                            {s.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(s.id, s.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {filtered.length} spread{filtered.length !== 1 ? "s" : ""} — page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
