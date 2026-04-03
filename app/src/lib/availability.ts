export interface SlotConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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

interface GetAvailableSlotsParams {
  date: string;
  weeklySlots: SlotConfig[];
  bookedSlots: BookedSlot[];
  overrides: Override[];
  durationMinutes: number;
  timezone: string;
}

export function getAvailableSlots({
  date,
  weeklySlots,
  bookedSlots,
  overrides,
  durationMinutes,
  timezone,
}: GetAvailableSlotsParams): { start: string; end: string }[] {
  const targetDate = new Date(date + "T00:00:00");
  const dayOfWeek = targetDate.getDay();

  // Check overrides first
  const override = overrides.find((o) => o.date === date);
  if (override && !override.isAvailable) {
    return [];
  }

  // Determine the time windows for the day
  let windows: { startTime: string; endTime: string }[];

  if (override && override.isAvailable && override.startTime && override.endTime) {
    windows = [{ startTime: override.startTime, endTime: override.endTime }];
  } else {
    windows = weeklySlots
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime }));
  }

  if (windows.length === 0) {
    return [];
  }

  const available: { start: string; end: string }[] = [];

  for (const window of windows) {
    const [startHour, startMinute] = window.startTime.split(":").map(Number);
    const [endHour, endMinute] = window.endTime.split(":").map(Number);

    const windowStart = new Date(targetDate);
    windowStart.setHours(startHour, startMinute, 0, 0);

    const windowEnd = new Date(targetDate);
    windowEnd.setHours(endHour, endMinute, 0, 0);

    let slotStart = new Date(windowStart);

    while (slotStart.getTime() + durationMinutes * 60 * 1000 <= windowEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      const candidate: BookedSlot = {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      };

      if (isSlotAvailable(candidate, bookedSlots)) {
        available.push({ start: candidate.start, end: candidate.end });
      }

      slotStart = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
    }
  }

  return available;
}

export function isSlotAvailable(slot: BookedSlot, bookedSlots: BookedSlot[]): boolean {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();

  return !bookedSlots.some((booked) => {
    const bookedStart = new Date(booked.start).getTime();
    const bookedEnd = new Date(booked.end).getTime();

    // Overlap exists if one starts before the other ends
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}
