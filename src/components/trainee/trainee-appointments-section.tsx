"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, Loader2, ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TraineeAppointment {
  id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  service_name: string | null;
  client_name: string | null;
  client_email: string | null;
  base_price: number;
  total_amount: number;
  booking_notes: string | null;
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

function fmtMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Post-training appointment list. Queries /api/trainee/appointments,
 * which resolves the authenticated trainee's email via Supabase auth
 * and returns bookings whose client matches that email.
 *
 * When the trainee has one or more appointments, renders each row with
 * a "See Details" button that opens a read-only slide-over with the
 * core booking fields. Full reschedule/cancel surface is intentionally
 * omitted for the trainee view — those actions belong to the diviner
 * dashboard at /dashboard/bookings.
 */
export function TraineeAppointmentsSection() {
  const [appts, setAppts] = useState<TraineeAppointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TraineeAppointment | null>(null);

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
  }, [load]);

  // Hide the whole section when there are no appointments — this keeps
  // the dashboard clean for trainees who haven't booked yet.
  if (!loading && (!appts || appts.length === 0)) return null;

  // Split upcoming vs past
  const now = Date.now();
  const upcoming = (appts ?? []).filter(
    (a) => new Date(a.scheduled_at).getTime() >= now
  );
  const past = (appts ?? []).filter(
    (a) => new Date(a.scheduled_at).getTime() < now
  );

  return (
    <>
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
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full text-left flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
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
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read-only detail drawer */}
      <Sheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.service_name ?? "Appointment"}</SheetTitle>
                <SheetDescription>
                  {fmtDateTime(selected.scheduled_at)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <DetailRow
                  label="Status"
                  value={
                    <Badge variant={STATUS_VARIANT[selected.status] ?? "outline"}>
                      {selected.status}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Scheduled"
                  value={fmtDateTime(selected.scheduled_at)}
                />
                <DetailRow
                  label="Duration"
                  value={`${selected.duration_minutes} minutes`}
                />
                {selected.client_name && (
                  <DetailRow label="Booked as" value={selected.client_name} />
                )}
                {selected.client_email && (
                  <DetailRow label="Email" value={selected.client_email} />
                )}
                {selected.total_amount > 0 && (
                  <DetailRow
                    label="Amount"
                    value={fmtMoney(selected.total_amount)}
                  />
                )}
                {selected.booking_notes && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/20 p-2.5 text-xs">
                      {selected.booking_notes}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-[10px] text-muted-foreground">
                    Need to reschedule, cancel, or manage this appointment?
                    Contact the host directly — or reply to your booking
                    confirmation email.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`mailto:${selected.client_email ?? ""}?subject=Appointment%20${encodeURIComponent(selected.service_name ?? "")}`}
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Email me my details
                  </a>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
