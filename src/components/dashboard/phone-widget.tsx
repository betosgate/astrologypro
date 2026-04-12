"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, PhoneIncoming, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WidgetState = "loading" | "idle" | "ringing" | "active" | "unavailable";

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PhoneWidget() {
  const [state, setState] = useState<WidgetState>("loading");
  const [callerNumber, setCallerNumber] = useState<string>("");
  // Store Device and Call as refs — no re-render on change
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  const timer = useCallTimer(state === "active");

  const hangUp = useCallback(() => {
    try {
      callRef.current?.disconnect();
    } catch {
      // ignore
    }
    callRef.current = null;
    setState("idle");
  }, []);

  const answerCall = useCallback(() => {
    try {
      callRef.current?.accept();
      setState("active");
    } catch {
      // ignore
    }
  }, []);

  const declineCall = useCallback(() => {
    try {
      callRef.current?.reject();
    } catch {
      // ignore
    }
    callRef.current = null;
    setState("idle");
  }, []);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        const res = await fetch("/api/twilio/token");
        if (!res.ok) {
          // 503 = not configured, 401 = not logged in — hide widget silently
          setState("unavailable");
          return;
        }
        const { token } = await res.json();

        // Dynamic import so this never runs on the server
        const { Device } = await import("@twilio/voice-sdk");
        if (destroyed) return;

        const device = new Device(token, { logLevel: "error" });
        deviceRef.current = device;

        device.on("registered", () => {
          if (!destroyed) setState("idle");
        });

        device.on("error", () => {
          if (!destroyed) {
            setState("unavailable");
            try { device.destroy(); } catch { /* ignore */ }
            deviceRef.current = null;
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        device.on("incoming", (call: any) => {
          if (destroyed) return;
          callRef.current = call;
          // Extract caller phone number from call parameters
          const from: string =
            call.parameters?.From ?? call.parameters?.from ?? "Unknown";
          setCallerNumber(from);
          setState("ringing");

          call.on("cancel", () => {
            if (!destroyed && callRef.current === call) {
              callRef.current = null;
              setState("idle");
            }
          });

          call.on("disconnect", () => {
            if (!destroyed && callRef.current === call) {
              callRef.current = null;
              setState("idle");
            }
          });

          call.on("reject", () => {
            if (!destroyed && callRef.current === call) {
              callRef.current = null;
              setState("idle");
            }
          });
        });

        await device.register();
      } catch {
        if (!destroyed) setState("unavailable");
      }
    }

    init();

    return () => {
      destroyed = true;
      try {
        deviceRef.current?.destroy();
      } catch {
        // ignore
      }
      deviceRef.current = null;
      callRef.current = null;
    };
  }, []);

  // Don't render anything if unavailable or still loading
  if (state === "unavailable" || state === "loading") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {state === "idle" && (
        <div className="flex items-center gap-2 rounded-full bg-[#0d1230] border border-[#c9a84c]/20 px-3 py-1.5 shadow-md backdrop-blur">
          <span className="size-2 rounded-full bg-[#c9a84c]" />
          <span className="text-xs text-[#b8bcd0]">Phone ready</span>
        </div>
      )}

      {state === "ringing" && (
        <div className="w-72 rounded-xl border-2 border-[#c9a84c] bg-[#0d1230] p-4 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
              <PhoneIncoming
                className="size-5 animate-pulse text-[#c9a84c]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-[#f5f0e8]">Incoming Call</p>
              <p className="truncate text-xs text-[#b8bcd0]">{callerNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-[#c9a84c] hover:bg-[#e2c97e] text-[#06080f]"
              onClick={answerCall}
            >
              <Phone className="mr-1.5 size-3.5" />
              Answer
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={declineCall}
            >
              <PhoneOff className="mr-1.5 size-3.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {state === "active" && (
        <div className="w-64 rounded-xl border border-[#c9a84c]/30 bg-[#0d1230] p-4 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
              <Phone className="size-5 text-[#c9a84c]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-[#f5f0e8]">Call in progress</p>
              <div className="flex items-center gap-1 text-xs text-[#c9a84c]">
                <Timer className="size-3" />
                <span>{timer}</span>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 bg-[#c9a84c]/10 text-[#c9a84c]">
              Live
            </Badge>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={hangUp}
          >
            <PhoneOff className="mr-1.5 size-3.5" />
            Hang Up
          </Button>
        </div>
      )}
    </div>
  );
}
