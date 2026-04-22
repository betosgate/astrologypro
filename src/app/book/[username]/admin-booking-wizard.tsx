"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";

type Slot = {
  start: string;
  end: string;
  availabilityTitle?: string;
  availabilityDescription?: string | null;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  availabilityTimezone?: string;
  availabilityId?: string;
};

type SlotsResponse = {
  username: string;
  date: string;
  durationMinutes: number;
  timezone: string;
  slots: Slot[];
};

type MonthResponse = {
  availableDates: string[];
  durationMinutes: number;
  timezone: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatSlotTime(iso: string, timezone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

function formatFullDate(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

interface Props {
  username: string;
  defaultTimezone: string;
  defaultDurationMinutes: number;
  /**
   * When set, the email input is prefilled with this value and
   * rendered read-only. The value MUST come from server-side auth
   * (supabase.auth.getUser()), never from a client-supplied query param,
   * so the caller cannot spoof a foreign email.
   * Used by the trainee-dashboard → Tabbie booking prefill flow.
   */
  lockedEmail?: string | null;
}

export function AdminBookingWizard({
  username,
  defaultTimezone,
  defaultDurationMinutes,
  lockedEmail,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    defaultDurationMinutes,
  );
  const [timezone, setTimezone] = useState<string>(defaultTimezone);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(lockedEmail ?? "");
  const [note, setNote] = useState("");

  // If the caller passes a lockedEmail (trainee prefill flow), keep the
  // state in sync even if Next.js hydrates with an empty default.
  useEffect(() => {
    if (lockedEmail) setEmail(lockedEmail);
  }, [lockedEmail]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Slot | null>(null);

  const viewerTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const canGoPrev = new Date(year, monthIdx, 1) > today;

  const prevMonth = () => setCurrentMonth(new Date(year, monthIdx - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, monthIdx + 1, 1));

  // Fetch available dates for the visible month
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoadingDates(true);
      try {
        const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
        const res = await fetch(
          `/api/book/${encodeURIComponent(username)}/month?month=${monthKey}`,
        );
        const data: MonthResponse | { error: string } = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setAvailableDates(new Set());
          return;
        }
        const ok = data as MonthResponse;
        setAvailableDates(new Set(ok.availableDates ?? []));
        if (ok.durationMinutes) setDurationMinutes(ok.durationMinutes);
        if (ok.timezone) setTimezone(ok.timezone);
      } catch {
        if (!cancelled) setAvailableDates(new Set());
      } finally {
        if (!cancelled) setLoadingDates(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [username, year, monthIdx]);

  // Fetch slots for the selected date
  const fetchSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true);
      setSlotsError(null);
      try {
        const res = await fetch(
          `/api/book/${encodeURIComponent(username)}/slots?date=${encodeURIComponent(date)}`,
        );
        const data: SlotsResponse | { error: string } = await res.json();
        if (!res.ok) {
          setSlots([]);
          setSlotsError(("error" in data && data.error) || "Failed to load slots.");
          return;
        }
        const ok = data as SlotsResponse;
        setSlots(ok.slots);
        setDurationMinutes(ok.durationMinutes);
        setTimezone(ok.timezone);
      } catch {
        setSlots([]);
        setSlotsError("Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [username],
  );

  useEffect(() => {
    if (!selectedDate) return;
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  // Reset the slot + form when date changes
  useEffect(() => {
    setSelectedSlot(null);
    setFormError(null);
  }, [selectedDate]);

  async function handleSubmit() {
    if (!selectedSlot) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/book/${encodeURIComponent(username)}/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: selectedSlot.start,
            durationMinutes,
            timezone,
            clientName: name,
            clientEmail: email,
            clientNote: note,
            availabilityId: selectedSlot.availabilityId,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setFormError(json?.error ?? "Failed to create booking.");
        return;
      }
      setConfirmation(selectedSlot);
    } catch {
      setFormError("Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  // Group slots by availability template (same UX as diviner page)
  const slotGroups = useMemo(() => {
    const groups: {
      id: string;
      title: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      description?: string | null;
      slots: Slot[];
    }[] = [];
    for (const slot of slots) {
      const gid = slot.availabilityId ?? "__unscoped__";
      let g = groups.find((x) => x.id === gid);
      if (!g) {
        g = {
          id: gid,
          title: slot.availabilityTitle ?? "",
          startTime: slot.availabilityStartTime,
          endTime: slot.availabilityEndTime,
          timezone: slot.availabilityTimezone,
          description: slot.availabilityDescription,
          slots: [],
        };
        groups.push(g);
      }
      g.slots.push(slot);
    }
    return groups;
  }, [slots]);

  if (confirmation) {
    const endIso = new Date(
      new Date(confirmation.start).getTime() + durationMinutes * 60_000,
    ).toISOString();
    return (
      <div className="mx-auto max-w-lg animate-[fade-up_500ms_ease-out]">
        <style>{`
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pop-in {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes ring-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.35); }
            50%      { box-shadow: 0 0 0 14px rgba(201, 168, 76, 0); }
          }
          @keyframes draw-check {
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        <div className="glass-card relative overflow-hidden rounded-xl p-8 text-center">
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#c9a84c]/15"
            style={{
              animation:
                "pop-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both, ring-pulse 1.8s ease-out 0.5s 2",
            }}
          >
            <svg
              viewBox="0 0 52 52"
              className="size-10"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M14 27l8 8 16-18"
                strokeDasharray="50"
                strokeDashoffset="50"
                style={{
                  animation: "draw-check 450ms ease-out 350ms forwards",
                }}
              />
            </svg>
          </div>

          <h2 className="mt-5 font-display text-2xl font-semibold text-cream md:text-3xl">
            Thank you, {name.trim().split(" ")[0] || "friend"}!
          </h2>
          <p className="mt-2 text-sm text-silver/70">
            Your booking with{" "}
            <span className="font-medium text-cream">{username}</span> is
            confirmed. A note has been recorded against{" "}
            <span className="font-medium text-cream">{email}</span>.
          </p>

          <div className="mt-6 space-y-3 text-left">
            <div className="rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#c9a84c]">
                When
              </p>
              <p className="mt-1 text-sm font-semibold text-cream">
                {formatFullDate(confirmation.start, timezone)}
              </p>
              <p className="mt-0.5 text-xs text-silver/60">
                Ends at {formatSlotTime(endIso, timezone)} •{" "}
                {durationMinutes} minutes
              </p>
            </div>

            {note.trim() && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-silver/60">
                  Your note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-cream/90">
                  {note.trim()}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-silver/60">
                What&rsquo;s next
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-silver/70">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-[#c9a84c]/70" />
                  <span>
                    We&rsquo;ve recorded your booking on the host&rsquo;s calendar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-[#c9a84c]/70" />
                  <span>
                    The host will reach out at{" "}
                    <span className="text-cream/90">{email}</span> with meeting
                    details before the session.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-[#c9a84c]/70" />
                  <span>
                    Need to change plans? Reply to the host&rsquo;s email and
                    they&rsquo;ll help you reschedule.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-wider text-silver/40">
            You can safely close this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Month calendar */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="rounded p-1 text-[#b8bcd0]/50 transition-colors hover:text-[#c9a84c] disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-[#f5f0e8]">
            {MONTHS[monthIdx]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded p-1 text-[#b8bcd0]/50 transition-colors hover:text-[#c9a84c]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-[#b8bcd0]/40"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const cellDate = new Date(year, monthIdx, day);
            const isPast = cellDate < today;
            const isAvailable = availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = cellDate.toDateString() === new Date().toDateString();

            return (
              <button
                key={day}
                disabled={isPast || !isAvailable}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative rounded-md py-1.5 text-xs transition-all ${
                  isSelected
                    ? "bg-[#c9a84c] font-bold text-black"
                    : isAvailable
                      ? "text-[#f5f0e8] hover:bg-[#c9a84c]/20"
                      : isPast
                        ? "text-[#b8bcd0]/20"
                        : "text-[#b8bcd0]/30"
                } ${isToday && !isSelected ? "ring-1 ring-[#c9a84c]/40" : ""}`}
              >
                {day}
                {isAvailable && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#c9a84c]/60" />
                )}
              </button>
            );
          })}
        </div>

        {loadingDates && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#b8bcd0]/40">
            <div className="size-3 animate-spin rounded-full border border-[#c9a84c]/30 border-t-[#c9a84c]" />
            Loading availability…
          </div>
        )}
      </div>

      {/* Time slots — shown after a date is selected, and only while no slot
          is picked. Once user picks a slot, the form replaces this panel. */}
      {selectedDate && !selectedSlot && (
        <div className="mt-3 glass-card rounded-xl p-4">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#b8bcd0]/50">
              <Clock className="mr-1 inline size-3" />
              Available times for{" "}
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-[11px] text-[#b8bcd0]/45">
              Shown in your timezone: {viewerTimezone.replace(/_/g, " ")}
            </p>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-4">
              <div className="size-4 animate-spin rounded-full border-2 border-[#c9a84c]/30 border-t-[#c9a84c]" />
            </div>
          ) : slotsError ? (
            <p className="py-2 text-center text-xs text-red-300/80">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="py-2 text-center text-xs text-[#b8bcd0]/40">
              No slots available this day
            </p>
          ) : (
            slotGroups.map((group) => (
              <div key={group.id} className="mb-4 last:mb-0">
                {group.title && (
                  <div className="mb-3 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-3 py-2 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                      {group.title}
                    </p>
                    {(group.startTime || group.endTime) && (
                      <p className="mt-1 text-xs text-[#b8bcd0]/70">
                        {group.startTime} - {group.endTime}
                        {group.timezone
                          ? ` • ${group.timezone.replace(/_/g, " ")}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {group.slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className="rounded-lg border border-white/8 bg-white/5 px-2 py-2 text-center text-xs font-medium text-[#f5f0e8] transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
                    >
                      {formatSlotTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Details form — shown once a slot is picked */}
      {selectedSlot && (
        <div className="mt-3 glass-card rounded-xl p-4">
          <div className="mb-4 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
              Your time
            </p>
            <p className="mt-1 text-sm text-[#f5f0e8]">
              {formatFullDate(selectedSlot.start, timezone)}
            </p>
            <p className="mt-0.5 text-xs text-[#b8bcd0]/70">
              {durationMinutes} minutes
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="client-name"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#b8bcd0]/60"
              >
                Name
              </label>
              <input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                autoComplete="name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#f5f0e8] outline-none transition focus:border-[#c9a84c]/60"
              />
            </div>
            <div>
              <label
                htmlFor="client-email"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#b8bcd0]/60"
              >
                Email
              </label>
              <input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => {
                  if (lockedEmail) return; // locked — ignore edits
                  setEmail(e.target.value);
                }}
                autoComplete="email"
                readOnly={!!lockedEmail}
                disabled={!!lockedEmail}
                aria-readonly={!!lockedEmail}
                title={lockedEmail ? "This email is locked to your account" : undefined}
                className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-[#f5f0e8] outline-none transition focus:border-[#c9a84c]/60 ${
                  lockedEmail
                    ? "border-white/5 cursor-not-allowed opacity-80"
                    : "border-white/10"
                }`}
              />
              {lockedEmail && (
                <p className="mt-1 text-[10px] text-[#b8bcd0]/50">
                  Locked to your account email.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="client-note"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#b8bcd0]/60"
              >
                Note (optional)
              </label>
              <textarea
                id="client-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Anything you want us to know?"
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#f5f0e8] outline-none transition focus:border-[#c9a84c]/60"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-center text-xs text-red-300/80">{formError}</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedSlot(null)}
              disabled={submitting}
              className="text-xs font-medium text-[#b8bcd0]/60 transition-colors hover:text-[#f5f0e8]"
            >
              ← Change time
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !email.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#d4b055] disabled:opacity-40"
            >
              {submitting ? "Booking…" : "Confirm booking"}
              {!submitting && <ArrowRight className="size-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
