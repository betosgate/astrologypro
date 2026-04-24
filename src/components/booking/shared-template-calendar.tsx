"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { formatInTimezone } from "@/lib/timezone-utils";

interface SubmissionSummary {
  id: string;
  primaryBirthCity: string | null;
  secondaryBirthCity: string | null;
  areaOfInquiry: string | null;
  question: string | null;
  submittedAt: string;
}

interface SharedTemplateCalendarProps {
  templateSlug: string;
  templateName: string;
  templateCategory: "astrology" | "tarot";
  submissionId: string | null;
  submissionSummary: SubmissionSummary | null;
  submissionError: string | null;
  compatibleDivinerCount: number;
}

interface AvailableDiviner {
  divinerId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  isCertified: boolean;
  averageRating: number | null;
  reviewCount: number;
  completedSessions: number;
  timezone: string | null;
  service: {
    id: string;
    slug: string;
    name: string;
    basePrice: number;
    durationMinutes: number;
  };
  earliestSlot: { start: string; end: string | null } | null;
  totalSlots: number;
}

interface AvailableSlotGroup {
  start: string;
  end: string | null;
  diviners: Array<
    Omit<AvailableDiviner, "earliestSlot" | "totalSlots"> & {
      slot: { start: string; end: string | null };
    }
  >;
}

