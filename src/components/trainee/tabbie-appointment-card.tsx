import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
} from "lucide-react";
import type { TraineeTabbieDashboardState } from "@/lib/trainee-tabbie-appointments";

interface TabbieAppointmentCardProps {
  state: TraineeTabbieDashboardState;
}

function formatDateTime(iso: string | null, timezone: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    return new Date(iso).toLocaleString("en-US");
  }
}

type CardStyle = {
  wrapper: string;
  icon: string;
  iconBg: string;
  Icon: React.ElementType;
};

function resolveCardStyle(variant: string): CardStyle {
  switch (variant) {
    case "success":
      return {
        wrapper: "border-green-300/50 bg-green-50/30 dark:border-green-700/50 dark:bg-green-950/20",
        icon: "text-green-600",
        iconBg: "bg-green-100 dark:bg-green-900/40",
        Icon: CheckCircle2,
      };
    case "warning":
      return {
        wrapper: "border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20",
        icon: "text-amber-600",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        Icon: AlertTriangle,
      };
    case "neutral":
      return {
        wrapper: "border-border bg-muted/10",
        icon: "text-muted-foreground",
        iconBg: "bg-muted/30",
        Icon: CalendarCheck,
      };
    default: // info
      return {
        wrapper: "border-primary/30 bg-primary/5",
        icon: "text-primary",
        iconBg: "bg-primary/10",
        Icon: CalendarCheck,
      };
  }
}

export function TabbieAppointmentCard({ state }: TabbieAppointmentCardProps) {
  if (!state.showBlock) return null;

  const { content, currentAppointment, status, configMissing } = state;
  const variant = content?.variant ?? "info";
  const style = resolveCardStyle(variant);
  const { Icon } = style;

  // Config missing — suppressed gracefully, no broken CTA
  if (configMissing && status !== "completed" && status !== "manually_completed") {
    return null;
  }

  const isBooked = status === "booked" || status === "booking_in_progress" || status === "rescheduled";
  const isCompleted = status === "completed" || status === "manually_completed";
  const isCancelled = status === "cancelled" || status === "no_show" || status === "manually_cancelled";
  const isEligible = !isBooked && !isCompleted && !isCancelled;

  return (
    <Card className={style.wrapper}>
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start">
        {/* Icon */}
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
          {isBooked ? (
            <CalendarCheck className={`size-5 ${style.icon}`} />
          ) : isCancelled ? (
            <CalendarX className={`size-5 ${style.icon}`} />
          ) : (
            <Icon className={`size-5 ${style.icon}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5">
          <p className="font-semibold leading-snug">
            {content?.title ?? "Book Your Post-Training Appointment"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content?.body}
          </p>

          {/* Booked: show scheduled time */}
          {isBooked && currentAppointment?.scheduledStartAt && (
            <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <span>{formatDateTime(currentAppointment.scheduledStartAt, currentAppointment.timezone)}</span>
              {currentAppointment.scheduledEndAt && (
                <span className="text-muted-foreground">
                  &mdash; {formatDateTime(currentAppointment.scheduledEndAt, currentAppointment.timezone)}
                </span>
              )}
            </div>
          )}

          {/* Helper text */}
          {content?.helperText && (
            <p className="text-xs text-muted-foreground">{content.helperText}</p>
          )}
        </div>

        {/* CTA */}
        {(isEligible || isCancelled) && content?.bookingLink && (
          <div className="shrink-0">
            {content.openMode === "new_tab" ? (
              <Button asChild className="gap-1.5">
                <a href={content.bookingLink} target="_blank" rel="noopener noreferrer">
                  {content.buttonLabel ?? "Book Appointment"}
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : (
              <Button asChild>
                <Link href={content.bookingLink}>
                  {content.buttonLabel ?? "Book Appointment"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
