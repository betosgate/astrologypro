"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Plus,
  Trophy,
  Download,
  Users,
  Shuffle,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

type Diviner = { id: string; display_name: string; email?: string };

type Giveaway = {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  status: GiveawayStatus;
  entry_fields: string[];
  max_entries: number | null;
  starts_at: string | null;
  ends_at: string | null;
  winner_count: number;
  winner_selection: "random" | "manual";
  is_public: boolean;
  created_at: string;
  updated_at: string;
  diviner: Diviner | null;
  entry_count: number;
  winner_count_selected: number;
};

type Entry = {
  id: string;
  name: string;
  email: string;
  entered_at: string;
  is_winner: boolean;
  extra_fields: Record<string, string> | null;
};

type WinnerResult = {
  id: string;
  entry_id: string;
  name: string;
  email: string;
};

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TABS: { value: GiveawayStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<GiveawayStatus, string> = {
  draft: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  ended: "bg-gray-500/15 text-gray-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function StatusBadge({ status }: { status: GiveawayStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── New Giveaway Form ─────────────────────────────────────────────────────────

type NewGiveawayForm = {
  diviner_id: string;
  title: string;
  description: string;
  prize_description: string;
  entry_fields: string;
  max_entries: string;
  starts_at: string;
  ends_at: string;
  winner_count: string;
  winner_selection: "random" | "manual";
  is_public: boolean;
};

const EMPTY_FORM: NewGiveawayForm = {
  diviner_id: "",
  title: "",
  description: "",
  prize_description: "",
  entry_fields: "name, email",
  max_entries: "",
  starts_at: "",
  ends_at: "",
  winner_count: "1",
  winner_selection: "random",
  is_public: true,
};

function inputCls(extra = "") {
  return `w-full rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/40 transition-colors ${extra}`;
}

function labelCls() {
  return "block mb-1 text-xs font-medium text-[#f5f0e8]/70";
}

interface NewGiveawayDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  diviners: Diviner[];
}

function NewGiveawayDialog({
  open,
  onClose,
  onCreated,
  diviners,
}: NewGiveawayDialogProps) {
  const [form, setForm] = useState<NewGiveawayForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function set(key: keyof NewGiveawayForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.prize_description.trim()) {
      toast.error("Prize description is required.");
      return;
    }
    if (!form.diviner_id) {
      toast.error("Diviner is required.");
      return;
    }

    const entryFieldsArray = form.entry_fields
      .split(",")
      .map((f) => f.trim().toLowerCase())
      .filter(Boolean);

    if (!entryFieldsArray.includes("name")) entryFieldsArray.unshift("name");
    if (!entryFieldsArray.includes("email")) {
      const nameIdx = entryFieldsArray.indexOf("name");
      entryFieldsArray.splice(nameIdx + 1, 0, "email");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diviner_id: form.diviner_id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          prize_description: form.prize_description.trim(),
          entry_fields: entryFieldsArray,
          max_entries: form.max_entries ? Number(form.max_entries) : null,
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
          winner_count: Number(form.winner_count) || 1,
          winner_selection: form.winner_selection,
          is_public: form.is_public,
        }),
      });

      if (res.ok) {
        toast.success("Giveaway created.");
        setForm(EMPTY_FORM);
        onCreated();
        onClose();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.detail ?? "Failed to create giveaway.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#0d1117] border border-white/[0.08] text-[#f5f0e8]">
        <DialogHeader>
          <DialogTitle className="text-[#f5f0e8]">New Giveaway</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Diviner */}
          <div>
            <label className={labelCls()}>Diviner *</label>
            <select
              value={form.diviner_id}
              onChange={(e) => set("diviner_id", e.target.value)}
              className={inputCls()}
            >
              <option value="">Select a diviner…</option>
              {diviners.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls()}>Title *</label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Giveaway title"
              className="bg-white/[0.04] border-white/[0.1] text-[#f5f0e8] placeholder-[#f5f0e8]/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls()}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
              rows={3}
              className={inputCls("resize-none")}
            />
          </div>

          {/* Prize */}
          <div>
            <label className={labelCls()}>Prize Description *</label>
            <Input
              value={form.prize_description}
              onChange={(e) => set("prize_description", e.target.value)}
              placeholder="What the winner receives"
              className="bg-white/[0.04] border-white/[0.1] text-[#f5f0e8] placeholder-[#f5f0e8]/30"
            />
          </div>

          {/* Entry fields */}
          <div>
            <label className={labelCls()}>
              Entry Fields{" "}
              <span className="text-[#f5f0e8]/40 font-normal">(comma-separated)</span>
            </label>
            <Input
              value={form.entry_fields}
              onChange={(e) => set("entry_fields", e.target.value)}
              placeholder="name, email, phone"
              className="bg-white/[0.04] border-white/[0.1] text-[#f5f0e8] placeholder-[#f5f0e8]/30"
            />
            <p className="mt-1 text-xs text-[#f5f0e8]/40">
              name and email are always included.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls()}>Starts At</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls()}>Ends At</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
                className={inputCls()}
              />
            </div>
          </div>

          {/* Max entries + winner count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls()}>Max Entries</label>
              <Input
                type="number"
                min="1"
                value={form.max_entries}
                onChange={(e) => set("max_entries", e.target.value)}
                placeholder="Unlimited"
                className="bg-white/[0.04] border-white/[0.1] text-[#f5f0e8] placeholder-[#f5f0e8]/30"
              />
            </div>
            <div>
              <label className={labelCls()}>Winner Count</label>
              <Input
                type="number"
                min="1"
                value={form.winner_count}
                onChange={(e) => set("winner_count", e.target.value)}
                placeholder="1"
                className="bg-white/[0.04] border-white/[0.1] text-[#f5f0e8] placeholder-[#f5f0e8]/30"
              />
            </div>
          </div>

          {/* Winner selection */}
          <div>
            <label className={labelCls()}>Winner Selection</label>
            <select
              value={form.winner_selection}
              onChange={(e) =>
                set("winner_selection", e.target.value as "random" | "manual")
              }
              className={inputCls()}
            >
              <option value="random">Random (auto-pick)</option>
              <option value="manual">Manual (choose from entries)</option>
            </select>
          </div>

          {/* Is public */}
          <div className="flex items-center gap-2.5">
            <input
              id="is_public"
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => set("is_public", e.target.checked)}
              className="size-4 accent-[#c9a84c]"
            />
            <label htmlFor="is_public" className="text-sm text-[#f5f0e8]/80">
              Publicly visible entry page
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-[#c9a84c] text-[#06080f] hover:bg-[#c9a84c]/90"
          >
            {saving ? "Creating…" : "Create Giveaway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Select Winners Modal ──────────────────────────────────────────────────────

interface SelectWinnersModalProps {
  giveaway: Giveaway;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function SelectWinnersModal({
  giveaway,
  open,
  onClose,
  onDone,
}: SelectWinnersModalProps) {
  const [mode, setMode] = useState<"random" | "manual">(
    giveaway.winner_selection
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [winners, setWinners] = useState<WinnerResult[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingEntries(true);
    fetch(`/api/admin/giveaways/${giveaway.id}/entries?limit=100`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => toast.error("Failed to load entries."))
      .finally(() => setLoadingEntries(false));
  }, [open, giveaway.id]);

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSelect() {
    setSelecting(true);
    try {
      const res = await fetch(
        `/api/admin/giveaways/${giveaway.id}/select-winners`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            entry_ids: mode === "manual" ? Array.from(selectedIds) : undefined,
          }),
        }
      );

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setWinners(body.winners ?? []);
        toast.success("Winners selected!");
        onDone();
      } else {
        toast.error(body?.detail ?? "Failed to select winners.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSelecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#0d1117] border border-white/[0.08] text-[#f5f0e8]">
        <DialogHeader>
          <DialogTitle className="text-[#f5f0e8]">
            Select Winners — {giveaway.title}
          </DialogTitle>
        </DialogHeader>

        {winners ? (
          <div className="space-y-3">
            <p className="text-sm text-green-400 font-medium">
              {winners.length} winner{winners.length !== 1 ? "s" : ""} selected!
            </p>
            <ul className="space-y-2">
              {winners.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center gap-3 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-2.5"
                >
                  <Trophy className="size-4 text-[#c9a84c] shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-[#f5f0e8]/50">{w.email}</p>
                  </div>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("random")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  mode === "random"
                    ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#c9a84c]"
                    : "border-white/[0.1] text-[#f5f0e8]/60 hover:border-white/20"
                }`}
              >
                <Shuffle className="mx-auto mb-1 size-4" />
                Random
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  mode === "manual"
                    ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#c9a84c]"
                    : "border-white/[0.1] text-[#f5f0e8]/60 hover:border-white/20"
                }`}
              >
                <CheckSquare className="mx-auto mb-1 size-4" />
                Manual
              </button>
            </div>

            {mode === "random" && (
              <p className="text-sm text-[#f5f0e8]/60">
                Will randomly pick{" "}
                <strong className="text-[#f5f0e8]">{giveaway.winner_count}</strong>{" "}
                winner{giveaway.winner_count !== 1 ? "s" : ""} from{" "}
                {giveaway.entry_count} entries.
              </p>
            )}

            {mode === "manual" && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loadingEntries ? (
                  <p className="py-4 text-center text-sm text-[#f5f0e8]/40">
                    Loading entries…
                  </p>
                ) : entries.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[#f5f0e8]/40">
                    No entries yet.
                  </p>
                ) : (
                  entries.map((entry) => (
                    <label
                      key={entry.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        selectedIds.has(entry.id)
                          ? "border-[#c9a84c]/40 bg-[#c9a84c]/8"
                          : "border-white/[0.07] hover:border-white/20"
                      } ${entry.is_winner ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        onChange={() => !entry.is_winner && toggleEntry(entry.id)}
                        disabled={entry.is_winner}
                        className="size-4 accent-[#c9a84c]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.name}
                        </p>
                        <p className="text-xs text-[#f5f0e8]/50 truncate">
                          {entry.email}
                        </p>
                      </div>
                      {entry.is_winner && (
                        <Trophy className="size-3.5 text-[#c9a84c] shrink-0" />
                      )}
                    </label>
                  ))
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={onClose} disabled={selecting}>
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={
                  selecting ||
                  (mode === "manual" && selectedIds.size === 0)
                }
                className="bg-[#c9a84c] text-[#06080f] hover:bg-[#c9a84c]/90"
              >
                {selecting
                  ? "Selecting…"
                  : mode === "random"
                  ? "Pick Random Winners"
                  : `Select ${selectedIds.size} Winner${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Entries Side Panel ────────────────────────────────────────────────────────

interface EntriesPanelProps {
  giveaway: Giveaway;
  open: boolean;
  onClose: () => void;
}

function EntriesPanel({ giveaway, open, onClose }: EntriesPanelProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<{
    cursor: string;
    cursor_id: string;
  } | null>(null);
  const [prevCursors, setPrevCursors] = useState<
    Array<{ cursor: string; cursor_id: string }>
  >([]);

  const load = useCallback(
    async (cursor?: { cursor: string; cursor_id: string }) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) {
        params.set("cursor", cursor.cursor);
        params.set("cursor_id", cursor.cursor_id);
      }
      try {
        const res = await fetch(
          `/api/admin/giveaways/${giveaway.id}/entries?${params}`
        );
        const data = await res.json();
        setEntries(data.entries ?? []);
        setNextCursor(data.nextCursor ?? null);
      } catch {
        toast.error("Failed to load entries.");
      } finally {
        setLoading(false);
      }
    },
    [giveaway.id]
  );

  useEffect(() => {
    if (open) {
      setEntries([]);
      setNextCursor(null);
      setPrevCursors([]);
      load();
    }
  }, [open, load]);

  function handleNext() {
    if (!nextCursor) return;
    if (entries.length > 0) {
      setPrevCursors((prev) => [
        ...prev,
        { cursor: entries[0].entered_at, cursor_id: entries[0].id },
      ]);
    }
    load(nextCursor);
  }

  function handlePrev() {
    const prev = [...prevCursors];
    const cursor = prev.pop();
    setPrevCursors(prev);
    load(cursor);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0d1117] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[#f5f0e8]">{giveaway.title}</h2>
          <p className="text-xs text-[#f5f0e8]/50">
            Entries · {giveaway.entry_count} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="text-[#f5f0e8]/60 hover:text-[#f5f0e8]"
            title="Download CSV"
          >
            <a
              href={`/api/admin/giveaways/${giveaway.id}/entries?format=csv`}
              download
            >
              <Download className="size-4" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-[#f5f0e8]/60 hover:text-[#f5f0e8]"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[#f5f0e8]/40">
            Loading…
          </p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-[#f5f0e8]/20" />
            <p className="text-sm text-[#f5f0e8]/40">No entries yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`rounded-lg border px-4 py-3 ${
                  entry.is_winner
                    ? "border-[#c9a84c]/30 bg-[#c9a84c]/5"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#f5f0e8] truncate">
                        {entry.name}
                      </p>
                      {entry.is_winner && (
                        <Trophy className="size-3.5 text-[#c9a84c] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#f5f0e8]/50 truncate">
                      {entry.email}
                    </p>
                  </div>
                  <p className="text-xs text-[#f5f0e8]/40 shrink-0">
                    {fmt(entry.entered_at)}
                  </p>
                </div>
                {entry.extra_fields &&
                  Object.keys(entry.extra_fields).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(entry.extra_fields).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-xs text-[#f5f0e8]/40"
                        >
                          <span className="text-[#f5f0e8]/60">{k}:</span> {v}
                        </span>
                      ))}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {(prevCursors.length > 0 || nextCursor) && (
        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrev}
            disabled={prevCursors.length === 0 || loading}
            className="text-[#f5f0e8]/60"
          >
            <ChevronLeft className="size-4 mr-1" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNext}
            disabled={!nextCursor || loading}
            className="text-[#f5f0e8]/60"
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Client ───────────────────────────────────────────────────────────────

export function GiveawaysClient() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<GiveawayStatus | "all">("all");
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectWinnersGiveaway, setSelectWinnersGiveaway] =
    useState<Giveaway | null>(null);
  const [entriesGiveaway, setEntriesGiveaway] = useState<Giveaway | null>(null);
  const [nextCursor, setNextCursor] = useState<{
    cursor: string;
    cursor_id: string;
  } | null>(null);
  const [prevCursors, setPrevCursors] = useState<
    Array<{ cursor: string; cursor_id: string }>
  >([]);

  const load = useCallback(
    async (
      status: GiveawayStatus | "all",
      cursor?: { cursor: string; cursor_id: string }
    ) => {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (status !== "all") params.set("status", status);
      if (cursor) {
        params.set("cursor", cursor.cursor);
        params.set("cursor_id", cursor.cursor_id);
      }
      try {
        const res = await fetch(`/api/admin/giveaways?${params}`);
        const data = await res.json();
        setGiveaways(data.giveaways ?? []);
        setNextCursor(data.nextCursor ?? null);
      } catch {
        toast.error("Failed to load giveaways.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load diviners for new giveaway form
  useEffect(() => {
    fetch("/api/admin/diviners?limit=200")
      .then((r) => r.json())
      .then((d) => {
        const list = d.diviners ?? d.data ?? [];
        setDiviners(list);
      })
      .catch(() => {
        // Non-fatal; form will just have no options
      });
  }, []);

  useEffect(() => {
    setGiveaways([]);
    setNextCursor(null);
    setPrevCursors([]);
    load(activeStatus);
  }, [activeStatus, load]);

  function handleTabChange(status: GiveawayStatus | "all") {
    setActiveStatus(status);
  }

  function handleNext() {
    if (!nextCursor) return;
    if (giveaways.length > 0) {
      const first = giveaways[0];
      setPrevCursors((prev) => [
        ...prev,
        { cursor: first.ends_at ?? "null", cursor_id: first.id },
      ]);
    }
    load(activeStatus, nextCursor);
  }

  function handlePrev() {
    const prev = [...prevCursors];
    const cursor = prev.pop();
    setPrevCursors(prev);
    load(activeStatus, cursor);
  }

  function handleCreated() {
    setPrevCursors([]);
    load(activeStatus);
  }

  function handleWinnersSelected() {
    load(activeStatus);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giveaways</h1>
          <p className="text-muted-foreground">
            {giveaways.length} giveaway{giveaways.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNew(true)}
          className="bg-[#c9a84c] text-[#06080f] hover:bg-[#c9a84c]/90"
        >
          <Plus className="mr-1.5 size-4" />
          New Giveaway
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
              activeStatus === tab.value
                ? "border-b-2 border-amber-500 text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="size-4" />
            Giveaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : giveaways.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Gift className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No giveaways found.</p>
              <Button
                size="sm"
                onClick={() => setShowNew(true)}
                className="bg-[#c9a84c] text-[#06080f] hover:bg-[#c9a84c]/90"
              >
                <Plus className="mr-1.5 size-4" /> Create your first giveaway
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Diviner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Winners</TableHead>
                  <TableHead>Ends At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giveaways.map((g) => (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() => setEntriesGiveaway(g)}
                  >
                    <TableCell className="max-w-[200px]">
                      <div>
                        <p className="font-medium truncate">{g.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {g.prize_description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.diviner?.display_name || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={g.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {g.entry_count}
                      {g.max_entries ? (
                        <span className="text-muted-foreground">
                          {" "}/ {g.max_entries}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {g.winner_count_selected} / {g.winner_count}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(g.ends_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Public entry page */}
                        {g.status === "active" && g.is_public && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            title="View public entry page"
                          >
                            <a
                              href={`/giveaways/${g.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        )}

                        {/* Select winners */}
                        {g.status === "ended" &&
                          g.winner_count_selected === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Select winners"
                              onClick={() => setSelectWinnersGiveaway(g)}
                              className="text-[#c9a84c] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10"
                            >
                              <Trophy className="size-3.5 mr-1" />
                              Pick Winners
                            </Button>
                          )}

                        {/* Export entries */}
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          title="Download entries CSV"
                        >
                          <a
                            href={`/api/admin/giveaways/${g.id}/entries?format=csv`}
                            download
                          >
                            <Download className="size-3.5" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {(prevCursors.length > 0 || nextCursor) && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrev}
                disabled={prevCursors.length === 0 || loading}
              >
                <ChevronLeft className="size-4 mr-1" />
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={!nextCursor || loading}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewGiveawayDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleCreated}
        diviners={diviners}
      />

      {selectWinnersGiveaway && (
        <SelectWinnersModal
          giveaway={selectWinnersGiveaway}
          open={!!selectWinnersGiveaway}
          onClose={() => setSelectWinnersGiveaway(null)}
          onDone={() => {
            handleWinnersSelected();
            setSelectWinnersGiveaway(null);
          }}
        />
      )}

      {entriesGiveaway && (
        <EntriesPanel
          giveaway={entriesGiveaway}
          open={!!entriesGiveaway}
          onClose={() => setEntriesGiveaway(null)}
        />
      )}
    </div>
  );
}
