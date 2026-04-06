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
import { toast } from "sonner";

const PAGE_SIZE = 10;

type TarotCard = {
  id: string;
  name: string;
  arcana: string | null;
  suit: string | null;
  is_active: boolean | null;
  created_at: string;
};

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function TarotCardsListPage() {
  const router = useRouter();
  const [allCards, setAllCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);

  async function loadCards(overrides?: { createdFrom?: string; createdTo?: string }) {
    setLoading(true);
    const params = new URLSearchParams();
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/tarot/cards?${params}`);
    if (res.ok) setAllCards(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadCards(); }, []);

  function handleSearch() {
    setPage(1);
    loadCards();
  }

  function handleReset() {
    setSearch("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
    loadCards({ createdFrom: "", createdTo: "" });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tarot/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to delete card");
      return;
    }
    toast.success("Card deleted");
    setAllCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleToggleStatus(card: TarotCard) {
    const next = !card.is_active;
    // Optimistic update
    setAllCards((prev) => prev.map((c) => c.id === card.id ? { ...c, is_active: next } : c));
    const res = await fetch(`/api/admin/tarot/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) {
      // Revert
      setAllCards((prev) => prev.map((c) => c.id === card.id ? { ...c, is_active: card.is_active } : c));
      toast.error("Failed to update status");
    } else {
      toast.success(`Card marked ${next ? "active" : "inactive"}`);
    }
  }

  const filtered = allCards.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold tracking-tight">Tarot Cards</h1>
          <Button asChild size="sm">
            <Link href="/admin/tarot/cards/new">New Card</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Search by name</Label>
              <Input
                placeholder="Card name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-48"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="w-40" />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
            <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : paged.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No cards found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Arcana</TableHead>
                    <TableHead>Suit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        {c.arcana ? (
                          <Badge variant="outline" className={c.arcana === "major" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}>
                            {c.arcana}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.suit ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={c.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/tarot/cards/${c.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(c)}
                          >
                            {c.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(c.id, c.name)}
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
                  {filtered.length} card{filtered.length !== 1 ? "s" : ""} — page {page} of {totalPages}
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
