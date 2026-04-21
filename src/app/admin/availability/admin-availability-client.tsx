"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const TIMEZONE_OPTIONS = [
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
  owner_id?: string;
  diviner_id?: string;
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
    const startDate = new Date(`${start}T12:00:00`);
    const endDate = new Date(`${end}T12:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return "Invalid date";
    }

    const startStr = startDate.toLocaleDateString("en-US", opts);
    const endStr = endDate.toLocaleDateString("en-US", { ...opts, year: "numeric" });
    return `${startStr} – ${endStr}`;
  } catch {
    return "Date error";
  }
}

function formatTimeRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const toAmPm = (value: string) => {
    try {
      const parts = value.split(":");
      if (parts.length < 2) return value;
      const [hours, minutes] = parts.map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
      const period = hours >= 12 ? "PM" : "AM";
      const hour = hours % 12 === 0 ? 12 : hours % 12;
      return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
    } catch {
      return value;
    }
  };

  return `${toAmPm(start)} – ${toAmPm(end)}`;
}

function validate(form: FormState): string | null {
  if (!form.start_date) return "Start date is required.";
  if (form.end_date && form.end_date < form.start_date) {
    return "End date must be on or after start date.";
  }
  if (!form.start_time || !form.end_time) return "Start and end time are required.";
  if (form.end_time <= form.start_time) return "End time must be after start time.";
  if (form.weekdays.length === 0) return "Select at least one weekday.";
  if (!form.timezone) return "Timezone is required.";
  return null;
}

export function AdminAvailabilityClient() {
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
      const res = await fetch("/api/admin/availability");
      if (!res.ok) return;
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } catch (error) {
      console.error("[AdminAvailabilityClient] Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function openCreate() {
    setEditTarget(null);
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matched = TIMEZONE_OPTIONS.find((option) => option.value === browserTz);
    setForm({ ...defaultForm(), timezone: matched ? browserTz : "America/New_York" });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(template: AvailabilityTemplate) {
    setEditTarget(template);
    setForm({
      title: template.title,
      start_date: template.start_date,
      end_date: template.end_date,
      weekdays: template.weekdays ?? [],
      start_time: template.start_time,
      end_time: template.end_time,
      timezone: template.timezone,
      duration_minutes: template.duration_minutes,
      description: template.description ?? "",
      is_active: template.is_active,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function toggleWeekday(day: number) {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((value) => value !== day)
        : [...prev.weekdays, day].sort((left, right) => left - right),
    }));
  }

  async function handleSave() {
    const error = validate(form);
    if (error) {
      setFormError(error);
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || "Available",
        start_date: form.start_date,
        end_date:
          form.end_date ||
          (() => {
            const date = new Date(`${form.start_date}T12:00:00`);
            date.setFullYear(date.getFullYear() + 2);
            return date.toISOString().slice(0, 10);
          })(),
        weekdays: form.weekdays,
        start_time: form.start_time,
        end_time: form.end_time,
        timezone: form.timezone,
        duration_minutes: form.duration_minutes,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };

      const res = await fetch(
        editTarget ? `/api/admin/availability/${editTarget.id}` : "/api/admin/availability",
        {
          method: editTarget ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Failed to save.");
        return;
      }

      const saved = json.template as AvailabilityTemplate;
      setTemplates((prev) =>
        editTarget ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
      );
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(template: AvailabilityTemplate) {
    const res = await fetch(`/api/admin/availability/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !template.is_active }),
    });
    if (!res.ok) return;

    setTemplates((prev) =>
      prev.map((item) =>
        item.id === template.id ? { ...item, is_active: !template.is_active } : item
      )
    );
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/availability/${id}`, { method: "DELETE" });
    if (!res.ok) return;

    setTemplates((prev) => prev.filter((item) => item.id !== id));
    setDeleteId(null);
  }

  const timezoneLabel = (timezone: string) =>
    TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ?? timezone;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/my-schedule">
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

      {loading && <p className="text-sm text-muted-foreground">Loading schedules…</p>}

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

      {!loading && templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="border border-border/60 bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{template.title}</CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      template.is_active
                        ? "bg-green-500/10 text-green-500 border-green-500/30 shrink-0"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30 shrink-0"
                    }
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  {formatDateRange(template.start_date, template.end_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-1">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <span
                      key={index}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                        (template.weekdays ?? []).includes(index)
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-muted/40 text-muted-foreground border-border/40"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Time</span>
                    <span className="text-foreground font-medium text-xs">
                      {formatTimeRange(template.start_time, template.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Duration</span>
                    <span className="text-foreground font-medium text-xs">
                      {template.duration_minutes} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Timezone</span>
                    <span className="text-foreground text-xs truncate max-w-[160px] text-right">
                      {timezoneLabel(template.timezone)}
                    </span>
                  </div>
                </div>

                {template.description && (
                  <div
                    className="prose prose-xs dark:prose-invert text-xs text-muted-foreground line-clamp-2 border-t border-border/40 pt-2 max-w-none"
                    dangerouslySetInnerHTML={{ __html: template.description }}
                  />
                )}

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleActive(template)}
                      size="sm"
                      aria-label={template.is_active ? "Deactivate schedule" : "Activate schedule"}
                    />
                    <span className="text-xs text-muted-foreground">
                      {template.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(template)}
                      aria-label="Edit schedule"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(template.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Schedule" : "New Availability Schedule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-availability-title">Title</Label>
              <Input
                id="admin-availability-title"
                placeholder="e.g. Spring Sessions"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-availability-start-date">Start Date</Label>
                <Input
                  id="admin-availability-start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, start_date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-availability-end-date">
                  End Date <span className="text-muted-foreground font-normal">(optional — defaults to 2 years)</span>
                </Label>
                <Input
                  id="admin-availability-end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, end_date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Available Weekdays</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWeekday(index)}
                    className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      form.weekdays.includes(index)
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70"
                    }`}
                    aria-pressed={form.weekdays.includes(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-availability-start-time">Start Time</Label>
                <Input
                  id="admin-availability-start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, start_time: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-availability-end-time">End Time</Label>
                <Input
                  id="admin-availability-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, end_time: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-availability-duration">Session Duration</Label>
              <select
                id="admin-availability-duration"
                value={form.duration_minutes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, duration_minutes: Number(event.target.value) }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {DURATION_OPTIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-availability-timezone">Timezone</Label>
              <Select
                value={form.timezone}
                onValueChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger id="admin-availability-timezone" className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-availability-description">
                Notes / Instructions{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
                placeholder="e.g. Available for new clients. Bring your birth details."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="admin-availability-active"
                checked={form.is_active}
                onCheckedChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
              />
              <Label htmlFor="admin-availability-active" className="cursor-pointer">
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
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
