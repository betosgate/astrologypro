"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, PhoneIncoming, Clock, Loader2, Mic, MicOff } from "lucide-react";

interface PendingCall {
  id: string;
  phone_session_id: string;
  caller_phone: string;
  call_id: string;
  status: string;
}

/**
 * ChimePhoneWidget — dashboard widget for diviners using AWS Chime PSTN.
 *
 * When a client calls the diviner's Chime phone number, the SMA Lambda
 * stores a notification in phone_call_notifications. This widget polls
 * for pending calls and allows the diviner to accept them by joining
 * a Chime meeting that the accept endpoint creates for the call.
 *
 * After accepting, the widget joins the Chime meeting via the browser SDK
 * (amazon-chime-sdk-js) to establish two-way audio with the PSTN caller.
 */
export function ChimePhoneWidget() {
  const [status, setStatus] = useState<
    "loading" | "idle" | "ringing" | "accepting" | "active" | "unavailable"
  >("loading");
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetingSessionRef = useRef<any>(null);
  const phoneSessionIdRef = useRef<string | null>(null);

  // Poll for incoming calls
  useEffect(() => {
    async function checkForCalls() {
      try {
        const res = await fetch("/api/chime/voice/pending-calls");
        if (!res.ok) {
          if (res.status === 503) {
            setStatus("unavailable");
            return;
          }
          return;
        }
        const data = await res.json();

        if (data.call && status !== "active" && status !== "accepting") {
          setPendingCall(data.call);
          setStatus("ringing");
        } else if (!data.call && status === "ringing") {
          setPendingCall(null);
          setStatus("idle");
        }
      } catch {
        // Network errors are non-critical
      }
    }

    // Initial check
    checkForCalls().then(() => {
      if (status === "loading") setStatus("idle");
    });

    // Poll every 3 seconds
    pollRef.current = setInterval(checkForCalls, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status]);

  // Timer for active calls
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Poll phone session status during active call to detect caller hangup
  useEffect(() => {
    if (status !== "active" || !phoneSessionIdRef.current) {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
      return;
    }

    const sessionId = phoneSessionIdRef.current;

    async function checkSessionStatus() {
      try {
        const res = await fetch(
          `/api/chime/voice/session-status?phoneSessionId=${sessionId}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" || data.status === "failed") {
          console.log("[ChimePhoneWidget] Caller disconnected, session status:", data.status);
          cleanupChimeSession();
          setStatus("idle");
          setPendingCall(null);
          phoneSessionIdRef.current = null;
        }
      } catch {
        // Non-critical
      }
    }

    statusPollRef.current = setInterval(checkSessionStatus, 4000);

    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current);
    };
  }, [status]);

  /** Tear down the Chime SDK meeting session and release audio devices */
  const cleanupChimeSession = useCallback(() => {
    const session = meetingSessionRef.current;
    if (session) {
      try {
        session.audioVideo.stop();
      } catch (e) {
        console.warn("[ChimePhoneWidget] Error stopping audioVideo:", e);
      }
      meetingSessionRef.current = null;
    }
    setIsMuted(false);
  }, []);

  /** Join the Chime meeting with browser audio using amazon-chime-sdk-js */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const joinChimeAudio = useCallback(async (meeting: any, attendee: any) => {
    try {
      console.log("[ChimePhoneWidget] Joining Chime meeting audio…");
      const ChimeSDK = await import("amazon-chime-sdk-js");

      const logger = new ChimeSDK.ConsoleLogger(
        "PhoneWidget",
        ChimeSDK.LogLevel.WARN
      );

      // Build session configuration from the full AWS Meeting + Attendee objects
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

      // 1. Bind audio output element
      const audioElement = audioRef.current;
      if (audioElement) {
        await meetingSession.audioVideo.bindAudioElement(audioElement);
        console.log("[ChimePhoneWidget] Audio element bound");
      }

      // 2. Select audio input (microphone)
      try {
        const audioInputs =
          await meetingSession.audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          await meetingSession.audioVideo.startAudioInput(
            audioInputs[0].deviceId
          );
          console.log("[ChimePhoneWidget] Audio input started:", audioInputs[0].label);
        } else {
          console.warn("[ChimePhoneWidget] No audio input devices found");
        }
      } catch (e) {
        console.warn("[ChimePhoneWidget] Audio input setup skipped:", e);
      }

      // 3. Subscribe to session lifecycle events
      meetingSession.audioVideo.addObserver({
        audioVideoDidStart: () => {
          console.log("[ChimePhoneWidget] audioVideo session started — two-way audio active");
        },
        audioVideoDidStop: (sessionStatus: { statusCode: () => number }) => {
          console.log("[ChimePhoneWidget] audioVideo session stopped, status:", sessionStatus.statusCode());
        },
        audioVideoDidStartConnecting: (reconnecting: boolean) => {
          console.log("[ChimePhoneWidget] Connecting to audio…", reconnecting ? "(reconnecting)" : "");
        },
      });

      // 4. Start the audio/video session (audio-only for phone calls)
      meetingSession.audioVideo.start();
      console.log("[ChimePhoneWidget] audioVideo.start() called");
    } catch (err) {
      console.error("[ChimePhoneWidget] Failed to join Chime audio:", err);
    }
  }, []);

  const handleAnswer = useCallback(async () => {
    if (!pendingCall) return;

    // Show loading state immediately
    setStatus("accepting");

    try {
      // Accept the call — this creates a Chime meeting and bridges the PSTN caller
      const res = await fetch("/api/chime/voice/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneSessionId: pendingCall.phone_session_id,
          callId: pendingCall.call_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[ChimePhoneWidget] Call accepted:", data);

        // Store phoneSessionId for status polling
        phoneSessionIdRef.current = pendingCall.phone_session_id;

        setStatus("active");

        // Join the Chime meeting audio if we got the full meeting object
        if (data.meeting && data.attendee) {
          await joinChimeAudio(data.meeting, data.attendee);
        } else {
          console.warn(
            "[ChimePhoneWidget] Accept response missing meeting/attendee objects — no browser audio"
          );
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[ChimePhoneWidget] Accept failed:", err);
        setStatus("ringing"); // Go back to ringing so they can retry
      }
    } catch (err) {
      console.error("[ChimePhoneWidget] Accept error:", err);
      setStatus("ringing");
    }
  }, [pendingCall, joinChimeAudio]);

  const handleDecline = useCallback(async () => {
    if (!pendingCall) return;

    try {
      await fetch("/api/chime/voice/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneSessionId: pendingCall.phone_session_id,
          callId: pendingCall.call_id,
        }),
      });
    } catch {
      // Non-blocking
    }

    setPendingCall(null);
    setStatus("idle");
  }, [pendingCall]);

  const handleHangup = useCallback(() => {
    cleanupChimeSession();
    setStatus("idle");
    setPendingCall(null);
    setElapsedSeconds(0);
    phoneSessionIdRef.current = null;
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "unavailable" || status === "loading") {
    return null;
  }

  // Persistent hidden audio element for Chime SDK — must exist across all states
  const persistentAudio = (
    <audio ref={audioRef} autoPlay style={{ display: "none" }} />
  );

  // Ringing state
  if ((status === "ringing" || status === "accepting") && pendingCall) {
    const isAccepting = status === "accepting";
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border-2 border-primary bg-card p-4 shadow-2xl">
        {persistentAudio}
        <div className="mb-3 flex items-center gap-2">
          <PhoneIncoming className="h-5 w-5 animate-bounce text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {isAccepting ? "Connecting…" : "Incoming Call"}
          </span>
          <Badge
            variant="outline"
            className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs"
          >
            Chime
          </Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {pendingCall.caller_phone}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
            onClick={handleAnswer}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Answer
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={handleDecline}
            disabled={isAccepting}
          >
            <PhoneOff className="mr-1.5 h-3.5 w-3.5" />
            Decline
          </Button>
        </div>
      </div>
    );
  }

  // Active call
  if (status === "active") {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-primary/30 bg-card p-4 shadow-2xl">
        {persistentAudio}

        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm font-semibold text-foreground">Call Active</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-sm text-primary">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {pendingCall?.caller_phone ?? "Unknown"}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isMuted ? "secondary" : "outline"}
            className="flex-1"
            onClick={handleToggleMute}
          >
            {isMuted ? (
              <>
                <MicOff className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="mr-1.5 h-3.5 w-3.5" />
                Mute
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={handleHangup}
          >
            <PhoneOff className="mr-1.5 h-3.5 w-3.5" />
            Hang Up
          </Button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-primary/20 bg-card px-4 py-2 shadow-lg">
      {persistentAudio}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Chime Phone Ready
        </span>
      </div>
    </div>
  );
}
