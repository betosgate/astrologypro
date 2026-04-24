"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  PhoneCall,
} from "lucide-react";

interface CallClientButtonProps {
  bookingId: string;
  clientName?: string | null;
  bookingStatus?: string | null;
  /**
   * Whether the booking has a dialable phone on file (clients.phone or a
   * phone field on questionnaire_responses). Server always validates, but
   * when this is false we render the button disabled with a clear tooltip
   * so the user doesn't find out only after clicking.
   */
  hasPhoneOnFile?: boolean;
}

/**
 * Row-level "Call client" action for /dashboard/bookings.
 *
 * When the diviner clicks the phone icon on a booking row:
 *   1. POST /api/chime/voice/call-client { bookingId }
 *   2. Chime dials the client's PSTN. The SMA Lambda bridges the answered
 *      leg into the meeting this endpoint created/reused.
 *   3. We join the same meeting from this browser via amazon-chime-sdk-js,
 *      producing two-way audio.
 *
 * While a call is active the button expands in-place into a small controls
 * bar (mute / hang up / elapsed timer). The inline layout is deliberate —
 * it keeps the visual anchor on the booking that the diviner just clicked
 * so it's obvious which call they're on.
 */
export function CallClientButton({
  bookingId,
  clientName,
  bookingStatus,
  hasPhoneOnFile = true,
}: CallClientButtonProps) {
  const [status, setStatus] = useState<"idle" | "dialing" | "active" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Chime SDK's DefaultMeetingSession type is loaded dynamically inside
  // joinChimeAudio (amazon-chime-sdk-js is imported with `await import()`)
  // so we keep this ref loosely-typed and cast at the call site.
  const meetingSessionRef = useRef<any>(null);
  const phoneSessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Disable on terminal statuses — server enforces the same rule, this is UX only.
  const blockedByStatus =
    typeof bookingStatus === "string" &&
    [
      "cancelled",
      "canceled",
      "refunded",
      "declined",
      "no_show",
    ].includes(bookingStatus);

  // Disable when nothing to dial — clear reason shown in tooltip.
  const blockedByPhone = !hasPhoneOnFile;

  const blocked = blockedByStatus || blockedByPhone;

  const blockedReason = blockedByStatus
    ? `Cannot call on a ${bookingStatus} booking`
    : blockedByPhone
    ? "No phone number on file for this client"
    : null;

  // Auto-clear error state after 5s so the row doesn't stay littered with
  // a stale error message. The full error remains in the tooltip title for
  // the duration so the diviner can still read it.
  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => {
      setStatus("idle");
      setErrorMsg(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [status]);

  // Active-call elapsed-time timer
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const cleanupChimeSession = useCallback(() => {
    const session = meetingSessionRef.current;
    if (session) {
      try {
        session.audioVideo.stop();
      } catch {
        /* ignore */
      }
      meetingSessionRef.current = null;
    }
    setIsMuted(false);
  }, []);

  /** Join meeting audio in the browser via amazon-chime-sdk-js */
  const joinChimeAudio = useCallback(
    async (meeting: any, attendee: any) => {
      const ChimeSDK = await import("amazon-chime-sdk-js");
      const logger = new ChimeSDK.ConsoleLogger(
        "CallClientButton",
        ChimeSDK.LogLevel.WARN
      );
      const configuration = new ChimeSDK.MeetingSessionConfiguration(
        meeting,
        attendee
      );
      const deviceController = new ChimeSDK.DefaultDeviceController(logger);
      const meetingSession = new ChimeSDK.DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );
      meetingSessionRef.current = meetingSession;

      const audioElement = audioRef.current;
      if (audioElement) {
        await meetingSession.audioVideo.bindAudioElement(audioElement);
      }

      try {
        const audioInputs =
          await meetingSession.audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          await meetingSession.audioVideo.startAudioInput(
            audioInputs[0].deviceId
          );
        }
      } catch {
        /* mic may be blocked; call still connects one-way */
      }

      meetingSession.audioVideo.addObserver({
        audioVideoDidStop: () => {
          meetingSessionRef.current = null;
          setIsMuted(false);
          setStatus("idle");
          phoneSessionIdRef.current = null;
        },
      });

      meetingSession.audioVideo.start();
    },
    []
  );

  const handleStartCall = useCallback(async () => {
    if (blocked) return;
    setErrorMsg(null);
    setStatus("dialing");

    try {
      const res = await fetch("/api/chime/voice/call-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Cheap idempotency for retry-prone double-clicks.
          "Idempotency-Key": `call-client:${bookingId}:${Date.now()}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(
          (data?.error as string | undefined) ?? "Failed to place call"
        );
        setStatus("error");
        return;
      }

      phoneSessionIdRef.current = (data?.phoneSessionId as string) ?? null;

      if (data?.meeting && data?.attendee) {
        await joinChimeAudio(data.meeting, data.attendee);
        setStatus("active");
      } else {
        setErrorMsg("Call started but browser audio failed to initialise");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }, [blocked, bookingId, joinChimeAudio]);

  const handleHangup = useCallback(async () => {
    const sessionId = phoneSessionIdRef.current;

    // Tear down browser audio immediately for a snappy click.
    cleanupChimeSession();
    setStatus("idle");
    phoneSessionIdRef.current = null;

    if (sessionId) {
      try {
        await fetch("/api/chime/voice/hangup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneSessionId: sessionId }),
        });
      } catch {
        /* server will also clean up via Chime HANGUP webhook */
      }
    }
  }, [cleanupChimeSession]);

  const handleToggleMute = useCallback(() => {
    const session = meetingSessionRef.current;
    if (!session) return;
    if (isMuted) {
      session.audioVideo.realtimeUnmuteLocalAudio();
      setIsMuted(false);
    } else {
      session.audioVideo.realtimeMuteLocalAudio();
      setIsMuted(true);
    }
  }, [isMuted]);

  // Ensure we release the mic/meeting if the row unmounts (e.g. pagination).
  useEffect(() => {
    return () => {
      cleanupChimeSession();
    };
  }, [cleanupChimeSession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Persistent hidden audio sink — must exist across all UI states so that
  // joining/ending audio doesn't blow away the <audio> element mid-call.
  const audioSink = (
    <audio ref={audioRef} autoPlay style={{ display: "none" }} />
  );

  const initial = (clientName ?? "").trim().charAt(0).toUpperCase() || "?";
  const displayName = clientName?.trim() || "Client";

  // Premium floating call panel — rendered while dialing or active. Fixed
  // positioning so it stays put while the user scrolls the bookings table,
  // and so only one is visible at a time (the row trigger remains in place
  // and is tinted to show which booking the call belongs to).
  const callPanel =
    status === "dialing" || status === "active" ? (
      <div
        role="dialog"
        aria-label={`Call with ${displayName}`}
        className="fixed bottom-6 right-6 z-50 w-[340px] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Gradient header with live status stripe */}
        <div
          className={`relative px-5 pt-6 pb-5 text-center ${
            status === "active"
              ? "bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent"
              : "bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
          }`}
        >
          {/* Avatar with ringing pulse */}
          <div className="relative mx-auto mb-4 h-20 w-20">
            {status === "dialing" && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
                <span
                  className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"
                  style={{ animationDelay: "400ms" }}
                />
              </>
            )}
            {status === "active" && (
              <span className="absolute inset-0 rounded-full ring-4 ring-emerald-500/20" />
            )}
            <div
              className={`relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white ${
                status === "active"
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-br from-primary to-primary/70"
              }`}
            >
              {initial}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold leading-tight">
            {displayName}
          </h3>

          {/* Subtitle: Calling… with animated dots, or the live timer */}
          {status === "dialing" ? (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <PhoneCall className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Calling</span>
              <span className="inline-flex items-center gap-0.5">
                <span
                  className="h-1 w-1 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1 w-1 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1 w-1 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </p>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className="text-3xl font-mono font-semibold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-600">
                <span className="relative inline-flex">
                  <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Connected
              </span>
            </div>
          )}

          {isMuted && status === "active" && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <MicOff className="h-3 w-3" /> Muted
            </p>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-stretch gap-3 px-5 pb-5 pt-1">
          <Button
            type="button"
            variant={isMuted ? "secondary" : "outline"}
            disabled={status !== "active"}
            onClick={handleToggleMute}
            className="flex-1"
          >
            {isMuted ? (
              <>
                <MicOff className="mr-1.5 h-4 w-4" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="mr-1.5 h-4 w-4" />
                Mute
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleHangup}
            className="flex-1"
          >
            <PhoneOff className="mr-1.5 h-4 w-4" />
            {status === "dialing" ? "Cancel" : "Hang Up"}
          </Button>
        </div>
      </div>
    ) : null;

  const triggerActive = status === "dialing" || status === "active";

  return (
    <>
      {audioSink}
      <Button
        size="icon"
        variant="outline"
        className={
          triggerActive
            ? "h-8 w-8 border-primary/50 bg-primary/10 text-primary"
            : status === "error"
            ? "h-8 w-8 border-destructive/50 text-destructive hover:bg-destructive/10"
            : "h-8 w-8"
        }
        onClick={handleStartCall}
        disabled={blocked || triggerActive}
        aria-label={
          clientName ? `Call ${clientName}` : "Call client for this booking"
        }
        title={
          blocked
            ? blockedReason ?? undefined
            : triggerActive
            ? `Call in progress with ${displayName}`
            : status === "error" && errorMsg
            ? errorMsg
            : clientName
            ? `Call ${clientName}`
            : "Call client"
        }
      >
        <Phone className="h-3.5 w-3.5" />
      </Button>
      {callPanel}
    </>
  );
}
