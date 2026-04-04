"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";

type Webinar = {
  id: string;
  title: string;
  description: string | null;
  host_name: string;
  scheduled_at: string;
  duration_mins: number | null;
  join_url: string | null;
  recording_url: string | null;
  is_free: boolean;
  price: number | null;
  is_active: boolean;
  created_at: string;
  priority: number | null;
};

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export default function AdminWebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewWebinar, setPreviewWebinar] = useState<Webinar | null>(null);

  // Filters
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);
    const res = await fetch(`/api/admin/webinars?${params}`);
    if (res.ok) setWebinars(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetFilters() {
    setCreatedFrom(""); setCreatedTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webinars</h1>
          <p className="text-muted-foreground">Manage live and recorded webinars</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/webinars/new"><Plus className="mr-1.5 size-4" /> New Webinar</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={load}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); setTimeout(load, 0); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewWebinar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewWebinar(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Webinar Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewWebinar.title}</div>
              {previewWebinar.description && <div><span className="font-medium">Description:</span> {previewWebinar.description}</div>}
              <div><span className="font-medium">Host:</span> {previewWebinar.host_name}</div>
              <div><span className="font-medium">Scheduled:</span> {fmtDateTime(previewWebinar.scheduled_at)}</div>
              {previewWebinar.duration_mins != null && <div><span className="font-medium">Duration:</span> {previewWebinar.duration_mins} min</div>}
              <div><span className="font-medium">Access:</span> <Badge variant="outline" className={previewWebinar.is_free ? "bg-blue-500/10 text-blue-500" : "bg-yellow-500/10 text-yellow-500"}>{previewWebinar.is_free ? "Free" : "Paid"}</Badge></div>
              {!previewWebinar.is_free && previewWebinar.price != null && <div><span className="font-medium">Price:</span> ${Number(previewWebinar.price).toFixed(2)}</div>}
              <div><span className="font-medium">Status:</span> <Badge variant={previewWebinar.is_active ? "default" : "outline"}>{previewWebinar.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewWebinar.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewWebinar(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : webinars.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No webinars found.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Webinars</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Host</th>
                    <th className="px-3 py-2 text-left font-medium">Scheduled</th>
                    <th className="px-3 py-2 text-left font-medium">Access</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webinars.map((w) => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{w.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.host_name}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{fmtDateTime(w.scheduled_at)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={w.is_free ? "bg-blue-500/10 text-blue-500" : "bg-yellow-500/10 text-yellow-500"}>
                          {w.is_free ? "Free" : "Paid"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={w.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {w.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewWebinar(w)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/webinars/${w.id}/edit`} className="text-sm text-blue-500">Edit</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
