"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Globe,
  MapPin,
  Plus,
  ChevronDown,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────────

const SECTORS = [
  { key: "Government & Leadership", val: "governmentAndLeadership" },
  { key: "Social Climate & Public Mood", val: "socialClimateAndPublicMood" },
  { key: "Weather & Agriculture", val: "weatherAndAgriculture" },
  { key: "Potential Conflicts & Alliances", val: "potentialConflictsAndAlliances" },
  { key: "Public Health & Workforce", val: "publicHealthAndWorkforce" },
  { key: "Communications & Transportation", val: "communicationsAndTransportation" },
  { key: "Justice, Law & Foreign Trade", val: "justiceLawAndForeignTrade" },
  { key: "Natural Disasters", val: "naturalDisasters" },
];

const INGRESS_COLORS: Record<string, string> = {
  "Aries Ingress": "border-green-500",
  "Cancer Ingress": "border-yellow-400",
  "Libra Ingress": "border-orange-500",
  "Capricorn Ingress": "border-blue-500",
};

const IMPORTANCE_BADGE: Record<string, string> = {
  "High Impact": "bg-red-100 text-red-700 border-red-200",
  "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Low Impact": "bg-green-100 text-green-700 border-green-200",
};

const VIEW_FILTERS = [
  { label: "All Charts", value: "" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "Social Advo", value: "social_advo" },
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

type IngressChart = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  short_description: string | null;
  is_social_advo: boolean;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  sector_focus: string[];
  tags: string[];
  created_at: string;
  event_timestamp: string | null;
};

