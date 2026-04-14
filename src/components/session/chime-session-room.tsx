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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [chimeSdkReady, setChimeSdkReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    { id: string; name: string; isLocal: boolean }[]
  >([]);
  const [joinNotification, setJoinNotification] = useState<string | null>(null);
  const initLockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const participantMapRef = useRef<Map<string, string>>(new Map());

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

        // 3. Register observer BEFORE start()
        const seenAttendees = new Set<string>();

        meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
          (attendeeId: string, present: boolean, externalUserId?: string) => {
            const name = resolveAttendeeName(externalUserId ?? attendeeId);
            const isLocal = attendeeId === meetingData.attendee.AttendeeId;

            if (present) {
              if (!seenAttendees.has(attendeeId)) {
                seenAttendees.add(attendeeId);
                setParticipants((prev) => {
                  if (prev.some((p) => p.id === attendeeId)) return prev;
                  return [...prev, { id: attendeeId, name, isLocal }];
                });
                if (!isLocal) {
                  setJoinNotification(`${name} joined the session`);
                  setTimeout(() => setJoinNotification(null), 4000);
                }
              }
            } else {
              seenAttendees.delete(attendeeId);
              setParticipants((prev) => prev.filter((p) => p.id !== attendeeId));
            }
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
            if (!tileState.boundAttendeeId || !videoContainerRef.current)
              return;

            const tileId = tileState.tileId;
            let videoEl = document.getElementById(
              `chime-video-${tileId}`
            ) as HTMLVideoElement | null;

            if (!videoEl) {
              videoEl = document.createElement("video");
              videoEl.id = `chime-video-${tileId}`;
              videoEl.autoplay = true;
              videoEl.playsInline = true;
              videoEl.style.width = "100%";
              videoEl.style.height = "100%";
              videoEl.style.objectFit = "cover";

              if (tileState.localTile) {
                videoEl.className =
                  "absolute bottom-4 right-4 h-32 w-44 rounded-lg border-2 border-primary/40 object-cover shadow-lg z-10";
                videoEl.muted = true;
              } else {
                videoEl.className = "h-full w-full object-cover rounded-lg";
              }

              videoContainerRef.current?.appendChild(videoEl);
            }

            meetingSession.audioVideo.bindVideoElement(tileId, videoEl);
          },
          videoTileWasRemoved: (tileId: number) => {
            const videoEl = document.getElementById(`chime-video-${tileId}`);
            if (videoEl) videoEl.remove();
          },
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

  const handleEndSession = useCallback(async () => {
    setSessionEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop Chime meeting session
    if (meetingSessionRef.current) {
      try {
        meetingSessionRef.current.audioVideo.stop();
      } catch {
        // Cleanup errors are non-critical
      }
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
    if (!chatInput.trim()) return;
    // Chime SDK has a data messaging API for in-meeting chat
    if (meetingSessionRef.current) {
      try {
        meetingSessionRef.current.audioVideo.realtimeSendDataMessage(
          "chat",
          chatInput,
          1000
        );
      } catch {
        // Fallback: local-only chat
      }
    }
    setChatMessages((prev) => [
      ...prev,
      {
        from: role === "diviner" ? divinerName : clientName,
        text: chatInput,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
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
                  body: JSON.stringify({ bookingId, role }),
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
    <div className="flex h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border border-border bg-background">
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

        {/* Video area — Chime SDK renders video elements here */}
        <div className="relative flex-1 bg-black" ref={videoContainerRef}>
          {/* Hidden audio element for Chime audio */}
          <audio ref={audioRef} autoPlay playsInline className="hidden" />

          {/* Join notification */}
          {joinNotification && (
            <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
                <User className="h-4 w-4" />
                {joinNotification}
              </div>
            </div>
          )}

          {/* Loading state */}
          {!chimeSdkReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Connecting to session...
                </p>
              </div>
            </div>
          )}

          {/* Overtime warning overlay */}
          {isOvertime && (
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-black shadow-lg md:left-4 md:top-4 md:gap-2 md:px-4 md:py-2 md:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Overtime: +{overtimeMinutes} min ($
              {(overtimeMinutes * overageRate).toFixed(2)}/min)
            </div>
          )}

          {/* Mobile floating buttons */}
          {isMobile && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg bg-card border border-primary/20"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg bg-card border border-primary/20"
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
