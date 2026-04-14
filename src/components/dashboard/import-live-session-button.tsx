"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ImportableLiveSession {
  id: string;
  title: string | null;
  platform: string;
  platform_url: string | null;
  ended_at: string | null;
  started_at: string | null;
  created_at: string;
  already_imported: boolean;
  media_item_id: string | null;
}

export function ImportLiveSessionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ImportableLiveSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [importing, setImporting] = useState(false);

  async function loadSessions() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/media/live-import");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? "Failed to load past lives.");
      }
      setSessions(data.sessions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load past lives.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadSessions();
    } else {
      setSelectedId("");
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
    }
  }

  function handleSelect(session: ImportableLiveSession) {
    setSelectedId(session.id);
    setTitle(session.title ?? `Past live on ${session.platform}`);
    setDescription("");
    setThumbnailUrl("");
  }

  async function handleImport() {
    if (!selectedId) {
      toast.error("Choose a past live session first.");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/dashboard/media/live-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          live_session_id: selectedId,
          title,
          description,
          thumbnail_url: thumbnailUrl,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? "Failed to import live session.");
      }

      toast.success("Past live added to your video library.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import live session.");
    } finally {
      setImporting(false);
    }
  }

  const selectedSession = sessions.find((session) => session.id === selectedId) ?? null;
  const availableSessions = sessions.filter((session) => !session.already_imported);

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        <Archive className="mr-2 size-4" />
        Add From Past Live
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Past Live</DialogTitle>
            <DialogDescription>
              Choose a completed live session and turn it into a video-library item without retyping the basics.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : availableSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center">
              <p className="text-sm font-medium">No eligible past lives found.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ended live sessions with a platform URL will appear here once available.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                {availableSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSelect(session)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedId === session.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {session.title ?? `Past live on ${session.platform}`}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Platform: {session.platform}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ended:{" "}
                      {session.ended_at
                        ? new Date(session.ended_at).toLocaleString()
                        : new Date(session.created_at).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="import-live-title">Title</Label>
                  <Input
                    id="import-live-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Library title"
                    disabled={!selectedSession}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-live-description">Description</Label>
                  <Textarea
                    id="import-live-description"
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional context for this replay"
                    disabled={!selectedSession}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-live-thumbnail">Thumbnail URL</Label>
                  <Input
                    id="import-live-thumbnail"
                    value={thumbnailUrl}
                    onChange={(event) => setThumbnailUrl(event.target.value)}
                    placeholder="Optional thumbnail URL"
                    disabled={!selectedSession}
                  />
                </div>

                {selectedSession?.platform_url && (
                  <p className="text-xs text-muted-foreground break-all">
                    Source URL: {selectedSession.platform_url}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedSession || importing || loading}
            >
              {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Import Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
