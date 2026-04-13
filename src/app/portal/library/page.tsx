"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Video,
  Sparkles,
  Globe,
  Star,
  BookOpen,
  Play,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";

type TabKey = "all" | "recordings" | "tarot" | "charts" | "astro";

interface LibraryData {
  recordings: any[];
  tarot: any[];
  charts: any[];
  astro: any[];
  counts: {
    recordings: number;
    tarot: number;
    charts: number;
    astro: number;
  };
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <BookOpen className="size-4" /> },
  { key: "recordings", label: "Recordings", icon: <Video className="size-4" /> },
  { key: "tarot", label: "Tarot", icon: <Sparkles className="size-4" /> },
  { key: "charts", label: "Birth Charts", icon: <Globe className="size-4" /> },
  { key: "astro", label: "Astro Toolkit", icon: <Star className="size-4" /> },
];

const READING_TYPE_LABELS: Record<string, string> = {
  horoscope: "Horoscope",
  planet_return: "Planet Return",
  solar_return: "Solar Return",
  saturn_return: "Saturn Return",
  jupiter_return: "Jupiter Return",
  transit: "Transit",
  natal_chart: "Natal Chart",
  custom: "Custom Reading",
};

export default function LibraryPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const res = await fetch("/api/portal/library");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load your library. Please try again.
      </div>
    );
  }

  const totalCount =
    data.counts.recordings +
    data.counts.tarot +
    data.counts.charts +
    data.counts.astro;

  // Build unified chronological list for "All" tab
  const allItems = buildAllItems(data);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BookOpen className="size-6" />
          My Session Library
        </h1>
        <p className="text-muted-foreground">
          All your readings, recordings, and charts in one place.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          icon={<Video className="size-5 text-blue-500" />}
          label="Recordings"
          count={data.counts.recordings}
        />
        <SummaryCard
          icon={<Sparkles className="size-5 text-purple-500" />}
          label="Tarot Readings"
          count={data.counts.tarot}
        />
        <SummaryCard
          icon={<Globe className="size-5 text-green-500" />}
          label="Birth Charts"
          count={data.counts.charts}
        />
        <SummaryCard
          icon={<Star className="size-5 text-amber-500" />}
          label="Astro Readings"
          count={data.counts.astro}
        />
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="gap-1.5"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {activeTab === "all" && <AllTab items={allItems} />}
          {activeTab === "recordings" && (
            <RecordingsTab recordings={data.recordings} />
          )}
          {activeTab === "tarot" && <TarotTab readings={data.tarot} />}
          {activeTab === "charts" && <ChartsTab charts={data.charts} />}
          {activeTab === "astro" && <AstroTab readings={data.astro} />}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Summary Card ────────────────────────── */

