"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Video,
  Loader2,
  ChevronRight,
} from "lucide-react";

type VideoSessionClient = {
  id: string;
  full_name: string | null;
  email: string | null;
} | null;

type VideoSession = {
  id: string;
  booking_id: string | null;
  room_id: string;
  room_name: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  phone_dial_in_enabled: boolean;
  created_at: string;
  clients: VideoSessionClient;
};

interface VideoSessionsListProps {
  initialSessions: VideoSession[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  created: "Ready",
  waiting: "Waiting",
  live: "Live",
  ended: "Ended",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    created: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    waiting: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    live: "bg-green-500/20 text-green-300 border-green-500/30 animate-pulse",
    ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls[status] ?? cls.created}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VideoSessionsList({
  initialSessions,
  initialNextCursor,
  initialHasMore,
}: VideoSessionsListProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<VideoSession[]>(initialSessions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // New session form state
  const [newForm, setNewForm] = useState({
    client_id: "",
    room_name: "",
    phone_dial_in_enabled: false,
  });

  const handleCopy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(
      `/api/dashboard/video-sessions?cursor=${encodeURIComponent(nextCursor)}&limit=20`
    );
    if (res.ok) {
      const data = (await res.json()) as {
        sessions: VideoSession[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      setSessions((prev) => [...prev, ...data.sessions]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
    setLoadingMore(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    const payload: Record<string, unknown> = {
      phone_dial_in_enabled: newForm.phone_dial_in_enabled,
    };
    if (newForm.client_id.trim()) payload.client_id = newForm.client_id.trim();
    if (newForm.room_name.trim()) payload.room_name = newForm.room_name.trim();

    const res = await fetch("/api/dashboard/video-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      id?: string;
      detail?: string;
    };

    if (!res.ok) {
      setCreateError(data.detail ?? "Failed to create session.");
      setCreating(false);
      return;
    }

    setShowNewModal(false);
    setNewForm({ client_id: "", room_name: "", phone_dial_in_enabled: false });
    setCreating(false);

    // Navigate to the new session
    if (data.id) {
      startTransition(() => router.push(`/dashboard/video/${data.id}`));
    } else {
      router.refresh();
    }
  }

  const clientLink = (session: VideoSession) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/portal/video/${session.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="size-5 text-[#c9a84c]" />
          <h1 className="text-xl font-semibold text-[#f5f0e8]">
            Video Sessions
          </h1>
        </div>
        <Button
          size="sm"
          className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#06080f] gap-1.5"
          onClick={() => setShowNewModal(true)}
        >
          <Plus className="size-4" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-border bg-[#0a0e1a]">
          <CardContent className="py-16 text-center">
            <Video className="mx-auto mb-3 size-10 opacity-30" />
            <p className="text-sm text-muted-foreground">
              No video sessions yet. Create your first session to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-[#0a0e1a]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Room Name</TableHead>
                  <TableHead className="hidden md:table-cell text-muted-foreground">Client</TableHead>
                  <TableHead className="hidden lg:table-cell text-muted-foreground">Created</TableHead>
                  <TableHead className="hidden lg:table-cell text-muted-foreground">Duration</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer border-border hover:bg-muted/30"
                    onClick={() => router.push(`/dashboard/video/${session.id}`)}
                  >
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell className="font-medium text-[#f5f0e8]">
                      {session.room_name ?? (
                        <span className="text-muted-foreground text-sm">
                          {session.room_id.slice(0, 12)}…
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {session.clients?.full_name ?? (
                        <span className="italic opacity-60">No client</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatDate(session.created_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatDuration(session.duration_seconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Copy client link"
                          onClick={() =>
                            handleCopy(clientLink(session), session.id)
                          }
                        >
                          {copied === session.id ? (
                            <Check className="size-3.5 text-green-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Open session"
                          onClick={() =>
                            router.push(`/dashboard/video/${session.id}`)
                          }
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Load more
          </Button>
        </div>
      )}

      {/* New session modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Video Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room_name">Session Name</Label>
              <Input
                id="room_name"
                placeholder="e.g. Birth Chart Reading — Jane"
                value={newForm.room_name}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, room_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client_id">Client ID (optional)</Label>
              <Input
                id="client_id"
                placeholder="Client UUID or leave blank"
                value={newForm.client_id}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, client_id: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                If provided, a join link will be generated for this client.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="phone_dial_in"
                type="checkbox"
                className="size-4 rounded border-border"
                checked={newForm.phone_dial_in_enabled}
                onChange={(e) =>
                  setNewForm((f) => ({
                    ...f,
                    phone_dial_in_enabled: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="phone_dial_in" className="cursor-pointer">
                Enable phone dial-in
              </Label>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#06080f]"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 size-4" />
                    Create Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
