"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";

interface TraineeAppointment {
  id: string;
  source: "bookings" | "admin_bookings";
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  diviner_id: string | null;
  diviner_username: string | null;
  /**
   * Server-computed calendar reschedule page URL:
   *   - Diviner booking → `/{divinerUsername}/reschedule/{id}`
   *   - Admin booking   → `/book/{adminUsername}/reschedule/{id}`
   * Null when we can't resolve a host username, in which case the drawer
   * falls back to its inline datetime form.
   */
  reschedule_href: string | null;
  /**
   * Server-computed video-session join URL.
   *   - Diviner booking → `/{divinerUsername}/session/{id}`
   *   - Admin booking   → `/book/{adminUsername}/session/{id}`
   */
  join_href: string | null;
  service_id: string | null;
  service_name: string | null;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  base_price: number;
  total_amount: number;
  booking_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  completed: "default",
  cancelled: "destructive",
  canceled: "destructive",
  no_show: "destructive",
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Post-training appointment list. Queries /api/trainee/appointments,
 * which resolves the authenticated trainee's email via Supabase auth
 * and returns bookings whose client matches that email.
 *
 * Each row exposes a "Details" button that mounts the shared
 * `BookingDetailSheet` in `viewerRole="client"` mode — the same drawer
 * used by /dashboard/bookings but with all mutation actions
 * (reschedule, cancel, refund, session-notes, send-note, sync
 * payment/recording, join session) hidden. The underlying read-only
 * APIs (session-details, recording-segments) accept trainee callers as
 * "client" via lib/booking-access.ts.
 */
export function TraineeAppointmentsSection() {
  const [appts, setAppts] = useState<TraineeAppointment[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trainee/appointments", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setAppts((json.data ?? []) as TraineeAppointment[]);
      } else {
        setAppts([]);
      }
    } catch {
      setAppts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    function handlePageShow() {
      void load();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [load]);

  // Hide the whole section when there are no appointments — this keeps
  // the dashboard clean for trainees who haven't booked yet.
  if (!loading && (!appts || appts.length === 0)) return null;

  // Split upcoming vs past for a consistent ordering.
  const now = Date.now();
  const upcoming = (appts ?? []).filter(
    (a) => new Date(a.scheduled_at).getTime() >= now
  );
  const past = (appts ?? []).filter(
    (a) => new Date(a.scheduled_at).getTime() < now
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          My Appointments
        </CardTitle>
        <CardDescription className="text-xs">
          {loading
            ? "Loading…"
            : `${upcoming.length} upcoming · ${past.length} past`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading appointments…
          </div>
        ) : (
          <div className="space-y-2">
            {[...upcoming, ...past].map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2.5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Clock className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {a.service_name ?? "Appointment"}
                    </p>
                    <Badge
                      variant={STATUS_VARIANT[a.status] ?? "outline"}
                      className="text-[10px]"
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDateTime(a.scheduled_at)} · {a.duration_minutes} min
                  </p>
                </div>
                <BookingDetailSheet
                  detailsOnly={a.source === "admin_bookings"}
                  actionBasePath={
                    a.source === "admin_bookings"
                      ? `/api/trainee/appointments/admin-bookings/${a.id}`
                      : null
                  }
                  viewerRole="client"
                  rescheduleHref={a.reschedule_href ?? null}
                  joinHref={a.join_href ?? null}
                  booking={{
                    id: a.id,
                    scheduled_at: a.scheduled_at,
                    status: a.status,
                    duration: a.duration_minutes,
                    amount: a.total_amount,
                    base_price: a.base_price,
                    notes: a.booking_notes,
                    booking_notes: a.booking_notes,
                    client_name: a.client_name ?? "You",
                    client_email: a.client_email ?? "",
                    client_id: a.client_id,
                    service_name: a.service_name ?? "Appointment",
                    metadata: a.metadata,
                    username: a.diviner_username ?? undefined,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
