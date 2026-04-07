"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Eye } from "lucide-react";

type Spread = {
  id: string;
  name: string;
  card_count: number | null;
  priority: number | null;
  is_active: boolean;
};

type TarotCard = {
  id: string;
  name: string;
  arcana: string | null;
  suit: string | null;
  spread_id: string | null;
  upright_meaning: string | null;
  reversed_meaning: string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
  tarot_spreads?: { name: string } | null;
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminTarotPage() {
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Card filters
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  // Preview
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);

  async function loadSpreads() {
    const res = await fetch("/api/admin/tarot/spreads");
    if (res.ok) setSpreads(await res.json());
  }

  async function loadCards(overrides?: { createdFrom?: string; createdTo?: string }) {
    const params = new URLSearchParams();
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/tarot/cards?${params}`);
    if (res.ok) setCards(await res.json());
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSpreads(), loadCards()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function handleSearch() { loadCards(); }
  function handleReset() {
    setCreatedFrom(""); setCreatedTo("");
    loadCards({ createdFrom: "", createdTo: "" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarot</h1>
        <p className="text-muted-foreground">Manage tarot spreads and cards</p>
      </div>

      {/* Card preview modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewCard(null)}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Card Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewCard.name}</div>
              <div><span className="font-medium">Arcana:</span> {previewCard.arcana ?? "—"}</div>
              <div><span className="font-medium">Suit:</span> {previewCard.suit ?? "—"}</div>
              <div><span className="font-medium">Spread:</span> {previewCard.tarot_spreads?.name ?? "—"}</div>
              {previewCard.upright_meaning && <div><span className="font-medium">Upright:</span> {previewCard.upright_meaning}</div>}
              {previewCard.reversed_meaning && <div><span className="font-medium">Reversed:</span> {previewCard.reversed_meaning}</div>}
              {previewCard.image_url && <div><span className="font-medium">Image:</span> <a href={previewCard.image_url} target="_blank" rel="noreferrer" className="text-blue-500 text-xs break-all hover:underline">{previewCard.image_url}</a></div>}
              <div><span className="font-medium">Status:</span> <Badge variant={previewCard.is_active ? "default" : "outline"}>{previewCard.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewCard.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewCard(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Spreads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Spreads</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/tarot/spreads/new">New Spread</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : spreads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No spreads yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Card Count</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spreads.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.card_count}</TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Cards</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/tarot/cards/new">New Card</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date filters */}
          <div className="flex flex-wrap items-end gap-3">
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
          ) : cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No cards yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Arcana</TableHead>
                  <TableHead>Suit</TableHead>
                  <TableHead>Spread</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.arcana === "major" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}>
                        {c.arcana}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.suit ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.tarot_spreads?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(c.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewCard(c)}><Eye className="size-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
