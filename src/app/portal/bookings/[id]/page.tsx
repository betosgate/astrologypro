import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Mail,
  MapPin,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { BookingActions } from "@/components/portal/booking-actions";
import { SectionContainer } from "@/components/shared/section-container";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  pending_payment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  pending_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  completed: "Completed",
  canceled: "Cancelled",
  in_progress: "In Progress",
  no_show: "No Show",
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, status, duration_minutes, base_price, session_notes, booking_token, metadata, questionnaire_responses, services(name, slug), diviners(id, display_name, username), clients(id, full_name, email, user_id)"
    )
    .eq("id", id)
    .single();

  if (!booking) notFound();

  // Cast booking to typed shape for template rendering
  const b = booking as unknown as {
    id: string;
    scheduled_at: string;
    status: string;
    duration_minutes: number;
    base_price: number;
    session_notes: string | null;
    booking_token: string | null;
    metadata: { availability_title?: string; is_reminder?: boolean } | null;
    questionnaire_responses: Record<string, string> | null;
    services: { name: string; slug: string } | null;
    diviners: { id: string; display_name: string; username: string } | null;
    clients: { id: string; full_name: string | null; email: string; user_id: string | null } | null;
  };

  // Verify the user is either the client or the diviner
  const client = b.clients as {
    id: string;
    full_name: string | null;
    email: string;
    user_id: string | null;
  } | null;
  const diviner = b.diviners as {
    id: string;
    display_name: string;
    username: string;
  } | null;

  const isClient = client?.user_id === user.id;
  const isDiviner = await (async () => {
    const { data: d } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return d?.id === diviner?.id;
  })();

  if (!isClient && !isDiviner) {
    // Allow access via booking_token in URL
    notFound();
  }

  const service = b.services as {
    name: string;
    slug: string;
  } | null;
  const meta = b.metadata as {
    availability_title?: string;
    is_reminder?: boolean;
  } | null;
  const qr = b.questionnaire_responses as Record<string, string> | null;

  const serviceName = meta?.availability_title ?? service?.name ?? "Session";
  const scheduledAt = new Date(b.scheduled_at);
  const isUpcoming =
    scheduledAt > new Date() &&
    ["pending", "confirmed", "pending_payment"].includes(b.status);
  const isCancellable =
    ["pending", "confirmed", "pending_payment"].includes(b.status);

  return (
    <SectionContainer verticalPadding="md" className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/portal/bookings">
          <ArrowLeft className="size-4" />
          Back to My Bookings
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{serviceName}</h1>
        <p className="text-muted-foreground">
          with {diviner?.display_name ?? "Practitioner"}
        </p>
      </div>

      {/* Booking Details Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={statusColors[b.status] ?? ""}
            >
              {statusLabels[b.status] ?? b.status}
            </Badge>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              Date & Time
            </div>
            <span className="text-sm font-medium text-right">
              {scheduledAt.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              <br />
              <span className="text-muted-foreground">
                {scheduledAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>

          <Separator />

          {/* Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              Duration
            </div>
            <span className="text-sm font-medium">
              {b.duration_minutes} minutes
            </span>
          </div>

          <Separator />

          {/* Practitioner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              Practitioner
            </div>
            <span className="text-sm font-medium">
              {diviner?.display_name ?? "Unknown"}
            </span>
          </div>

          <Separator />

          {/* Client */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" />
              Client
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {meta?.is_reminder ? "Personal Reminder" : (client?.full_name ?? "Unknown")}
              </p>
              {client?.email && (
                <p className="text-xs text-muted-foreground">{client.email}</p>
              )}
            </div>
          </div>

          {/* Amount */}
          {(b.base_price) > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium">
                  {formatCurrency(b.base_price)}
                </span>
              </div>
            </>
          )}

          {/* Focus Question */}
          {qr?.focusQuestion && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  Focus Question
                </div>
                <p className="text-sm rounded-lg bg-muted/30 p-3">
                  {qr.focusQuestion as string}
                </p>
              </div>
            </>
          )}

          {/* Life Area */}
          {qr?.lifeArea && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Life Area</span>
                <Badge variant="secondary">{qr.lifeArea as string}</Badge>
              </div>
            </>
          )}

          {/* Birth Data */}
          {(qr?.birthDate || qr?.birthCity) && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  Birth Details
                </div>
                <div className="text-sm rounded-lg bg-muted/30 p-3 space-y-0.5">
                  {qr.birthDate && <p>Date: {String(qr.birthDate)}</p>}
                  {qr.birthTime && <p>Time: {String(qr.birthTime)}</p>}
                  {qr.birthCity && <p>Place: {String(qr.birthCity)}</p>}
                </div>
              </div>
            </>
          )}

          {/* Session Notes */}
          {(b.session_notes) && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Session Notes</span>
                <div
                  className="text-sm rounded-lg bg-muted/30 p-3 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: b.session_notes,
                  }}
                />
              </div>
            </>
          )}

          {/* Additional Attendees */}
          {Array.isArray(qr?.attendees) && (qr.attendees as Array<{ name?: string; email?: string }>).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Additional Attendees</span>
                {(qr.attendees as Array<{ name?: string; email?: string }>).map((a, i) => (
                  <div key={i} className="text-sm rounded-lg bg-muted/30 p-2">
                    {a.name && <p className="font-medium">{a.name}</p>}
                    {a.email && <p className="text-xs text-muted-foreground">{a.email}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isCancellable && (
        <BookingActions
          bookingId={b.id}
          divinerUsername={diviner?.username ?? ""}
          isUpcoming={isUpcoming}
        />
      )}
    </SectionContainer>
  );
}
