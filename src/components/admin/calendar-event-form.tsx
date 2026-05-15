"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EVENT_CATEGORIES,
  EVENT_AUDIENCES,
  RECURRENCE_DAYS,
  RecurrenceDay,
} from "@/lib/calendar-events/constants";
import { getRecurrenceDisplay, CalendarRecurrenceDisplayEvent } from "@/lib/calendar-events/display";
import { generateOccurrenceResult, zonedDateTimeToUtc } from "@/lib/calendar-events/recurrence";
import { TIMEZONE_OPTIONS, getLocalTimezone } from "@/lib/timezone-utils";
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";

export interface EventFormValues {
  title: string;
  description: string;
  category: string;
  start_at: string;
  end_at: string;
  display_for: string;
  priority: string;
  is_active: boolean;
  timezone: string;
}

interface CalendarEventFormProps {
  initialValues?: Partial<EventFormValues>;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
  recurrenceContext?: CalendarRecurrenceDisplayEvent | null;
}

export function CalendarEventForm({
  initialValues,
  isEdit = false,
  onSubmit,
  onDelete,
  saving,
  recurrenceContext,
}: CalendarEventFormProps) {
  const router = useRouter();
  const recurrenceDisplay = getRecurrenceDisplay(recurrenceContext ?? {});

  const [form, setForm] = useState<EventFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    category: initialValues?.category ?? "",
    start_at: initialValues?.start_at ?? "",
    end_at: initialValues?.end_at ?? "",
    display_for: initialValues?.display_for ?? "members",
    priority: initialValues?.priority ?? "0",
    is_active: initialValues?.is_active ?? true,
    timezone: initialValues?.timezone ?? getLocalTimezone(),
  });

  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringDays, setRecurringDays] = useState<RecurrenceDay[]>([]);
  const [rangeEnd, setRangeEnd] = useState("");
  const timezoneOptions = useMemo(() => {
    if (TIMEZONE_OPTIONS.some((option) => option.value === form.timezone)) return TIMEZONE_OPTIONS;
    return [
      ...TIMEZONE_OPTIONS,
      { value: form.timezone, label: form.timezone.replace(/_/g, " "), abbr: form.timezone },
    ];
  }, [form.timezone]);

  const handleShortcut = (shortcut: "weekend" | "weekdays" | "everyday") => {
    if (shortcut === "weekend") setRecurringDays(["sat", "sun"]);
    else if (shortcut === "weekdays") setRecurringDays(["mon", "tue", "wed", "thu", "fri"]);
    else if (shortcut === "everyday") setRecurringDays(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
  };

  const previewResult = useMemo(() => {
    if (!recurringEnabled || !form.start_at || !form.end_at || !rangeEnd || recurringDays.length === 0) {
      return { occurrences: [], exceededLimit: false };
    }
    const start = zonedDateTimeToUtc(form.start_at, form.timezone);
    const end = zonedDateTimeToUtc(form.end_at, form.timezone);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { occurrences: [], exceededLimit: false };
    }

    // Keep this preview calculation aligned with the server-side manual occurrence
    // generation. Future cron should use the same recurrence rule semantics.
    return generateOccurrenceResult(
      start,
      end,
      {
        enabled: true,
        type: "weekly",
        days: recurringDays,
        range_end: rangeEnd,
        timezone: form.timezone,
      },
      120
    );
  }, [recurringEnabled, form.start_at, form.end_at, form.timezone, rangeEnd, recurringDays]);

  const previewOccurrences = previewResult.occurrences;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, timezone: form.timezone };
    if (!isEdit && recurringEnabled) {
      payload.recurrence = {
        enabled: true,
        type: "weekly",
        days: recurringDays,
        range_end: rangeEnd,
        timezone: form.timezone,
      };
    }
    await onSubmit(payload);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-9 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="" disabled>Select category</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_at">Start *</Label>
              <Input
                id="start_at"
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_at">End *</Label>
              <Input
                id="end_at"
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_for">Audience *</Label>
            <select
              id="display_for"
              value={form.display_for}
              onChange={(e) => setForm({ ...form, display_for: e.target.value })}
              className="w-full h-9 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              {EVENT_AUDIENCES.map((aud) => (
                <option key={aud.value} value={aud.value}>{aud.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone *</Label>
            <select
              id="timezone"
              required
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full h-9 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Event times and recurring dates are created in this timezone. Community members still see times in their local timezone.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {!isEdit && (
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id="recurring_enabled"
                  checked={recurringEnabled}
                  onCheckedChange={(checked) => setRecurringEnabled(!!checked)}
                />
                <Label htmlFor="recurring_enabled" className="font-semibold text-base">Repeat this event</Label>
                {recurringEnabled && (
                  <Badge variant="outline" className="border-yellow-500/40 text-yellow-600">
                    Automation Pending
                  </Badge>
                )}
              </div>

              {recurringEnabled && (
                <div className="space-y-4 ml-6">
                  <div className="space-y-2">
                    <Label>Repeat on:</Label>
                    <div className="flex flex-wrap gap-4">
                      {RECURRENCE_DAYS.map((day) => (
                        <div key={day.value} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={recurringDays.includes(day.value)}
                            onCheckedChange={(checked) => {
                              if (checked) setRecurringDays([...recurringDays, day.value]);
                              else setRecurringDays(recurringDays.filter((d) => d !== day.value));
                            }}
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quick select:</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcut("weekend")}>Weekend</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcut("weekdays")}>Weekdays</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcut("everyday")}>Everyday</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="range_end">Repeat until *</Label>
                    <Input
                      id="range_end"
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      required={recurringEnabled}
                      className="max-w-[200px]"
                    />
                  </div>

                  {(previewOccurrences.length > 0 || previewResult.exceededLimit) && (
                    <div className="mt-4 p-4 rounded-md border bg-muted/30 text-sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">Occurrences to be created ({previewOccurrences.length})</h4>
                        <Badge variant="outline" className="border-yellow-500/40 text-yellow-600">
                          Automation Pending
                        </Badge>
                      </div>
                      {previewResult.exceededLimit && (
                        <p className="mb-2 text-xs text-red-500">
                          This repeat range creates more than 120 dates. Shorten the repeat range before saving.
                        </p>
                      )}
                      <ul className="space-y-1 mb-2 text-muted-foreground">
                        {previewOccurrences.slice(0, 4).map((occ, idx) => (
                          <li key={idx}>
                            {occ.start_at.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: form.timezone })}{" "}
                            {occ.start_at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: form.timezone })} - {" "}
                            {occ.end_at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: form.timezone })}
                          </li>
                        ))}
                        {previewOccurrences.length > 4 && (
                          <li>+{previewOccurrences.length - 4} more</li>
                        )}
                      </ul>
                      <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                        Occurrences are shown in {form.timezone}. They will be created as real calendar events when this form is saved. Automation is pending before launch.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isEdit && recurrenceDisplay.isRecurring && (
            <div className="mt-4 space-y-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  <Repeat className="mr-1 size-3" />
                  Recurring
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {recurrenceDisplay.typeLabel}
                </Badge>
                {recurrenceDisplay.occurrenceLabel && (
                  <Badge variant="outline" className="text-[10px]">
                    {recurrenceDisplay.occurrenceLabel}
                  </Badge>
                )}
                {recurrenceDisplay.automationLabel && (
                  <Badge variant="outline" className="border-yellow-500/40 text-[10px] text-yellow-600">
                    {recurrenceDisplay.automationLabel}
                  </Badge>
                )}
              </div>
              <p>{recurrenceDisplay.editNotice}</p>
              <p>
                Automation pending: occurrences are generated on admin save in this phase. Before launch, cron/worker should handle rolling generation, cleanup, reminders, and long-range maintenance.
              </p>
            </div>
          )}

          {isEdit && !recurrenceDisplay.isRecurring && (
            <div className="mt-4 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p>This is a one-time calendar event.</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/calendar")}
              >
                Cancel
              </Button>
            </div>
            {isEdit && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                {recurrenceDisplay.isRecurring ? "Delete This Occurrence" : "Delete Event"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
