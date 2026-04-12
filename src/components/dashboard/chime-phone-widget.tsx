"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, PhoneIncoming, Clock } from "lucide-react";

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
 * a Chime meeting that the SMA created for the call.
 */
export function ChimePhoneWidget() {
  const [status, setStatus] = useState<
    "loading" | "idle" | "ringing" | "active" | "unavailable"
  >("loading");
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

        if (data.call && status !== "active") {
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

  const handleAnswer = useCallback(async () => {
    if (!pendingCall) return;

    try {
      // Accept the call — this creates a Chime meeting and joins the diviner
      const res = await fetch("/api/chime/voice/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneSessionId: pendingCall.phone_session_id,
          callId: pendingCall.call_id,
        }),
      });

      if (res.ok) {
        setStatus("active");
      }
    } catch {
      // Fallback
    }
  }, [pendingCall]);

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
    setStatus("idle");
    setPendingCall(null);
    setElapsedSeconds(0);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "unavailable" || status === "loading") {
    return null;
  }

  // Ringing state
  if (status === "ringing" && pendingCall) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border-2 border-primary bg-card p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <PhoneIncoming className="h-5 w-5 animate-bounce text-primary" />
          <span className="text-sm font-semibold text-foreground">Incoming Call</span>
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
          >
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            Answer
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={handleDecline}
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
        <Button
          size="sm"
          variant="destructive"
          className="w-full"
          onClick={handleHangup}
        >
          <PhoneOff className="mr-1.5 h-3.5 w-3.5" />
          Hang Up
        </Button>
      </div>
    );
  }

  // Idle state
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-primary/20 bg-card px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Chime Phone Ready
        </span>
      </div>
    </div>
  );
}
