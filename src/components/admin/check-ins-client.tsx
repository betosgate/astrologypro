"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Loader2, Search, Download, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DivinerRef {
  id: string;
  display_name: string;
  username: string;
}

interface CheckIn {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string | null;
  birth_city: string | null;
  birth_time: string | null;
  created_at: string;
  diviners: DivinerRef | DivinerRef[] | null;
}

interface ApiResponse {
  data: CheckIn[];
  nextCursor: string | null;
  total: number;
}

interface DivinerOption {
  id: string;
  display_name: string;
  username: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDiviner(ci: CheckIn): DivinerRef | null {
  if (!ci.diviners) return null;
  return Array.isArray(ci.diviners) ? ci.diviners[0] ?? null : ci.diviners;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckInsClient() {
  const [rows, setRows] = useState<CheckIn[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [divinerId, setDivinerId] = useState("all");
  const [diviners, setDiviners] = useState<DivinerOption[]>([]);
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch diviners for dropdown
  useEffect(() => {
    fetch("/api/admin/diviners?limit=200")
      .then((r) => r.json())
      .then((json: { data?: DivinerOption[] }) => {
        setDiviners(json.data ?? []);
      })
      .catch(() => {/* non-critical */});
  }, []);

  const fetchData = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams({ limit: "50" });
      if (divinerId && divinerId !== "all") params.set("diviner_id", divinerId);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/admin/check-ins?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        return json;
      } catch (err) {
        throw err;
      }
    },
    [divinerId, debouncedSearch]
  );

  // Initial / filter load
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
        if (!cancelled) setError("Failed to load check-ins.");
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

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (divinerId && divinerId !== "all") params.set("diviner_id", divinerId);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/admin/check-ins?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `check-ins-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore export errors silently
    } finally {
      setExporting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4"
            style={{ color: "rgba(184,188,208,0.5)" }}
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            aria-label="Search check-ins"
          />
        </div>

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            aria-label="Export CSV"
          >
            {exporting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-3.5" />
            )}
            Export CSV
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
              <TableHead className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(184,188,208,0.6)" }}>Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(184,188,208,0.6)" }}>Email</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Birth Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Birth City</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Birth Time</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>Diviner</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(184,188,208,0.6)" }}>Date</TableHead>
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
                    <Button variant="ghost" size="sm" onClick={() => setDebouncedSearch(search)}>
                      <RefreshCw className="mr-1.5 size-3.5" />
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm" style={{ color: "rgba(184,188,208,0.5)" }}>
                  No check-ins found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((ci) => {
                const diviner = getDiviner(ci);
                return (
                  <TableRow
                    key={ci.id}
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <TableCell className="font-medium text-sm" style={{ color: "#f5f0e8" }}>
                      {ci.first_name} {ci.last_name}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(184,188,208,0.8)" }}>
                      {ci.email}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>
                      {ci.birth_date ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>
                      {ci.birth_city ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>
                      {ci.birth_time ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell" style={{ color: "rgba(184,188,208,0.6)" }}>
                      {diviner?.display_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap" style={{ color: "rgba(184,188,208,0.5)" }}>
                      {formatDate(ci.created_at)}
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
