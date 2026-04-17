export interface SlotConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityTemplateConfig {
  id: string;
  title: string;
  serviceId?: string | null;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  durationMinutes: number;
  description?: string | null;
  isActive?: boolean;
}

export interface BookedSlot {
  start: string;
  end: string;
}

export interface Override {
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
  availabilityId?: string;
  availabilityTitle?: string;
  availabilityDescription?: string | null;
  availabilityTimezone?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  availabilitySlotIntervalMinutes?: number;
  availabilityServiceId?: string | null;
  source: "template" | "legacy" | "override";
}

interface GetAvailableSlotsParams {
  date: string;
  templates?: AvailabilityTemplateConfig[];
  serviceId?: string | null;
  /** When true, ignore service_id filtering and return slots from all templates */
  allTemplates?: boolean;
  weeklySlots: SlotConfig[];
  bookedSlots: BookedSlot[];
  overrides: Override[];
  durationMinutes: number;
  timezone: string;
}

interface AvailabilityWindow {
  source: AvailableSlot["source"];
  availabilityId?: string;
  availabilityTitle?: string;
  availabilityDescription?: string | null;
  availabilityServiceId?: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function parseTime(time: string): { hour: number; minute: number; second: number } {
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  return { hour, minute, second };
}

function getDateWeekday(date: string): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const map = new Map<string, string>();
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      map.set(part.type, part.value);
    }
  }

  return {
    year: Number(map.get("year") ?? "0"),
    month: Number(map.get("month") ?? "1"),
    day: Number(map.get("day") ?? "1"),
    hour: Number(map.get("hour") ?? "0"),
    minute: Number(map.get("minute") ?? "0"),
    second: Number(map.get("second") ?? "0"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const { year, month, day } = parseDate(date);
  const { hour, minute, second } = parseTime(time);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  try {
    let offsetMs = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
    let actualUtc = utcGuess - offsetMs;

    const refinedOffsetMs = getTimeZoneOffsetMs(new Date(actualUtc), timeZone);
    if (refinedOffsetMs !== offsetMs) {
      offsetMs = refinedOffsetMs;
      actualUtc = utcGuess - offsetMs;
    }

    return new Date(actualUtc);
  } catch {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
}

function buildWindowsForDate({
  date,
  templates,
  weeklySlots,
  overrides,
  serviceId,
  allTemplates,
  timezone,
  durationMinutes,
}: Omit<GetAvailableSlotsParams, "bookedSlots">): AvailabilityWindow[] {
  const override = overrides.find((item) => item.date === date);
  if (override && !override.isAvailable) {
    return [];
  }

  if (override?.isAvailable && override.startTime && override.endTime) {
    return [
      {
        source: "override",
        timezone,
        startTime: override.startTime,
        endTime: override.endTime,
        slotIntervalMinutes: durationMinutes,
      },
    ];
  }

  const dayOfWeek = getDateWeekday(date);

  const templateWindows = (templates ?? [])
    .filter((template) => {
      if (template.isActive === false) return false;
      if (!allTemplates) {
        if (serviceId) {
          // Only show templates explicitly linked to this service.
          // Services without dedicated availability won't show any slots.
          if (template.serviceId !== serviceId) return false;
        } else if (template.serviceId) {
          return false;
        }
      }
      if (!template.weekdays?.includes(dayOfWeek)) return false;
      return date >= template.startDate && date <= template.endDate;
    })
    .map<AvailabilityWindow>((template) => ({
      source: "template",
      availabilityId: template.id,
      availabilityTitle: template.title,
      availabilityDescription: template.description ?? null,
      availabilityServiceId: template.serviceId ?? null,
      timezone: template.timezone || timezone,
      startTime: template.startTime,
      endTime: template.endTime,
      slotIntervalMinutes: template.durationMinutes || durationMinutes,
    }));

  // Legacy weekly slots are the old scheduling system. Skip them when:
  // 1. A serviceId is provided (legacy slots can't be scoped to services)
  // 2. The diviner has active templates (templates are the modern replacement)
  const hasActiveTemplates = (templates ?? []).some(
    (t) => t.isActive !== false
  );
  const skipLegacy = !!serviceId || hasActiveTemplates;

  const legacyWindows = skipLegacy
    ? []
    : weeklySlots
        .filter((slot) => slot.dayOfWeek === dayOfWeek)
        .map<AvailabilityWindow>((slot) => ({
          source: "legacy",
          timezone,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotIntervalMinutes: durationMinutes,
        }));

  return [...templateWindows, ...legacyWindows];
}

export function getAvailableSlots({
  date,
  templates = [],
  serviceId,
  allTemplates,
  weeklySlots,
  bookedSlots,
  overrides,
  durationMinutes,
  timezone,
}: GetAvailableSlotsParams): AvailableSlot[] {
  const windows = buildWindowsForDate({
    date,
    templates,
    serviceId,
    allTemplates,
    weeklySlots,
    overrides,
    durationMinutes,
    timezone,
  });

  if (windows.length === 0) {
    return [];
  }

  const available: AvailableSlot[] = [];
  const seen = new Set<string>();

  for (const window of windows) {
    const windowStart = zonedDateTimeToUtc(date, window.startTime, window.timezone);
    const windowEnd = zonedDateTimeToUtc(date, window.endTime, window.timezone);
    const stepMinutes = Math.max(5, window.slotIntervalMinutes || durationMinutes);

    let slotStart = new Date(windowStart);

    while (slotStart.getTime() + durationMinutes * 60_000 <= windowEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);

      const candidate: AvailableSlot = {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        availabilityId: window.availabilityId,
        availabilityTitle: window.availabilityTitle,
        availabilityDescription: window.availabilityDescription ?? null,
        availabilityTimezone: window.timezone,
        availabilityStartTime: window.startTime,
        availabilityEndTime: window.endTime,
        availabilitySlotIntervalMinutes: stepMinutes,
        availabilityServiceId: window.availabilityServiceId ?? null,
        source: window.source,
      };

      const dedupeKey = `${candidate.start}-${candidate.end}`;
      if (!seen.has(dedupeKey) && isSlotAvailable(candidate, bookedSlots)) {
        seen.add(dedupeKey);
        available.push(candidate);
      }

      slotStart = new Date(slotStart.getTime() + stepMinutes * 60_000);
    }
  }

  return available.sort((a, b) => a.start.localeCompare(b.start));
}

export function isSlotAvailable(slot: BookedSlot, bookedSlots: BookedSlot[]): boolean {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();

  return !bookedSlots.some((booked) => {
    const bookedStart = new Date(booked.start).getTime();
    const bookedEnd = new Date(booked.end).getTime();
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}
