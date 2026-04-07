"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Search,
  MoreHorizontal,
  StickyNote,
  ShieldOff,
  ShieldCheck,
  Eye,
  BadgeCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  RefreshCw,
  FilterX,
  Pencil,
  KeyRound,
  Trash2,
  UserCog,
  Download,
  Mail,
  X,
  UserPlus,
} from "lucide-react";
import { UserDetailSheet } from "./user-detail-sheet";
import { InviteUserForm } from "./invite-user-form";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  userId: string;
  rowId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleLabel: string;
  roles: { slug: string; label: string }[];
  status: string;
  joinedAt: string;
  blocked: boolean;
  isCertified?: boolean;
  lastLoginAt?: string;
  notesCount?: number;
  extra?: Record<string, string>;
}

interface Props {
  users: AdminUser[];
  total: number;
  pageSize: number;
  searchParams: {
    q?: string;
    role?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
    joinedFrom?: string;
    joinedTo?: string;
    loginFrom?: string;
    loginTo?: string;
    status?: string;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "all",       label: "All Roles" },
  { value: "diviner",   label: "Diviners" },
  { value: "client",    label: "Clients" },
  { value: "advocate",  label: "Advocates" },
  { value: "community", label: "Community" },
  { value: "trainee",   label: "Trainees" },
];

const STATUS_OPTIONS = [
  { value: "all",      label: "All Statuses" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type SortKey = "name" | "email" | "role" | "joinedAt" | "lastLoginAt";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: string) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: tz,
  }).format(new Date(d));
}

/** Format a raw phone string to US (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX */
function formatPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const n = digits.slice(1);
    return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone; // return as-is for non-standard
}

// ─── Autocomplete search ───────────────────────────────────────────────────────

type Suggestion = { value: string; type: "name" | "email" | "phone"; display: string };

