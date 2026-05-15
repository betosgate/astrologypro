"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Repeat } from "lucide-react";
import { EVENT_CATEGORIES, EVENT_AUDIENCES } from "@/lib/calendar-events/constants";

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
  recurrence_series_id: string | null;
  recurrence_parent_id: string | null;
};

const DISPLAY_FOR_LABELS: Record<string, string> = {};
EVENT_AUDIENCES.forEach(a => DISPLAY_FOR_LABELS[a.value] = a.label);

const CATEGORY_LABELS: Record<string, string> = {};
EVENT_CATEGORIES.forEach(c => CATEGORY_LABELS[c.value] = c.label);

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

  const load = useCallback(async (overrides?: { startFrom?: string; startTo?: string; category?: string }) => {
    setLoading(true);
    const sf = overrides?.startFrom ?? "";
    const st = overrides?.startTo ?? "";
    const cat = overrides?.category ?? "";
    const params = new URLSearchParams();
    if (sf) params.set("start_date_from", sf);
    if (st) params.set("start_date_to", st);
    if (cat) params.set("category", cat);
    const res = await fetch(`/api/admin/calendar?${params}`);
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">All Categories</option>
                {EVENT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => load({ startFrom, startTo, category })}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); load({ startFrom: "", startTo: "", category: "" }); }}>Reset</Button>
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
              {previewEvent.category && <div><span className="font-medium">Category:</span> {CATEGORY_LABELS[previewEvent.category] ?? previewEvent.category}</div>}
              <div><span className="font-medium">Start:</span> {fmtDateTime(previewEvent.start_at)}</div>
              {previewEvent.end_at && <div><span className="font-medium">End:</span> {fmtDateTime(previewEvent.end_at)}</div>}
              <div><span className="font-medium">Audience:</span> <Badge variant="secondary" className="text-xs">{DISPLAY_FOR_LABELS[previewEvent.display_for] ?? previewEvent.display_for ?? "—"}</Badge></div>
              <div><span className="font-medium">Priority:</span> {previewEvent.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewEvent.is_active ? "default" : "outline"}>{previewEvent.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewEvent.created_at)}</div>
              {previewEvent.recurrence_series_id && (
                <div><span className="font-medium">Recurring:</span> Yes {previewEvent.recurrence_parent_id ? "(Occurrence)" : "(Series start)"}</div>
              )}
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
                    <th className="px-3 py-2 text-left font-medium">Audience</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{event.title}</span>
                          {event.recurrence_series_id && (
                            <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground py-0">
                              <Repeat className="mr-1 size-3" />
                              {event.recurrence_parent_id ? "Occurrence" : "Series start"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {event.category ? (
                          <Badge variant="secondary" className="font-normal">
                            {CATEGORY_LABELS[event.category] ?? event.category}
                          </Badge>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDateTime(event.start_at)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs bg-muted/40">
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