export function SharedTemplateCalendar({
  templateSlug,
  templateName,
  templateCategory,
  submissionId,
  submissionSummary,
  submissionError,
  compatibleDivinerCount,
}: SharedTemplateCalendarProps) {
  const router = useRouter();

  // ── Month (calendar) state ─────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [monthLoading, setMonthLoading] = useState(true);
  const [monthLoaded, setMonthLoaded] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);

  // ── Date-aware diviner resolution state ────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotGroup[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotGroup | null>(
    null,
  );

  // Which diviner is being handed off to (so the button shows a spinner).
  const [handoffId, setHandoffId] = useState<string | null>(null);
  const [clientTimezone, setClientTimezone] = useState("UTC");

  const monthFetchRef = useRef<AbortController | null>(null);
  const dateFetchRef = useRef<AbortController | null>(null);

  const submissionQuery = useMemo(
    () =>
      submissionId ? `&submission=${encodeURIComponent(submissionId)}` : "",
    [submissionId],
  );

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detectedTimezone) setClientTimezone(detectedTimezone);
  }, []);

  // ── Fetch month availability whenever the calendar month changes ──────────
  useEffect(() => {
    monthFetchRef.current?.abort();
    const controller = new AbortController();
    monthFetchRef.current = controller;

    async function load() {
      setMonthLoading(true);
      setMonthLoaded(false);
      setMonthError(null);
      try {
        const monthKey = format(currentMonth, "yyyy-MM");
        const url =
          `/api/services/${encodeURIComponent(templateSlug)}/template-availability/month` +
          `?month=${monthKey}${submissionQuery}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(
            `Availability request failed (${res.status})`,
          );
        }
        const json = (await res.json()) as { availableDates?: unknown };
        const next = new Set<string>(
          Array.isArray(json.availableDates)
            ? (json.availableDates as unknown[]).filter(
                (v): v is string =>
                  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
              )
            : [],
        );
        setAvailableDates(next);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setAvailableDates(new Set());
        setMonthError(
          "We couldn't load availability for this month. Please try again.",
        );
      } finally {
        setMonthLoaded(true);
        setMonthLoading(false);
      }
    }
    void load();

    return () => controller.abort();
  }, [currentMonth, submissionQuery, templateSlug]);

  // ── Resolve available diviners whenever the user picks a date ─────────────
  const resolveDate = useCallback(
    async (date: Date) => {
      dateFetchRef.current?.abort();
      const controller = new AbortController();
      dateFetchRef.current = controller;

      setDateLoading(true);
      setDateError(null);
      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const url =
          `/api/services/${encodeURIComponent(templateSlug)}/template-availability` +
          `?date=${dateStr}${submissionQuery}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Date resolver failed (${res.status})`);
        }
        const json = (await res.json()) as {
          slots?: unknown;
        };
        const slots = Array.isArray(json.slots)
          ? (json.slots as AvailableSlotGroup[])
          : [];
        setAvailableSlots(slots);
        setSelectedSlot(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setAvailableSlots([]);
        setSelectedSlot(null);
        setDateError(
          "We couldn't check available times for that date. Please try another date.",
        );
      } finally {
        setDateLoading(false);
      }
    },
    [submissionQuery, templateSlug],
  );

  function onSelectDate(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setHandoffId(null);
    void resolveDate(date);
  }

  // ── Handoff — click-through to the existing booking page ──────────────────
  function continueWithDiviner(
    d: AvailableSlotGroup["diviners"][number],
    slot: AvailableSlotGroup,
  ) {
    if (!selectedDate) return;
    setHandoffId(d.divinerId);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const qs = new URLSearchParams();
    if (submissionId) qs.set("submission", submissionId);
    qs.set("date", dateStr);
    qs.set("time", slot.start);
    const url = `/${encodeURIComponent(d.username)}/book/${encodeURIComponent(
      d.service.slug,
    )}?${qs.toString()}`;
    // router.push keeps client-side navigation + prefetch
    router.push(url);
  }

  const today = startOfDay(new Date());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Submission / context banner */}
      {(submissionSummary || submissionError) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-primary" />
              Saved intake
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {submissionError ? (
              <p className="text-amber-500">{submissionError}</p>
            ) : (
              submissionSummary && (
                <>
                  <p className="text-muted-foreground">
                    We have your intake from{" "}
                    {format(
                      new Date(submissionSummary.submittedAt),
                      "MMM d, yyyy",
                    )}
                    . It will stay attached through booking.
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {submissionSummary.primaryBirthCity && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Birth city:{" "}
                        </span>
                        {submissionSummary.primaryBirthCity}
                      </div>
                    )}
                    {submissionSummary.secondaryBirthCity && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Partner:{" "}
                        </span>
                        {submissionSummary.secondaryBirthCity}
                      </div>
                    )}
                    {submissionSummary.areaOfInquiry && (
                      <div className="text-xs text-muted-foreground sm:col-span-2">
                        <span className="font-medium text-foreground">
                          Focus:{" "}
                        </span>
                        {submissionSummary.areaOfInquiry}
                      </div>
                    )}
                    {submissionSummary.question && (
                      <div className="text-xs text-muted-foreground sm:col-span-2">
                        <span className="font-medium text-foreground">
                          Question:{" "}
                        </span>
                        {submissionSummary.question}
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1 — date picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="size-4 text-primary" />
            Choose a date
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {compatibleDivinerCount}{" "}
            {compatibleDivinerCount === 1 ? "reader offers" : "readers offer"}{" "}
            this {templateCategory === "tarot" ? "reading" : "session"}. Pick a
            date and we&rsquo;ll show you who can take it.
          </p>
        </CardHeader>
        <CardContent>
          {monthError ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-500">
              {monthError}
            </div>
          ) : null}
          <div className="relative flex flex-col items-center">
            {(monthLoading || !monthLoaded) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Checking availability...
                  </p>
                </div>
              </div>
            )}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              onMonthChange={setCurrentMonth}
              disabled={(date) => {
                if (monthLoading) return true;
                if (isBefore(date, today)) return true;
                if (!monthLoaded) return false;
                const dateStr = format(date, "yyyy-MM-dd");
                return !availableDates.has(dateStr);
              }}
              className="rounded-md border"
            />
          </div>
          {monthLoaded && availableDates.size === 0 && !monthLoading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No availability this month. Try the arrows above to browse
              another month.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — time selection */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" />
              {dateLoading
                ? "Finding available times..."
                : availableSlots.length === 0
                  ? "No times available on this date"
                  : "Choose a time"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")} · Times shown in{" "}
              {clientTimezone.replace(/_/g, " ")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {dateError && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-500">
                {dateError}
              </div>
            )}

            {dateLoading && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Checking every compatible reader&rsquo;s calendar...
              </div>
            )}

            {!dateLoading && availableSlots.length === 0 && !dateError && (
              <p className="text-sm text-muted-foreground">
                Try a different date — we&rsquo;ll find a time for you.
              </p>
            )}

            {!dateLoading && availableSlots.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {availableSlots.map((slot) => {
                  const selected = selectedSlot?.start === slot.start;
                  return (
                    <Button
                      key={slot.start}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      className="h-auto justify-between px-4 py-3"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setHandoffId(null);
                      }}
                    >
                      <span className="font-semibold">
                        {formatInTimezone(slot.start, clientTimezone, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs opacity-75">
                        {slot.diviners.length}{" "}
                        {slot.diviners.length === 1 ? "reader" : "readers"}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3 — diviner selection for the selected slot */}
      {selectedDate && selectedSlot && !dateLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              {selectedSlot.diviners.length === 1
                ? "One reader is available"
                : `${selectedSlot.diviners.length} readers are available`}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
              {formatInTimezone(selectedSlot.start, clientTimezone, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSlot.diviners.map((d, idx) => {
              return (
                <div key={d.divinerId}>
                  {idx > 0 && <Separator className="my-3" />}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={d.avatarUrl ?? undefined}
                          alt={d.displayName}
                        />
                        <AvatarFallback>
                          {d.displayName.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{d.displayName}</p>
                          {d.isCertified && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[10px]"
                            >
                              <ShieldCheck className="size-3" />
                              Certified
                            </Badge>
                          )}
                        </div>
                        {d.tagline && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {d.tagline}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {d.averageRating != null && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {d.averageRating.toFixed(1)}
                              {d.reviewCount > 0 && (
                                <span>({d.reviewCount})</span>
                              )}
                            </span>
                          )}
                          {d.completedSessions > 0 && (
                            <span>{d.completedSessions} sessions</span>
                          )}
                          {d.service.durationMinutes > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" />
                              {d.service.durationMinutes} min
                            </span>
                          )}
                          <span>{formatCurrency(d.service.basePrice)}</span>
                        </div>
                        {d.timezone && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Reader local time:{" "}
                            {formatInTimezone(selectedSlot.start, d.timezone, {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => continueWithDiviner(d, selectedSlot)}
                      disabled={handoffId !== null}
                    >
                      {handoffId === d.divinerId ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {selectedSlot.diviners.length === 1
                        ? "Continue"
                        : "Book with this reader"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
