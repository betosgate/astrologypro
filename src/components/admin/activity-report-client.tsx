"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import type { ActivityItem } from "@/app/api/admin/reports/activity/route";
import { useAdminTableParams } from "./admin-table-parts";
import { ActivityReportDetailSheet } from "./activity-report-detail-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type Source = "user_activity" | "admin_activity" | "security_events";

interface Props {
  initialSource: Source;
  initialFilters: Filters;
  initialItems: ActivityItem[];
  initialCursor: string | null;
  initialTotal: number;
}

// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  auth:         "bg-blue-500/15 text-blue-400",
  booking:      "bg-green-500/15 text-green-400",
  payment:      "bg-amber-500/15 text-amber-400",
  reading:      "bg-purple-500/15 text-purple-400",
  subscription: "bg-teal-500/15 text-teal-400",
  admin:        "bg-orange-500/15 text-orange-400",
  security:     "bg-red-500/15 text-red-400",
  system:       "bg-gray-500/15 text-gray-400",
};

function CategoryBadge({ category }: { category?: string }) {
  const cat = (category ?? "system").toLowerCase();
  const cls = CATEGORY_COLORS[cat] ?? "bg-gray-500/15 text-gray-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {cat}
    </span>
  );
}

// ─── Expandable metadata JSON cell ───────────────────────────────────────────

