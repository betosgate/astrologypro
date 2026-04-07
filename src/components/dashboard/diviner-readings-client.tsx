"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TarotReading {
  id: string;
  user_id: string | null;
  diviner_id: string | null;
  spread_name: string | null;
  cards: unknown;
  notes: string | null;
  created_at: string;
}

export interface BirthChartReading {
  id: string;
  user_id: string | null;
  diviner_id: string | null;
  city_label: string | null;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  created_at: string;
}

export interface AstroToolkitReading {
  id: string;
  user_id: string | null;
  diviner_id: string | null;
  reading_type: string | null;
  input_data: unknown;
  result_data: unknown;
  created_at: string;
}

export type TabKey = "tarot" | "birth_chart" | "astro_toolkit";

export interface InitialData {
  tarot: { readings: TarotReading[]; nextCursor: string | null; hasMore: boolean };
  birth_chart: { readings: BirthChartReading[]; nextCursor: string | null; hasMore: boolean };
  astro_toolkit: { readings: AstroToolkitReading[]; nextCursor: string | null; hasMore: boolean };
}

interface DivinerReadingsClientProps {
  initialData: InitialData;
  counts: { tarot: number; birth_chart: number; astro_toolkit: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function jsonToString(val: unknown): string {
  if (val === null || val === undefined) return "--";
  if (typeof val === "string") return val;
  return JSON.stringify(val, null, 2);
}

// ---------------------------------------------------------------------------
// Export CSV utility — runs entirely in the browser, no library needed
// ---------------------------------------------------------------------------

function exportCsv(rows: unknown[], filename: string) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0] as Record<string, unknown>);
  const escape = (v: unknown) => {
    const s = jsonToString(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const header = keys.join(",");
  const body = rows
    .map((r) =>
      keys.map((k) => escape((r as Record<string, unknown>)[k])).join(",")
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Expandable detail row
// ---------------------------------------------------------------------------

function ExpandedDetail({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  const text = jsonToString(value);
  if (!text || text === "--") return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wide">
        {label}
      </p>
      <pre className="whitespace-pre-wrap break-words rounded bg-white/5 p-3 text-xs font-mono text-[#f5f0e8]/80 max-h-48 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Tarot Readings table
// ---------------------------------------------------------------------------

function TarotTable({
  readings,
  hasMore,
  loadingMore,
  onLoadMore,
  onExport,
}: {
  readings: TarotReading[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onExport: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (readings.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#f5f0e8]/50">
        No tarot readings linked to your account yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
          onClick={onExport}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#f5f0e8]/60">Date</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Spread</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Client ID</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Notes</TableHead>
              <TableHead className="w-[80px] text-[#f5f0e8]/60">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => (
              <>
                <TableRow
                  key={r.id}
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                >
                  <TableCell className="text-[#f5f0e8]/80">
                    <div>{formatDate(r.created_at)}</div>
                    <div className="text-xs text-[#f5f0e8]/40">
                      {formatTime(r.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.spread_name ? (
                      <Badge
                        variant="outline"
                        className="border-[#c9a84c]/40 text-[#c9a84c] text-xs"
                      >
                        {r.spread_name}
                      </Badge>
                    ) : (
                      <span className="text-[#f5f0e8]/40">--</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#f5f0e8]/50">
                    {r.user_id ? r.user_id.slice(0, 8) + "…" : "--"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-[#f5f0e8]/70">
                    {r.notes ?? "--"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[#f5f0e8]/50 hover:text-[#f5f0e8] hover:bg-white/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === r.id ? null : r.id);
                      }}
                      aria-label={
                        expandedId === r.id ? "Collapse details" : "Expand details"
                      }
                    >
                      {expandedId === r.id ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedId === r.id && (
                  <TableRow
                    key={`${r.id}-expanded`}
                    className="border-white/5 bg-white/[0.02]"
                  >
                    <TableCell colSpan={5} className="py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ExpandedDetail label="Cards" value={r.cards} />
                        <ExpandedDetail label="Notes" value={r.notes} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Birth Chart Readings table
// ---------------------------------------------------------------------------

function BirthChartTable({
  readings,
  hasMore,
  loadingMore,
  onLoadMore,
  onExport,
}: {
  readings: BirthChartReading[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onExport: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (readings.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#f5f0e8]/50">
        No birth chart readings linked to your account yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
          onClick={onExport}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#f5f0e8]/60">Date</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Location</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Birth Date</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Client ID</TableHead>
              <TableHead className="w-[80px] text-[#f5f0e8]/60">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => (
              <>
                <TableRow
                  key={r.id}
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                >
                  <TableCell className="text-[#f5f0e8]/80">
                    <div>{formatDate(r.created_at)}</div>
                    <div className="text-xs text-[#f5f0e8]/40">
                      {formatTime(r.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#f5f0e8]/80">
                    {r.city_label ?? "--"}
                  </TableCell>
                  <TableCell className="text-sm text-[#f5f0e8]/70">
                    {r.birth_day && r.birth_month && r.birth_year
                      ? `${r.birth_day}/${r.birth_month}/${r.birth_year}`
                      : "--"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#f5f0e8]/50">
                    {r.user_id ? r.user_id.slice(0, 8) + "…" : "--"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[#f5f0e8]/50 hover:text-[#f5f0e8] hover:bg-white/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === r.id ? null : r.id);
                      }}
                      aria-label={
                        expandedId === r.id ? "Collapse details" : "Expand details"
                      }
                    >
                      {expandedId === r.id ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedId === r.id && (
                  <TableRow
                    key={`${r.id}-expanded`}
                    className="border-white/5 bg-white/[0.02]"
                  >
                    <TableCell colSpan={5} className="py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wide">
                            Full Location
                          </p>
                          <p className="text-sm text-[#f5f0e8]/80">
                            {r.city_label ?? "--"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wide">
                            Birth Date
                          </p>
                          <p className="text-sm text-[#f5f0e8]/80">
                            {r.birth_day}/{r.birth_month}/{r.birth_year}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Astro Toolkit Readings table
// ---------------------------------------------------------------------------

function AstroToolkitTable({
  readings,
  hasMore,
  loadingMore,
  onLoadMore,
  onExport,
}: {
  readings: AstroToolkitReading[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onExport: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (readings.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#f5f0e8]/50">
        No astro toolkit readings linked to your account yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
          onClick={onExport}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#f5f0e8]/60">Date</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Reading Type</TableHead>
              <TableHead className="text-[#f5f0e8]/60">Client ID</TableHead>
              <TableHead className="w-[80px] text-[#f5f0e8]/60">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => (
              <>
                <TableRow
                  key={r.id}
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                >
                  <TableCell className="text-[#f5f0e8]/80">
                    <div>{formatDate(r.created_at)}</div>
                    <div className="text-xs text-[#f5f0e8]/40">
                      {formatTime(r.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.reading_type ? (
                      <Badge
                        variant="outline"
                        className="border-[#c9a84c]/40 text-[#c9a84c] text-xs"
                      >
                        {r.reading_type}
                      </Badge>
                    ) : (
                      <span className="text-[#f5f0e8]/40">--</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#f5f0e8]/50">
                    {r.user_id ? r.user_id.slice(0, 8) + "…" : "--"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[#f5f0e8]/50 hover:text-[#f5f0e8] hover:bg-white/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === r.id ? null : r.id);
                      }}
                      aria-label={
                        expandedId === r.id ? "Collapse details" : "Expand details"
                      }
                    >
                      {expandedId === r.id ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedId === r.id && (
                  <TableRow
                    key={`${r.id}-expanded`}
                    className="border-white/5 bg-white/[0.02]"
                  >
                    <TableCell colSpan={4} className="py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ExpandedDetail label="Input Data" value={r.input_data} />
                        <ExpandedDetail label="Result Data" value={r.result_data} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-[#f5f0e8]/70 hover:bg-white/5 hover:text-[#f5f0e8]"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<TabKey, string> = {
  tarot: "Tarot",
  birth_chart: "Birth Charts",
  astro_toolkit: "Astro Toolkit",
};

export function DivinerReadingsClient({
  initialData,
  counts,
}: DivinerReadingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("tarot");

  // Per-tab state
  const [tarotReadings, setTarotReadings] = useState<TarotReading[]>(
    initialData.tarot.readings
  );
  const [tarotCursor, setTarotCursor] = useState<string | null>(
    initialData.tarot.nextCursor
  );
  const [tarotHasMore, setTarotHasMore] = useState(initialData.tarot.hasMore);

  const [birthChartReadings, setBirthChartReadings] = useState<BirthChartReading[]>(
    initialData.birth_chart.readings
  );
  const [birthChartCursor, setBirthChartCursor] = useState<string | null>(
    initialData.birth_chart.nextCursor
  );
  const [birthChartHasMore, setBirthChartHasMore] = useState(
    initialData.birth_chart.hasMore
  );

  const [astroReadings, setAstroReadings] = useState<AstroToolkitReading[]>(
    initialData.astro_toolkit.readings
  );
  const [astroCursor, setAstroCursor] = useState<string | null>(
    initialData.astro_toolkit.nextCursor
  );
  const [astroHasMore, setAstroHasMore] = useState(
    initialData.astro_toolkit.hasMore
  );

  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(
    async (tab: TabKey) => {
      const cursor =
        tab === "tarot"
          ? tarotCursor
          : tab === "birth_chart"
          ? birthChartCursor
          : astroCursor;

      if (!cursor) return;
      setLoadingMore(true);

      try {
        const params = new URLSearchParams({ tab, limit: "25" });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(
          `/api/dashboard/reports/readings?${params.toString()}`
        );
        if (!res.ok) return;
        const json = await res.json();

        if (tab === "tarot") {
          setTarotReadings((prev) => [...prev, ...(json.readings ?? [])]);
          setTarotCursor(json.nextCursor ?? null);
          setTarotHasMore(json.hasMore ?? false);
        } else if (tab === "birth_chart") {
          setBirthChartReadings((prev) => [...prev, ...(json.readings ?? [])]);
          setBirthChartCursor(json.nextCursor ?? null);
          setBirthChartHasMore(json.hasMore ?? false);
        } else {
          setAstroReadings((prev) => [...prev, ...(json.readings ?? [])]);
          setAstroCursor(json.nextCursor ?? null);
          setAstroHasMore(json.hasMore ?? false);
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [tarotCursor, birthChartCursor, astroCursor]
  );

  function exportCurrentTab() {
    if (activeTab === "tarot") {
      exportCsv(tarotReadings, "tarot-readings.csv");
    } else if (activeTab === "birth_chart") {
      exportCsv(birthChartReadings, "birth-chart-readings.csv");
    } else {
      exportCsv(astroReadings, "astro-toolkit-readings.csv");
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="text-[#f5f0e8]">Reading History</CardTitle>
        <CardDescription className="text-[#f5f0e8]/50">
          All readings linked to your diviner account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab selector */}
        <div
          className="flex gap-1 rounded-lg bg-white/[0.04] p-1"
          role="tablist"
          aria-label="Reading type tabs"
        >
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => {
            const count =
              tab === "tarot"
                ? counts.tarot
                : tab === "birth_chart"
                ? counts.birth_chart
                : counts.astro_toolkit;

            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#c9a84c] text-[#06080f] shadow-sm"
                    : "text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-white/5"
                }`}
              >
                {TAB_LABELS[tab]}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                    activeTab === tab
                      ? "bg-[#06080f]/20 text-[#06080f]"
                      : "bg-white/10 text-[#f5f0e8]/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        {activeTab === "tarot" && (
          <TarotTable
            readings={tarotReadings}
            hasMore={tarotHasMore}
            loadingMore={loadingMore}
            onLoadMore={() => loadMore("tarot")}
            onExport={exportCurrentTab}
          />
        )}
        {activeTab === "birth_chart" && (
          <BirthChartTable
            readings={birthChartReadings}
            hasMore={birthChartHasMore}
            loadingMore={loadingMore}
            onLoadMore={() => loadMore("birth_chart")}
            onExport={exportCurrentTab}
          />
        )}
        {activeTab === "astro_toolkit" && (
          <AstroToolkitTable
            readings={astroReadings}
            hasMore={astroHasMore}
            loadingMore={loadingMore}
            onLoadMore={() => loadMore("astro_toolkit")}
            onExport={exportCurrentTab}
          />
        )}
      </CardContent>
    </Card>
  );
}
