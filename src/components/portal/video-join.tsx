"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, ExternalLink, Loader2 } from "lucide-react";

interface VideoJoinProps {
  sessionId: string;
  sessionName: string;
  divinerName: string;
  /** The client_token passed via URL param — used to authenticate with the join API */
  clientSessionToken: string;
  /** Initial status from the server — used to show "waiting" state */
  sessionStatus: string;
}

export function VideoJoin({
  sessionId,
  sessionName,
  divinerName,
  clientSessionToken,
  sessionStatus: initialStatus,
}: VideoJoinProps) {
  const [status, setStatus] = useState(initialStatus);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videosdkToken, setVideosdkToken] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  async function handleJoin() {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/video-sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: clientSessionToken }),
      });

      const data = (await res.json()) as {
        videosdk_token?: string;
        room_id?: string;
        session_status?: string;
        detail?: string;
      };

      if (!res.ok) {
        setError(data.detail ?? "Failed to join session. Please try again.");
        return;
      }

      setVideosdkToken(data.videosdk_token ?? null);
      setRoomId(data.room_id ?? null);
      setStatus(data.session_status ?? status);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setJoining(false);
    }
  }

  const joinUrl =
    roomId && videosdkToken
      ? `https://app.videosdk.live/join?roomId=${roomId}&token=${encodeURIComponent(videosdkToken)}&name=Guest&role=guest`
      : null;

  if (!clientSessionToken) {
    return (
      <Card className="border-red-500/30 bg-red-500/10">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-red-300">
            Invalid session link. Please request a new link from your diviner.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Session info card */}
        <Card className="border-[#c9a84c]/20 bg-[#0a0e1a]">
          <CardHeader className="pb-3 text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#c9a84c]/10">
              <Video className="size-7 text-[#c9a84c]" />
            </div>
            <CardTitle className="text-xl text-[#f5f0e8]">
              Your Reading Room is Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="font-medium text-[#f5f0e8]">
                {sessionName || "Video Reading"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diviner</p>
              <p className="font-medium text-[#f5f0e8]">{divinerName}</p>
            </div>

            {status === "created" || status === "waiting" ? (
              <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                <p className="text-sm text-blue-300">
                  Waiting for your diviner to start the session...
                </p>
              </div>
            ) : null}

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!joinUrl ? (
              <Button
                className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-[#06080f] gap-2"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Video className="size-4" />
                    Join Reading
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-[#06080f] gap-2"
                  onClick={() => window.open(joinUrl, "_blank")}
                >
                  <ExternalLink className="size-4" />
                  Open Video Room
                </Button>

                {/* Embedded iframe */}
                <div
                  className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
                  style={{ paddingTop: "56.25%" }}
                >
                  <iframe
                    src={joinUrl}
                    allow="camera; microphone; display-capture; fullscreen"
                    className="absolute inset-0 h-full w-full"
                    title="Video Reading"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Please allow camera and microphone access when prompted.
        </p>
      </div>
    </div>
  );
}
