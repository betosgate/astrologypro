"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  start_at: string;
  end_at: string | null;
  display_for: string;
  priority: number;
  is_active: boolean;
  created_at: string;
};

const DISPLAY_FOR_LABELS: Record<string, string> = {
  public: "Public",
  members: "Members",
  students: "Students",
  members_and_guests: "Members & Guests",
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

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);

  // Filters
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (startFrom) params.set("start_date_from", startFrom);
    if (startTo) params.set("start_date_to", startTo);
    if (category) params.set("category", category);
    const res = await fetch(`/api/admin/calendar?${params}`);
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetFilters() {
    setStartFrom(""); setStartTo(""); setCategory("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar Events</h1>
          <p className="text-muted-foreground">Manage community sessions and events</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/calendar/new"><Plus className="mr-1.5 size-4" /> New Event</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Start date from</Label>
              <Input type="date" value={startFrom} onChange={(e) => setStartFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start date to</Label>
              <Input type="date" value={startTo} onChange={(e) => setStartTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. workshop" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={load}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); setTimeout(load, 0); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewEvent(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Event Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewEvent.title}</div>
              {previewEvent.description && <div><span className="font-medium">Description:</span> {previewEvent.description}</div>}
              {previewEvent.category && <div><span className="font-medium">Category:</span> {previewEvent.category}</div>}
              <div><span className="font-medium">Start:</span> {fmtDateTime(previewEvent.start_at)}</div>
              {previewEvent.end_at && <div><span className="font-medium">End:</span> {fmtDateTime(previewEvent.end_at)}</div>}
              <div><span className="font-medium">Audience:</span> <Badge variant="secondary" className="text-xs">{DISPLAY_FOR_LABELS[previewEvent.display_for] ?? previewEvent.display_for ?? "—"}</Badge></div>
              <div><span className="font-medium">Priority:</span> {previewEvent.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewEvent.is_active ? "default" : "outline"}>{previewEvent.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewEvent.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewEvent(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : events.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No events found.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Events</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Category</th>
                    <th className="px-3 py-2 text-left font-medium">Start</th>
                    <th className="px-3 py-2 text-left font-medium">End</th>
                    <th className="px-3 py-2 text-left font-medium">Audience</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{event.title}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{event.category ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{fmtDateTime(event.start_at)}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{event.end_at ? fmtDateTime(event.end_at) : "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-xs">
                          {DISPLAY_FOR_LABELS[event.display_for] ?? event.display_for ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={event.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {event.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewEvent(event)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/calendar/${event.id}/edit`} className="text-sm text-blue-500">Edit</Link>
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
