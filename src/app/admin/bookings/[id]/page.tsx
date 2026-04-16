import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingDetail = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  actual_duration_minutes: number | null;
  base_price: number | null;
  total_amount: number | null;
  overage_amount: number | null;
  status: string;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string | null;
  questionnaire_responses: Record<string, unknown> | null;
  session_notes: string | null;
  chat_transcript: { from: string; text: string; time: string }[] | null;
  cancellation_reason: string | null;
  canceled_at: string | null;
  google_calendar_event_id: string | null;
  outlook_calendar_event_id: string | null;
  daily_room_url: string | null;
  booking_token: string | null;
  created_at: string;
  updated_at: string;
  diviners: { id: string; display_name: string; username: string } | null;
  clients: { id: string; full_name: string | null; email: string } | null;
  services: { id: string; name: string; duration_minutes: number } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtCurrency(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending:     "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed:   "bg-green-500/10 text-green-700 dark:text-green-400",
  canceled:    "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  no_show:     "bg-red-500/10 text-red-700 dark:text-red-400",
  in_progress: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-44 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getBooking(id: string): Promise<BookingDetail | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(
      `id, scheduled_at, duration_minutes, actual_duration_minutes,
       base_price, total_amount, overage_amount, status,
       stripe_payment_intent_id, stripe_payment_status,
       questionnaire_responses, session_notes, chat_transcript,
       cancellation_reason, canceled_at,
       google_calendar_event_id, outlook_calendar_event_id,
       daily_room_url, booking_token, created_at, updated_at,
       diviners!inner(id, display_name, username),
       clients!inner(id, full_name, email),
       services!inner(id, name, duration_minutes)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as BookingDetail;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const client = booking.clients;
  const diviner = booking.diviners;
  const service = booking.services;

  const canCancel = !["canceled", "completed"].includes(booking.status);
  const canMarkNoShow = booking.status === "confirmed";
  const canMarkCompleted = ["confirmed", "in_progress"].includes(booking.status);

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/bookings">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Booking Detail</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
        </div>
        {/* ICS download */}
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/bookings/${booking.id}/ics`} download>
            <Download className="h-4 w-4 mr-1" />
            Download .ics
          </a>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Session info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Date &amp; Time">{fmtDate(booking.scheduled_at)}</InfoRow>
              <InfoRow label="Service">{service?.name ?? "—"}</InfoRow>
              <InfoRow label="Duration">{booking.duration_minutes} min{booking.actual_duration_minutes ? ` (actual: ${booking.actual_duration_minutes} min)` : ""}</InfoRow>
              {booking.daily_room_url && (
                <InfoRow label="Video Room">
                  <a
                    href={booking.daily_room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    Open Room
                  </a>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name">{client?.full_name ?? "—"}</InfoRow>
              <InfoRow label="Email">{client?.email ?? "—"}</InfoRow>
              {client?.id && (
                <InfoRow label="Profile">
                  <Link href={`/admin/users/${client.id}`} className="text-blue-600 dark:text-blue-400 underline">
                    View profile
                  </Link>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Diviner info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Diviner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name">{diviner?.display_name ?? "—"}</InfoRow>
              <InfoRow label="Username">{diviner?.username ? `@${diviner.username}` : "—"}</InfoRow>
              {diviner?.id && (
                <InfoRow label="Profile">
                  <Link href={`/admin/diviners`} className="text-blue-600 dark:text-blue-400 underline">
                    View diviners
                  </Link>
                </InfoRow>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Base Price">{fmtCurrency(booking.base_price)}</InfoRow>
              {(booking.overage_amount ?? 0) > 0 && (
                <InfoRow label="Overage">{fmtCurrency(booking.overage_amount)}</InfoRow>
              )}
              <InfoRow label="Total">{fmtCurrency(booking.total_amount)}</InfoRow>
              <InfoRow label="Payment Status">
                <span className={booking.stripe_payment_status === "succeeded" ? "text-green-600" : "text-amber-600"}>
                  {booking.stripe_payment_status ?? "—"}
                </span>
              </InfoRow>
              {booking.stripe_payment_intent_id && (
                <InfoRow label="Stripe PI">
                  <a
                    href={`https://dashboard.stripe.com/payments/${booking.stripe_payment_intent_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 dark:text-blue-400 underline"
                  >
                    {booking.stripe_payment_intent_id}
                  </a>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Calendar sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Calendar Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Google Calendar">
                {booking.google_calendar_event_id ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    Not connected
                  </span>
                )}
              </InfoRow>
              <InfoRow label="Outlook Calendar">
                {booking.outlook_calendar_event_id ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    Not connected
                  </span>
                )}
              </InfoRow>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Created">{fmtDate(booking.created_at)}</InfoRow>
              <InfoRow label="Last Updated">{fmtDate(booking.updated_at)}</InfoRow>
              {booking.canceled_at && (
                <InfoRow label="Canceled">{fmtDate(booking.canceled_at)}</InfoRow>
              )}
              {booking.cancellation_reason && (
                <InfoRow label="Cancel Reason">{booking.cancellation_reason}</InfoRow>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Questionnaire responses */}
      {booking.questionnaire_responses && Object.keys(booking.questionnaire_responses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Intake Questionnaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(booking.questionnaire_responses).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{key}</span>
                  <span className="text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session notes */}
      {booking.session_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{booking.session_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Chat transcript */}
      {Array.isArray(booking.chat_transcript) && booking.chat_transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Chat Transcript ({booking.chat_transcript.length} messages)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {booking.chat_transcript.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{msg.from}</span>
                  <span className="text-xs text-muted-foreground ml-2">{msg.time}</span>
                  <p className="text-muted-foreground mt-0.5">{msg.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {canMarkCompleted && (
              <form action={`/api/admin/bookings/${booking.id}/status`} method="POST">
                <input type="hidden" name="status" value="completed" />
                <Button type="submit" variant="outline" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                  Mark Completed
                </Button>
              </form>
            )}
            {canMarkNoShow && (
              <form action={`/api/admin/bookings/${booking.id}/status`} method="POST">
                <input type="hidden" name="status" value="no_show" />
                <Button type="submit" variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                  Mark No-Show
                </Button>
              </form>
            )}
            {canCancel && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/bookings/${booking.id}/cancel`}>
                  Cancel Booking
                </Link>
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Note: Status actions require a dedicated API route at /api/admin/bookings/{"{id}"}/status (wired separately).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
