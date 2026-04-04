"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
    sortBy?: string;
    sortDir?: string;
    joinedFrom?: string;
    joinedTo?: string;
    loginFrom?: string;
    loginTo?: string;
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

type SortKey = "name" | "email" | "role" | "joinedAt" | "lastLoginAt";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  }, [currentQ, currentRole, currentSort, currentDir, currentJoinedFrom, currentJoinedTo, currentLoginFrom, currentLoginTo]);

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
          <InviteUserForm />
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: search + role */}
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
                return (
                  <tr
                    key={`${u.role}-${u.rowId}`}
                    className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                    onClick={() => openSheet(u, "overview")}
                  >
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
                      <Badge variant="outline" className="text-xs capitalize">{u.roleLabel}</Badge>
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
                          <DropdownMenuItem onClick={() => openSheet(u, "notes")}>
                            <StickyNote className="mr-2 size-4" />
                            {(u.notesCount ?? 0) > 0 ? `Notes (${u.notesCount})` : "Add Note"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSheet(u, "logins")}>
                            <Eye className="mr-2 size-4" />
                            Login History
                          </DropdownMenuItem>
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
                              onClick={() => openSheet(u, "overview")}
                            >
                              <ShieldOff className="mr-2 size-4" />
                              Block User…
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No users match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={cn("flex items-center justify-between text-sm transition-opacity duration-150", isPending && "opacity-50 pointer-events-none")}>
          <p className="text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, total)}–{Math.min(currentPage * pageSize, total)} of {total}
          </p>
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
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
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
        </div>
      )}

      {/* ── Detail sheet ────────────────────────────────────────────────────── */}
      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUserChanged={(userId, change) => {
          // Optimistic local update for block/unblock
          if (change.blocked === false) {
            setLocalUnblocked((prev) => new Set([...prev, userId]));
          }
          if (selectedUser?.userId === userId) {
            setSelectedUser((prev) => (prev ? { ...prev, ...change } : prev));
          }
        }}
      />
    </>
  );
}
