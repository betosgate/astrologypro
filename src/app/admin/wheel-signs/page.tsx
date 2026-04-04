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

type WheelSign = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  priority: number | null;
  is_active: boolean;
  theme_image: string | null;
  icon_image: string | null;
  created_at: string | null;
};

type DecanInfo = {
  id: string;
  sign_name: string;
  planet: string | null;
  tarot_name: string | null;
  decan: number | null;
  is_active: boolean;
};

export default function AdminWheelSignsPage() {
  const [signs, setSigns] = useState<WheelSign[]>([]);
  const [decans, setDecans] = useState<DecanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");

  // Preview
  const [previewSign, setPreviewSign] = useState<WheelSign | null>(null);

  async function loadSigns(q?: { search?: string; startFrom?: string; startTo?: string }) {
    const params = new URLSearchParams();
    const s = q?.search ?? search;
    const sf = q?.startFrom ?? startFrom;
    const st = q?.startTo ?? startTo;
    if (s) params.set("search", s);
    if (sf) params.set("start_date_from", sf);
    if (st) params.set("start_date_to", st);
    const res = await fetch(`/api/admin/wheel-signs?${params}`);
    if (res.ok) setSigns(await res.json());
  }

  async function loadDecans() {
    const res = await fetch("/api/admin/astro-decans");
    if (res.ok) setDecans(await res.json());
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSigns(), loadDecans()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function handleSearch() { loadSigns(); }
  function handleReset() {
    setSearch(""); setStartFrom(""); setStartTo("");
    loadSigns({ search: "", startFrom: "", startTo: "" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wheel Signs</h1>
        <p className="text-muted-foreground">Manage astrological wheel signs and decan info</p>
      </div>

      {/* Preview modal */}
      {previewSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewSign(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Wheel Sign Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewSign.title}</div>
              <div><span className="font-medium">Start Date:</span> {previewSign.start_date ?? "—"}</div>
              <div><span className="font-medium">End Date:</span> {previewSign.end_date ?? "—"}</div>
              <div><span className="font-medium">Priority:</span> {previewSign.priority ?? "—"}</div>
              <div><span className="font-medium">Status:</span> <Badge variant="outline" className={previewSign.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>{previewSign.is_active ? "Active" : "Inactive"}</Badge></div>
              {previewSign.theme_image && <div><span className="font-medium">Theme Image:</span> <a href={previewSign.theme_image} target="_blank" rel="noreferrer" className="text-blue-500 text-xs break-all hover:underline">{previewSign.theme_image}</a></div>}
              {previewSign.icon_image && <div><span className="font-medium">Icon Image:</span> <a href={previewSign.icon_image} target="_blank" rel="noreferrer" className="text-blue-500 text-xs break-all hover:underline">{previewSign.icon_image}</a></div>}
              {previewSign.created_at && <div><span className="font-medium">Created:</span> {new Date(previewSign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
              <Button size="sm" className="mt-2" onClick={() => setPreviewSign(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wheel Signs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Wheel Signs</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/wheel-signs/new">New Sign</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <Label className="text-xs">Search sign name</Label>
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start date from</Label>
              <Input type="date" value={startFrom} onChange={(e) => setStartFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start date to</Label>
              <Input type="date" value={startTo} onChange={(e) => setStartTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSearch}>Search</Button>
            <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : signs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No wheel signs found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.start_date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.end_date}</TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewSign(s)}><Eye className="size-3.5" /></Button>
                        <Link href={`/admin/wheel-signs/${s.id}/edit`} className="text-sm text-blue-500 hover:underline px-2">
                          Edit
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Astro Decans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Astro Decan Info</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/wheel-signs/decans/new">New Decan</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {decans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No decan info yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sign Name</TableHead>
                  <TableHead>Planet</TableHead>
                  <TableHead>Tarot</TableHead>
                  <TableHead>Decan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decans.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.sign_name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.planet}</TableCell>
                    <TableCell className="text-muted-foreground">{d.tarot_name}</TableCell>
                    <TableCell>{d.decan}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={d.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {d.is_active ? "Active" : "Inactive"}
                      </Badge>
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
