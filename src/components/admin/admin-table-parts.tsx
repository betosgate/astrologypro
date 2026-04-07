"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── SortHeader ───────────────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string;
  column: string;
  currentSort: string;
  currentDir: string;
  onSort: (col: string) => void;
}

export function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
}: SortHeaderProps) {
  const active = currentSort === column;
  const Icon = active
    ? currentDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
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

// ─── AdminPagination ──────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: string) => void;
  isPending?: boolean;
}

export function AdminPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isPending,
}: AdminPaginationProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}{" "}
        <span className="text-muted-foreground/60">({total} total)</span>
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={onPageSizeChange}
        >
          <SelectTrigger className="h-8 w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={currentPage <= 1 || isPending}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={currentPage >= totalPages || isPending}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── AdminTableSearch ─────────────────────────────────────────────────────────

interface AdminTableSearchProps {
  defaultValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function AdminTableSearch({
  defaultValue,
  onSearch,
  placeholder = "Search...",
  debounceMs = 1000,
}: AdminTableSearchProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the input in sync when the URL param changes externally (e.g. reset)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== defaultValue) {
      inputRef.current.value = defaultValue;
    }
  }, [defaultValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

// ─── AdminResetButton ─────────────────────────────────────────────────────────

interface AdminResetButtonProps {
  hasActiveFilters: boolean;
  onReset: () => void;
}

export function AdminResetButton({
  hasActiveFilters,
  onReset,
}: AdminResetButtonProps) {
  if (!hasActiveFilters) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onReset}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <FilterX className="size-4" />
      Reset filters
    </Button>
  );
}

// ─── useAdminTableParams ──────────────────────────────────────────────────────

interface AdminTableParams {
  pushParams: (updates: Record<string, string>) => void;
  currentPage: number;
  currentSort: string;
  currentDir: string;
  currentQ: string;
  startNavTransition: React.TransitionStartFunction;
  isPending: boolean;
}

export function useAdminTableParams(defaults?: {
  sort?: string;
  dir?: string;
}): AdminTableParams {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isPending, startNavTransition] = useTransition();

  const currentPage = Math.max(1, parseInt(urlSearchParams.get("page") ?? "1", 10));
  const currentSort = urlSearchParams.get("sortBy") ?? defaults?.sort ?? "";
  const currentDir = urlSearchParams.get("sortDir") ?? defaults?.dir ?? "desc";
  const currentQ = urlSearchParams.get("q") ?? "";

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
    [router, pathname, urlSearchParams, startNavTransition],
  );

  return {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    startNavTransition,
    isPending,
  };
}
