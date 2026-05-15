"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarEventForm } from "@/components/admin/calendar-event-form";

export default function NewCalendarEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: any) {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        priority: parseInt(data.priority) || 0,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create event");
      setSaving(false);
      return;
    }

    router.push("/admin/calendar");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/calendar"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Calendar
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Event</h1>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
          {error}
        </div>
      )}

      <CalendarEventForm
        isEdit={false}
        saving={saving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
