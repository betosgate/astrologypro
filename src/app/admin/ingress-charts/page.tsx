"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type IngressChart = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  is_published: boolean;
  is_social_advo: boolean;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  author_name: string | null;
  sector_focus: string[];
  tags: string[];
  created_at: string;
};

type StatsData = {
  total: number;
  published: number;
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

function getSectorKey(val: string): string {
  return SECTORS.find((s) => s.val === val)?.key ?? val;
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
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
  const [charts, setCharts] = useState<IngressChart[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, published: 0, upcoming: 0, social_advo: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleImportMongo() {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/ingress-charts/import-mongo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: false }),
      });
      
      const json = await res.json();
      if (res.ok) {
        toast.success(`Import completed! Processed: ${json.processed}, Inserted: ${json.inserted}`);
        fetchCharts(1, true); // Refresh the list
      } else {
        toast.error(`Import failed: ${json.detail || json.error || "Unknown error"}`);
      }
    } catch (error) {
      toast.error("An error occurred during import.");
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
  const [view, setView] = useState("");
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
          published: json.published ?? 0,
          upcoming: json.upcoming ?? 0,
          social_advo: json.social_advo ?? 0,
        });
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { fetchCharts(1, true); }, []);

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

  async function togglePublish(chart: IngressChart) {
    const res = await fetch(`/api/admin/ingress-charts/${chart.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !chart.is_published }),
    });
    if (res.ok) {
      setCharts((prev) =>
        prev.map((c) => c.id === chart.id ? { ...c, is_published: !c.is_published } : c)
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/ingress-charts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCharts((prev) => prev.filter((c) => c.id !== id));
      setStats((s) => ({ ...s, total: s.total - 1 }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mundane Astrology</h1>
          <p className="text-muted-foreground">Manage planetary ingress chart publications.</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={importing}>
                {importing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Globe className="mr-1.5 size-4" />}
                Import Mongo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import from MongoDB?</AlertDialogTitle>
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
                  Import
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Charts" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Upcoming" value={stats.upcoming} />
        <StatCard label="Social Advo" value={stats.social_advo} />
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
        <select
          value={ingressType}
          onChange={(e) => applyFilter("ingressType", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Types</option>
          <option value="Aries Ingress">Aries Ingress</option>
          <option value="Cancer Ingress">Cancer Ingress</option>
          <option value="Libra Ingress">Libra Ingress</option>
          <option value="Capricorn Ingress">Capricorn Ingress</option>
        </select>

        {/* Importance */}
        <select
          value={importance}
          onChange={(e) => applyFilter("importance", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Importance</option>
          <option value="High Impact">High Impact</option>
          <option value="Medium Impact">Medium Impact</option>
          <option value="Low Impact">Low Impact</option>
        </select>

        {/* Sector multi-select */}
        <SectorDropdown
          selected={sectors}
          onChange={(vals) => {
            setSectors(vals);
            fetchCharts(1, true, { sectors: vals });
          }}
        />

        {/* View toggle */}
        <select
          value={view}
          onChange={(e) => applyFilter("view", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => applyFilter("sort", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="event_asc">Event Date ↑</option>
          <option value="event_desc">Event Date ↓</option>
          <option value="name_asc">Name A–Z</option>
        </select>

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
        <div className="space-y-3">
          {charts.map((chart) => {
            const borderColor = INGRESS_COLORS[chart.ingress_type ?? ""] ?? "border-violet-500";

            return (
              <div
                key={chart.id}
                className={`relative rounded-lg border bg-card pl-1 shadow-sm border-l-4 ${borderColor}`}
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {chart.ingress_type && (
                        <Badge variant="outline" className="text-xs">
                          {chart.ingress_type}
                        </Badge>
                      )}
                      <span className="font-semibold text-base leading-tight">{chart.title}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {chart.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" /> {chart.location_name}
                        </span>
                      )}
                      {(chart.validity_start || chart.validity_end) && (
                        <span>
                          {chart.validity_start ? formatDate(chart.validity_start) : "—"}
                          {" – "}
                          {chart.validity_end ? formatDate(chart.validity_end) : "—"}
                        </span>
                      )}
                      {chart.importance && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${IMPORTANCE_BADGE[chart.importance] ?? ""}`}
                        >
                          {chart.importance}
                        </Badge>
                      )}
                      {chart.author_name && (
                        <span className="text-xs">by {chart.author_name}</span>
                      )}
                    </div>

                    {/* Sectors */}
                    {chart.sector_focus?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chart.sector_focus.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {getSectorKey(s)}
                          </span>
                        ))}
                        {chart.sector_focus.length > 2 && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            +{chart.sector_focus.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {chart.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chart.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {/* Social Advo toggle */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch
                        checked={chart.is_social_advo}
                        onCheckedChange={() => toggleSocialAdvo(chart)}
                        aria-label="Social Advo"
                      />
                      Advo
                    </div>

                    {/* Publish/Unpublish */}
                    <Button
                      size="sm"
                      variant={chart.is_published ? "secondary" : "outline"}
                      onClick={() => togglePublish(chart)}
                    >
                      {chart.is_published ? "Unpublish" : "Publish"}
                    </Button>

                    {/* Edit */}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/ingress-charts/${chart.id}/edit`}>
                        <Pencil className="size-3.5 mr-1" /> Edit
                      </Link>
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete ingress chart?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &ldquo;{chart.title}&rdquo; will be permanently deleted. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(chart.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
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
