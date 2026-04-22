/**
 * Diviner dashboard — "Your services" page.
 *
 * Rewritten in Task 05 of the 2026-04-21 landing-page-simplification.
 *
 * V2 contract:
 *   - ONE actionable toggle per service: Live / Offline, writes
 *     diviner_services.is_published via POST
 *     /api/dashboard/landing-pages/:templateId/toggle-live.
 *   - Admin state (services.is_active, diviner_services.is_enabled) renders
 *     as a read-only "Deactivated by admin" notice that disables the toggle.
 *   - "Customize" always routes to the builder, regardless of live state.
 *   - "View live page" appears only when the service is Live + not
 *     admin-disabled — it hides entirely otherwise so the diviner never gets
 *     a 404 from the dashboard.
 *   - No Published / Draft / Unpublished / Flagged badges. No Preview button.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutTemplate,
  Search,
  ExternalLink,
  BarChart3,
  Plus,
  RefreshCw,
  AlertTriangle,
  Settings2,
  Circle,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types matching the Task 05 API contract ──────────────────────────────────

interface ServiceRow {
  template_id: string;
  template_name: string;
  template_slug: string;
  template_category: string;
  template_icon: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  is_enabled: boolean;
  is_published: boolean;
  admin_disabled: boolean;
  block_count: { about_diviner: number; extra: number };
  last_edited_at: string | null;
  builder_url: string;
  public_url: string;
  analytics_url: string;
}

interface Summary {
  total: number;
  live: number;
  offline: number;
  admin_disabled: number;
}

// ── Row component ────────────────────────────────────────────────────────────

function ServiceRowCard({
  row,
  onToggle,
}: {
  row: ServiceRow;
  onToggle: (row: ServiceRow, nextLive: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const totalBlocks = row.block_count.about_diviner + row.block_count.extra;

  async function handleToggle(v: boolean) {
    if (row.admin_disabled) return;
    setBusy(true);
    try {
      await onToggle(row, v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-cosmos-900/40 p-5 flex flex-col gap-3 md:flex-row md:items-center md:gap-6",
        row.admin_disabled && "opacity-80",
      )}
    >
      {/* Icon + text */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
          <LayoutTemplate className="size-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-cream truncate">
              {row.template_name}
            </h3>
            <LiveBadge
              live={row.is_published && !row.admin_disabled}
              adminDisabled={row.admin_disabled}
            />
          </div>
          <p className="text-xs text-silver/60 mt-0.5 capitalize">
            {row.template_category} · {row.duration_minutes} min · $
            {Number(row.price).toFixed(0)}
          </p>
          {row.admin_disabled ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300/85">
              <AlertTriangle className="size-3.5" />
              Deactivated by admin — contact support to re-enable
            </div>
          ) : (
            <p className="text-xs text-silver/45 mt-1">
              {totalBlocks > 0
                ? `${totalBlocks} custom block${totalBlocks === 1 ? "" : "s"}`
                : "No custom blocks yet"}
              {row.last_edited_at ? ` · Last edited ${fmtRelative(row.last_edited_at)}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap md:justify-end">
        {/* Live toggle (disabled when admin-disabled) */}
        <div className="flex items-center gap-2">
          <Switch
            checked={row.is_published && !row.admin_disabled}
            disabled={row.admin_disabled || busy}
            onCheckedChange={handleToggle}
            aria-label={
              row.is_published
                ? `Take ${row.template_name} offline`
                : `Take ${row.template_name} live`
            }
          />
          <span className="text-xs uppercase tracking-wider text-silver/60 min-w-[52px]">
            {row.is_published && !row.admin_disabled ? "Live" : "Offline"}
          </span>
        </div>

        {/* Customize — always available */}
        <Link href={row.builder_url}>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:bg-white/5"
          >
            <Settings2 className="size-3.5 mr-1.5" />
            Customize
          </Button>
        </Link>

        {/* View live page — only when actually live */}
        {row.is_published && !row.admin_disabled ? (
          <Link
            href={row.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold/80 hover:text-gold transition-colors px-2 py-1"
          >
            <ExternalLink className="size-3.5" />
            View live page
          </Link>
        ) : null}

        {/* Analytics */}
        <Link
          href={row.analytics_url}
          className="inline-flex items-center gap-1.5 text-xs text-silver/60 hover:text-silver transition-colors px-2 py-1"
        >
          <BarChart3 className="size-3.5" />
          Analytics
        </Link>
      </div>
    </div>
  );
}

function LiveBadge({ live, adminDisabled }: { live: boolean; adminDisabled: boolean }) {
  if (adminDisabled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5 text-[10px] font-medium">
        <Circle className="size-2 fill-amber-400 text-amber-400" />
        Admin-disabled
      </span>
    );
  }
  return live ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[10px] font-medium">
      <Circle className="size-2 fill-emerald-400 text-emerald-400" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 text-slate-300 px-2 py-0.5 text-[10px] font-medium">
      <Circle className="size-2 fill-slate-400 text-slate-400" />
      Offline
    </span>
  );
}

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPagesDashboard() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    live: 0,
    offline: 0,
    admin_disabled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "offline">("all");
  const [category, setCategory] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (category !== "all") qs.set("category", category);
      if (statusFilter !== "all") qs.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/landing-pages?${qs.toString()}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      setRows(json.services ?? []);
      setSummary(json.summary ?? { total: 0, live: 0, offline: 0, admin_disabled: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [search, category, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(row: ServiceRow, nextLive: boolean) {
    try {
      const res = await fetch(
        `/api/dashboard/landing-pages/${row.template_id}/toggle-live`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_published: nextLive }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(json.detail ?? "Admin has disabled this service.");
        } else {
          toast.error(json.title ?? "Toggle failed");
        }
        return;
      }
      toast.success(nextLive ? "Service is now Live" : "Service is now Offline");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  }

  return (
    <div className="min-h-screen bg-cosmos-950 py-8 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-cream">Your services</h1>
            <p className="mt-1 text-sm text-silver/60">
              Take services live, customize the page blocks, and watch your traffic.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryStat label="Total services" value={summary.total} />
          <SummaryStat label="Live" value={summary.live} tone="emerald" />
          <SummaryStat label="Offline" value={summary.offline} tone="slate" />
          <SummaryStat label="Admin-disabled" value={summary.admin_disabled} tone="amber" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-silver/50" />
            <Input
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-cosmos-900/40 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-cosmos-900/40 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-cosmos-900/40 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="astrology">Astrology</SelectItem>
              <SelectItem value="tarot">Tarot</SelectItem>
              <SelectItem value="spiritual_guidance">Spiritual Guidance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="text-center py-16 text-silver/50">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <ServiceRowCard key={r.template_id} row={r} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "slate" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "slate"
        ? "text-slate-300"
        : tone === "amber"
          ? "text-amber-300"
          : "text-cream";
  return (
    <div className="rounded-xl border border-white/10 bg-cosmos-900/40 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-silver/50">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold", toneClass)}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-cosmos-900/30 py-16 text-center">
      <Plus className="mx-auto size-8 text-silver/40 mb-3" />
      <p className="text-silver/70">No services match the current filters.</p>
      <p className="text-xs text-silver/50 mt-1">
        Clear the filters or ask an admin to assign a service to your account.
      </p>
    </div>
  );
}
