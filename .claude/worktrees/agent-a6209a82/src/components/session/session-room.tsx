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
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SessionRoomProps {
  bookingId: string;
  roomUrl: string;
  role: "diviner" | "client";
  serviceName: string;
  clientName: string;
  divinerName: string;
  scheduledDuration: number; // minutes
  basePrice: number;
  overageRate: number; // per minute
  username: string;
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

export function SessionRoom({
  bookingId,
  roomUrl,
  role,
  serviceName,
  clientName,
  divinerName,
  scheduledDuration,
  basePrice,
  overageRate,
  username,
  questionnaire,
  clientBirthData,
}: SessionRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewMode, setViewMode] = useState<"facecam" | "screenshare">("facecam");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Detect mobile viewport and set sidebar visibility
  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true);
      }
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Timer logic
  useEffect(() => {
    if (sessionStarted && !sessionEnded) {
      startTimeRef.current = new Date();
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

  const isOvertime = elapsedMinutes >= scheduledDuration;
  const overtimeMinutes = isOvertime ? elapsedMinutes - scheduledDuration : 0;
  const totalCost = basePrice + overtimeMinutes * overageRate;

  const handleEndSession = useCallback(async () => {
    setSessionEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await fetch("/api/daily/end-session", {
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
    setChatMessages((prev) => [
      ...prev,
      {
        from: role === "diviner" ? divinerName : clientName,
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4 text-xl">Session Recording Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              This session with <strong>{role === "client" ? divinerName : clientName}</strong> will
              be recorded for your benefit. The recording will be available for
              you to rewatch and optionally share.
            </p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">Session Details</p>
              <p className="mt-1 text-muted-foreground">
                {serviceName} &middot; {scheduledDuration} min &middot; ${basePrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${overageRate.toFixed(2)}/min after {scheduledDuration} minutes
              </p>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setConsentGiven(true);
                setSessionStarted(true);
              }}
            >
              <Video className="mr-2 h-4 w-4" />
              I Consent — Join Session
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
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4 text-xl">Session Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">{formatTime(elapsedMinutes, elapsedSeconds)}</p>
              {isOvertime && (
                <p className="text-sm text-amber-400">
                  +{overtimeMinutes} overtime minutes (${(overtimeMinutes * overageRate).toFixed(2)})
                </p>
              )}
              <Separator className="my-3" />
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your session recording will be emailed to you shortly. You can also
              access it from your portal.
            </p>
            {role === "client" && (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <a href="/portal/bookings">View My Bookings</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href={`/${username}`}>Book Another Session</a>
                </Button>
              </div>
            )}
            {role === "diviner" && (
              <Button asChild className="w-full">
                <a href="/dashboard/bookings">Back to Dashboard</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat panel content (shared between desktop sidebar and mobile sheet)
  const chatPanel = (
    <div className="flex flex-1 flex-col">
      <div className="border-b p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          Chat
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Send a message if you need to communicate via text during the session.
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
      <div className="flex gap-2 border-t p-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          placeholder="Type a message..."
          className="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="icon" variant="ghost" onClick={handleSendChat}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // Active session
  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border bg-card">
      {/* Main video area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-2 py-2 md:px-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Badge variant="destructive" className="animate-pulse gap-1">
              <span className="h-2 w-2 rounded-full bg-white" />
              REC
            </Badge>
            <span className="hidden text-sm font-medium sm:inline">{serviceName}</span>
            <span className="hidden text-sm text-muted-foreground md:inline">
              with {role === "diviner" ? clientName : divinerName}
            </span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-mono font-bold md:gap-2 md:px-3 md:text-sm ${
            isOvertime
              ? "bg-amber-500/20 text-amber-400"
              : "bg-primary/10 text-primary"
          }`}>
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {formatTime(elapsedMinutes, elapsedSeconds)}
            <span className="hidden text-xs font-normal md:inline">/ {scheduledDuration}:00</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* View toggle (diviner only, desktop) */}
            {role === "diviner" && !isMobile && (
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === "facecam" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("facecam")}
                >
                  <User className="mr-1 h-3.5 w-3.5" />
                  Face
                </Button>
                <Button
                  variant={viewMode === "screenshare" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("screenshare")}
                >
                  <Monitor className="mr-1 h-3.5 w-3.5" />
                  Screen
                </Button>
              </div>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Video iframe */}
        <div className="relative flex-1 bg-black">
          <iframe
            ref={iframeRef}
            src={roomUrl}
            className="h-full w-full"
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            title="Video Session"
          />

          {/* Overtime warning overlay */}
          {isOvertime && (
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-black shadow-lg md:left-4 md:top-4 md:gap-2 md:px-4 md:py-2 md:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Overtime: +{overtimeMinutes} min (${(overtimeMinutes * overageRate).toFixed(2)}/min)
            </div>
          )}

          {/* Mobile floating buttons */}
          {isMobile && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={() => setMobileChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-2 border-t px-3 py-2 md:gap-3 md:px-4 md:py-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant={isVideoOff ? "destructive" : "outline"}
            size="icon"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
          {/* Mobile-only view toggle for diviners */}
          {role === "diviner" && isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "facecam" ? "screenshare" : "facecam")}
            >
              {viewMode === "facecam" ? <Monitor className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </Button>
          )}
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
        <div className="flex w-80 flex-col border-l">
          {/* Billing info */}
          <div className="border-b p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base</span>
              <span>${basePrice.toFixed(2)} / {scheduledDuration} min</span>
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
            <div className="border-b p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                <Sparkles className="h-3 w-3" />
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
                  <p className="font-medium text-primary">Focus Question:</p>
                  <p className="mt-0.5 text-muted-foreground">{questionnaire.focusQuestion}</p>
                </div>
              )}
              {questionnaire?.lifeArea && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {questionnaire.lifeArea}
                </Badge>
              )}
            </div>
          )}

          {/* Session notes (diviner only) */}
          {role === "diviner" && (
            <div className="border-b p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                <FileText className="h-3 w-3" />
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

      {/* Mobile sidebar sheet (notes + info) */}
      {isMobile && (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="right" className="w-[85vw] p-0 sm:max-w-sm">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Session Info</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col overflow-y-auto">
              {/* Billing info */}
              <div className="border-b p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base</span>
                  <span>${basePrice.toFixed(2)} / {scheduledDuration} min</span>
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
                <div className="border-b p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
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
                      <p className="font-medium text-primary">Focus Question:</p>
                      <p className="mt-0.5 text-muted-foreground">{questionnaire.focusQuestion}</p>
                    </div>
                  )}
                  {questionnaire?.lifeArea && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {questionnaire.lifeArea}
                    </Badge>
                  )}
                </div>
              )}

              {/* Session notes (diviner only) */}
              {role === "diviner" && (
                <div className="p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    <FileText className="h-3 w-3" />
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
          <SheetContent side="bottom" className="h-[60vh] rounded-t-xl p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Chat</SheetTitle>
            </SheetHeader>
            {chatPanel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
