"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CalendarEventForm, EventFormValues } from "@/components/admin/calendar-event-form";

function toDatetimeLocal(iso: string | null | undefined, timezone = "UTC"): string {
  if (!iso) return "";
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}

export default function EditCalendarEventPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialValues, setInitialValues] = useState<Partial<EventFormValues>>({});

  useEffect(() => {
    fetch(`/api/admin/calendar/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const timezone = data.event_timezone ?? data.recurrence_rule?.timezone ?? "UTC";
        setInitialValues({
          title: data.title ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          start_at: toDatetimeLocal(data.start_at, timezone),
          end_at: toDatetimeLocal(data.end_at, timezone),
          display_for: data.display_for ?? "members",
          priority: data.priority != null ? String(data.priority) : "0",
          is_active: data.is_active ?? true,
          timezone,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load event");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(data: any) {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/calendar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        priority: parseInt(data.priority) || 0,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update event");
      setSaving(false);
      return;
    }

    router.push("/admin/calendar");
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;

    // In Phase 1, we only allow deleting single occurrences by default.
    // To properly support "delete future", we would need to know if this is part of a series,
    // but the API defaults to 'single' delete unless seriesAction=future is provided.

    const res = await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/calendar");
    else setError("Failed to delete event");
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/calendar"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Calendar
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Event</h1>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
          {error}
        </div>
      )}

      <CalendarEventForm
        initialValues={initialValues}
        isEdit={true}
        saving={saving}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
