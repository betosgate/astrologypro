"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "tarot" | "birth_chart" | "astro_toolkit";

interface TarotItem {
  id: string;
  user_id: string;
  user_email: string | null;
  spread_name: string | null;
  cards_count: number;
  notes: string | null;
  created_at: string;
}

interface BirthChartItem {
  id: string;
  user_id: string;
  user_email: string | null;
  city_label: string | null;
  birth_date: string;
  created_at: string;
}

interface AstroToolkitItem {
  id: string;
  user_id: string;
  user_email: string | null;
  reading_type: string | null;
  created_at: string;
}

type ReadingItem = TarotItem | BirthChartItem | AstroToolkitItem;

interface PaginatedResponse {
  items: ReadingItem[];
  next_cursor: string | null;
}

interface TabState {
  items: ReadingItem[];
  next_cursor: string | null;
  loading: boolean;
  total: number;
}

const EMPTY_TAB_STATE: TabState = {
  items: [],
  next_cursor: null,
  loading: false,
  total: 0,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialTarot: PaginatedResponse;
  initialBirthChart: PaginatedResponse;
  initialAstroToolkit: PaginatedResponse;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Expandable JSON row ──────────────────────────────────────────────────────

function ExpandableRow({
  id,
  expandedId,
  onToggle,
  payload,
  colSpan,
  children,
}: {
  id: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
  payload: Record<string, unknown> | null;
  colSpan: number;
  children: React.ReactNode;
}) {
  const isOpen = expandedId === id;
  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => onToggle(id)}
      >
        {children}
        <TableCell className="w-10 text-right">
          {isOpen ? (
            <ChevronUp className="size-4 text-amber-400 inline" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground inline" />
          )}
        </TableCell>
      </TableRow>
      {isOpen && payload && (
        <TableRow className="bg-white/[0.02]">
          <TableCell colSpan={colSpan} className="px-4 pb-4 pt-0">
            <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-white/10 bg-[#0d1020] p-3 text-xs text-[#f5f0e8]/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function ReadingsReportClient({
  initialTarot,
  initialBirthChart,
  initialAstroToolkit,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("tarot");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Per-tab state
  const [tarotState, setTarotState] = useState<TabState>({
    items: initialTarot.items,
    next_cursor: initialTarot.next_cursor,
    loading: false,
    total: initialTarot.items.length,
  });
  const [birthChartState, setBirthChartState] = useState<TabState>({
    items: initialBirthChart.items,
    next_cursor: initialBirthChart.next_cursor,
    loading: false,
    total: initialBirthChart.items.length,
  });
  const [astroToolkitState, setAstroToolkitState] = useState<TabState>({
    items: initialAstroToolkit.items,
    next_cursor: initialAstroToolkit.next_cursor,
    loading: false,
    total: initialAstroToolkit.items.length,
  });

  // Track if a filter-driven reload is needed (vs initial hydration)
  const isFirstRender = useRef(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Re-fetch when search or typeFilter changes (not on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchTab(activeTab, "reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter, activeTab]);

  function setState(tab: Tab, updater: (prev: TabState) => TabState) {
    if (tab === "tarot") setTarotState(updater);
    else if (tab === "birth_chart") setBirthChartState(updater);
    else setAstroToolkitState(updater);
  }

  function getState(tab: Tab): TabState {
    if (tab === "tarot") return tarotState;
    if (tab === "birth_chart") return birthChartState;
    return astroToolkitState;
  }

  const fetchTab = useCallback(
    async (tab: Tab, mode: "reset" | "more") => {
      const current = getState(tab);
      const cursor = mode === "more" ? (current.next_cursor ?? "") : "";

      setState(tab, (prev) => ({ ...prev, loading: true }));

      const params = new URLSearchParams({ tab, limit: "25" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tab === "astro_toolkit" && typeFilter && typeFilter !== "__all__") {
        params.set("type", typeFilter);
      }
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/admin/reports/readings?${params}`);
      if (!res.ok) {
        setState(tab, (prev) => ({ ...prev, loading: false }));
        return;
      }
      const data: PaginatedResponse = await res.json();

      setState(tab, (prev) => ({
        items: mode === "reset" ? data.items : [...prev.items, ...data.items],
        next_cursor: data.next_cursor,
        loading: false,
        total:
          mode === "reset"
            ? data.items.length
            : prev.total + data.items.length,
      }));

      if (mode === "reset") setExpandedId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, typeFilter, tarotState, birthChartState, astroToolkitState]
  );

  // ─── Payload fetch for expanded row ────────────────────────────────────────
  // We store full raw items from initial fetch; for "Load More" items the
  // details button fetches via the expandable row click.
  // Since initial data from server component doesn't include full JSON payloads
  // (to keep payload size small), we show the item's own data as the detail.
  // The full payload is already in each item as returned by the API.

  function handleToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ─── CSV export ────────────────────────────────────────────────────────────

  function exportCsv() {
    const state = getState(activeTab);
    if (activeTab === "tarot") {
      const header = ["ID", "User Email", "Spread Name", "Cards Count", "Notes", "Created At"];
      const rows = (state.items as TarotItem[]).map((r) => [
        r.id,
        r.user_email ?? "",
        r.spread_name ?? "",
        String(r.cards_count),
        r.notes ?? "",
        fmtDateTime(r.created_at),
      ]);
      downloadCsv([header, ...rows], `tarot-readings-${Date.now()}.csv`);
    } else if (activeTab === "birth_chart") {
      const header = ["ID", "User Email", "City", "Birth Date", "Created At"];
      const rows = (state.items as BirthChartItem[]).map((r) => [
        r.id,
        r.user_email ?? "",
        r.city_label ?? "",
        r.birth_date,
        fmtDateTime(r.created_at),
      ]);
      downloadCsv([header, ...rows], `birth-charts-${Date.now()}.csv`);
    } else {
      const header = ["ID", "User Email", "Reading Type", "Created At"];
      const rows = (state.items as AstroToolkitItem[]).map((r) => [
        r.id,
        r.user_email ?? "",
        r.reading_type ?? "",
        fmtDateTime(r.created_at),
      ]);
      downloadCsv([header, ...rows], `astro-toolkit-${Date.now()}.csv`);
    }
  }

  const currentState = getState(activeTab);

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by user email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40"
        />
        {activeTab === "astro_toolkit" && (
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v)}
          >
            <SelectTrigger className="h-9 w-48 bg-white/5 border-white/10 text-[#f5f0e8]">
              <SelectValue placeholder="All reading types" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1020] border-white/10 text-[#f5f0e8]">
              <SelectItem value="__all__">All types</SelectItem>
              <SelectItem value="natal_chart">Natal Chart</SelectItem>
              <SelectItem value="transit">Transit</SelectItem>
              <SelectItem value="solar_return">Solar Return</SelectItem>
              <SelectItem value="synastry">Synastry</SelectItem>
              <SelectItem value="composite">Composite</SelectItem>
              <SelectItem value="tarot">Tarot</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 text-xs"
          >
            {currentState.total} rows
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-white/10 text-[#f5f0e8]/70 hover:text-[#f5f0e8] hover:border-white/20"
            onClick={exportCsv}
            disabled={currentState.items.length === 0}
          >
            <Download className="size-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as Tab);
          setExpandedId(null);
        }}
      >
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger
            value="tarot"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            Tarot Readings
            <Badge variant="secondary" className="ml-2 text-xs">
              {tarotState.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="birth_chart"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            Birth Charts
            <Badge variant="secondary" className="ml-2 text-xs">
              {birthChartState.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="astro_toolkit"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            Astro Toolkit
            <Badge variant="secondary" className="ml-2 text-xs">
              {astroToolkitState.total}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── Tarot tab ──────────────────────────────────────────────────── */}
        <TabsContent value="tarot" className="mt-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-0">
              {tarotState.loading && tarotState.items.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-amber-400" />
                </div>
              ) : tarotState.items.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#f5f0e8]/40">
                  No tarot readings found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-[#f5f0e8]/50 font-medium">User</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Spread</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium text-center">Cards</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Notes</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Date</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tarotState.items as TarotItem[]).map((item) => (
                        <ExpandableRow
                          key={item.id}
                          id={item.id}
                          expandedId={expandedId}
                          onToggle={handleToggle}
                          payload={{ id: item.id, user_id: item.user_id, spread_name: item.spread_name, cards_count: item.cards_count, notes: item.notes, created_at: item.created_at }}
                          colSpan={6}
                        >
                          <TableCell className="text-[#f5f0e8]/80 text-xs">
                            <div>{item.user_email ?? <span className="text-[#f5f0e8]/30 italic">unknown</span>}</div>
                            <div className="text-[#f5f0e8]/30 font-mono mt-0.5">{item.user_id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/80">
                            {item.spread_name ? (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-400/80 text-xs">
                                {item.spread_name}
                              </Badge>
                            ) : (
                              <span className="text-[#f5f0e8]/30 text-xs italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-[#f5f0e8]/60 tabular-nums">
                            {item.cards_count}
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/50 text-xs max-w-48 truncate">
                            {item.notes ?? <span className="italic">—</span>}
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/40 text-xs whitespace-nowrap">
                            {fmtDate(item.created_at)}
                          </TableCell>
                        </ExpandableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Birth Chart tab ────────────────────────────────────────────── */}
        <TabsContent value="birth_chart" className="mt-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-0">
              {birthChartState.loading && birthChartState.items.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-amber-400" />
                </div>
              ) : birthChartState.items.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#f5f0e8]/40">
                  No birth chart readings found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-[#f5f0e8]/50 font-medium">User</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">City</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Birth Date</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(birthChartState.items as BirthChartItem[]).map((item) => (
                        <ExpandableRow
                          key={item.id}
                          id={item.id}
                          expandedId={expandedId}
                          onToggle={handleToggle}
                          payload={{ id: item.id, user_id: item.user_id, city_label: item.city_label, birth_date: item.birth_date, created_at: item.created_at }}
                          colSpan={5}
                        >
                          <TableCell className="text-[#f5f0e8]/80 text-xs">
                            <div>{item.user_email ?? <span className="text-[#f5f0e8]/30 italic">unknown</span>}</div>
                            <div className="text-[#f5f0e8]/30 font-mono mt-0.5">{item.user_id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/70 text-sm">
                            {item.city_label ?? <span className="text-[#f5f0e8]/30 italic text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/60 tabular-nums text-sm">
                            {item.birth_date}
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/40 text-xs whitespace-nowrap">
                            {fmtDate(item.created_at)}
                          </TableCell>
                        </ExpandableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Astro Toolkit tab ──────────────────────────────────────────── */}
        <TabsContent value="astro_toolkit" className="mt-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-0">
              {astroToolkitState.loading && astroToolkitState.items.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-amber-400" />
                </div>
              ) : astroToolkitState.items.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#f5f0e8]/40">
                  No astro toolkit readings found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-[#f5f0e8]/50 font-medium">User</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Reading Type</TableHead>
                        <TableHead className="text-[#f5f0e8]/50 font-medium">Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(astroToolkitState.items as AstroToolkitItem[]).map((item) => (
                        <ExpandableRow
                          key={item.id}
                          id={item.id}
                          expandedId={expandedId}
                          onToggle={handleToggle}
                          payload={{ id: item.id, user_id: item.user_id, reading_type: item.reading_type, created_at: item.created_at }}
                          colSpan={4}
                        >
                          <TableCell className="text-[#f5f0e8]/80 text-xs">
                            <div>{item.user_email ?? <span className="text-[#f5f0e8]/30 italic">unknown</span>}</div>
                            <div className="text-[#f5f0e8]/30 font-mono mt-0.5">{item.user_id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell>
                            {item.reading_type ? (
                              <Badge
                                variant="outline"
                                className="border-[#c9a84c]/40 text-[#c9a84c] text-xs capitalize"
                              >
                                {item.reading_type.replace(/_/g, " ")}
                              </Badge>
                            ) : (
                              <span className="text-[#f5f0e8]/30 text-xs italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[#f5f0e8]/40 text-xs whitespace-nowrap">
                            {fmtDate(item.created_at)}
                          </TableCell>
                        </ExpandableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Load More */}
      {currentState.next_cursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#f5f0e8]/70 hover:text-[#f5f0e8] hover:border-white/20"
            disabled={currentState.loading}
            onClick={() => fetchTab(activeTab, "more")}
          >
            {currentState.loading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
