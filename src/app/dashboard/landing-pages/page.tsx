"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate,
  Search,
  ExternalLink,
  Copy,
  Eye,
  BarChart3,
  Globe,
  AlertTriangle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

interface LandingPageEntry {
  diviner_service_id: string;
  template_id: string;
  template_name: string;
  template_slug: string;
  template_category: string;
  template_icon: string | null;
  has_landing_page: boolean;
  landing_page_id: string | null;
  landing_page_status: "published" | "draft" | "unpublished" | "archived" | null;
  section_count: number;
  custom_section_count: number;
  published_at: string | null;
  moderation_status: string | null;
  is_enabled: boolean;
  is_published: boolean;
  publish_status: string | null;
  public_url: string;
  builder_url: string;
  price: number;
  duration_minutes: number;
  stats: { views: number; unique_visitors: number; bookings_completed: number; conversion_rate: number };
  updated_at: string;
}

interface Summary {
  total_enabled: number;
  total_published: number;
  total_draft: number;
  total_views_30d: number;
  total_bookings_30d: number;
}

function StatusBadge({
  status,
  moderationStatus,
  hasLandingPage,
  isPublished,
}: {
  status: string | null;
  moderationStatus: string | null;
  hasLandingPage: boolean;
  isPublished: boolean;
}) {
  if (moderationStatus === "flagged" || moderationStatus === "rejected") {
    return <Badge className="bg-red-500/15 text-red-400 border-red-500/20">Flagged</Badge>;
  }
  // When no custom builder row exists, the template-backed landing page is live
  // whenever diviner_services.is_published is true.
  if (!hasLandingPage && isPublished) {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Published</Badge>;
  }
  switch (status) {
    case "published":
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Published</Badge>;
    case "draft":
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">Draft</Badge>;
    case "unpublished":
      return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/20">Unpublished</Badge>;
    default:
      return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/20">No Page</Badge>;
  }
}

