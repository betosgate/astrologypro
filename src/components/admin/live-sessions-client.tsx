"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Radio, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "scheduled" | "live" | "ended" | "cancelled";

interface DivinerRef {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface LiveSession {
  id: string;
  platform: string;
  platform_url: string | null;
  title: string | null;
  status: SessionStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  check_in_enabled: boolean;
  check_in_form_title: string | null;
  check_in_form_subtitle: string | null;
  created_at: string;
  updated_at: string;
  check_in_count: number;
  diviners: DivinerRef | DivinerRef[] | null;
}

interface DivinerOption {
  id: string;
  display_name: string;
  username: string;
}

interface ApiListResponse {
  data: LiveSession[];
  nextCursor: string | null;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORMS = ["facebook", "youtube", "instagram", "tiktok", "zoom", "other"] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDiviner(s: LiveSession): DivinerRef | null {
  if (!s.diviners) return null;
  return Array.isArray(s.diviners) ? s.diviners[0] ?? null : s.diviners;
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; className: string }> = {
    live: {
      label: "Live",
      className: "bg-green-500/20 text-green-400 border border-green-500/30",
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
    ended: {
      label: "Ended",
      className: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
  };
  const cfg = map[status] ?? map.ended;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── New session modal ────────────────────────────────────────────────────────

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  diviners: DivinerOption[];
}

function NewSessionModal({ open, onClose, onCreated, diviners }: NewSessionModalProps) {
  const [divinerId, setDivinerId] = useState("");
  const [platform, setPlatform] = useState<string>("youtube");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDivinerId("");
    setPlatform("youtube");
    setTitle("");
    setScheduledAt("");
    setPlatformUrl("");
    setCheckInEnabled(true);
    setSaving(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!divinerId) {
      setError("Please select a diviner.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diviner_id: divinerId,
          platform,
          title: title.trim() || null,
          scheduled_at: scheduledAt || null,
          platform_url: platformUrl.trim() || null,
          check_in_enabled: checkInEnabled,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { detail?: string };
        setError(json.detail ?? "Failed to create session.");
        return;
      }

      reset();
      onCreated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Live Session</DialogTitle>
          <DialogDescription>
            Create a live session to enable the public check-in form.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <p className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ns-diviner">Diviner *</Label>
            <Select value={divinerId} onValueChange={setDivinerId}>
              <SelectTrigger id="ns-diviner" className="text-sm">
                <SelectValue placeholder="Select diviner…" />
              </SelectTrigger>
              <SelectContent>
                {diviners.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ns-platform">Platform *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="ns-platform" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ns-title">Title</Label>
            <Input
              id="ns-title"
              placeholder="e.g. Full Moon Reading"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ns-scheduled-at">Scheduled At</Label>
            <Input
              id="ns-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ns-platform-url">Platform URL</Label>
            <Input
              id="ns-platform-url"
              type="url"
              placeholder="https://…"
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ns-check-in-enabled"
              type="checkbox"
              checked={checkInEnabled}
              onChange={(e) => setCheckInEnabled(e.target.checked)}
              className="size-4 accent-amber-500"
            />
            <Label htmlFor="ns-check-in-enabled" className="text-sm font-normal cursor-pointer">
              Enable check-in form
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveSessionsClient() {
  const [rows, setRows] = useState<LiveSession[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [divinerId, setDivinerId] = useState("all");
  const [diviners, setDiviners] = useState<DivinerOption[]>([]);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch diviners for filter + modal
  useEffect(() => {
    fetch("/api/admin/diviners?limit=200")
      .then((r) => r.json())
      .then((json: { data?: DivinerOption[] }) => setDiviners(json.data ?? []))
      .catch(() => {/* non-critical */});
  }, []);

  const fetchData = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (divinerId && divinerId !== "all") params.set("diviner_id", divinerId);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/admin/live-sessions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as ApiListResponse;
    },
    [statusFilter, divinerId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchData()
      .then((json) => {
        if (cancelled) return;
        setRows(json.data);
        setTotal(json.total);
        setNextCursor(json.nextCursor);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load sessions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchData]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const json = await fetchData(nextCursor);
      setRows((prev) => [...prev, ...json.data]);
      setNextCursor(json.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  async function patchStatus(id: string, status: SessionStatus) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/live-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as LiveSession;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  function handleCreated() {
    // Re-fetch from start
    setLoading(true);
    setError(null);
    fetchData()
      .then((json) => {
        setRows(json.data);
        setTotal(json.total);
        setNextCursor(json.nextCursor);
      })
      .catch(() => setError("Failed to refresh."))
      .finally(() => setLoading(false));
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={divinerId} onValueChange={setDivinerId}>
          <SelectTrigger className="h-9 w-[200px] text-sm" aria-label="Filter by diviner">
            <SelectValue placeholder="All Diviners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diviners</SelectItem>
            {diviners.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(184,188,208,0.5)" }}>
            {total.toLocaleString()} total
          </span>
          <Button size="sm" onClick={() => setNewSessionOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            New Session
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <TableHead className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(184,188,208,0.6)" }}>Diviner</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Platform</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Title</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(184,188,208,0.6)" }}>Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Scheduled</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right" style={{ color: "rgba(184,188,208,0.6)" }}>Check-ins</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right" style={{ color: "rgba(184,188,208,0.6)" }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" style={{ color: "rgba(184,188,208,0.4)" }} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={handleCreated}>
                      <RefreshCw className="mr-1.5 size-3.5" />
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm" style={{ color: "rgba(184,188,208,0.5)" }}>
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((session) => {
                const diviner = getDiviner(session);
                const isActioning = actionLoading === session.id;
                return (
                  <TableRow key={session.id} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <TableCell className="font-medium text-sm" style={{ color: "#f5f0e8" }}>
                      {diviner?.display_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell capitalize" style={{ color: "rgba(184,188,208,0.7)" }}>
                      {session.platform}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell" style={{ color: "rgba(184,188,208,0.7)" }}>
                      {session.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell className="text-xs hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.5)" }}>
                      {formatDate(session.scheduled_at)}
                    </TableCell>
                    <TableCell className="text-sm text-right" style={{ color: "rgba(184,188,208,0.7)" }}>
                      {session.check_in_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                            onClick={() => patchStatus(session.id, "live")}
                            disabled={isActioning}
                            aria-label="Go live"
                          >
                            {isActioning ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Radio className="size-3 mr-1" />
                            )}
                            Go Live
                          </Button>
                        )}
                        {session.status === "live" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                            onClick={() => patchStatus(session.id, "ended")}
                            disabled={isActioning}
                            aria-label="End session"
                          >
                            {isActioning ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <XCircle className="size-3 mr-1" />
                            )}
                            End
                          </Button>
                        )}
                        {(session.status === "scheduled" || session.status === "live") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => patchStatus(session.id, "cancelled")}
                            disabled={isActioning}
                            aria-label="Cancel session"
                          >
                            Cancel
                          </Button>
                        )}
                        {(session.status === "ended" || session.status === "cancelled") && (
                          <span className="text-xs" style={{ color: "rgba(184,188,208,0.3)" }}>
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load more */}
      {nextCursor && !loading && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}

      {/* New session modal */}
      <NewSessionModal
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        onCreated={handleCreated}
        diviners={diviners}
      />
    </div>
  );
}