function SummaryCard({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {icon}
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────── Empty State ──────────────────────────── */

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground/40" />
        <p className="text-lg font-medium">No sessions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Book your first reading to start building your library.
        </p>
        <Button asChild className="mt-6">
          <Link href="/discover">Find a Diviner</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────── Recordings Tab ───────────────────────── */

function RecordingsTab({ recordings }: { recordings: any[] }) {
  if (recordings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No recordings yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recordings.map((r: any) => (
        <Card key={r.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Video className="size-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {r.services?.name ?? "Session"}
                </p>
                <p className="text-xs text-muted-foreground">
                  with {r.diviners?.display_name ?? "Diviner"} &middot;{" "}
                  {formatDateTime(r.scheduled_at)}
                  {r.actual_duration_minutes
                    ? ` &middot; ${r.actual_duration_minutes} min`
                    : ""}
                </p>
              </div>
            </div>
            {r.recording_share_id && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/session/${r.recording_share_id}/recording`}>
                  <Play className="mr-1 size-3" />
                  Watch Recording
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ────────────────────────── Tarot Tab ────────────────────────────── */

function TarotTab({ readings }: { readings: any[] }) {
  if (readings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No tarot readings yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {readings.map((r: any) => {
        const cardCount = Array.isArray(r.cards) ? r.cards.length : 0;
        const notesPreview = r.notes
          ? r.notes.length > 100
            ? r.notes.slice(0, 100) + "..."
            : r.notes
          : null;

        return (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-5 text-purple-500" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{r.spread_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.diviners?.display_name
                      ? `with ${r.diviners.display_name} \u00b7 `
                      : ""}
                    {formatDate(r.created_at)} &middot; {cardCount} card
                    {cardCount !== 1 ? "s" : ""} drawn
                  </p>
                  {notesPreview && (
                    <p className="text-xs text-muted-foreground/80 italic">
                      {notesPreview}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ────────────────────────── Birth Charts Tab ────────────────────── */

function ChartsTab({ charts }: { charts: any[] }) {
  if (charts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No birth charts yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {charts.map((c: any) => (
        <Card key={c.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="size-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{c.city_label}</p>
                <p className="text-xs text-muted-foreground">
                  {c.diviners?.display_name
                    ? `with ${c.diviners.display_name} \u00b7 `
                    : ""}
                  Born {c.birth_month}/{c.birth_day}/{c.birth_year} &middot;{" "}
                  {formatDate(c.created_at)}
                </p>
              </div>
            </div>
            {c.chart_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={c.chart_url} target="_blank" rel="noopener noreferrer">
                  View Chart
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ────────────────────────── Astro Toolkit Tab ───────────────────── */

function AstroTab({ readings }: { readings: any[] }) {
  if (readings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No astro toolkit readings yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {readings.map((r: any) => {
        const typeLabel =
          READING_TYPE_LABELS[r.reading_type] ?? r.reading_type;
        const summary = getAstroSummary(r.result_data);

        return (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 size-5 text-amber-500" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{typeLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.diviners?.display_name
                      ? `with ${r.diviners.display_name} \u00b7 `
                      : ""}
                    {formatDate(r.created_at)}
                  </p>
                  {summary && (
                    <p className="text-xs text-muted-foreground/80 italic">
                      {summary}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ────────────────────────── All Tab (Chronological) ─────────────── */

interface UnifiedItem {
  id: string;
  type: "recording" | "tarot" | "chart" | "astro";
  date: string;
  data: any;
}

function buildAllItems(data: LibraryData): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  for (const r of data.recordings) {
    items.push({
      id: r.id,
      type: "recording",
      date: r.scheduled_at,
      data: r,
    });
  }
  for (const r of data.tarot) {
    items.push({
      id: r.id,
      type: "tarot",
      date: r.created_at,
      data: r,
    });
  }
  for (const c of data.charts) {
    items.push({
      id: c.id,
      type: "chart",
      date: c.created_at,
      data: c,
    });
  }
  for (const r of data.astro) {
    items.push({
      id: r.id,
      type: "astro",
      date: r.created_at,
      data: r,
    });
  }

  items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return items;
}

const TYPE_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  recording: {
    label: "Recording",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  tarot: {
    label: "Tarot",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  chart: {
    label: "Chart",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  astro: {
    label: "Astro",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

function AllTab({ items }: { items: UnifiedItem[] }) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const badge = TYPE_BADGE[item.type];
        return (
          <Card key={`${item.type}-${item.id}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {item.type === "recording" && (
                  <Video className="size-5 text-blue-500" />
                )}
                {item.type === "tarot" && (
                  <Sparkles className="size-5 text-purple-500" />
                )}
                {item.type === "chart" && (
                  <Globe className="size-5 text-green-500" />
                )}
                {item.type === "astro" && (
                  <Star className="size-5 text-amber-500" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {getItemTitle(item)}
                    </p>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getItemSubtitle(item)}
                  </p>
                </div>
              </div>
              {getItemAction(item)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getItemTitle(item: UnifiedItem): string {
  switch (item.type) {
    case "recording":
      return item.data.services?.name ?? "Session";
    case "tarot":
      return item.data.spread_name;
    case "chart":
      return item.data.city_label;
    case "astro":
      return (
        READING_TYPE_LABELS[item.data.reading_type] ??
        item.data.reading_type
      );
  }
}

function getItemSubtitle(item: UnifiedItem): string {
  const divinerName =
    item.data.diviners?.display_name ?? null;
  const prefix = divinerName ? `with ${divinerName} \u00b7 ` : "";

  switch (item.type) {
    case "recording":
      return `${prefix}${formatDateTime(item.data.scheduled_at)}`;
    case "tarot":
      return `${prefix}${formatDate(item.data.created_at)}`;
    case "chart":
      return `${prefix}Born ${item.data.birth_month}/${item.data.birth_day}/${item.data.birth_year}`;
    case "astro":
      return `${prefix}${formatDate(item.data.created_at)}`;
  }
}

function getItemAction(item: UnifiedItem): React.ReactNode {
  if (
    item.type === "recording" &&
    item.data.recording_share_id
  ) {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link
          href={`/session/${item.data.recording_share_id}/recording`}
        >
          <Play className="mr-1 size-3" />
          Watch
        </Link>
      </Button>
    );
  }
  if (item.type === "chart" && item.data.chart_url) {
    return (
      <Button size="sm" variant="outline" asChild>
        <a
          href={item.data.chart_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Chart
        </a>
      </Button>
    );
  }
  return null;
}

/* ────────────────────────── Helpers ──────────────────────────────── */

function getAstroSummary(resultData: any): string | null {
  if (!resultData || typeof resultData !== "object") return null;

  // Try common meaningful fields first
  if (typeof resultData.summary === "string") {
    return resultData.summary.length > 100
      ? resultData.summary.slice(0, 100) + "..."
      : resultData.summary;
  }
  if (typeof resultData.description === "string") {
    return resultData.description.length > 100
      ? resultData.description.slice(0, 100) + "..."
      : resultData.description;
  }

  // Fallback to stringified preview
  const str = JSON.stringify(resultData);
  if (str.length <= 5) return null;
  return str.length > 100 ? str.slice(0, 100) + "..." : str;
}
