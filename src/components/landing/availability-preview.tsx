"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
}

interface AvailabilityPreviewProps {
  divinerId: string;
  username: string;
}

export function AvailabilityPreview({
  divinerId,
  username,
}: AvailabilityPreviewProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch(`/api/availability/${divinerId}?limit=3`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        }
      } catch {
        // Silently fail — section just won't render slots
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [divinerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (slots.length === 0) return null;

  function formatSlotDate(dateStr: string) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
  }

  function formatSlotTime(dateStr: string) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="glass-card flex items-center gap-3 rounded-lg px-4 py-3"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold/10">
              <Calendar className="size-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream">
                {formatSlotDate(slot.start_time)}
              </p>
              <p className="flex items-center gap-1 text-xs text-silver/60">
                <Clock className="size-3" />
                {formatSlotTime(slot.start_time)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href={`/${username}/book`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
        >
          See All Available Times
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
