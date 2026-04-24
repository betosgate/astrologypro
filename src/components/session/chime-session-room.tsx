"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Captions,
  CaptionsOff,
  Save,
  Loader2,
  Check,
  ExternalLink,
} from "lucide-react";
import { encodeAudioEvent, floatToPcm16, decodeTranscriptEvent } from "@/lib/transcribe-stream";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/** Lightweight tooltip wrapper — wraps any interactive element with a Radix tooltip */
function Tip({ label, children, side = "top" }: { label: string; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="bg-zinc-800 text-zinc-100 text-xs border-zinc-700">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

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
  /**
   * Pre-computed link to /admin/session/{bookingId} when the booking's service
   * maps to a toolkit (horoscope tab or tarot spread). NULL when the service
   * is unmapped (hides the button). Only meaningful for role === "diviner".
   * Computed server-side via getSessionLinkForBooking().
   */
  sessionLink?: string | null;
  /**
   * Override for the Chime attendee-provisioning endpoint. Defaults to
   * `/api/chime/join-meeting` (legacy `bookings` table). Admin-hosted
   * sessions point this at `/api/chime/admin-bookings/join`, which reads
   * from `admin_bookings` and enforces admin-host ↔ client-email auth.
   */
  joinApiPath?: string;
  /**
   * Override for the session-teardown endpoint called when the host clicks
   * "End Session". Defaults to `/api/chime/end-meeting` (legacy `bookings`
   * table). Admin-hosted sessions point this at `/api/chime/admin-bookings/end`
   * so the teardown reads/writes `admin_bookings`. Both endpoints perform
   * the same teardown sequence: stop capture pipeline → wait → concat → delete
   * Chime meeting.
   */
  endApiPath?: string;
  /**
   * When true, the in-session billing / overage / session-notes
   * integrations are suppressed — admin-hosted bookings have no price,
   * no overage, and no `bookings.session_notes` column to write to.
   */
  disableBillingAndNotes?: boolean;
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
  sessionLink,
  joinApiPath = "/api/chime/join-meeting",
  endApiPath = "/api/chime/end-meeting",
  disableBillingAndNotes = false,
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
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ── Live captions (AWS Transcribe Streaming) ─────────────────────────────
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [captionIsPartial, setCaptionIsPartial] = useState(false);
  const [captionSpeaker, setCaptionSpeaker] = useState("");
  const transcribeWsRef = useRef<WebSocket | null>(null);
  const transcribeAudioCtxRef = useRef<AudioContext | null>(null);
  const transcribeStreamRef = useRef<MediaStream | null>(null);
  // Clear the caption after N ms of silence (no new transcript events)
  const captionClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Safety net #1 — derive isDivinerPresent from participants state.
  // The direct setIsDivinerPresent() inside the presence callback is the fast
  // path, but Chime's roster-replay timing is not guaranteed. Watching the
  // participants array (which the same callback also updates) ensures the
  // waiting-room overlay disappears the moment any non-local participant is
  // tracked, regardless of callback ordering.
  useEffect(() => {
    if (role !== "client") return;
    if (participants.some((p) => !p.isLocal)) {
      setIsDivinerPresent(true);
    }
  }, [participants, role]);

  // Safety net #2 — a remote video tile appearing is proof-positive the
  // diviner is in the meeting. Covers cases where the presence event fires
  // but the state update is somehow missed (e.g. StrictMode, rapid fire).
  useEffect(() => {
    if (role !== "client") return;
    const hasRemoteTile = tiles.some((t) => !t.isLocal && !t.isContent);
    if (hasRemoteTile) setIsDivinerPresent(true);
  }, [tiles, role]);

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
        const meetingResponse = await fetch(joinApiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ bookingId, clientToken }),
        });

        if (!meetingResponse.ok) {
          throw new Error("Failed to fetch meeting details");
        }

        const meetingData = await meetingResponse.json();

        // Set timer from server-persisted start time (survives reloads)
        startTimeRef.current = new Date(meetingData.sessionStartedAt);
        setSessionStarted(true);

        // If the server confirmed the diviner is already in the meeting, show
        // the session immediately — don't wait for the presence callback.
        if (role === "client" && meetingData.divinerPresent) {
          setIsDivinerPresent(true);
        }

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
            // Ignore the #content ghost attendee (screen share) — it inflates
            // the participant count and is not a real person in the call.
            if (attendeeId.endsWith("#content")) return;

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

        // "Session ended" signal — diviner sends this just before deleting the meeting.
        // Gives the client a chance to show "Session Complete" before the Chime SDK
        // disconnects them with a MeetingEnded status code.
        meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage(
          "session-ended",
          () => {
            setSessionEnded(true);
            if (timerRef.current) clearInterval(timerRef.current);
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

        // Live captions — client receives caption text broadcast by diviner
        meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage(
          "captions",
          (dataMessage: any) => {
            const payload =
              typeof dataMessage.data === "string"
                ? dataMessage.data
                : new TextDecoder().decode(dataMessage.data as Uint8Array);
            try {
              const msg = JSON.parse(payload);
              if (msg.type === "text") {
                setCaptionText(msg.text ?? "");
                setCaptionIsPartial(msg.isPartial ?? false);
                setCaptionSpeaker(msg.speaker ?? "");
                // Auto-clear after final result
                if (!msg.isPartial && msg.text) {
                  if (captionClearTimerRef.current) clearTimeout(captionClearTimerRef.current);
                  captionClearTimerRef.current = setTimeout(() => {
                    setCaptionText("");
                    setCaptionSpeaker("");
                  }, 4000);
                }
              } else if (msg.type === "toggle") {
                setIsCaptionsEnabled(msg.enabled);
                if (!msg.enabled) {
                  setCaptionText("");
                  setCaptionSpeaker("");
                }
              }
            } catch { /* ignore malformed */ }
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
            if (stopped) return; // Already handled by local cleanup
            if (code === 5) {
              // MeetingEnded (5) — the meeting was deleted by the host.
              // Treat this as a graceful session end for the non-ending participant
              // (client) so they see "Session Complete" instead of an error.
              setSessionEnded(true);
              if (timerRef.current) clearInterval(timerRef.current);
            } else if (code !== 1) {
              // Any other non-voluntary disconnect is a real connection error.
              setConnectionError(
                "Session disconnected. Please click Retry to reconnect."
              );
            }
          },
          videoTileDidUpdate: (tileState: any) => {
            // When boundAttendeeId is null the tile became unbound — the participant
            // turned their camera off. Remove it from tiles so the avatar renders
            // instead of leaving a stale black video element in state.
            if (!tileState.boundAttendeeId) {
              videoElemRefs.current.delete(tileState.tileId);
              setTiles((prev) => prev.filter((t) => t.tileId !== tileState.tileId));
              return;
            }
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

  // Derived: whether the remote participant has actually joined the Chime session
  const isRemotePresent = participants.some((p) => !p.isLocal);
  const remoteName = role === "diviner" ? clientName : divinerName;

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
        // Use getDisplayMedia directly so we can pass selfBrowserSurface: 'exclude'.
        // This removes the current tab from the Chrome picker entirely, which is the
        // industry-standard fix (Chrome 107+) for the infinite-mirror problem.
        // We then hand the stream to Chime's startContentShare() instead of letting
        // the SDK call getDisplayMedia itself.
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: false,
          // @ts-expect-error — selfBrowserSurface is a Chrome 107+ constraint not yet in TS types
          selfBrowserSurface: "exclude",
        });
        await meetingSessionRef.current.audioVideo.startContentShare(stream);
      } catch {
        // User dismissed the picker, browser denied permission, or
        // selfBrowserSurface is unsupported — no-op
      }
    }
  }, [isScreenSharing]);

  // ── Helper: broadcast caption data to the other participant via Chime ────
  // ── Helper: broadcast caption data to the other participant via Chime ────
  const broadcastCaption = useCallback(
    (payload: { type: string; text?: string; isPartial?: boolean; enabled?: boolean; speaker?: string }) => {
      if (!meetingSessionRef.current) return;
      try {
        meetingSessionRef.current.audioVideo.realtimeSendDataMessage(
          "captions",
          JSON.stringify(payload),
          2_000
        );
      } catch { /* non-critical */ }
    },
    []
  );

  // ── Live captions toggle (AWS Transcribe Streaming) ──────────────────────
  // Only the diviner can start/stop transcription. Caption text is broadcast
  // to the client via Chime data messaging so both see the same captions.
  const handleToggleCaptions = useCallback(async () => {
    // ── STOP ──────────────────────────────────────────────────────────────
    if (isCaptionsEnabled) {
      transcribeWsRef.current?.close();
      transcribeWsRef.current = null;
      transcribeAudioCtxRef.current?.close();
      transcribeAudioCtxRef.current = null;
      transcribeStreamRef.current?.getTracks().forEach((t) => t.stop());
      transcribeStreamRef.current = null;
      if (captionClearTimerRef.current) clearTimeout(captionClearTimerRef.current);
      setCaptionText("");
      setIsCaptionsEnabled(false);
      // Notify client to hide captions
      broadcastCaption({ type: "toggle", enabled: false });
      return;
    }

    // ── START ─────────────────────────────────────────────────────────────
    try {
      // 1. Get pre-signed WebSocket URL from our API (server signs with AWS v4)
      const res = await fetch("/api/transcribe/signed-url");
      if (!res.ok) throw new Error("Failed to get Transcribe URL");
      const { url } = await res.json();

      // 2. Open WebSocket to AWS Transcribe
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      transcribeWsRef.current = ws;

      // 3. Capture mic audio for Transcribe via getUserMedia.
      //    Chrome allows multiple streams from the same mic — Chime SDK
      //    already has one, this opens a second that coexists fine.
      console.log("[captions] Opening mic stream for Transcribe");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      transcribeStreamRef.current = stream;
      console.log("[captions] Mic stream obtained, tracks:", stream.getAudioTracks().length);

      // Use the browser's default sample rate (typically 48000) — forcing 16000
      // can cause ScriptProcessor to never fire on some browsers/OS combos.
      // We downsample to 16000 manually before sending to Transcribe.
      const audioCtx = new AudioContext();
      transcribeAudioCtxRef.current = audioCtx;
      const nativeSampleRate = audioCtx.sampleRate;
      console.log("[captions] AudioContext created, sampleRate:", nativeSampleRate);

      // Ensure context is running (browsers may suspend until user gesture)
      if (audioCtx.state === "suspended") await audioCtx.resume();
      console.log("[captions] AudioContext state:", audioCtx.state);

      const source = audioCtx.createMediaStreamSource(stream);

      // Downsample from native rate (e.g. 48000) to 16000 for Transcribe
      const downsampleRatio = nativeSampleRate / 16000;

      function downsample(input: Float32Array): Float32Array {
        if (downsampleRatio <= 1) return input;
        const outputLength = Math.floor(input.length / downsampleRatio);
        const output = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
          output[i] = input[Math.floor(i * downsampleRatio)];
        }
        return output;
      }

      const bufferSize = 4096;
      const scriptNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      let audioChunkCount = 0;

      scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = event.inputBuffer.getChannelData(0);
        // Debug: log first few chunks
        if (audioChunkCount < 5) {
          const maxVal = input.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
          console.log(`[captions] chunk #${audioChunkCount} amplitude: ${maxVal.toFixed(4)}, samples: ${input.length}`);
          audioChunkCount++;
        }
        const downsampled = downsample(input);
        const pcm = floatToPcm16(downsampled);
        ws.send(encodeAudioEvent(pcm));
      };

      source.connect(scriptNode);
      scriptNode.connect(audioCtx.destination);
      console.log("[captions] ScriptProcessor connected, waiting for audio data...");

      // 4. ScriptProcessor already streams audio via onaudioprocess above.
      //    The ws.readyState check inside onaudioprocess ensures we only
      //    send after the WebSocket is open — no separate onopen needed.
      ws.onopen = () => {
        console.log("[captions] WebSocket to Transcribe opened");
      };

      // 5. Receive transcript events, update local state, and broadcast to client
      let msgCount = 0;
      ws.onmessage = (e) => {
        if (msgCount < 5) {
          console.log(`[captions] WS message #${msgCount}, type: ${e.data instanceof ArrayBuffer ? 'ArrayBuffer' : typeof e.data}, size: ${e.data instanceof ArrayBuffer ? e.data.byteLength : (e.data as string).length}`);
          msgCount++;
        }
        const chunk = decodeTranscriptEvent(e.data as ArrayBuffer);
        if (msgCount < 8) {
          console.log(`[captions] decoded chunk:`, chunk);
        }
        if (!chunk || !chunk.text) return;

        setCaptionText(chunk.text);
        setCaptionIsPartial(chunk.isPartial);
        setCaptionSpeaker(divinerName); // Transcription captures diviner's mic

        // Broadcast to client so they see the same captions (with speaker name)
        broadcastCaption({ type: "text", text: chunk.text, isPartial: chunk.isPartial, speaker: divinerName });

        // Auto-clear caption 4 s after a final (non-partial) result
        if (!chunk.isPartial) {
          if (captionClearTimerRef.current) clearTimeout(captionClearTimerRef.current);
          captionClearTimerRef.current = setTimeout(() => {
            setCaptionText("");
            setCaptionSpeaker("");
            broadcastCaption({ type: "text", text: "", isPartial: false });
          }, 4000);
        }
      };

      ws.onerror = (err) => {
        console.error("[captions] WebSocket error:", err);
        toast.error("Captions connection error. Please try again.");
        setIsCaptionsEnabled(false);
        broadcastCaption({ type: "toggle", enabled: false });
      };

      // 6. Auto-reconnect when the 5-min pre-signed URL expires
      ws.onclose = (e) => {
        if (!isCaptionsEnabled) return; // user turned off — don't reconnect
        // 1008 = policy violation (URL expired), 1006 = abnormal closure
        if (e.code === 1008 || e.code === 1006) {
          void handleToggleCaptions(); // re-start with a fresh URL
        }
      };

      setIsCaptionsEnabled(true);
      // Notify client to show captions
      broadcastCaption({ type: "toggle", enabled: true });
    } catch (err) {
      console.error("Captions start failed:", err);
      toast.error("Could not start captions. Check microphone permissions.");
    }
  }, [isCaptionsEnabled, broadcastCaption]);

  const handleEndSession = useCallback(async () => {
    setSessionEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // Stop captions if running
    transcribeWsRef.current?.close();
    transcribeAudioCtxRef.current?.close();
    transcribeStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Stop Chime meeting session and release all media devices.
    // Order matters: stop inputs first so the OS camera/mic indicator turns off,
    // then stop the local tile, then disconnect from Chime.
    if (meetingSessionRef.current) {
      // Notify the other participant BEFORE stopping so they can react gracefully.
      // This fires before the meeting is deleted on the server, giving the client
      // a chance to set sessionEnded=true via the data message handler as a
      // belt-and-suspenders backup to the MeetingEnded status code (5).
      try {
        meetingSessionRef.current.audioVideo.realtimeSendDataMessage(
          "session-ended",
          "ended",
          5_000
        );
      } catch { /* non-critical */ }
      try { await meetingSessionRef.current.audioVideo.stopVideoInput(); } catch { /* non-critical */ }
      try { await meetingSessionRef.current.audioVideo.stopAudioInput(); } catch { /* non-critical */ }
      try { meetingSessionRef.current.audioVideo.stopLocalVideoTile(); } catch { /* non-critical */ }
      try { meetingSessionRef.current.audioVideo.stop(); } catch { /* non-critical */ }
      meetingSessionRef.current = null;
    }

    try {
      await fetch(endApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          actualDurationMinutes: elapsedMinutes,
          sessionNotes,
          chatTranscript: chatMessages,
        }),
      });
      toast.success("Session ended. Recording will be available shortly.");
    } catch {
      toast.error("Failed to save session data. Please contact support.");
    }
  }, [bookingId, elapsedMinutes, sessionNotes, chatMessages, endApiPath]);

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

  // ── Save session notes to DB ──────────────────────────────────────────
  const handleSaveNotes = useCallback(async () => {
    if (disableBillingAndNotes) return; // admin_bookings have no notes column
    if (!sessionNotes.trim() && !notesSaved) return; // nothing to save
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      const res = await fetch("/api/bookings/session-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, sessionNotes, role, clientToken }),
      });
      if (res.ok) {
        setNotesSaved(true);
        // Reset the "saved" indicator after 3s
        setTimeout(() => setNotesSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Failed to save notes");
      }
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setNotesSaving(false);
    }
  }, [bookingId, sessionNotes, notesSaved, role]);

  // Auto-save notes 3 seconds after the user stops typing
  const handleNotesChange = useCallback((value: string) => {
    setSessionNotes(value);
    setNotesSaved(false);
    if (notesSaveTimerRef.current) clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      // Trigger save via the latest value (we read from the ref-captured closure)
      // Since handleSaveNotes reads sessionNotes from state, we schedule it
      // after the state update has flushed.
    }, 3000);
  }, []);

  // Debounced auto-save effect — triggers 3s after last notes edit
  useEffect(() => {
    if (!sessionNotes || notesSaving) return;
    if (notesSaveTimerRef.current) clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      handleSaveNotes();
    }, 3000);
    return () => {
      if (notesSaveTimerRef.current) clearTimeout(notesSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionNotes]);

  const formatTime = (min: number, sec: number) =>
    `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  // Recording consent screen
  if (!consentGiven) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-primary/20 to-primary/5 ring-1 ring-primary/30">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-zinc-100">
              Session Recording Consent
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              This session with{" "}
              <strong className="text-zinc-200">
                {role === "client" ? divinerName : clientName}
              </strong>{" "}
              will be recorded for your benefit. The recording will be
              available for you to rewatch and optionally share.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center text-sm">
            <p className="font-semibold text-primary">Session Details</p>
            {disableBillingAndNotes ? (
              <p className="mt-1.5 text-zinc-300">
                {serviceName} &middot; {scheduledDuration} min
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-zinc-300">
                  {serviceName} &middot; {scheduledDuration} min &middot; $
                  {basePrice.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  ${overageRate.toFixed(2)}/min after {scheduledDuration}{" "}
                  minutes
                </p>
              </>
            )}
          </div>

          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
            onClick={() => {
              setConsentGiven(true);
              fetch("/api/chime/participant-joined", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, role, clientToken }),
              }).catch(() => {});
            }}
          >
            <Video className="h-4 w-4" />
            I Consent — Join Session
          </button>
        </div>
      </div>
    );
  }

  // Connection error screen
  if (connectionError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-zinc-100">
            Connection Error
          </h2>
          <p className="mt-3 text-sm text-zinc-400">{connectionError}</p>
          <button
            className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            onClick={() => {
              setConnectionError(null);
              initLockRef.current = false;
              setChimeSdkReady(false);
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-primary/20 to-primary/5 ring-1 ring-primary/30">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-zinc-100">
            Session Complete
          </h2>

          <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Duration</p>
            <p className="mt-1 text-3xl font-bold text-zinc-100">
              {formatTime(elapsedMinutes, elapsedSeconds)}
            </p>
            {isOvertime && !disableBillingAndNotes && (
              <p className="mt-1 text-sm text-amber-400">
                +{overtimeMinutes} overtime minutes ($
                {(overtimeMinutes * overageRate).toFixed(2)})
              </p>
            )}
            {!disableBillingAndNotes && (
              <>
                <div className="my-4 h-px bg-zinc-700/50" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Total</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  ${totalCost.toFixed(2)}
                </p>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            Your session recording will be emailed to you shortly. You
            can also access it from your portal.
          </p>

          {role === "client" && (
            <div className="mt-6 space-y-2.5">
              <a
                href={joinApiPath.includes("/admin-bookings/") ? "/trainee" : "/portal/bookings"}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
              >
                {joinApiPath.includes("/admin-bookings/") ? "Back to Learning Portal" : "View My Bookings"}
              </a>
              <a
                href={`/${username}`}
                className="flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700"
              >
                Book Another Session
              </a>
            </div>
          )}
          {role === "diviner" && (
            <a
              href={joinApiPath.includes("/admin-bookings/") ? "/admin/my-bookings" : "/dashboard/bookings"}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              Back to Dashboard
            </a>
          )}
        </div>
      </div>
    );
  }

  // Chat panel content
  const chatPanel = (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-800/60 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <MessageSquare className="h-3 w-3 text-primary" />
          Chat
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 && (
          <p className="py-6 text-center text-xs text-zinc-500">
            Send a message if you need to communicate via text during the
            session.
          </p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className="mb-3">
            <p className="text-xs">
              <span className="font-semibold text-primary">{msg.from}</span>
              <span className="ml-2 text-zinc-500">{msg.time}</span>
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-zinc-800/60 p-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
        <Tip label="Send message" side="top">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/90 text-white transition-colors hover:bg-primary"
            onClick={handleSendChat}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </Tip>
      </div>
    </div>
  );

  // Active session
  return (
    <TooltipProvider delayDuration={300}>
    <div className="relative flex h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950">

      {/* ── Waiting for diviner overlay (client only) ────────────────────────
          Rendered as an absolute layer so audio/video elements stay mounted
          and Chime bindings stay valid. Disappears the moment the diviner's
          attendee presence event fires — no refresh required.              */}
      {role === "client" && !isDivinerPresent && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-zinc-950/98 p-6 text-center backdrop-blur-md">
          {/* Pulsing avatar rings */}
          <div className="relative mx-auto h-32 w-32">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
            <div
              className="absolute inset-4 animate-ping rounded-full bg-primary/10"
              style={{ animationDelay: "0.45s" }}
            />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-b from-primary/15 to-primary/5">
              <User className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold gold-text">
              Waiting for {divinerName}
            </h2>
            <p className="text-sm text-zinc-400">
              {chimeSdkReady
                ? "You're connected. The session will start automatically when your diviner joins."
                : "Connecting to session…"}
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-8 py-5 text-sm backdrop-blur-sm">
            <p className="font-semibold text-primary">{serviceName}</p>
            <p className="mt-1.5 text-zinc-400">
              {scheduledDuration} min
              {!disableBillingAndNotes && (
                <> &middot; ${basePrice.toFixed(2)}</>
              )}
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            This page updates automatically — no need to refresh.
          </p>
        </div>
      )}

      {/* Main video area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar — minimal, dark, with key info only */}
        <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 md:px-5">
          <div className="flex items-center gap-2.5 md:gap-3">
            {/* REC indicator */}
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold tracking-wide text-red-400">REC</span>
            </div>
            <span className="hidden text-sm font-medium text-zinc-200 sm:inline">
              {serviceName}
            </span>
            <span className="hidden text-sm text-zinc-500 md:inline">
              with {remoteName}
            </span>
            {isRemotePresent ? (
              <span className="hidden items-center gap-1 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-400">Joined</span>
              </span>
            ) : (
              <span className="hidden items-center gap-1 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <span className="text-[11px] text-zinc-500">Waiting</span>
              </span>
            )}
            <span className="hidden items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 md:inline-flex">
              <User className="h-3 w-3" />
              {participants.length}
            </span>
          </div>

          {/* Timer — centered feel */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono font-bold md:gap-2 md:px-4 md:text-sm ${
              isOvertime
                ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                : "bg-zinc-800 text-zinc-200"
            }`}
          >
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {formatTime(elapsedMinutes, elapsedSeconds)}
            <span className="hidden text-[11px] font-normal text-zinc-500 md:inline">
              / {scheduledDuration}:00
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {!isMobile && (
              <Tip label={showSidebar ? "Hide sidebar" : "Show sidebar"} side="bottom">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </Tip>
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
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-zinc-400">Connecting to session…</p>
              </div>
            </div>
          )}

          {/* Overtime badge */}
          {isOvertime && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-xs font-semibold text-black shadow-lg backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5" />
              +{overtimeMinutes} min overtime
              {!disableBillingAndNotes && (
                <> (${(overtimeMinutes * overageRate).toFixed(2)}/min)</>
              )}
            </div>
          )}

          {/* ── VIDEO LAYOUT ──────────────────────────────────────────────── */}
          {(() => {
            const contentTile = tiles.find((t) => t.isContent);
            const localTile   = tiles.find((t) => t.isLocal && !t.isContent);
            const remoteTiles = tiles.filter((t) => !t.isLocal && !t.isContent);

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

            // Helper: "John Doe" → "JD"
            const getInitials = (name: string) =>
              name
                .split(" ")
                .map((w) => w[0] ?? "")
                .join("")
                .toUpperCase()
                .slice(0, 2) || "??";

            const myName = role === "diviner" ? divinerName : clientName;

            /** Name label pill — overlaid on video tiles */
            const nameLabel = (name: string, isYou = false, position: "bottom-left" | "bottom-center" = "bottom-left") => (
              <div className={`absolute z-[2] ${
                position === "bottom-center"
                  ? "bottom-4 left-1/2 -translate-x-1/2"
                  : "bottom-3 left-3"
              }`}>
                <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-medium text-white">{isYou ? "You" : name}</span>
                </div>
              </div>
            );

            /** Avatar circle for camera-off states */
            const avatarCircle = (name: string, size: "sm" | "md" | "lg" = "md") => {
              const sizes = {
                sm: "h-10 w-10 text-sm",
                md: "h-20 w-20 text-2xl",
                lg: "h-28 w-28 text-4xl",
              };
              return (
                <div className={`flex items-center justify-center rounded-full bg-gradient-to-b from-zinc-700 to-zinc-800 ${sizes[size]}`}>
                  <span className="font-bold text-zinc-300">
                    {getInitials(name)}
                  </span>
                </div>
              );
            };

            /* ── PRESENTATION MODE: screen share active ─────────────────── */
            if (contentTile) {
              return (
                <div className="absolute inset-0 flex">
                  {/* Screen share — main panel */}
                  <div className="flex min-w-0 flex-1 items-center justify-center bg-black">
                    {isScreenSharing ? (
                      <div className="flex flex-col items-center gap-5 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/20 to-primary/5 ring-1 ring-primary/30">
                          <Monitor className="h-9 w-9 text-primary" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">
                            You are presenting your screen
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            Others can see your screen.
                          </p>
                        </div>
                        <button
                          onClick={handleToggleScreenShare}
                          className="rounded-full bg-red-500/90 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-red-500 hover:shadow-red-500/25"
                        >
                          Stop Sharing
                        </button>
                      </div>
                    ) : (
                      <video
                        ref={videoRef(contentTile.tileId)}
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>

                  {/* Camera strip — right panel */}
                  <div className="flex w-48 flex-shrink-0 flex-col gap-2 overflow-y-auto bg-zinc-900/50 p-2">
                    {remoteTiles.map((tile) => (
                      <div
                        key={tile.tileId}
                        className="relative overflow-hidden rounded-xl bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <video
                          ref={videoRef(tile.tileId)}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        {nameLabel(remoteName)}
                      </div>
                    ))}
                    {localTile && (
                      <div
                        className="relative overflow-hidden rounded-xl bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <video
                          ref={videoRef(localTile.tileId, true)}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                          style={{ transform: "scaleX(-1)" }}
                        />
                        {nameLabel(myName, true)}
                      </div>
                    )}
                    {/* Remote camera off in strip */}
                    {remoteTiles.length === 0 && isRemotePresent && (
                      <div
                        className="flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        {avatarCircle(remoteName, "sm")}
                        <span className="text-[10px] text-zinc-400">{remoteName}</span>
                      </div>
                    )}
                    {remoteTiles.length === 0 && !isRemotePresent && (
                      <div
                        className="flex flex-col items-center justify-center gap-1 rounded-xl bg-zinc-800/40"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <span className="text-[10px] text-zinc-500">Waiting for {remoteName}…</span>
                      </div>
                    )}
                    {!localTile && (
                      <div
                        className="flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-800"
                        style={{ aspectRatio: "16/9" }}
                      >
                        {avatarCircle(myName, "sm")}
                        <span className="text-[10px] text-zinc-400">You</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            /* ── GALLERY MODE: no screen share ──────────────────────────── */

            // ── BOTH CAMERAS OFF — equal grid ──────────────────────────
            if (remoteTiles.length === 0 && !localTile) {
              return (
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-zinc-950 p-4 md:gap-4 md:p-6">
                  {/* Remote tile */}
                  <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-900/80">
                    {isRemotePresent ? (
                      <>
                        {avatarCircle(remoteName, "lg")}
                        <div className="text-center">
                          <p className="text-sm font-semibold text-zinc-200">{remoteName}</p>
                          <p className="mt-1 text-xs text-zinc-500">Camera off</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-700/50">
                          <User className="h-10 w-10 text-zinc-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-zinc-400">Waiting for {remoteName}</p>
                          <p className="mt-1 text-xs text-zinc-600">Not yet in session</p>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Self tile */}
                  <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-900/80">
                    {avatarCircle(myName, "lg")}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-200">{myName}</p>
                      <p className="mt-1 text-xs text-zinc-500">You &middot; Camera off</p>
                    </div>
                  </div>
                </div>
              );
            }

            // ── BOTH CAMERAS ON — 50/50 side-by-side with rounded tiles ─
            if (remoteTiles.length > 0 && localTile) {
              return (
                <div className="absolute inset-0 flex items-stretch gap-2 bg-zinc-950 p-2 md:gap-3 md:p-3">
                  {/* Remote participant */}
                  <div className="relative flex-1 overflow-hidden rounded-2xl bg-zinc-900">
                    {remoteTiles.map((tile) => (
                      <video
                        key={tile.tileId}
                        ref={videoRef(tile.tileId)}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ))}
                    {nameLabel(remoteName)}
                  </div>
                  {/* Self */}
                  <div className="relative flex-1 overflow-hidden rounded-2xl bg-zinc-900">
                    <video
                      ref={videoRef(localTile.tileId, true)}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    {nameLabel(myName, true)}
                  </div>
                </div>
              );
            }

            // ── ONE CAMERA ON — spotlight + floating PIP ─────────────────
            return (
              <>
                {/* ── Remote participant — main area ─────────────────────── */}
                {remoteTiles.length > 0 ? (
                  remoteTiles.map((tile) => (
                    <video
                      key={tile.tileId}
                      ref={videoRef(tile.tileId)}
                      autoPlay
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ))
                ) : isRemotePresent ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-900">
                    {avatarCircle(remoteName, "lg")}
                    <div className="text-center">
                      <p className="text-base font-semibold text-zinc-200">{remoteName}</p>
                      <p className="mt-1 text-xs text-zinc-500">Camera off</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-950">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-700/50">
                      <User className="h-10 w-10 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-zinc-400">Waiting for {remoteName}</p>
                      <p className="mt-1 text-xs text-zinc-600">Not yet in session</p>
                    </div>
                  </div>
                )}

                {/* Remote name label (only when video is on) */}
                {remoteTiles.length > 0 && nameLabel(remoteName)}

                {/* ── Self-view PIP — floating bottom-right ────────────────── */}
                <div
                  className="absolute bottom-4 right-4 z-10 w-44 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-105"
                  style={{ aspectRatio: "16/9" }}
                >
                  {localTile ? (
                    <video
                      ref={videoRef(localTile.tileId, true)}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-zinc-800">
                      {avatarCircle(myName, "sm")}
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5">
                    <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      <span className="text-[10px] font-medium text-white">You</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* ── Live captions overlay ───────────────────────────────────────
               Sits above the controls bar, full width. Partial results are
               shown in a lighter colour; final results are white.           */}
          {isCaptionsEnabled && captionText && (
            <div className="absolute bottom-4 left-1/2 z-30 w-[85%] max-w-2xl -translate-x-1/2">
              <div className="rounded-2xl bg-black/80 px-6 py-3.5 shadow-2xl backdrop-blur-md">
                {captionSpeaker && (
                  <p className="mb-1 text-xs font-semibold text-primary">{captionSpeaker}</p>
                )}
                <p
                  className={`text-sm leading-relaxed md:text-base ${
                    captionIsPartial ? "text-zinc-300 italic" : "text-white font-medium"
                  }`}
                >
                  {captionText}
                </p>
              </div>
            </div>
          )}

          {/* Captions active indicator (when no text yet) */}
          {isCaptionsEnabled && !captionText && (
            <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-5 py-2 text-xs text-zinc-300 shadow-lg backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Listening for speech…
              </div>
            </div>
          )}

          {/* Mobile quick-access buttons */}
          {isMobile && (
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2">
              <Tip label="Session info" side="left">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-zinc-700"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <FileText className="h-4 w-4 text-zinc-300" />
                </button>
              </Tip>
              <Tip label="Open chat" side="left">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-zinc-700"
                  onClick={() => setMobileChatOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 text-zinc-300" />
                </button>
              </Tip>
            </div>
          )}
        </div>

        {/* Bottom controls — floating pill style */}
        <div className="flex items-center justify-center gap-2 bg-zinc-900/80 px-4 py-3 md:gap-3 md:px-6 md:py-4">
          {/* Mic */}
          <Tip label={isMuted ? "Unmute microphone" : "Mute microphone"}>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all md:h-12 md:w-12 ${
                isMuted
                  ? "bg-red-500/90 text-white shadow-lg shadow-red-500/20 hover:bg-red-500"
                  : "bg-zinc-700/80 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-600"
              }`}
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </Tip>
          {/* Camera */}
          <Tip label={isVideoOff ? "Turn on camera" : "Turn off camera"}>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all md:h-12 md:w-12 ${
                isVideoOff
                  ? "bg-red-500/90 text-white shadow-lg shadow-red-500/20 hover:bg-red-500"
                  : "bg-zinc-700/80 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-600"
              }`}
              onClick={handleToggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          </Tip>
          {/* Screen share */}
          <Tip label={isScreenSharing ? "Stop sharing screen" : "Share your screen"}>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all md:h-12 md:w-12 ${
                isScreenSharing
                  ? "bg-primary/90 text-white shadow-lg shadow-primary/20 hover:bg-primary"
                  : "bg-zinc-700/80 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-600"
              }`}
              onClick={handleToggleScreenShare}
            >
              <Monitor className="h-5 w-5" />
            </button>
          </Tip>
          {/* Live captions (AWS Transcribe) — only diviner can toggle */}
          {role === "diviner" && (
            <Tip label={isCaptionsEnabled ? "Turn off live captions" : "Turn on live captions"}>
              <button
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all md:h-12 md:w-12 ${
                  isCaptionsEnabled
                    ? "bg-primary/90 text-white shadow-lg shadow-primary/20 hover:bg-primary"
                    : "bg-zinc-700/80 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-600"
                }`}
                onClick={handleToggleCaptions}
              >
                {isCaptionsEnabled ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
              </button>
            </Tip>
          )}

          {/* Open Service — diviner-only, hidden when service is unmapped */}
          {role === "diviner" && sessionLink && (
            <Tip label="Open the toolkit session for this booking">
              <a
                href={sessionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-2 rounded-full bg-amber-500/90 px-4 text-sm font-medium text-zinc-900 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-500 md:h-12 md:px-5"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Open Service</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </Tip>
          )}

          {/* Separator before end session */}
          {role === "diviner" && (
            <>
              <div className="mx-1 h-8 w-px bg-zinc-700 md:mx-2" />
              <Tip label="End this session">
                <button
                  className="flex h-11 items-center gap-2 rounded-full bg-red-500/90 px-5 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-500 md:h-12 md:px-6"
                  onClick={handleEndSession}
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden sm:inline">End Session</span>
                </button>
              </Tip>
            </>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      {showSidebar && !isMobile && (
        <div className="flex w-80 flex-col border-l border-zinc-800/60 bg-zinc-900/95">
          {/* Billing info (suppressed for admin-hosted sessions) */}
          {!disableBillingAndNotes && (
            <div className="border-b border-zinc-800/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Base</span>
                <span className="text-zinc-200">
                  ${basePrice.toFixed(2)} / {scheduledDuration} min
                </span>
              </div>
              {isOvertime && (
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-amber-400">Overtime</span>
                  <span className="text-amber-400">
                    +${(overtimeMinutes * overageRate).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Running Total
                </span>
                <span className="text-lg font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Client info (diviner only) */}
          {role === "diviner" && (
            <div className="border-b border-zinc-800/60 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <Sparkles className="h-3 w-3 text-primary" />
                Client Info
              </p>
              <p className="text-sm font-semibold text-zinc-200">{clientName}</p>
              {clientBirthData?.date && (
                <p className="mt-1.5 text-xs text-zinc-400">
                  Born: {clientBirthData.date}
                  {clientBirthData.time && ` at ${clientBirthData.time}`}
                  {clientBirthData.city && ` in ${clientBirthData.city}`}
                </p>
              )}
              {questionnaire?.focusQuestion && (
                <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs ring-1 ring-primary/10">
                  <p className="font-semibold text-primary">
                    Focus Question
                  </p>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    {questionnaire.focusQuestion}
                  </p>
                </div>
              )}
              {questionnaire?.lifeArea && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {questionnaire.lifeArea}
                </span>
              )}
            </div>
          )}

          {/* Diviner info (client only) */}
          {role === "client" && (
            <div className="border-b border-zinc-800/60 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <Sparkles className="h-3 w-3 text-primary" />
                Your Diviner
              </p>
              <p className="text-sm font-semibold text-zinc-200">{divinerName}</p>
              <p className="mt-1 text-xs text-zinc-400">{serviceName}</p>
            </div>
          )}

          {/* Session notes — available for both roles */}
          <div className="border-b border-zinc-800/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <FileText className="h-3 w-3 text-primary" />
                {role === "diviner" ? "Session Notes" : "My Notes"}
              </p>
              {/* Save status / button */}
              <div className="flex items-center gap-1.5">
                {notesSaved && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
                {notesSaving && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </span>
                )}
                <Tip label="Save notes now" side="left">
                  <button
                    className="flex h-7 items-center gap-1 rounded-md bg-zinc-800 px-2.5 text-[11px] font-medium text-zinc-300 ring-1 ring-zinc-700/50 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                    onClick={handleSaveNotes}
                    disabled={notesSaving || !sessionNotes.trim()}
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                </Tip>
              </div>
            </div>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={role === "diviner" ? "Private notes about this session..." : "Take notes during your session..."}
              className="h-24 resize-none border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-primary/40 focus:ring-primary/20"
            />
            <p className="mt-1.5 text-[10px] text-zinc-600">Auto-saves after you stop typing</p>
          </div>

          {/* Chat */}
          {chatPanel}
        </div>
      )}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="right" className="w-[85vw] p-0 sm:max-w-sm bg-zinc-900">
            <SheetHeader className="border-b border-zinc-800/60 px-4 py-3">
              <SheetTitle className="text-zinc-200">Session Info</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col overflow-y-auto">
              {!disableBillingAndNotes && (
                <div className="border-b border-zinc-800/60 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Base</span>
                    <span className="text-zinc-200">
                      ${basePrice.toFixed(2)} / {scheduledDuration} min
                    </span>
                  </div>
                  {isOvertime && (
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-amber-400">Overtime</span>
                      <span className="text-amber-400">
                        +${(overtimeMinutes * overageRate).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Running Total
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {role === "diviner" && (
                <div className="border-b border-zinc-800/60 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Client Info
                  </p>
                  <p className="text-sm font-semibold text-zinc-200">{clientName}</p>
                  {clientBirthData?.date && (
                    <p className="mt-1.5 text-xs text-zinc-400">
                      Born: {clientBirthData.date}
                      {clientBirthData.time &&
                        ` at ${clientBirthData.time}`}
                      {clientBirthData.city &&
                        ` in ${clientBirthData.city}`}
                    </p>
                  )}
                  {questionnaire?.focusQuestion && (
                    <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs ring-1 ring-primary/10">
                      <p className="font-semibold text-primary">
                        Focus Question
                      </p>
                      <p className="mt-1 leading-relaxed text-zinc-300">
                        {questionnaire.focusQuestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {role === "client" && (
                <div className="border-b border-zinc-800/60 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Your Diviner
                  </p>
                  <p className="text-sm font-semibold text-zinc-200">{divinerName}</p>
                  <p className="mt-1 text-xs text-zinc-400">{serviceName}</p>
                </div>
              )}

              {/* Notes — both roles */}
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <FileText className="h-3 w-3 text-primary" />
                    {role === "diviner" ? "Session Notes" : "My Notes"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {notesSaved && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Saved
                      </span>
                    )}
                    {notesSaving && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                      </span>
                    )}
                    <button
                      className="flex h-7 items-center gap-1 rounded-md bg-zinc-800 px-2.5 text-[11px] font-medium text-zinc-300 ring-1 ring-zinc-700/50 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                      onClick={handleSaveNotes}
                      disabled={notesSaving || !sessionNotes.trim()}
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                </div>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder={role === "diviner" ? "Private notes about this session..." : "Take notes during your session..."}
                  className="h-32 resize-none border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-primary/40 focus:ring-primary/20"
                />
                <p className="mt-1.5 text-[10px] text-zinc-600">Auto-saves after you stop typing</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile chat bottom sheet */}
      {isMobile && (
        <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
          <SheetContent
            side="bottom"
            className="h-[60vh] rounded-t-xl p-0 bg-zinc-900"
          >
            <SheetHeader className="border-b border-zinc-800/60 px-4 py-3">
              <SheetTitle className="text-zinc-200">Chat</SheetTitle>
            </SheetHeader>
            {chatPanel}
          </SheetContent>
        </Sheet>
      )}
    </div>
    </TooltipProvider>
  );
}
