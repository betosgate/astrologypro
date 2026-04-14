"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  User,
  Copy,
  Check,
  Clock,
  Calendar,
  ClipboardList,
  Sparkles,
  Video,
  Loader2,
} from "lucide-react";
import { getSessionInsights } from "@/lib/astrology";

interface BookingData {
  id: string;
  scheduled_at: string;
  status: string;
  service_name: string;
  client_name: string;
  client_email: string;
  client_id: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  questionnaire_responses: Record<string, string | undefined> | null;
  previous_session_count: number;
  last_session_date: string | null;
  session_notes: string | null;
  username: string;
  /** Booking metadata — may contain availability_description with a meeting link */
  metadata?: Record<string, unknown> | null;
  stripe_payment_intent_id?: string | null;
  base_price?: number | null;
}

interface SessionPrepProps {
  booking: BookingData;
}

const CHECKLIST_ITEMS = [
  { id: "birth-chart", label: "Review client's birth chart" },
  { id: "transits", label: "Check current transits" },
  { id: "spread", label: "Prepare spread/chart type for this service" },
  { id: "camera", label: "Test camera and microphone" },
  { id: "environment", label: "Set up quiet environment" },
];

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Starting now");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function PrepContent({ booking }: SessionPrepProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [joiningSession, setJoiningSession] = useState(false);
  const timeLeft = useCountdown(booking.scheduled_at);

  const storageKey = `session-prep-${booking.id}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  const toggleItem = useCallback(
    (id: string) => {
      setCheckedItems((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Storage full or unavailable
        }
        return next;
      });
    },
    [storageKey]
  );

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard not available
    }
  }

  const birthSummary = [
    booking.birth_date,
    booking.birth_time,
    booking.birth_city,
  ]
    .filter(Boolean)
    .join(" | ");

  const questionnaire = booking.questionnaire_responses;

  // Compute astrological insights
  const sessionInsights = booking.birth_date
    ? getSessionInsights(booking.birth_date, new Date(booking.scheduled_at))
    : [];

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Timer + Join Session */}
      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Starts in</span>
        </div>
        <span className="text-sm font-semibold">{timeLeft}</span>
      </div>

      {["confirmed", "in_progress", "pending"].includes(booking.status) && (
        <Button
          className="w-full"
          onClick={async () => {
            setJoiningSession(true);
            try {
              // 1. Check if the booking has a pre-configured meeting link
              //    (e.g. Google Meet URL in the availability description)
              const availDesc =
                (booking.metadata?.availability_description as string | undefined) ?? "";
              const meetLinkMatch = availDesc.match(
                /https?:\/\/(meet\.google\.com|zoom\.us|teams\.microsoft\.com|whereby\.com|us\d+\.zoom\.us)\S+/i
              );
              if (meetLinkMatch) {
                window.open(meetLinkMatch[0], "_blank");
                return;
              }

              // 2. Check if a VideoSDK session already exists for this booking
              const checkRes = await fetch(
                `/api/dashboard/video-sessions?booking_id=${booking.id}`
              );
              const checkData = await checkRes.json();
              const existing = checkData?.sessions?.[0];

              if (existing) {
                window.open(`/dashboard/video/${existing.id}`, "_blank");
                return;
              }

              // 3. Create a new VideoSDK session
              const createRes = await fetch("/api/dashboard/video-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  booking_id: booking.id,
                  ...(booking.client_id ? { client_id: booking.client_id } : {}),
                  room_name: `${booking.service_name} – ${booking.client_name}`,
                }),
              });

              if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({}));
                throw new Error(
                  (err as { detail?: string }).detail ?? "Failed to create session"
                );
              }

              const session = await createRes.json();
              window.open(`/dashboard/video/${session.id}`, "_blank");
            } catch (e) {
              alert(e instanceof Error ? e.message : "Could not start video session. Please try again.");
            } finally {
              setJoiningSession(false);
            }
          }}
          disabled={joiningSession}
        >
          {joiningSession ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Video className="mr-2 size-4" />
          )}
          {joiningSession ? "Starting..." : "Join Session"}
        </Button>
      )}

      {/* Client info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <User className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{booking.client_name}</p>
            <p className="text-xs text-muted-foreground">
              {booking.client_email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          {formatDateTime(booking.scheduled_at)} &middot;{" "}
          {booking.service_name}
        </div>
      </div>

      {/* Birth data */}
      {birthSummary && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Birth Data
            </p>
            <div className="flex items-center justify-between rounded-md bg-muted p-2.5">
              <span className="text-sm">{birthSummary}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => copyToClipboard(birthSummary, "birth")}
              >
                {copiedField === "birth" ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            {questionnaire?.birthTimezone && (
              <p className="text-xs text-muted-foreground px-0.5">
                Timezone: {questionnaire.birthTimezone}
              </p>
            )}
            {questionnaire?.birthTimeAccuracy && (
              <p className="text-xs text-muted-foreground px-0.5">
                Time accuracy:{" "}
                {({"exact": "Exact (birth certificate)", "close": "Close estimate (±15 min)", "approximate": "Approximate (±1–2 hrs)", "guess": "Best guess (family memory)"} as Record<string, string>)[questionnaire.birthTimeAccuracy] ?? questionnaire.birthTimeAccuracy}
              </p>
            )}
          </div>
        </>
      )}

      {/* Questionnaire */}
      {questionnaire && (
        <>
          {/* Focus question + life area */}
          {(questionnaire.focusQuestion || questionnaire.lifeArea) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Client's Questions
                </p>
                {questionnaire.focusQuestion && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary">
                      Focus Question
                    </p>
                    <p className="mt-1 text-sm">{questionnaire.focusQuestion}</p>
                  </div>
                )}
                {questionnaire.lifeArea && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Life area:
                    </span>
                    <Badge variant="secondary">{questionnaire.lifeArea}</Badge>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Second person (relationship readings) */}
          {questionnaire.secondPersonName && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Second Person
                </p>

                {/* Attendance badge */}
                <div className="flex flex-col gap-1.5">
                  {questionnaire.secondPersonAttending === "yes" ? (
                    <span className="rounded-full bg-green-500/20 text-green-400 text-xs px-2 py-0.5 font-medium w-fit">Guest Attending</span>
                  ) : questionnaire.secondPersonAttending === "maybe" ? (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 font-medium w-fit">Guest May Attend</span>
                  ) : (
                    <span className="rounded-full bg-white/10 text-muted-foreground text-xs px-2 py-0.5 font-medium w-fit">Chart Only</span>
                  )}
                  {questionnaire.secondPersonEmail && (
                    <p className="text-xs text-muted-foreground">Guest notified at: {questionnaire.secondPersonEmail}</p>
                  )}
                </div>

                {/* Two-column birth data layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary person */}
                  <div className="rounded-md bg-muted p-2.5 space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      Primary: {questionnaire.firstName || booking.client_name}
                    </p>
                    {booking.birth_date && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">DOB: </span>
                        {booking.birth_date}
                      </p>
                    )}
                    {booking.birth_time && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Time: </span>
                        {booking.birth_time}
                      </p>
                    )}
                    {booking.birth_city && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">City: </span>
                        {booking.birth_city}
                      </p>
                    )}
                  </div>

                  {/* Subject / second person */}
                  <div className="rounded-md bg-muted p-2.5 space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      Subject: {questionnaire.secondPersonName}
                    </p>
                    {questionnaire.secondPersonBirthDate && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">DOB: </span>
                        {questionnaire.secondPersonBirthDate}
                      </p>
                    )}
                    {questionnaire.secondPersonBirthTime && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Time: </span>
                        {questionnaire.secondPersonBirthTime}
                      </p>
                    )}
                    {questionnaire.secondPersonBirthCity && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">City: </span>
                        {questionnaire.secondPersonBirthCity}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Service-specific extras */}
          {(() => {
            const SKIP_KEYS = new Set([
              "focusQuestion", "lifeArea", "birthDate", "birthTime", "birthCity",
              "birthLat", "birthLng", "birthTimezone",
              "secondPersonName", "secondPersonAttending", "secondPersonEmail",
              "secondPersonBirthDate", "secondPersonBirthTime", "secondPersonBirthCity",
              "secondPersonBirthLat", "secondPersonBirthLng", "secondPersonBirthTimezone",
              "additionalNotes",
            ]);
            const extras = Object.entries(questionnaire).filter(
              ([k, v]) => !SKIP_KEYS.has(k) && !k.endsWith("Lat") && !k.endsWith("Lng") && !k.endsWith("Timezone") && v
            );
            if (!extras.length) return null;
            return (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reading Details
                  </p>
                  {extras.map(([key, val]) => (
                    <div key={key} className="rounded-md bg-muted p-2.5">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="mt-0.5 text-sm">{val}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* Previous sessions */}
      {booking.previous_session_count > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Previous Sessions
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span>
                <span className="font-semibold">
                  {booking.previous_session_count}
                </span>{" "}
                past session{booking.previous_session_count !== 1 ? "s" : ""}
              </span>
              {booking.last_session_date && (
                <span className="text-muted-foreground">
                  Last: {formatDateTime(booking.last_session_date)}
                </span>
              )}
            </div>
            {booking.session_notes && (
              <div className="mt-2 rounded-md bg-muted p-2.5">
                <p className="text-xs text-muted-foreground">
                  Notes from last session
                </p>
                <p className="mt-0.5 text-sm">{booking.session_notes}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Smart Insights */}
      {sessionInsights.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session Insights
            </p>
            {sessionInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-200/90">{insight}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Repeat client insight */}
      {booking.previous_session_count > 0 && (
        <>
          <Separator />
          <div className="flex items-start gap-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-400" />
            <div className="text-sm text-purple-200/90">
              <p>
                This is their{" "}
                <span className="font-semibold">
                  {getOrdinal(booking.previous_session_count + 1)}
                </span>{" "}
                session with you.
              </p>
              {booking.session_notes && (
                <Link
                  href={`/${booking.username}/clients`}
                  className="mt-1 inline-block text-xs text-purple-400 underline underline-offset-2 hover:text-purple-300"
                >
                  View past session notes
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Preparation checklist */}
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Preparation Checklist
        </p>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
            >
              <Checkbox
                checked={!!checkedItems[item.id]}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <span
                className={`text-sm ${
                  checkedItems[item.id]
                    ? "text-muted-foreground line-through"
                    : ""
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional attendees */}
      {(() => {
        const attendees = questionnaire?.attendees;
        if (!Array.isArray(attendees) || attendees.length === 0) return null;
        return (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Additional Attendees
              </p>
              {(attendees as Array<{ name?: string; email?: string }>).map((a, i) => (
                <div key={i} className="rounded-md bg-muted p-2.5 text-sm">
                  {a.name && <p className="font-medium">{a.name}</p>}
                  {a.email && <p className="text-xs text-muted-foreground">{a.email}</p>}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Booking notes (from intake form) */}
      {questionnaire?.additionalNotes && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Client Notes
            </p>
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-sm">{questionnaire.additionalNotes}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SessionPrepSheet({ booking }: SessionPrepProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="mr-1.5 size-3.5" />
          Details
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
        </SheetHeader>
        <PrepContent booking={booking} />
      </SheetContent>
    </Sheet>
  );
}
