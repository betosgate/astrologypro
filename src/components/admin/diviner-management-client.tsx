"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Search,
  Star,
  Plus,
  Pencil,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  CreditCard,
  Phone,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FilterX,
  CalendarIcon,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminDiviner {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  email: string;
  phone: string;
  accountStatus?: string;
  isActive: boolean;
  chargesEnabled: boolean;
  calendarConnected: boolean;
  /** True if the diviner has a provisioned reading phone number (Twilio or Chime). */
  phoneConnected: boolean;
  phoneProvider: string;
  /** The active provisioned number (Twilio OR Chime, depending on phoneProvider). */
  readingPhoneNumber: string;
  isCertified: boolean;
  onboardingCompleted: boolean;
  affiliateCount: number;
  joinedAt: string;
}

interface Props {
  diviners: AdminDiviner[];
  total: number;
  counts: { all: number; active: number; suspended: number };
  pageSize: number;
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
    joinedFrom?: string;
    joinedTo?: string;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<"all" | "active" | "suspended"> = ["all", "active", "suspended"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
type SortKey = "name" | "username" | "joinedAt" | "isActive";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({
  isActive,
  accountStatus,
}: {
  isActive: boolean;
  accountStatus?: string | null;
}) {
  const status = accountStatus ?? (isActive ? "active" : "inactive");
  const s = status.toLowerCase();

  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    inactive: "bg-gray-500/10 text-gray-600",
    suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    locked: "bg-red-500/10 text-red-700 dark:text-red-400",
    draft: "bg-blue-500/10 text-blue-700",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
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

export function DivinerManagementClient({
  diviners,
  total,
  counts,
  pageSize,
  searchParams: sp,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  // ── Current params (URL is source of truth) ───────────────────────────────
  const currentQ = sp.q ?? "";
  const currentStatus = sp.status ?? "all";
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10));
  const currentSort = sp.sortBy ?? "joinedAt";
  const currentDir = sp.sortDir ?? "desc";
  const currentJoinedFrom = sp.joinedFrom ?? "";
  const currentJoinedTo = sp.joinedTo ?? "";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Persist + restore last search ────────────────────────────────────────
  const STORAGE_KEY = "admin_diviners_last_search";

  const [isPending, startNavTransition] = useTransition();
  const [isRefreshing, startRefreshing] = useTransition();

  const hasActiveFilters =
    !!currentQ ||
    currentStatus !== "all" ||
    !!currentJoinedFrom ||
    !!currentJoinedTo ||
    currentSort !== "joinedAt" ||
    currentDir !== "desc";

  function handleRefresh() {
    startRefreshing(() => router.refresh());
  }

  function handleReset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.push(pathname);
  }

  // On mount: restore last saved search if URL has no filter params
  useEffect(() => {
    const hasActiveParams =
      sp.q ||
      (sp.status && sp.status !== "all") ||
      sp.joinedFrom ||
      sp.joinedTo ||
      sp.sortBy;
    if (!hasActiveParams) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, string>;
          const next = new URLSearchParams();
          for (const [k, v] of Object.entries(parsed)) {
            if (v && v !== "" && !(k === "status" && v === "all")) next.set(k, v);
          }
          if (next.toString()) {
            router.replace(`${pathname}?${next.toString()}`);
          }
        }
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save search state whenever params change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          q: currentQ,
          status: currentStatus,
          sortBy: currentSort,
          sortDir: currentDir,
          joinedFrom: currentJoinedFrom,
          joinedTo: currentJoinedTo,
        })
      );
    } catch {
      /* ignore */
    }
  }, [
    currentQ,
    currentStatus,
    currentSort,
    currentDir,
    currentJoinedFrom,
    currentJoinedTo,
  ]);

  // Push params helper
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(urlSearchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === "" || v === undefined) next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in updates)) next.set("page", "1");
      startNavTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [router, pathname, urlSearchParams, startNavTransition]
  );

  // Debounced search input
  const [searchValue, setSearchValue] = useState(currentQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Sync from URL when not typing (e.g. reset filters)
  useEffect(() => {
    if (!isTypingRef.current) setSearchValue(currentQ);
  }, [currentQ]);

  function handleSearchChange(value: string) {
    isTypingRef.current = true;
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      isTypingRef.current = false;
      pushParams({ q: value });
    }, 500);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    isTypingRef.current = false;
    setSearchValue("");
    pushParams({ q: "" });
  }

  function handleStatusChange(tab: string) {
    pushParams({ status: tab === "all" ? "" : tab });
  }

  function handlePageSizeChange(value: string) {
    pushParams({ pageSize: value, page: "1" });
  }

  function handleSort(col: SortKey) {
    if (currentSort === col) {
      pushParams({
        sortBy: col,
        sortDir: currentDir === "asc" ? "desc" : "asc",
      });
    } else {
      pushParams({
        sortBy: col,
        sortDir: col === "name" || col === "username" ? "asc" : "desc",
      });
    }
  }

  function handlePage(p: number) {
    pushParams({ page: String(p) });
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diviners</h1>
          <p className="text-sm text-muted-foreground">
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
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/invitations?role=diviner">
              <Plus className="mr-1.5 size-4" />
              Add Diviner
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Status filter tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleStatusChange(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              currentStatus === tab
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab}
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-xs">
              {counts[tab] ?? 0}
            </Badge>
          </button>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: search */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              value={searchValue}
              placeholder="Search by name, username or phone…"
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
              autoComplete="off"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: joined date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card className="relative">
        {(isPending || isRefreshing) && (
          <div className="absolute inset-0 z-10 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-background/90 border px-4 py-2 shadow-md text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin text-amber-500" />
              Loading…
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left">
                    <SortHeader
                      label="Diviner"
                      column="name"
                      currentSort={currentSort}
                      currentDir={currentDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">
                    <SortHeader
                      label="Username"
                      column="username"
                      currentSort={currentSort}
                      currentDir={currentDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <SortHeader
                      label="Status"
                      column="isActive"
                      currentSort={currentSort}
                      currentDir={currentDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    <span className="flex items-center gap-1" title="Stripe payments connected">
                      <CreditCard className="size-3.5" />
                      Stripe
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    <span className="flex items-center gap-1" title="Google or Microsoft Calendar connected">
                      <CalendarCheck className="size-3.5" />
                      Calendar
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    <span
                      className="flex items-center gap-1"
                      title="Provisioned reading phone number (Twilio or AWS Chime)"
                    >
                      <Phone className="size-3.5" />
                      Phone
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Affiliates
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Certified
                  </th>
                  <th className="px-4 py-2.5 text-left hidden xl:table-cell">
                    <SortHeader
                      label="Joined"
                      column="joinedAt"
                      currentSort={currentSort}
                      currentDir={currentDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  isPending || isRefreshing ? "opacity-50" : "opacity-100",
                  "transition-opacity duration-150"
                )}
              >
                {diviners.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/diviners/${d.id}`}
                        className="block hover:underline"
                      >
                        <p className="font-medium text-sm">{d.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.email || (d.username ? `@${d.username}` : "—")}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell text-xs">
                      {d.username ? `@${d.username}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        isActive={d.isActive}
                        accountStatus={d.accountStatus}
                      />
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {d.chargesEnabled ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {d.calendarConnected ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {d.phoneConnected ? (
                        <span
                          className="inline-flex items-center gap-1"
                          title={`${
                            d.phoneProvider === "chime" ? "Chime" : "Twilio"
                          } · ${d.readingPhoneNumber}`}
                        >
                          <CheckCircle2 className="size-4 text-green-600" />
                        </span>
                      ) : (
                        <XCircle className="size-4 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden xl:table-cell">
                      <span className="text-sm">{d.affiliateCount}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden xl:table-cell">
                      {d.isCertified ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 text-xs"
                        >
                          Certified
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden xl:table-cell">
                      {fmtDate(d.joinedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/diviners/${d.id}`}>
                            <Eye className="size-3.5" />
                            <span className="sr-only">View detail</span>
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/users/edit/${d.userId}`}>
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {diviners.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Star className="size-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          No diviners match your search
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm transition-opacity duration-150",
          isPending && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, total)}–
            {Math.min(currentPage * pageSize, total)} of {total}
          </p>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
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

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
              )
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1)
                  acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
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
    </>
  );
}