function LandingPageCard({ entry, username, onRefresh }: { entry: LandingPageEntry; username: string; onRefresh: () => void }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  const publicUrl = `${APP_URL}${entry.public_url}`;

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${entry.template_id}/publish`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? err.title ?? "Publish failed");
        return;
      }
      toast.success("Landing page published!");
      onRefresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setUnpublishing(true);
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${entry.template_id}/unpublish`, { method: "POST" });
      if (!res.ok) {
        toast.error("Unpublish failed");
        return;
      }
      toast.success("Landing page unpublished");
      onRefresh();
    } catch {
      toast.error("Network error");
    } finally {
      setUnpublishing(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success("Link copied to clipboard");
    });
  }

  const isFlagged = entry.moderation_status === "flagged" || entry.moderation_status === "rejected";

  return (
    <div className={cn(
      "rounded-2xl border bg-white/[0.02] p-5 transition-colors",
      isFlagged ? "border-red-500/20" : "border-white/[0.06]"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <LayoutTemplate className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-cream truncate">{entry.template_name}</h3>
            <p className="text-xs text-silver/50 capitalize">
              {entry.template_category} &middot; {entry.duration_minutes} min &middot; ${entry.price}
            </p>
          </div>
        </div>
        <StatusBadge
          status={entry.landing_page_status}
          moderationStatus={entry.moderation_status}
          hasLandingPage={entry.has_landing_page}
          isPublished={entry.is_published}
        />
      </div>

      {/* Moderation warning */}
      {isFlagged && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          This page has been flagged by our moderation team. Open the builder to review and fix the issue.
        </div>
      )}

      {/* Stats (if published) */}
      {entry.landing_page_status === "published" && (
        <div className="mt-3 flex gap-6 text-xs text-silver/50">
          <span>{entry.stats.views.toLocaleString()} views</span>
          <span>{entry.stats.bookings_completed} bookings</span>
          {entry.stats.conversion_rate > 0 && <span>{entry.stats.conversion_rate.toFixed(1)}% conversion</span>}
          {entry.custom_section_count > 0 && <span>{entry.custom_section_count} custom sections</span>}
        </div>
      )}

      {/* Draft info */}
      {entry.has_landing_page && entry.landing_page_status !== "published" && (
        <p className="mt-3 text-xs text-silver/50">
          {entry.custom_section_count > 0
            ? `${entry.custom_section_count} custom sections added`
            : "No custom sections yet — open builder to start"}
        </p>
      )}

      {!entry.has_landing_page && (
        <p className="mt-3 text-xs text-silver/50">
          {entry.is_published
            ? "Using the default template-backed landing page"
            : "No landing page created yet"}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={entry.builder_url}>
          <Button size="sm" variant="outline" className="h-8 text-xs border-gold/20 text-gold hover:bg-gold/10">
            <LayoutTemplate className="mr-1.5 size-3.5" />
            {entry.has_landing_page ? "Open Builder" : "Start Building"}
          </Button>
        </Link>

        {entry.has_landing_page && (
          <Link href={`${entry.public_url}?preview=true`} target="_blank">
            <Button size="sm" variant="ghost" className="h-8 text-xs text-silver/60 hover:text-cream">
              <Eye className="mr-1.5 size-3.5" />
              Preview
            </Button>
          </Link>
        )}

        {entry.landing_page_status === "published" && (
          <>
            <Button size="sm" variant="ghost" className="h-8 text-xs text-silver/60 hover:text-cream" onClick={handleCopyLink}>
              <Copy className="mr-1.5 size-3.5" />
              Copy Link
            </Button>
            <Link href={`/dashboard/landing-pages/${entry.template_id}/analytics`}>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-silver/60 hover:text-cream">
                <BarChart3 className="mr-1.5 size-3.5" />
                Analytics
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-silver/50 hover:text-red-400"
              onClick={handleUnpublish}
              disabled={unpublishing}
            >
              {unpublishing ? "Unpublishing..." : "Unpublish"}
            </Button>
          </>
        )}

        {entry.has_landing_page && entry.landing_page_status !== "published" && !isFlagged && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-emerald-400 hover:text-emerald-300"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Globe className="mr-1.5 size-3.5" />
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LandingPagesPage() {
  const [data, setData] = useState<{ landing_pages: LandingPageEntry[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [username, setUsername] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [listRes, profileRes] = await Promise.all([
        fetch(`/api/dashboard/landing-pages?${params}`),
        fetch("/api/dashboard/profile"),
      ]);

      if (listRes.ok) {
        const json = await listRes.json();
        setData(json);
      }
      if (profileRes.ok) {
        const p = await profileRes.json();
        setUsername(p.diviner?.username ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary;
  const entries = data?.landing_pages ?? [];

  return (
    <div className="min-h-screen bg-cosmos-950 px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Landing Pages</h1>
          <p className="mt-1 text-sm text-silver/60">
            Build and manage your service landing pages
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="text-silver/50 hover:text-cream"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total services", value: summary.total_enabled },
            { label: "Published", value: summary.total_published, green: true },
            { label: "Drafts", value: summary.total_draft },
            { label: "Views (30d)", value: summary.total_views_30d.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl font-bold text-cream">{s.value}</p>
              <p className="mt-0.5 text-xs text-silver/50">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-silver/40" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10 text-cream placeholder:text-silver/30"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/10 text-cream">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="astrology">Astrology</SelectItem>
            <SelectItem value="tarot">Tarot</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="freelance">Freelance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/10 text-cream">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft / Unpublished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LayoutTemplate className="size-12 text-silver/20 mb-4" />
          <h3 className="font-display text-xl font-semibold text-cream">
            {data?.landing_pages.length === 0 && !search && !categoryFilter && statusFilter === "all"
              ? "No services enabled yet"
              : "No results found"}
          </h3>
          <p className="mt-2 text-sm text-silver/50 max-w-sm">
            {data?.landing_pages.length === 0 && !search
              ? "Your account does not have any services enabled. Contact support to get started."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <LandingPageCard
              key={entry.template_id}
              entry={entry}
              username={username}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