function SearchAutocomplete({
  defaultValue,
  onSelect,
}: {
  defaultValue: string;
  onSelect: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // True while the user is actively typing — prevents the defaultValue sync
  // from overwriting characters the user typed after the last debounce fired.
  const isTypingRef = useRef(false);

  // Sync only for external resets (e.g. Reset filters sets defaultValue to "").
  // Guarded by isTypingRef so an in-progress keystroke sequence is never interrupted.
  useEffect(() => {
    if (!isTypingRef.current) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);

  function fetchSuggestions(q: string) {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    fetch(`/api/admin/users/suggestions?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(({ suggestions: s }) => {
        setSuggestions(s ?? []);
        setOpen((s ?? []).length > 0);
        setActiveSuggestion(-1);
      })
      .catch(() => {});
  }

  function handleChange(value: string) {
    isTypingRef.current = true;       // block external sync while typing
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      isTypingRef.current = false;    // typing paused — allow sync again
      onSelect(value);
      fetchSuggestions(value);
    }, 1000);
  }

  function handleSelect(s: Suggestion) {
    setInputValue(s.value);
    setSuggestions([]);
    setOpen(false);
    onSelect(s.value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveSuggestion((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeSuggestion >= 0) { e.preventDefault(); handleSelect(suggestions[activeSuggestion]); }
    if (e.key === "Escape") { setOpen(false); }
  }

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const typeIcon = (type: Suggestion["type"]) =>
    type === "email" ? "✉" : type === "phone" ? "☎" : "👤";

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
      <Input
        value={inputValue}
        placeholder="Search by name, email or phone…"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        className="pl-9"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.type}-${s.value}`}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => handleSelect(s)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                idx === activeSuggestion
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="text-xs w-4 shrink-0 opacity-60">{typeIcon(s.type)}</span>
              <span className="truncate">{s.display}</span>
              <Badge variant="outline" className="ml-auto text-[10px] shrink-0 capitalize">{s.type}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sort header button ────────────────────────────────────────────────────────

function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  currentSort: string;
  currentDir: string;
  onSort: (col: SortKey) => void;
}) {
  const active = currentSort === column;
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      <Icon className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function UserManagementClient({ users, total, pageSize, searchParams: sp }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  // ── Current params (read from server-rendered props, URL is source of truth) ─
  const currentQ          = sp.q ?? "";
  const currentRole       = sp.role ?? "all";
  const currentStatus     = sp.status ?? "all";
  const currentPage       = Math.max(1, parseInt(sp.page ?? "1", 10));
  const currentSort       = sp.sortBy ?? "lastLoginAt";
  const currentDir        = sp.sortDir ?? "desc";
  const currentJoinedFrom = sp.joinedFrom ?? "";
  const currentJoinedTo   = sp.joinedTo   ?? "";
  const currentLoginFrom  = sp.loginFrom  ?? "";
  const currentLoginTo    = sp.loginTo    ?? "";
  const totalPages        = Math.max(1, Math.ceil(total / pageSize));

  // ── Persist + restore last search per table ──────────────────────────────
  const STORAGE_KEY = "admin_users_last_search";

  // ── Navigation pending state (sort / filter / paginate) ──────────────────
  const [isPending, startNavTransition] = useTransition();

  // ── Refresh + reset ───────────────────────────────────────────────────────
  const [isRefreshing, startRefreshing] = useTransition();

  const hasActiveFilters =
    !!currentQ ||
    (currentRole !== "all") ||
    (currentStatus !== "all") ||
    !!currentJoinedFrom ||
    !!currentJoinedTo ||
    !!currentLoginFrom ||
    !!currentLoginTo ||
    currentSort !== "lastLoginAt" ||
    currentDir !== "desc";

  function handleRefresh() {
    startRefreshing(() => {
      router.refresh();
    });
  }

  function handleReset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    router.push(pathname);
  }

  // Local UI state for the detail sheet only
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"overview" | "notes" | "logins">("overview");

  // On mount: if URL has no filter params, restore last saved search
  useEffect(() => {
    const hasActiveParams = sp.q || (sp.role && sp.role !== "all") || sp.joinedFrom || sp.joinedTo || sp.loginFrom || sp.loginTo || sp.sortBy;
    if (!hasActiveParams) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, string>;
          const next = new URLSearchParams();
          for (const [k, v] of Object.entries(parsed)) {
            if (v && v !== "" && !(k === "role" && v === "all")) next.set(k, v);
          }
          if (next.toString()) {
            router.replace(`${pathname}?${next.toString()}`);
          }
        }
      } catch {
        // ignore localStorage errors
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save search state whenever URL params change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          q:           currentQ,
          role:        currentRole,
          status:      currentStatus,
          sortBy:      currentSort,
          sortDir:     currentDir,
          joinedFrom:  currentJoinedFrom,
          joinedTo:    currentJoinedTo,
          loginFrom:   currentLoginFrom,
          loginTo:     currentLoginTo,
        })
      );
    } catch {
      // ignore
    }
  }, [currentQ, currentRole, currentStatus, currentSort, currentDir, currentJoinedFrom, currentJoinedTo, currentLoginFrom, currentLoginTo]);

  // Build URL with updated params and push (wrapped in transition so isPending fires)
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(urlSearchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === "" || v === undefined) {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      // Reset to page 1 when any filter/sort changes (but not when explicitly paging)
      if (!("page" in updates)) next.set("page", "1");
      startNavTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [router, pathname, urlSearchParams, startNavTransition]
  );

  function handleRoleChange(value: string) {
    pushParams({ role: value });
  }

  function handleStatusChange(value: string) {
    pushParams({ status: value });
  }

  function handlePageSizeChange(value: string) {
    pushParams({ pageSize: value, page: "1" });
  }

  function handleSort(col: SortKey) {
    if (currentSort === col) {
      pushParams({ sortBy: col, sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: col === "name" || col === "email" ? "asc" : "desc" });
    }
  }

  function handlePage(p: number) {
    pushParams({ page: String(p) });
  }

  // Detail sheet helpers
  function openSheet(user: AdminUser, tab: "overview" | "notes" | "logins" = "overview") {
    setSelectedUser(user);
    setSheetTab(tab);
    setSheetOpen(true);
  }

  // Optimistic unblock (no full page refresh needed)
  const [localUnblocked, setLocalUnblocked] = useState<Set<string>>(new Set());

  // ── Block with note dialog ──────────────────────────────────────────────
  const [blockDialogUser, setBlockDialogUser] = useState<AdminUser | null>(null);
  const [blockNote, setBlockNote] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  async function handleBlockWithNote() {
    if (!blockDialogUser) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${blockDialogUser.userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockNote }),
      });
      if (!res.ok) throw new Error("Failed");
      // Save note to admin_user_notes
      if (blockNote.trim()) {
        await fetch(`/api/admin/users/${blockDialogUser.userId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: `Block reason: ${blockNote}`, role: blockDialogUser.role, action_type: "block" }),
        });
      }
      toast.success(`${blockDialogUser.name} has been blocked`);
      setBlockDialogUser(null);
      setBlockNote("");
      router.refresh();
    } catch {
      toast.error("Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  }

  // ── Password management dialogs ─────────────────────────────────────────
  const [pwdDialogUser, setPwdDialogUser] = useState<AdminUser | null>(null);
  const [pwdDialogMode, setPwdDialogMode] = useState<"reset_link" | "force_set">("reset_link");
  const [forcePassword, setForcePassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handlePasswordAction() {
    if (!pwdDialogUser) return;
    setPwdLoading(true);
    try {
      const body =
        pwdDialogMode === "reset_link"
          ? { action: "reset_link" }
          : { action: "force_set", password: forcePassword };
      const res = await fetch(`/api/admin/users/${pwdDialogUser.userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (pwdDialogMode === "reset_link" && data.link) {
        await navigator.clipboard.writeText(data.link).catch(() => {});
        toast.success("Password reset link copied to clipboard");
      } else {
        toast.success("Password updated successfully");
      }
      setPwdDialogUser(null);
      setForcePassword("");
    } catch {
      toast.error("Failed to perform password action");
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Soft delete dialog ──────────────────────────────────────────────────
  const [deleteDialogUser, setDeleteDialogUser] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleSoftDelete() {
    if (!deleteDialogUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteDialogUser.userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: deleteDialogUser.role, rowId: deleteDialogUser.rowId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${deleteDialogUser.name} has been soft-deleted`);
      setDeleteDialogUser(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Training status dialog ──────────────────────────────────────────────
  const [trainingDialogUser, setTrainingDialogUser] = useState<AdminUser | null>(null);
  const [trainingStatus, setTrainingStatus] = useState("in_progress");
  const [trainingLoading, setTrainingLoading] = useState(false);

  async function handleTrainingStatusUpdate() {
    if (!trainingDialogUser) return;
    setTrainingLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${trainingDialogUser.userId}/training-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: trainingStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Training status updated");
      setTrainingDialogUser(null);
      router.refresh();
    } catch {
      toast.error("Failed to update training status");
    } finally {
      setTrainingLoading(false);
    }
  }

  // ── Role change dialog ──────────────────────────────────────────────────
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("client");
  const [roleLoading, setRoleLoading] = useState(false);

  // ── Bulk select ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAll() {
    const allPageIds = users.map((u) => u.userId);
    const allSelected = allPageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of allPageIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of allPageIds) next.add(id);
        return next;
      });
    }
  }

  const allOnPageSelected = users.length > 0 && users.every((u) => selectedIds.has(u.userId));
  const someOnPageSelected = users.some((u) => selectedIds.has(u.userId));

  // ── Bulk email dialog ───────────────────────────────────────────────────
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailMessage, setBulkEmailMessage] = useState("");
  const [bulkEmailLoading, setBulkEmailLoading] = useState(false);

  async function handleBulkEmail() {
    setBulkEmailLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: [...selectedIds],
          subject:  bulkEmailSubject,
          message:  bulkEmailMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast.success(`Email sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}`);
      setBulkEmailOpen(false);
      setBulkEmailSubject("");
      setBulkEmailMessage("");
    } catch {
      toast.error("Failed to send bulk email");
    } finally {
      setBulkEmailLoading(false);
    }
  }

  // ── Bulk status dialog ──────────────────────────────────────────────────
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<"active" | "blocked">("active");
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  async function handleBulkStatus() {
    setBulkStatusLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: [...selectedIds],
          status:   bulkStatusValue,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast.success(`Updated ${data.updated} user${data.updated !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}`);
      setBulkStatusOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Failed to update user statuses");
    } finally {
      setBulkStatusLoading(false);
    }
  }

  // ── Bulk CSV export (selected rows — POSTs IDs, streams download) ───────
  const [bulkExportLoading, setBulkExportLoading] = useState(false);

  async function handleBulkExportCSV() {
    setBulkExportLoading(true);
    try {
      const res = await fetch("/api/admin/export/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-selected-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setBulkExportLoading(false);
    }
  }

  // ── Export all (GET with current filter params) ─────────────────────────
  function handleExportAll() {
    const params = new URLSearchParams();
    if (currentQ)           params.set("search",      currentQ);
    if (currentRole !== "all") params.set("role",      currentRole);
    if (currentStatus !== "all") params.set("status",  currentStatus);
    if (currentJoinedFrom)  params.set("joined_from", currentJoinedFrom);
    if (currentJoinedTo)    params.set("joined_to",   currentJoinedTo);
    const qs = params.toString();
    window.location.href = `/api/admin/export/users${qs ? `?${qs}` : ""}`;
  }

  async function handleRoleChangeAction() {
    if (!roleDialogUser) return;
    setRoleLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${roleDialogUser.userId}/change-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Role record created for ${roleDialogUser.name}`);
      setRoleDialogUser(null);
      router.refresh();
    } catch {
      toast.error("Failed to change role");
    } finally {
      setRoleLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4" />
              Reset filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            className="gap-1.5"
          >
            <Download className="size-4" />
            Export All (CSV)
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/users/add">
              <UserPlus className="mr-2 size-4" />
              Add User
            </Link>
          </Button>
          <InviteUserForm />
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: search + role + status + page size */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <SearchAutocomplete
            defaultValue={currentQ}
            onSelect={(value) => pushParams({ q: value })}
          />
          <Select value={currentRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: date ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Joined range */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-12 shrink-0">Joined</span>
            <Input
              type="date"
              value={currentJoinedFrom}
              onChange={(e) => pushParams({ joinedFrom: e.target.value })}
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={currentJoinedTo}
              onChange={(e) => pushParams({ joinedTo: e.target.value })}
              className="h-8 text-xs"
            />
            {(currentJoinedFrom || currentJoinedTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => pushParams({ joinedFrom: "", joinedTo: "" })}
              >
                ✕
              </Button>
            )}
          </div>

          {/* Last login range */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-12 shrink-0">Login</span>
            <Input
              type="date"
              value={currentLoginFrom}
              onChange={(e) => pushParams({ loginFrom: e.target.value })}
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={currentLoginTo}
              onChange={(e) => pushParams({ loginTo: e.target.value })}
              className="h-8 text-xs"
            />
            {(currentLoginFrom || currentLoginTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => pushParams({ loginFrom: "", loginTo: "" })}
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk action bar (visible when rows are selected) ───────────────── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={bulkExportLoading}
              onClick={handleBulkExportCSV}
            >
              {bulkExportLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export Selected CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkEmailOpen(true)}
            >
              <Mail className="size-4" />
              Send Email
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Change Status
                  <ArrowDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setBulkStatusValue("active"); setBulkStatusOpen(true); }}>
                  <ShieldCheck className="mr-2 size-4 text-green-500" />
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkStatusValue("blocked"); setBulkStatusOpen(true); }}>
                  <ShieldOff className="mr-2 size-4 text-destructive" />
                  Block Users
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="size-4" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="relative">
        {/* Loading overlay — visible while server is fetching new results */}
        {(isPending || isRefreshing) && (
          <div className="absolute inset-0 z-10 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-background/90 border px-4 py-2 shadow-md text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin text-amber-500" />
              Loading…
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="pl-4 pr-2 py-2.5 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Name"       column="name"        currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-left hidden md:table-cell">
                  <SortHeader label="Email"      column="email"       currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Role"       column="role"        currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left hidden xl:table-cell">
                  <SortHeader label="Last Login" column="lastLoginAt" currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-left hidden xl:table-cell">
                  <SortHeader label="Joined"     column="joinedAt"    currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell w-8">
                  <span title="Notes"><StickyNote className="size-3.5" /></span>
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={cn(isPending || isRefreshing ? "opacity-50" : "opacity-100", "transition-opacity duration-150")}>
              {users.map((u) => {
                const isBlocked = u.blocked && !localUnblocked.has(u.userId);
                const isSelected = selectedIds.has(u.userId);
                return (
                  <tr
                    key={`${u.role}-${u.rowId}`}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/20 cursor-pointer",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => openSheet(u, "overview")}
                  >
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${u.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(u.userId)}
                        className="size-4 cursor-pointer accent-primary"
                      />
                    </td>
                    {/* Name */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{u.name}</span>
                        {u.isCertified && (
                          <BadgeCheck className="size-3.5 text-amber-500 shrink-0" aria-label="DIB Certified" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">{u.email}</div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{u.email}</td>

                    {/* Phone */}
                    <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">
                      {formatPhone(u.phone) ? (
                        <a
                          href={`tel:${u.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-foreground transition-colors tabular-nums"
                        >
                          {formatPhone(u.phone)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0 ? (
                          u.roles.map((r, idx) => (
                            <Badge
                              key={r.slug}
                              variant={idx === 0 ? "outline" : "secondary"}
                              className="text-xs capitalize"
                            >
                              {r.label}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs capitalize">{u.roleLabel}</Badge>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {isBlocked ? (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{u.status}</Badge>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden xl:table-cell">
                      {u.lastLoginAt ? dateStr(u.lastLoginAt) : <span className="text-muted-foreground/40">Never</span>}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden xl:table-cell">
                      {dateStr(u.joinedAt)}
                    </td>

                    {/* Notes count */}
                    <td className="px-4 py-2.5 hidden lg:table-cell" onClick={(e) => { e.stopPropagation(); openSheet(u, "notes"); }}>
                      {(u.notesCount ?? 0) > 0 ? (
                        <Badge variant="secondary" className="text-xs h-5 min-w-5 flex items-center justify-center cursor-pointer hover:bg-amber-500/20">
                          {u.notesCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSheet(u, "overview")}>
                            <Eye className="mr-2 size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/users/edit/${u.userId}`)}>
                            <Pencil className="mr-2 size-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSheet(u, "notes")}>
                            <StickyNote className="mr-2 size-4" />
                            {(u.notesCount ?? 0) > 0 ? `Notes (${u.notesCount})` : "Add Note"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSheet(u, "logins")}>
                            <Eye className="mr-2 size-4" />
                            Login History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setPwdDialogUser(u); setPwdDialogMode("reset_link"); }}
                          >
                            <KeyRound className="mr-2 size-4" />
                            Send Password Reset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setPwdDialogUser(u); setPwdDialogMode("force_set"); setForcePassword(""); }}
                          >
                            <KeyRound className="mr-2 size-4" />
                            Force Set Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setRoleDialogUser(u); setNewRole("client"); }}>
                            <UserCog className="mr-2 size-4" />
                            Add / Grant New Role
                          </DropdownMenuItem>
                          {u.role === "trainee" && (
                            <DropdownMenuItem onClick={() => { setTrainingDialogUser(u); setTrainingStatus("in_progress"); }}>
                              <UserCog className="mr-2 size-4" />
                              Update Training Status
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isBlocked ? (
                            <DropdownMenuItem
                              className="text-green-500"
                              onClick={async () => {
                                const res = await fetch(`/api/admin/users/${u.userId}/unblock`, { method: "POST" });
                                if (res.ok) setLocalUnblocked((prev) => new Set([...prev, u.userId]));
                              }}
                            >
                              <ShieldCheck className="mr-2 size-4" />
                              Unblock User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setBlockDialogUser(u); setBlockNote(""); }}
                            >
                              <ShieldOff className="mr-2 size-4" />
                              Block User…
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialogUser(u)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete User…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    No users match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm transition-opacity duration-150", isPending && "opacity-50 pointer-events-none")}>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, total)}–{Math.min(currentPage * pageSize, total)} of {total}
          </p>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => handlePage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Page number buttons — show up to 5 around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => handlePage(currentPage + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Detail sheet ────────────────────────────────────────────────────── */}
      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialTab={sheetTab}
        onUserChanged={(userId, change) => {
          // Optimistic local update for block/unblock
          if (change.blocked === false) {
            setLocalUnblocked((prev) => new Set([...prev, userId]));
          }
          if (selectedUser?.userId === userId) {
            setSelectedUser((prev) => (prev ? { ...prev, ...change } : prev));
          }
          // Auto-refresh the list data after any user change
          handleRefresh();
        }}
      />

      {/* ── Block with note dialog ─────────────────────────────────────────── */}
      <Dialog open={!!blockDialogUser} onOpenChange={(v) => { if (!v) setBlockDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {blockDialogUser?.name}?</DialogTitle>
            <DialogDescription>
              This will prevent them from logging in. You can unblock at any time. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for blocking (required)…"
            value={blockNote}
            onChange={(e) => setBlockNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogUser(null)} disabled={blockLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockWithNote}
              disabled={blockLoading || !blockNote.trim()}
            >
              {blockLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Password management dialog ─────────────────────────────────────── */}
      <Dialog open={!!pwdDialogUser} onOpenChange={(v) => { if (!v) { setPwdDialogUser(null); setForcePassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pwdDialogMode === "reset_link" ? "Send Password Reset Link" : "Force Set Password"}
            </DialogTitle>
            <DialogDescription>
              {pwdDialogMode === "reset_link"
                ? `A password reset link will be generated for ${pwdDialogUser?.email} and copied to your clipboard.`
                : `Set a new password for ${pwdDialogUser?.name}. This will override their current password immediately.`}
            </DialogDescription>
          </DialogHeader>
          {pwdDialogMode === "force_set" && (
            <Input
              type="password"
              placeholder="New password (min 8 characters)"
              value={forcePassword}
              onChange={(e) => setForcePassword(e.target.value)}
              minLength={8}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwdDialogUser(null); setForcePassword(""); }} disabled={pwdLoading}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordAction}
              disabled={pwdLoading || (pwdDialogMode === "force_set" && forcePassword.length < 8)}
            >
              {pwdLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {pwdDialogMode === "reset_link" ? "Generate & Copy Link" : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Soft delete dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteDialogUser} onOpenChange={(v) => { if (!v) setDeleteDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteDialogUser?.name}?</DialogTitle>
            <DialogDescription>
              This performs a soft delete — the user&apos;s data is archived and can be restored later. Their account will be deactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogUser(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSoftDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Training status dialog ─────────────────────────────────────────── */}
      <Dialog open={!!trainingDialogUser} onOpenChange={(v) => { if (!v) setTrainingDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Training Status</DialogTitle>
            <DialogDescription>
              Update the training status for {trainingDialogUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <Select value={trainingStatus} onValueChange={setTrainingStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="certified">Certified</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainingDialogUser(null)} disabled={trainingLoading}>
              Cancel
            </Button>
            <Button onClick={handleTrainingStatusUpdate} disabled={trainingLoading}>
              {trainingLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk email dialog ─────────────────────────────────────────────── */}
      <Dialog open={bulkEmailOpen} onOpenChange={(v) => { if (!v) { setBulkEmailOpen(false); setBulkEmailSubject(""); setBulkEmailMessage(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {selectedIds.size} User{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Compose an email to send to the selected users. Emails are sent individually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Subject…"
              value={bulkEmailSubject}
              onChange={(e) => setBulkEmailSubject(e.target.value)}
            />
            <Textarea
              placeholder="Message body…"
              value={bulkEmailMessage}
              onChange={(e) => setBulkEmailMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEmailOpen(false)} disabled={bulkEmailLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkEmail}
              disabled={bulkEmailLoading || !bulkEmailSubject.trim() || !bulkEmailMessage.trim()}
            >
              {bulkEmailLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk status dialog ─────────────────────────────────────────────── */}
      <Dialog open={bulkStatusOpen} onOpenChange={(v) => { if (!v) setBulkStatusOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkStatusValue === "blocked" ? "Block" : "Activate"} {selectedIds.size} User{selectedIds.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              {bulkStatusValue === "blocked"
                ? `This will block ${selectedIds.size} user${selectedIds.size !== 1 ? "s" : ""} — they will be unable to log in. You can unblock them individually at any time.`
                : `This will re-activate ${selectedIds.size} user${selectedIds.size !== 1 ? "s" : ""} and lift any bans.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)} disabled={bulkStatusLoading}>
              Cancel
            </Button>
            <Button
              variant={bulkStatusValue === "blocked" ? "destructive" : "default"}
              onClick={handleBulkStatus}
              disabled={bulkStatusLoading}
            >
              {bulkStatusLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {bulkStatusValue === "blocked" ? "Block Users" : "Activate Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Role change dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!roleDialogUser} onOpenChange={(v) => { if (!v) setRoleDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add / Grant New Role for {roleDialogUser?.name}</DialogTitle>
            <DialogDescription>
              The user will keep their current role(s) while gaining this new one. Current role(s): <strong>{roleDialogUser?.roles?.map((r) => r.label).join(", ") ?? roleDialogUser?.roleLabel}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diviner">Diviner</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="advocate">Advocate</SelectItem>
              <SelectItem value="trainee">Trainee</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogUser(null)} disabled={roleLoading}>
              Cancel
            </Button>
            <Button onClick={handleRoleChangeAction} disabled={roleLoading || (roleDialogUser?.roles?.some((r) => r.slug === newRole) ?? newRole === roleDialogUser?.role)}>
              {roleLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Grant New Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
