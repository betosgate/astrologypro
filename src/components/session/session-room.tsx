"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  PhoneOff,
  Shield,
  Video,
} from "lucide-react";
import { toast } from "sonner";

interface SessionRoomProps {
  bookingId: string;
  roomUrl: string;
  role: "diviner" | "client";
  serviceName: string;
  clientName: string;
  scheduledDuration: number;
  username: string;
}

export function SessionRoom({
  bookingId,
  roomUrl,
  role,
  serviceName,
  clientName,
  scheduledDuration,
  username,
}: SessionRoomProps) {
  const [hasConsented, setHasConsented] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start the elapsed timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startTimeRef.current = Date.now();
    setSessionActive(true);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }
    }, 1000);
  }, []);

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSessionActive(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Listen to Daily.co iframe messages for participant events
  useEffect(() => {
    if (!hasConsented) return;

    function handleMessage(event: MessageEvent) {
      if (typeof event.data !== "object" || !event.data.action) return;

      const action: string = event.data.action;

      if (
        action === "joined-meeting" ||
        action === "participant-joined"
      ) {
        startTimer();
      }

      if (action === "left-meeting") {
        stopTimer();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [hasConsented, startTimer, stopTimer]);

  // Auto-start timer when iframe loads (fallback)
  const handleIframeLoad = useCallback(() => {
    // Give a brief moment for the room to initialize, then start timer
    setTimeout(() => {
      if (!sessionActive && !sessionEnded) {
        startTimer();
      }
    }, 3000);
  }, [sessionActive, sessionEnded, startTimer]);

  // End the session
  async function handleEndSession() {
    if (isEnding) return;
    setIsEnding(true);

    const actualDurationMinutes = elapsedSeconds / 60;

    try {
      const response = await fetch("/api/daily/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          actualDurationMinutes: Math.round(actualDurationMinutes),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to end session");
        setIsEnding(false);
        return;
      }

      stopTimer();
      setSessionEnded(true);

      if (data.overageMinutes > 0) {
        toast.info(
          `Session ran ${data.overageMinutes} minutes over. Overage of $${(data.overageAmount / 100).toFixed(2)} noted.`
        );
      } else {
        toast.success("Session completed successfully.");
      }
    } catch {
      toast.error("Failed to end session. Please try again.");
      setIsEnding(false);
    }
  }

  // Format elapsed time
  function formatElapsed(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Check if session is running overtime
  const isOvertime = elapsedSeconds > scheduledDuration * 60;

  // Consent screen
  if (!hasConsented) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
                <Shield className="size-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold">Recording Consent</h2>
              <p className="text-sm text-muted-foreground">
                This session will be recorded for your reference. The recording
                will be available to both the diviner and client after the
                session ends.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-400">
                  By clicking &quot;Accept & Join&quot;, you consent to this session
                  being recorded. Screen sharing by the diviner may also be
                  captured.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Video className="size-4" />
                <span>Video & audio recording</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>Scheduled for {scheduledDuration} minutes</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setHasConsented(true)}
            >
              Accept & Join Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="size-7 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">Session Complete</h2>
              <p className="text-sm text-muted-foreground">
                Your {serviceName} session with {clientName} has ended.
                {" "}The recording will be available shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Duration: {formatElapsed(elapsedSeconds)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <a href={`/dashboard/bookings`}>Back to Bookings</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/${username}`}>View Profile</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session with Daily.co iframe
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Timer & Controls Overlay */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={
              isOvertime
                ? "border-red-500/30 bg-red-500/10 text-red-400 animate-pulse"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }
          >
            <Clock className="mr-1.5 size-3" />
            {formatElapsed(elapsedSeconds)}
          </Badge>
          {isOvertime && (
            <span className="text-xs text-red-400">
              Overtime ({Math.floor((elapsedSeconds - scheduledDuration * 60) / 60)} min over)
            </span>
          )}
        </div>

        {role === "diviner" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
            disabled={isEnding}
          >
            <PhoneOff className="mr-1.5 size-3.5" />
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        )}
      </div>

      {/* Daily.co Iframe */}
      <iframe
        ref={iframeRef}
        src={roomUrl}
        className="flex-1 border-0"
        allow="camera; microphone; autoplay; display-capture; screen-wake-lock"
        onLoad={handleIframeLoad}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