type StatsData = {
  total: number;
  upcoming: number;
  social_advo: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatOptionalDate(iso: string | null) {
  return iso ? formatDate(iso) : "Not set";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSectorKey(val: string): string {
  return SECTORS.find((s) => s.val === val)?.key ?? val;
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border bg-card px-4 py-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "border-primary bg-primary/5" : ""
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </button>
  );
}

// ─── Sector dropdown ────────────────────────────────────────────────────────────

function SectorDropdown({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(val: string) {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  }

  const label =
    selected.length === 0
      ? "All Sectors"
      : `${selected.length} sector${selected.length > 1 ? "s" : ""}`;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 h-9"
        onClick={() => setOpen((v) => !v)}
      >
        {label} <ChevronDown className="size-3.5" />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-lg">
          {SECTORS.map((s) => (
            <label
              key={s.val}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.includes(s.val)}
                onChange={() => toggle(s.val)}
                className="size-3.5"
              />
              {s.key}
            </label>
          ))}
          {selected.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-xs"
              onClick={() => onChange([])}
            >
              Clear sectors
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminIngressChartsPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<IngressChart[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, upcoming: 0, social_advo: 0 });
  const [expandedSectorIds, setExpandedSectorIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleImportMongo(showToast = true) {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/ingress-charts/import-mongo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: false }),
      });
      
      const json = await res.json();
      if (res.ok) {
        if (showToast) {
          toast.success(`Import completed! Processed: ${json.processed}, Inserted: ${json.inserted}`);
        }
        fetchCharts(1, true); // Refresh the list
      } else {
        if (showToast) {
          toast.error(`Import failed: ${json.detail || json.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      if (showToast) {
        toast.error("An error occurred during import.");
      }
      console.error(error);
    } finally {
      setImporting(false);
    }
  }

  // Filters
  const [search, setSearch] = useState("");
  const [ingressType, setIngressType] = useState("");
  const [importance, setImportance] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [view, setView] = useState("upcoming");
  const [sort, setSort] = useState("newest");

  async function fetchCharts(p: number, replace: boolean, overrides?: Partial<{
    search: string; ingressType: string; importance: string;
    sectors: string[]; view: string; sort: string;
  }>) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    const s = overrides?.search ?? search;
    const it = overrides?.ingressType ?? ingressType;
    const imp = overrides?.importance ?? importance;
    const sec = overrides?.sectors ?? sectors;
    const v = overrides?.view ?? view;
    const so = overrides?.sort ?? sort;

    const params = new URLSearchParams({ page: String(p), sort: so });
    if (s) params.set("search", s);
    if (it) params.set("ingress_type", it);
    if (imp) params.set("importance", imp);
    if (sec.length) params.set("sectors", sec.join(","));
    if (v) params.set("view", v);

    const res = await fetch(`/api/admin/ingress-charts?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCharts((prev) => replace ? json.charts : [...prev, ...json.charts]);
      setHasMore(json.hasMore);
      setPage(p);
      if (p === 1) {
        setStats({
          total: json.total,
          upcoming: json.upcoming ?? 0,
          social_advo: json.social_advo ?? 0,
        });
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    void fetchCharts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter(key: string, value: unknown) {
    const overrides: Record<string, unknown> = {
      search, ingressType, importance, sectors, view, sort,
      [key]: value,
    };
    if (key === "ingressType") setIngressType(value as string);
    else if (key === "importance") setImportance(value as string);
    else if (key === "view") setView(value as string);
    else if (key === "sort") setSort(value as string);
    fetchCharts(1, true, overrides as Parameters<typeof fetchCharts>[2]);
  }

  async function toggleSocialAdvo(chart: IngressChart) {
    const res = await fetch(`/api/admin/ingress-charts/${chart.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_social_advo: !chart.is_social_advo }),
    });
    if (res.ok) {
      setCharts((prev) =>
        prev.map((c) => c.id === chart.id ? { ...c, is_social_advo: !c.is_social_advo } : c)
      );
    }
  }

  function toggleSectorExpansion(chartId: string) {
    setExpandedSectorIds((prev) => ({ ...prev, [chartId]: !prev[chartId] }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mundane Astrology</h1>
          <p className="text-muted-foreground">Manage planetary ingress charts.</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={importing}>
                {importing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Globe className="mr-1.5 size-4" />}
                Import Charts
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import charts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will connect to the legacy MongoDB and import ingress charts.
                  Existing charts with the same Mongo ID will be skipped.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleImportMongo()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Import Charts
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button asChild size="sm">
            <Link href="/admin/ingress-charts/new">
              <Plus className="mr-1.5 size-4" /> New Chart
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Charts"
          value={stats.total}
          active={view === ""}
          onClick={() => applyFilter("view", "")}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          active={view === "upcoming"}
          onClick={() => applyFilter("view", "upcoming")}
        />
        <StatCard
          label="Social Advo"
          value={stats.social_advo}
          active={view === "social_advo"}
          onClick={() => applyFilter("view", "social_advo")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Search title or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchCharts(1, true);
            }}
          />
        </div>

        {/* Ingress type */}
        <Select
          value={ingressType || "all"}
          onValueChange={(value) =>
            applyFilter("ingressType", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Aries Ingress">Aries Ingress</SelectItem>
            <SelectItem value="Cancer Ingress">Cancer Ingress</SelectItem>
            <SelectItem value="Libra Ingress">Libra Ingress</SelectItem>
            <SelectItem value="Capricorn Ingress">Capricorn Ingress</SelectItem>
          </SelectContent>
        </Select>

        {/* Importance */}
        <Select
          value={importance || "all"}
          onValueChange={(value) =>
            applyFilter("importance", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="all">All Importance</SelectItem>
            <SelectItem value="High Impact">High Impact</SelectItem>
            <SelectItem value="Medium Impact">Medium Impact</SelectItem>
            <SelectItem value="Low Impact">Low Impact</SelectItem>
          </SelectContent>
        </Select>

        {/* Sector multi-select */}
        <SectorDropdown
          selected={sectors}
          onChange={(vals) => {
            setSectors(vals);
            fetchCharts(1, true, { sectors: vals });
          }}
        />

        {/* View toggle */}
        <div
          className="flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-sm"
          role="group"
          aria-label="Chart view"
        >
          {VIEW_FILTERS.map((option) => {
            const selected = view === option.value;

            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => applyFilter("view", option.value)}
                className={`border-r px-3 text-sm font-medium transition last:border-r-0 ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <Select
          value={sort}
          onValueChange={(value) => applyFilter("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="event_asc">Event Date ↑</SelectItem>
            <SelectItem value="event_desc">Event Date ↓</SelectItem>
            <SelectItem value="name_asc">Name A–Z</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" onClick={() => fetchCharts(1, true)}>
          Search
        </Button>
      </div>

      {/* Chart list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : charts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Globe className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No ingress charts found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new chart.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((chart) => {
            const borderColor = INGRESS_COLORS[chart.ingress_type ?? ""] ?? "border-violet-500";
            const chartSectors = chart.sector_focus ?? [];
            const sectorsExpanded = expandedSectorIds[chart.id] ?? false;
            const visibleSectors = sectorsExpanded
              ? chartSectors
              : chartSectors.slice(0, 2);
            const detailHref = `/admin/ingress-charts/${chart.id}`;

            return (
              <div
                key={chart.id}
                role="link"
                tabIndex={0}
                aria-label={`View details for ${chart.title}`}
                onClick={() => router.push(detailHref)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(detailHref);
                  }
                }}
                className={`group flex min-h-[360px] cursor-pointer flex-col rounded-lg border-2 bg-card p-4 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${borderColor}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="size-3.5 shrink-0 text-orange-500" />
                    <span className="truncate">{chart.ingress_type ?? "Ingress Chart"}</span>
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch
                        checked={chart.is_social_advo}
                        onCheckedChange={() => toggleSocialAdvo(chart)}
                        aria-label="Social Advo"
                      />
                      Social Advo
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold leading-snug text-foreground">
                      {chart.title}
                    </h2>

                    {chart.short_description && (
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {chart.short_description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="inline-flex rounded-sm bg-primary/10 px-1.5 py-0.5 text-sm font-bold text-foreground">
                      This Chart Focused On :
                    </h3>
                    {chartSectors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {visibleSectors.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                          >
                            {getSectorKey(s)}
                          </span>
                        ))}
                        {chartSectors.length > 2 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSectorExpansion(chart.id);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            className="text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                          >
                            {sectorsExpanded ? "Less" : `+ ${chartSectors.length - 2} other`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No focus sectors added.</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto border-t pt-3">
                  <dl className="space-y-1.5 text-xs">
                    {chart.event_timestamp && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Event Timestamp</dt>
                        <dd className="text-right font-semibold text-foreground">
                          {formatDateTime(chart.event_timestamp)}
                        </dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Start date</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {formatOptionalDate(chart.validity_start)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">End date</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {formatOptionalDate(chart.validity_end)}
                      </dd>
                    </div>
                    {chart.location_name && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Location</dt>
                        <dd className="flex items-center justify-end gap-1 text-right font-semibold text-foreground">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                          {chart.location_name}
                        </dd>
                      </div>
                    )}
                    {chart.importance && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Importance</dt>
                        <dd>
                          <Badge
                            variant="outline"
                            className={`text-xs ${IMPORTANCE_BADGE[chart.importance] ?? ""}`}
                          >
                            {chart.importance}
                          </Badge>
                        </dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Created on</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {formatDate(chart.created_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2 md:col-span-2 xl:col-span-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCharts(page + 1, false)}
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
