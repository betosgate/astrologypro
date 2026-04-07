"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  ExternalLink,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  Users,
} from "lucide-react";

interface VideoRoomProps {
  sessionId: string;
  roomId: string;
  token: string;
  role: "host" | "guest";
  sessionName: string;
  sessionStatus: string;
  clientToken?: string;
  participantCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  created: "Ready",
  waiting: "Waiting",
  live: "Live",
  ended: "Ended",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    created: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    waiting: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    live: "bg-green-500/20 text-green-300 border-green-500/30 animate-pulse",
    ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function VideoRoom({
  sessionId,
  roomId,
  token,
  sessionName,
  sessionStatus: initialStatus,
  clientToken,
  participantCount: initialParticipantCount = 0,
}: VideoRoomProps) {
  const [status, setStatus] = useState(initialStatus);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const joinUrl = `https://app.videosdk.live/join?roomId=${roomId}&token=${encodeURIComponent(token)}&name=Host&role=host`;

  const clientJoinPageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/video/${sessionId}${clientToken ? `?t=${encodeURIComponent(clientToken)}` : ""}`
      : `/portal/video/${sessionId}`;

  const handleCopy = useCallback(
    async (text: string, key: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    },
    []
  );

  const patchSession = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/dashboard/video-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(d.detail ?? "Request failed");
      }
      return res.json() as Promise<{ session?: { status: string } }>;
    },
    [sessionId]
  );

  const fetchParticipantCount = useCallback(async () => {
    const res = await fetch(`/api/dashboard/video-sessions/${sessionId}`);
    if (res.ok) {
      const d = await res.json() as { participantCount?: number };
      setParticipantCount(d.participantCount ?? 0);
    }
  }, [sessionId]);

  async function handleStartSession() {
    setLoading("start");
    setError(null);
    try {
      await patchSession({ status: "live" });
      setStatus("live");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(null);
    }
  }

  async function handleEndSession() {
    if (!confirm("End this session? This cannot be undone.")) return;
    setLoading("end");
    setError(null);
    try {
      await patchSession({ status: "ended" });
      setStatus("ended");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setLoading(null);
    }
  }

  async function handleRefreshCount() {
    setLoading("count");
    await fetchParticipantCount();
    setLoading(null);
  }

  const canStart = status === "created" || status === "waiting";
  const canEnd = status === "live";
  const isEnded = status === "ended" || status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Video className="size-5 text-[#c9a84c]" />
            <h1 className="text-xl font-semibold text-[#f5f0e8]">
              {sessionName || "Video Reading"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge status={status} />
            <span>Room: {roomId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "live" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshCount}
              disabled={loading === "count"}
              className="gap-1.5"
            >
              <Users className="size-4" />
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
              <RefreshCw className={`size-3 ${loading === "count" ? "animate-spin" : ""}`} />
            </Button>
          )}

          {canStart && (
            <Button
              size="sm"
              onClick={handleStartSession}
              disabled={!!loading}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <Play className="size-4" />
              {loading === "start" ? "Starting…" : "Start Session"}
            </Button>
          )}

          {canEnd && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndSession}
              disabled={!!loading}
              className="gap-1.5"
            >
              <Square className="size-4" />
              {loading === "end" ? "Ending…" : "End Session"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Join room card */}
      {!isEnded && (
        <Card className="border-[#c9a84c]/20 bg-[#0a0e1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#f5f0e8]">
              Your Video Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Open your video room in a new tab or embed it below. Make sure
              your microphone and camera permissions are granted.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => window.open(joinUrl, "_blank")}
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#06080f] gap-1.5"
              >
                <ExternalLink className="size-4" />
                Open Video Room
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(joinUrl, "joinUrl")}
                className="gap-1.5"
              >
                {copied === "joinUrl" ? (
                  <Check className="size-4 text-green-400" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied === "joinUrl" ? "Copied!" : "Copy Room Link"}
              </Button>
            </div>

            {/* Embedded iframe */}
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`https://app.videosdk.live/join?roomId=${roomId}&token=${encodeURIComponent(token)}&name=Host&role=host`}
                allow="camera; microphone; display-capture; fullscreen"
                className="absolute inset-0 h-full w-full"
                title="Video Reading Room"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client link card */}
      {clientToken && !isEnded && (
        <Card className="border-border bg-[#0a0e1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#f5f0e8]">
              Client Access Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this link with your client to let them join the reading.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                {clientJoinPageUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(clientJoinPageUrl, "clientLink")}
                className="shrink-0 gap-1.5"
              >
                {copied === "clientLink" ? (
                  <Check className="size-4 text-green-400" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied === "clientLink" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEnded && (
        <Card className="border-border bg-[#0a0e1a]">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Video className="mx-auto mb-3 size-8 opacity-40" />
            <p className="text-sm">This session has ended.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
