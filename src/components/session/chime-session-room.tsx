"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  PhoneOff,
  Shield,
  Video,
  Monitor,
  User,
  MessageSquare,
  FileText,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  VideoOff,
  DollarSign,
  Sparkles,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ChimeSessionRoomProps {
  bookingId: string;
  meetingId: string;
  attendeeId: string;
  joinToken: string;
  role: "diviner" | "client";
  serviceName: string;
  clientName: string;
  divinerName: string;
  scheduledDuration: number;
  basePrice: number;
  overageRate: number;
  username: string;
  /** Secure token for unauthenticated client access — passed to join-meeting API */
  clientToken?: string;
  questionnaire?: {
    focusQuestion?: string;
    lifeArea?: string;
    additionalNotes?: string;
  };
  clientBirthData?: {
    date?: string;
    time?: string;
    city?: string;
  };
}

export function ChimeSessionRoom({
  bookingId,
  meetingId,
  attendeeId,
  joinToken,
  role,
  serviceName,
  clientName,
  divinerName,
  scheduledDuration,
  basePrice,
  overageRate,
  username,
  clientToken,
  questionnaire,
  clientBirthData,
}: ChimeSessionRoomProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const meetingSessionRef = useRef<any>(null);

  const [consentGiven, setConsentGiven] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  // Client sees a waiting room until the diviner joins; diviners are always "present" for themselves
  const [isDivinerPresent, setIsDivinerPresent] = useState(role === "diviner");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { from: string; text: string; time: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [chimeSdkReady, setChimeSdkReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    { id: string; name: string; isLocal: boolean }[]
  >([]);
  const initLockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const participantMapRef = useRef<Map<string, string>>(new Map());
  // React-managed tile list — drives the video layout instead of raw DOM manipulation
  const [tiles, setTiles] = useState<{ tileId: number; isLocal: boolean; isContent: boolean }[]>([]);
  const videoElemRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Detect mobile viewport
  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Timer logic — uses startTimeRef which is set from the server's
  // session_started_at value (persists across reloads)
  useEffect(() => {
    if (sessionStarted && !sessionEnded && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsed = Math.floor(
          (new Date().getTime() - startTimeRef.current.getTime()) / 1000
        );
        setElapsedMinutes(Math.floor(elapsed / 60));
        setElapsedSeconds(elapsed % 60);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStarted, sessionEnded]);

  // Bind each tracked tile to its <video> element whenever tiles list changes
  useEffect(() => {
    tiles.forEach(({ tileId }) => {
      const el = videoElemRefs.current.get(tileId);
      if (el && meetingSessionRef.current) {
        try {
          meetingSessionRef.current.audioVideo.bindVideoElement(tileId, el);
        } catch { /* non-critical */ }
      }
    });
  }, [tiles]);

  // Initialize Chime SDK meeting session
  // Initialize Chime SDK — uses a ref lock to survive StrictMode/HMR
  useEffect(() => {
    if (!consentGiven) return;

    // Prevent double-init from StrictMode or HMR
    if (initLockRef.current) return;
    initLockRef.current = true;

    let stopped = false;

    async function initChime() {
      try {
        const ChimeSDK = await import("amazon-chime-sdk-js");

        const logger = new ChimeSDK.ConsoleLogger(
          "AstroPro",
          ChimeSDK.LogLevel.WARN
        );

        // Fetch fresh meeting + attendee from API
        const meetingResponse = await fetch("/api/chime/join-meeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, clientToken }),
        });

        if (!meetingResponse.ok) {
          throw new Error("Failed to fetch meeting details");
        }

        const meetingData = await meetingResponse.json();

        // Set timer from server-persisted start time (survives reloads)
        startTimeRef.current = new Date(meetingData.sessionStartedAt);
        setSessionStarted(true);

        // Store participant names for display
        if (meetingData.participants) {
          participantMapRef.current.set("diviner", meetingData.participants.divinerName);
          participantMapRef.current.set("client", meetingData.participants.clientName);
        }

        // Build session configuration from real AWS response
        const configuration = new ChimeSDK.MeetingSessionConfiguration(
          meetingData.meeting,
          meetingData.attendee
        );

        const deviceController =
          new ChimeSDK.DefaultDeviceController(logger);
        const meetingSession = new ChimeSDK.DefaultMeetingSession(
          configuration,
          logger,
          deviceController
        );

        meetingSessionRef.current = meetingSession;

        // 1. Bind audio output
        const audioElement = audioRef.current;
        if (audioElement) {
          await meetingSession.audioVideo.bindAudioElement(audioElement);
        }

        // 2. Select input devices BEFORE start()
        try {
          const audioInputs =
            await meetingSession.audioVideo.listAudioInputDevices();
          if (audioInputs.length > 0) {
            await meetingSession.audioVideo.startAudioInput(
              audioInputs[0].deviceId
            );
          }
        } catch (e) {
          console.warn("Chime: audio input setup skipped:", e);
        }

        try {
          const videoInputs =
            await meetingSession.audioVideo.listVideoInputDevices();
          if (videoInputs.length > 0) {
            await meetingSession.audioVideo.startVideoInput(
              videoInputs[0].deviceId
            );
          }
        } catch (e) {
          console.warn("Chime: video input setup skipped:", e);
        }

        // Helper to resolve attendee name from externalUserId
        const resolveAttendeeName = (externalUserId: string): string => {
          if (externalUserId.startsWith("diviner-"))
            return participantMapRef.current.get("diviner") ?? divinerName;
          if (externalUserId.startsWith("client-"))
            return participantMapRef.current.get("client") ?? clientName;
          return "Participant";
        };

        // 3. Register observers BEFORE start()
        const seenAttendees = new Set<string>();

        meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
          (attendeeId: string, present: boolean, externalUserId?: string) => {
            const isLocal = attendeeId === meetingData.attendee.AttendeeId;
            // externalUserId can be undefined for remote attendees in some SDK versions,
            // so we use a dual check: explicit prefix OR any non-local attendee (1-on-1)
            const isDiviner =
              externalUserId?.startsWith("diviner-") ||
              (!isLocal && role === "client");
            if (isDiviner) setIsDivinerPresent(present);

            const name = resolveAttendeeName(externalUserId ?? attendeeId);

            if (present) {
              if (!seenAttendees.has(attendeeId)) {
                seenAttendees.add(attendeeId);
                setParticipants((prev) => {
                  if (prev.some((p) => p.id === attendeeId)) return prev;
                  return [...prev, { id: attendeeId, name, isLocal }];
                });
                if (!isLocal) {
                  toast.success(`${name} joined the session`, {
                    duration: 4000,
                    icon: "👤",
                  });
                }
              }
            } else {
              seenAttendees.delete(attendeeId);
              setParticipants((prev) => prev.filter((p) => p.id !== attendeeId));
              if (!isLocal) {
                toast.info(`${name} left the session`, { duration: 3000 });
              }
            }
          }
        );

        // Chat data messaging — receive messages from the other participant
        meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage(
          "chat",
          (dataMessage: any) => {
            const senderExternalId: string =
              dataMessage.senderExternalUserId ?? "";
            const from =
              resolveAttendeeName(senderExternalId) || "Participant";
            const text =
              typeof dataMessage.data === "string"
                ? dataMessage.data
                : new TextDecoder().decode(dataMessage.data as Uint8Array);
            if (!text.trim()) return;
            setChatMessages((prev) => [
              ...prev,
              {
                from,
                text,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          }
        );

        meetingSession.audioVideo.addObserver({
          audioVideoDidStart: () => {
            meetingSession.audioVideo.startLocalVideoTile();
            setChimeSdkReady(true);
          },
          audioVideoDidStop: (status: any) => {
            const code = status?.statusCode?.();
            console.log("Chime session stopped, status code:", code);
            if (!stopped && code !== 1) {
              setConnectionError(
                "Session disconnected. Please click Retry to reconnect."
              );
            }
          },
          videoTileDidUpdate: (tileState: any) => {
            if (!tileState.boundAttendeeId) return;
            setTiles((prev) => {
              if (prev.some((t) => t.tileId === tileState.tileId)) return prev;
              return [
                ...prev,
                {
                  tileId: tileState.tileId,
                  isLocal: Boolean(tileState.localTile),
                  isContent: Boolean(tileState.isContent),
                },
              ];
            });
          },
          videoTileWasRemoved: (tileId: number) => {
            videoElemRefs.current.delete(tileId);
            setTiles((prev) => prev.filter((t) => t.tileId !== tileId));
          },
        } as any);

        // Content share observer
        meetingSession.audioVideo.addContentShareObserver({
          contentShareDidStart: () => setIsScreenSharing(true),
          contentShareDidStop: () => setIsScreenSharing(false),
        } as any);

        // 4. Start
        meetingSession.audioVideo.start();
      } catch (err) {
        console.error("Failed to initialize Chime SDK:", err);
        initLockRef.current = false;
        setConnectionError(
          err instanceof Error ? err.message : "Failed to connect"
        );
      }
    }

    initChime();

    return () => {
      stopped = true;
      // Do NOT stop the session here — StrictMode/HMR cleanup
      // would kill a perfectly good session. The session lives
      // until the user clicks End Session or navigates away.
    };
  }, [consentGiven, bookingId]);

  const isOvertime = elapsedMinutes >= scheduledDuration;
  const overtimeMinutes = isOvertime ? elapsedMinutes - scheduledDuration : 0;
  const totalCost = basePrice + overtimeMinutes * overageRate;

  const handleToggleMute = useCallback(() => {
    if (!meetingSessionRef.current) return;
    if (isMuted) {
      meetingSessionRef.current.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      meetingSessionRef.current.audioVideo.realtimeMuteLocalAudio();
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleToggleVideo = useCallback(async () => {
    if (!meetingSessionRef.current) return;
    if (isVideoOff) {
      meetingSessionRef.current.audioVideo.startLocalVideoTile();
    } else {
      meetingSessionRef.current.audioVideo.stopLocalVideoTile();
    }
    setIsVideoOff(!isVideoOff);
  }, [isVideoOff]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!meetingSessionRef.current) return;
    if (isScreenSharing) {
      meetingSessionRef.current.audioVideo.stopContentShare();
    } else {
      try {
        await meetingSessionRef.current.audioVideo.startContentShareFromScreenCapture();
      } catch {
        // User dismissed the picker or browser denied permission — no-op
      }
    }
  }, [isScreenSharing]);

  const handleEndSession = useCallback(async () => {
    setSessionEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop Chime meeting session and release all media devices.
    // Order matters: stop inputs first so the OS camera/mic indicator turns off,
    // then stop the local tile, then disconnect from Chime.
    if (meetingSessionRef.current) {
      try { await meetingSessionRef.current.audioVideo.stopVideoInput(); } catch { /* non-critical */ }
      try { await meetingSessionRef.current.audioVideo.stopAudioInput(); } catch { /* non-critical */ }
      try { meetingSessionRef.current.audioVideo.stopLocalVideoTile(); } catch { /* non-critical */ }
      try { meetingSessionRef.current.audioVideo.stop(); } catch { /* non-critical */ }
      meetingSessionRef.current = null;
    }

    try {
      await fetch("/api/chime/end-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          actualDurationMinutes: elapsedMinutes,
          sessionNotes,
        }),
      });
      toast.success("Session ended. Recording will be available shortly.");
    } catch {
      toast.error("Failed to save session data. Please contact support.");
    }
  }, [bookingId, elapsedMinutes, sessionNotes]);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    // Optimistically add to local chat (echo)
    setChatMessages((prev) => [
      ...prev,
      {
        from: role === "diviner" ? divinerName : clientName,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
    // Send to remote participant via Chime data messaging
    if (meetingSessionRef.current) {
      try {
        meetingSessionRef.current.audioVideo.realtimeSendDataMessage(
          "chat",
          text,
          10_000 // 10 s lifetime — long enough for brief disconnects
        );
      } catch (err) {
        console.warn("Chime chat send failed:", err);
      }
    }
  };

  const formatTime = (min: number, sec: number) =>
    `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  // Recording consent screen
  if (!consentGiven) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="max-w-lg bg-card border-primary/20">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4 text-xl gold-text">
              Session Recording Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              This session with{" "}
              <strong className="text-foreground">
                {role === "client" ? divinerName : clientName}
              </strong>{" "}
              will be recorded for your benefit. The recording will be
              available for you to rewatch and optionally share.
            </p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">Session Details</p>
              <p className="mt-1 text-muted-foreground">
                {serviceName} &middot; {scheduledDuration} min &middot; $
                {basePrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${overageRate.toFixed(2)}/min after {scheduledDuration}{" "}
                minutes
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20"
            >
              Powered by AWS Chime
            </Badge>
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
              onClick={() => {
                setConsentGiven(true);
                // sessionStarted is set after API returns sessionStartedAt
                // Record join for no-show tracking (fire-and-forget)
                fetch("/api/chime/participant-joined", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ bookingId, role, clientToken }),
                }).catch(() => {});
              }}
            >
              <Video className="mr-2 h-4 w-4" />I Consent — Join Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connection error screen
  if (connectionError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="max-w-lg bg-card border-primary/20">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4 text-xl">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{connectionError}</p>
            <Button
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
              onClick={() => {
                setConnectionError(null);
                initLockRef.current = false;
                setChimeSdkReady(false);
              }}
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="max-w-lg bg-card border-primary/20">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4 text-xl">
              Session Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg border-border border bg-card p-4">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">
                {formatTime(elapsedMinutes, elapsedSeconds)}
              </p>
              {isOvertime && (
                <p className="text-sm text-amber-400">
                  +{overtimeMinutes} overtime minutes ($
                  {(overtimeMinutes * overageRate).toFixed(2)})
                </p>
              )}
              <Separator className="my-3" />
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">
                ${totalCost.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your session recording will be emailed to you shortly. You
              can also access it from your portal.
            </p>
            {role === "client" && (
              <div className="space-y-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                  <a href="/portal/bookings">View My Bookings</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href={`/${username}`}>Book Another Session</a>
                </Button>
              </div>
            )}
            {role === "diviner" && (
              <Button asChild className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                <a href="/dashboard/bookings">Back to Dashboard</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat panel content
  const chatPanel = (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
          <MessageSquare className="h-3 w-3 text-primary" />
          Chat
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Send a message if you need to communicate via text during the
            session.
          </p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className="mb-2">
            <p className="text-xs">
              <span className="font-medium text-primary">{msg.from}</span>
              <span className="ml-2 text-muted-foreground">{msg.time}</span>
            </p>
            <p className="text-xs text-foreground">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-primary/20 bg-transparent px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="icon" variant="ghost" onClick={handleSendChat}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // Active session
  return (
    <div className="relative flex h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border border-border bg-background">

      {/* ── Waiting for diviner overlay (client only) ────────────────────────
          Rendered as an absolute layer so audio/video elements stay mounted
          and Chime bindings stay valid. Disappears the moment the diviner's
          attendee presence event fires — no refresh required.              */}
      {role === "client" && !isDivinerPresent && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/97 p-6 text-center backdrop-blur-sm">
          {/* Pulsing avatar rings */}
          <div className="relative mx-auto h-28 w-28">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div
              className="absolute inset-3 animate-ping rounded-full bg-primary/15"
              style={{ animationDelay: "0.45s" }}
            />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold gold-text">
              Waiting for {divinerName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {chimeSdkReady
                ? "You're connected. The session will start automatically when your diviner joins."
                : "Connecting to session…"}
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 px-6 py-4 text-sm">
            <p className="font-medium text-primary">{serviceName}</p>
            <p className="mt-1 text-muted-foreground">
              {scheduledDuration} min &middot; ${basePrice.toFixed(2)}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            This page updates automatically — no need to refresh.
          </p>
        </div>
      )}

      {/* Main video area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border bg-background px-2 py-2 md:px-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Badge className="animate-pulse gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
              REC
            </Badge>
            <span className="hidden text-sm font-medium sm:inline">
              {serviceName}
            </span>
            <span className="hidden text-sm text-muted-foreground md:inline">
              with {role === "diviner" ? clientName : divinerName}
            </span>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 text-xs"
            >
              Chime
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-primary/20 text-xs"
            >
              <User className="h-3 w-3" />
              {participants.length}
            </Badge>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-mono font-bold md:gap-2 md:px-3 md:text-sm ${
              isOvertime
                ? "bg-amber-500/20 text-amber-400"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {formatTime(elapsedMinutes, elapsedSeconds)}
            <span className="hidden text-xs font-normal md:inline">
              / {scheduledDuration}:00
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Video area */}
        <div className="relative flex-1 overflow-hidden bg-zinc-950" ref={videoContainerRef}>
          {/* Audio element — always mounted so Chime keeps audio bound */}
          <audio ref={audioRef} autoPlay playsInline className="hidden" />

          {/* Connecting overlay */}
          {!chimeSdkReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted-foreground">Connecting…</p>
              </div>
            </div>
          )}

          {/* Overtime badge */}
          {isOvertime && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
              <AlertTriangle className="h-3.5 w-3.5" />
              +{overtimeMinutes} min overtime (${(overtimeMinutes * overageRate).toFixed(2)}/min)
            </div>
          )}

          {/* ── VIDEO LAYOUT ──────────────────────────────────────────────── */}
          {(() => {
            const contentTile = tiles.find((t) => t.isContent);
            const localTile   = tiles.find((t) => t.isLocal && !t.isContent);
            const remoteTiles = tiles.filter((t) => !t.isLocal && !t.isContent);
            const remoteName  = role === "diviner" ? clientName : divinerName;

            /** Callback-ref: mount → add to map & bind; unmount → remove */
            const videoRef = (tileId: number, muted = false) =>
              (el: HTMLVideoElement | null) => {
                if (el) {
                  el.muted = muted;
                  videoElemRefs.current.set(tileId, el);
                  if (meetingSessionRef.current) {
                    try {
                      meetingSessionRef.current.audioVideo.bindVideoElement(tileId, el);
                    } catch { /* non-critical */ }
                  }
                } else {
                  videoElemRefs.current.delete(tileId);
                }
              };

            /* ── PRESENTATION MODE: screen share active ─────────────────── */
            if (contentTile) {
              return (
                <div className="absolute inset-0 flex">
                  {/* Screen share — main panel */}
                  <div className="flex min-w-0 flex-1 items-center justify-center bg-black">
                    <video
                      ref={videoRef(contentTile.tileId)}
                      autoPlay
                      playsInline
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Camera strip — right panel */}
                  <div className="flex w-44 flex-shrink-0 flex-col gap-1 overflow-y-auto bg-zinc-900 p-1">
                    {remoteTiles.map((tile) => (
                      <div
                        key={tile.tileId}
                        className="relative overflow-hidden rounded-lg bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <video
                          ref={videoRef(tile.tileId)}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {remoteName}
                        </span>
                      </div>
                    ))}
                    {localTile && (
                      <div
                        className="relative overflow-hidden rounded-lg bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <video
                          ref={videoRef(localTile.tileId, true)}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          You
                        </span>
                      </div>
                    )}
                    {/* Placeholder when camera is off */}
                    {remoteTiles.length === 0 && (
                      <div
                        className="flex items-center justify-center rounded-lg bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <User className="h-8 w-8 text-zinc-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            /* ── GALLERY MODE: no screen share ──────────────────────────── */

            // Only local camera on — show self full-screen, remote as small placeholder
            if (remoteTiles.length === 0 && localTile) {
              return (
                <>
                  <video
                    ref={videoRef(localTile.tileId, true)}
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute bottom-4 left-4 z-[2] rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                    You
                  </span>
                  {/* Remote camera-off pill — top-right */}
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-zinc-600/50 bg-zinc-800/90 px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-300">{remoteName}</span>
                    <span className="text-[10px] text-zinc-500">Camera off</span>
                  </div>
                </>
              );
            }

            return (
              <>
                {/* Remote participant — fills entire area */}
                {remoteTiles.map((tile) => (
                  <video
                    key={tile.tileId}
                    ref={videoRef(tile.tileId)}
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ))}

                {/* Both cameras off / still connecting */}
                {remoteTiles.length === 0 && !localTile && chimeSdkReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-700">
                      <User className="h-10 w-10 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">{remoteName}</p>
                    <p className="text-xs text-zinc-500">Camera off or connecting…</p>
                  </div>
                )}

                {/* Remote name label */}
                {remoteTiles.length > 0 && (
                  <span className="absolute bottom-4 left-4 z-[2] rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                    {remoteName}
                  </span>
                )}

                {/* Self-view PIP — bottom-right (only when remote is also visible) */}
                {localTile && remoteTiles.length > 0 && (
                  <div
                    className="absolute bottom-4 right-4 z-10 w-40 overflow-hidden rounded-xl border-2 border-primary/50 shadow-2xl"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <video
                      ref={videoRef(localTile.tileId, true)}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      You
                    </span>
                  </div>
                )}

                {/* Remote camera off — pill indicator when only remote video is missing */}
                {localTile && remoteTiles.length === 0 && chimeSdkReady && (
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-zinc-600/50 bg-zinc-800/90 px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-300">{remoteName}</span>
                    <span className="text-[10px] text-zinc-500">Camera off</span>
                  </div>
                )}
              </>
            );
          })()}

          {/* Mobile quick-access buttons */}
          {isMobile && (
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full border border-primary/20 bg-card shadow-lg"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full border border-primary/20 bg-card shadow-lg"
                onClick={() => setMobileChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-2 border-t border-border bg-muted px-3 py-2 md:gap-3 md:px-4 md:py-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            className={isMuted ? "" : "border-primary/30"}
            onClick={handleToggleMute}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={isVideoOff ? "destructive" : "outline"}
            size="icon"
            className={isVideoOff ? "" : "border-primary/30"}
            onClick={handleToggleVideo}
          >
            {isVideoOff ? (
              <VideoOff className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="icon"
            className={isScreenSharing ? "border-primary/60 bg-primary/20" : "border-primary/30"}
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          {role === "diviner" && (
            <Button
              variant="destructive"
              onClick={handleEndSession}
              className="gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End Session</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      {showSidebar && !isMobile && (
        <div className="flex w-80 flex-col border-l border-border bg-muted">
          {/* Billing info */}
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base</span>
              <span>
                ${basePrice.toFixed(2)} / {scheduledDuration} min
              </span>
            </div>
            {isOvertime && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-amber-400">Overtime</span>
                <span className="text-amber-400">
                  +${(overtimeMinutes * overageRate).toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Running Total
              </span>
              <span className="text-primary">${totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Client info (diviner only) */}
          {role === "diviner" && (
            <div className="border-b border-border p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Client Info
              </p>
              <p className="text-sm font-medium">{clientName}</p>
              {clientBirthData?.date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Born: {clientBirthData.date}
                  {clientBirthData.time && ` at ${clientBirthData.time}`}
                  {clientBirthData.city && ` in ${clientBirthData.city}`}
                </p>
              )}
              {questionnaire?.focusQuestion && (
                <div className="mt-2 rounded bg-primary/5 p-2 text-xs">
                  <p className="font-medium text-primary">
                    Focus Question:
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {questionnaire.focusQuestion}
                  </p>
                </div>
              )}
              {questionnaire?.lifeArea && (
                <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary">
                  {questionnaire.lifeArea}
                </Badge>
              )}
            </div>
          )}

          {/* Session notes (diviner only) */}
          {role === "diviner" && (
            <div className="border-b border-border p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                <FileText className="h-3 w-3 text-primary" />
                Session Notes
              </p>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Private notes about this session..."
                className="h-24 resize-none text-xs"
              />
            </div>
          )}

          {/* Chat */}
          {chatPanel}
        </div>
      )}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="right" className="w-[85vw] p-0 sm:max-w-sm bg-muted">
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle>Session Info</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col overflow-y-auto">
              <div className="border-b border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base</span>
                  <span>
                    ${basePrice.toFixed(2)} / {scheduledDuration} min
                  </span>
                </div>
                {isOvertime && (
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-amber-400">Overtime</span>
                    <span className="text-amber-400">
                      +${(overtimeMinutes * overageRate).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-primary" />
                    Running Total
                  </span>
                  <span className="text-primary">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {role === "diviner" && (
                <div className="border-b border-border p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Client Info
                  </p>
                  <p className="text-sm font-medium">{clientName}</p>
                  {clientBirthData?.date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Born: {clientBirthData.date}
                      {clientBirthData.time &&
                        ` at ${clientBirthData.time}`}
                      {clientBirthData.city &&
                        ` in ${clientBirthData.city}`}
                    </p>
                  )}
                  {questionnaire?.focusQuestion && (
                    <div className="mt-2 rounded bg-primary/5 p-2 text-xs">
                      <p className="font-medium text-primary">
                        Focus Question:
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {questionnaire.focusQuestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {role === "diviner" && (
                <div className="p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    <FileText className="h-3 w-3 text-primary" />
                    Session Notes
                  </p>
                  <Textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Private notes about this session..."
                    className="h-32 resize-none text-xs"
                  />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile chat bottom sheet */}
      {isMobile && (
        <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
          <SheetContent
            side="bottom"
            className="h-[60vh] rounded-t-xl p-0 bg-muted"
          >
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle>Chat</SheetTitle>
            </SheetHeader>
            {chatPanel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