function MetaCell({ metadata }: { metadata?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const summary = Object.entries(metadata)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
    .join(", ");
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((x) => !x)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-normal text-left"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {open ? "collapse" : summary}
      </button>
      {open && (
        <pre className="text-xs font-mono bg-muted/50 rounded p-2 whitespace-pre-wrap break-all max-w-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Format helper ────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
  });
}

// ─── Date range helper ────────────────────────────────────────────────────────

type DateRange = "today" | "7d" | "30d" | "all";

function toDateFilter(range: DateRange): string {
  if (range === "all") return "";
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  const days = range === "7d" ? 7 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString();
}

// ─── Activity table ───────────────────────────────────────────────────────────

function ActivityTable({
  items,
  loading,
  cursor,
  onLoadMore,
  onViewDetails,
}: {
  items: ActivityItem[];
  loading: boolean;
  cursor: string | null;
  onLoadMore: () => void;
  onViewDetails: (item: ActivityItem) => void;
}) {
  if (!loading && items.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No activity found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>IP</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.source}__${item.id}`}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {fmt(item.created_at)}
              </TableCell>
              <TableCell className="text-xs">
                {item.user_email ?? (
                  <span className="font-mono text-muted-foreground">{item.user_id.slice(0, 8)}…</span>
                )}
              </TableCell>
              <TableCell>
                <CategoryBadge category={item.event_category} />
              </TableCell>
              <TableCell className="text-xs font-medium">{item.event_type}</TableCell>
              <TableCell className="max-w-[220px]">
                <MetaCell metadata={item.metadata} />
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">
                {item.ip_address ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Activity row actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onViewDetails(item)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="size-3.5" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {cursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : null}
            Load More
          </Button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Export CSV helper ────────────────────────────────────────────────────────

function exportCsv(items: ActivityItem[], filename: string) {
  const header = ["time", "user_email", "user_id", "category", "event_type", "ip", "metadata"];
  const rows = items.map((i) => [
    new Date(i.created_at).toISOString(),
    i.user_email ?? "",
    i.user_id,
    i.event_category ?? "",
    i.event_type,
    i.ip_address ?? "",
    i.metadata ? JSON.stringify(i.metadata) : "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Filters bar ─────────────────────────────────────────────────────────────

interface Filters {
  category:  string;
  eventType: string;
  userId:    string;
  dateRange: DateRange;
}

function FiltersBar({
  source,
  filters,
  onChange,
}: {
  source: Source;
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {/* Date range */}
      <div className="flex gap-1 rounded-md border p-0.5">
        {(["today", "7d", "30d", "all"] as DateRange[]).map((r) => (
          <button
            key={r}
            onClick={() => onChange({ ...filters, dateRange: r })}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              filters.dateRange === r
                ? "bg-amber-500/20 text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "today" ? "Today" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
          </button>
        ))}
      </div>

      {/* Category — only for user_activity */}
      {source === "user_activity" && (
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
        >
          <option value="">All categories</option>
          {["auth", "booking", "payment", "reading", "subscription", "admin", "system"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Event type */}
      <Input
        placeholder="Event type…"
        value={filters.eventType}
        onChange={(e) => onChange({ ...filters, eventType: e.target.value })}
        className="h-8 w-40 text-xs"
      />

      {/* User ID search */}
      <Input
        placeholder="User ID…"
        value={filters.userId}
        onChange={(e) => onChange({ ...filters, userId: e.target.value })}
        className="h-8 w-56 font-mono text-xs"
      />

      {/* Clear */}
      {(filters.category || filters.eventType || filters.userId || filters.dateRange !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            onChange({ category: "", eventType: "", userId: "", dateRange: "all" })
          }
        >
          Clear
        </Button>
      )}
    </div>
  );
}

// ─── Per-tab state hook ───────────────────────────────────────────────────────

function useTabState(
  source: Source,
  initial: ActivityItem[],
  initCursor: string | null,
  initTotal: number,
  initialFilters: Filters,
  isInitiallyActive: boolean,
) {
  const [items, setItems] = useState<ActivityItem[]>(isInitiallyActive ? initial : []);
  const [cursor, setCursor] = useState<string | null>(isInitiallyActive ? initCursor : null);
  const [total, setTotal] = useState<number>(isInitiallyActive ? initTotal : 0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [initialized, setInitialized] = useState(isInitiallyActive);

  const fetchPage = useCallback(
    async (nextCursor: string | null, newFilters: Filters, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ source, limit: "50" });
        if (newFilters.category)  params.set("category",   newFilters.category);
        if (newFilters.eventType) params.set("event_type", newFilters.eventType);
        if (newFilters.userId)    params.set("user_id",    newFilters.userId);
        if (nextCursor)           params.set("cursor",     nextCursor);

        // Apply date range as cursor on first page
        if (!nextCursor && newFilters.dateRange !== "all") {
          params.set("date_after", toDateFilter(newFilters.dateRange));
        }

        const res  = await fetch(`/api/admin/reports/activity?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Fetch failed");

        if (append) {
          setItems((prev) => [...prev, ...(json.items ?? [])]);
        } else {
          setItems(json.items ?? []);
        }
        setCursor(json.next_cursor ?? null);
        setTotal(json.total_count ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [source]
  );

  const handleFiltersChange = useCallback(
    (f: Filters) => {
      setFilters(f);
      void fetchPage(null, f, false);
    },
    [fetchPage]
  );

  const handleLoadMore = useCallback(() => {
    if (cursor) void fetchPage(cursor, filters, true);
  }, [cursor, filters, fetchPage]);

  const ensureInit = useCallback(() => {
    if (!initialized) {
      setInitialized(true);
      void fetchPage(null, filters, false);
    }
  }, [initialized, fetchPage, filters]);

  return { items, cursor, total, loading, filters, handleFiltersChange, handleLoadMore, ensureInit };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityReportClient({
  initialSource,
  initialFilters,
  initialItems,
  initialCursor,
  initialTotal,
}: Props) {
  const { pushParams } = useAdminTableParams();
  const [activeTab, setActiveTab] = useState<Source>(initialSource);
  const [detailItem, setDetailItem] = useState<ActivityItem | null>(null);

  const ua = useTabState(
    "user_activity",
    initialItems,
    initialCursor,
    initialTotal,
    initialSource === "user_activity" ? initialFilters : { category: "", eventType: "", userId: "", dateRange: "all" },
    initialSource === "user_activity",
  );
  const aa = useTabState(
    "admin_activity",
    initialItems,
    initialCursor,
    initialTotal,
    initialSource === "admin_activity" ? initialFilters : { category: "", eventType: "", userId: "", dateRange: "all" },
    initialSource === "admin_activity",
  );
  const se = useTabState(
    "security_events",
    initialItems,
    initialCursor,
    initialTotal,
    initialSource === "security_events" ? initialFilters : { category: "", eventType: "", userId: "", dateRange: "all" },
    initialSource === "security_events",
  );

  function syncFiltersToUrl(source: Source, filters: Filters) {
    pushParams({
      source,
      category: source === "user_activity" ? filters.category : "",
      event_type: filters.eventType,
      user_id: filters.userId,
      date_range: filters.dateRange === "all" ? "" : filters.dateRange,
    });
  }

  function handleTabChange(tab: string) {
    const nextSource = tab as Source;
    setActiveTab(nextSource);
    const nextState = nextSource === "user_activity" ? ua : nextSource === "admin_activity" ? aa : se;
    syncFiltersToUrl(nextSource, nextState.filters);
    if (nextSource === "admin_activity") aa.ensureInit();
    if (nextSource === "security_events") se.ensureInit();
  }

  const activeState = activeTab === "user_activity" ? ua : activeTab === "admin_activity" ? aa : se;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            {activeState.total.toLocaleString()} records
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={activeState.items.length === 0}
          onClick={() =>
            exportCsv(
              activeState.items,
              `activity-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
            )
          }
        >
          <Download className="mr-1.5 size-3.5" />
          Export CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="user_activity">User Activity</TabsTrigger>
          <TabsTrigger value="admin_activity">Admin Actions</TabsTrigger>
          <TabsTrigger value="security_events">Security Events</TabsTrigger>
        </TabsList>

        {(["user_activity", "admin_activity", "security_events"] as Source[]).map((src) => {
          const state = src === "user_activity" ? ua : src === "admin_activity" ? aa : se;
          return (
            <TabsContent key={src} value={src}>
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base sr-only">
                    {src === "user_activity"
                      ? "User Activity"
                      : src === "admin_activity"
                      ? "Admin Actions"
                      : "Security Events"}
                  </CardTitle>
                  <FiltersBar
                    source={src}
                    filters={state.filters}
                    onChange={(nextFilters) => {
                      state.handleFiltersChange(nextFilters);
                      syncFiltersToUrl(src, nextFilters);
                    }}
                  />
                </CardHeader>
                <CardContent className="pt-0">
                  <ActivityTable
                    items={state.items}
                    loading={state.loading}
                    cursor={state.cursor}
                    onLoadMore={state.handleLoadMore}
                    onViewDetails={setDetailItem}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <ActivityReportDetailSheet
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}
