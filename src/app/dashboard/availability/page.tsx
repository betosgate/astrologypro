"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET) — UTC−5/−4" },
  { value: "America/Chicago", label: "Central Time (CT) — UTC−6/−5" },
  { value: "America/Denver", label: "Mountain Time (MT) — UTC−7/−6" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) — UTC−8/−7" },
  { value: "America/Anchorage", label: "Alaska Time (AKT) — UTC−9/−8" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HAT) — UTC−10" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST) — UTC+5:30" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

type AvailabilityTemplate = {
  id: string;
  diviner_id: string;
  title: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  title: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  description: string;
  is_active: boolean;
};

const defaultForm = (): FormState => ({
  title: "",
  start_date: "",
  end_date: "",
  weekdays: [],
  start_time: "09:00",
  end_time: "17:00",
  timezone: "America/New_York",
  duration_minutes: 60,
  description: "",
  is_active: true,
});

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "No date set";
  try {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startDate = new Date(start + "T12:00:00");
    const endDate = new Date(end + "T12:00:00");
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "Invalid date";

    const startStr = startDate.toLocaleDateString("en-US", opts);
    const endStr = endDate.toLocaleDateString("en-US", {
      ...opts,
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  } catch {
    return "Date error";
  }
}

function formatTimeRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const toAmPm = (t: string) => {
    try {
      const parts = (t || "").split(":");
      if (parts.length < 2) return t;
      const [h, m] = parts.map(Number);
      if (isNaN(h) || isNaN(m)) return t;
      const period = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch {
      return t;
    }
  };
  return `${toAmPm(start)} – ${toAmPm(end)}`;
}

function validate(form: FormState): string | null {
  if (!form.start_date || !form.end_date) return "Start and end date are required.";
  if (form.end_date < form.start_date) return "End date must be on or after start date.";
  if (!form.start_time || !form.end_time) return "Start and end time are required.";
  if (form.end_time <= form.start_time) return "End time must be after start time.";
  if (form.weekdays.length === 0) return "Select at least one weekday.";
  if (!form.timezone) return "Timezone is required.";
  return null;
}

export default function AvailabilityPage() {
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AvailabilityTemplate | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/availability");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates ?? []);
      }
    } catch (err) {
      console.error("[AvailabilityPage] Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function openCreate() {
    setEditTarget(null);
    setForm(defaultForm());
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(t: AvailabilityTemplate) {
    setEditTarget(t);
    setForm({
      title: t.title,
      start_date: t.start_date,
      end_date: t.end_date,
      weekdays: t.weekdays ?? [],
      start_time: t.start_time,
      end_time: t.end_time,
      timezone: t.timezone,
      duration_minutes: t.duration_minutes,
      description: t.description ?? "",
      is_active: t.is_active,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function toggleWeekday(day: number) {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort((a, b) => a - b),
    }));
  }

  async function handleSave() {
    const err = validate(form);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || "Available",
        start_date: form.start_date,
        end_date: form.end_date,
        weekdays: form.weekdays,
        start_time: form.start_time,
        end_time: form.end_time,
        timezone: form.timezone,
        duration_minutes: form.duration_minutes,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };

      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/dashboard/availability/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/dashboard/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const json = await res.json();
        setFormError(json.error ?? "Failed to save.");
        return;
      }

      setDialogOpen(false);
      await loadTemplates();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(t: AvailabilityTemplate) {
    const res = await fetch(`/api/dashboard/availability/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_active: !t.is_active } : item))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/dashboard/availability/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteId(null);
    }
  }

  const tzLabel = (tz: string) =>
    TIMEZONE_OPTIONS.find((o) => o.value === tz)?.label ?? tz;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
            <p className="text-muted-foreground text-sm">
              Define the windows when clients can book sessions with you.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1.5 size-4" />
          New Schedule
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading schedules…</p>
      )}

      {/* Empty state */}
      {!loading && templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No availability schedules yet. Create one to start accepting bookings.
            </p>
            <Button className="mt-4" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" />
              New Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template cards */}
      {!loading && templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card
              key={t.id}
              className="border border-border/60 bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      t.is_active
                        ? "bg-green-500/10 text-green-500 border-green-500/30 shrink-0"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30 shrink-0"
                    }
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  {formatDateRange(t.start_date, t.end_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Weekday pills */}
                <div className="flex flex-wrap gap-1">
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <span
                      key={idx}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                        (t.weekdays ?? []).includes(idx)
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-muted/40 text-muted-foreground border-border/40"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Time + duration */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Time</span>
                    <span className="text-foreground font-medium text-xs">
                      {formatTimeRange(t.start_time, t.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Duration</span>
                    <span className="text-foreground font-medium text-xs">{t.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Timezone</span>
                    <span className="text-foreground text-xs truncate max-w-[160px] text-right">
                      {tzLabel(t.timezone)}
                    </span>
                  </div>
                </div>

                {t.description && (
                  <div
                    className="prose prose-xs dark:prose-invert text-xs text-muted-foreground line-clamp-2 border-t border-border/40 pt-2 max-w-none"
                    dangerouslySetInnerHTML={{ __html: t.description }}
                  />
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={() => handleToggleActive(t)}
                      size="sm"
                      aria-label={t.is_active ? "Deactivate schedule" : "Activate schedule"}
                    />
                    <span className="text-xs text-muted-foreground">
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(t)}
                      aria-label="Edit schedule"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(t.id)}
                      aria-label="Delete schedule"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Schedule" : "New Availability Schedule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="av-title">Title</Label>
              <Input
                id="av-title"
                placeholder="e.g. Spring Sessions"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="av-start-date">Start Date</Label>
                <Input
                  id="av-start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-end-date">End Date</Label>
                <Input
                  id="av-end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Weekdays */}
            <div className="space-y-1.5">
              <Label>Available Weekdays</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      form.weekdays.includes(idx)
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70"
                    }`}
                    aria-pressed={form.weekdays.includes(idx)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="av-start-time">Start Time</Label>
                <Input
                  id="av-start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-end-time">End Time</Label>
                <Input
                  id="av-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="av-duration">Session Duration</Label>
              <select
                id="av-duration"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label htmlFor="av-timezone">Timezone</Label>
              <select
                id="av-timezone"
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {TIMEZONE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="av-description">
                Notes / Instructions{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                placeholder="e.g. Available for new clients. Bring your birth details."
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="av-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="av-active" className="cursor-pointer">
                {form.is_active ? "Active — visible to clients" : "Inactive — hidden from clients"}
              </Label>
            </div>

            {formError && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editTarget ? "Update Schedule" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Schedule?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently remove the availability schedule. Existing bookings are not
            affected.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
