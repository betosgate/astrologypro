"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  Building2,
  UserRound,
  CalendarDays,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SearchResult = {
  id: string;
  type: "entity" | "leader" | "event" | "forecast";
  title: string;
  snippet: string;
  href: string;
};

type Counts = {
  all: number;
  entity: number;
  leader: number;
  event: number;
  forecast: number;
};

type TabId = "all" | "entity" | "leader" | "event" | "forecast";

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  result_types: string[];
  created_at: string;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  entity: Building2,
  leader: UserRound,
  event: CalendarDays,
  forecast: TrendingUp,
};

const TYPE_BADGE_COLOR: Record<string, string> = {
  entity: "bg-blue-100 text-blue-700 border-blue-200",
  leader: "bg-purple-100 text-purple-700 border-purple-200",
  event: "bg-amber-100 text-amber-700 border-amber-200",
  forecast: "bg-green-100 text-green-700 border-green-200",
};

const SECTION_LABEL: Record<string, string> = {
  entity: "Entities",
  leader: "Leaders",
  event: "Events",
  forecast: "Forecasts",
};

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "entity", label: "Entities" },
  { id: "leader", label: "Leaders" },
  { id: "event", label: "Events" },
  { id: "forecast", label: "Forecasts" },
];

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm animate-pulse">
          <div className="size-4 rounded bg-muted mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-64 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Save search dialog ────────────────────────────────────────────────────────

function SaveSearchPanel({
  query,
  onSaved,
  onCancel,
}: {
  query: string;
  onSaved: (saved: SavedSearch) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(query.slice(0, 60));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/mundane/search/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), query }),
    });
    if (res.ok) {
      const data = await res.json() as SavedSearch;
      onSaved(data);
    } else {
      setError("Failed to save search. Please try again.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
      <Bookmark className="size-4 text-muted-foreground shrink-0" />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Search name..."
        className="h-7 text-sm flex-1"
        maxLength={100}
        autoFocus
      />
      <Button type="submit" size="sm" disabled={saving || !name.trim()} className="h-7 px-3 text-xs">
        {saving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="h-7 px-2">
        <X className="size-3" />
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MundaneSearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, entity: 0, leader: 0, event: 0, forecast: 0 });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load saved searches on mount
  useEffect(() => {
    fetch("/api/admin/mundane/search/saved")
      .then((r) => r.json())
      .then((d: { saved_searches: SavedSearch[] }) => {
        setSavedSearches(d.saved_searches ?? []);
      })
      .catch(() => {})
      .finally(() => setSavedLoading(false));
  }, []);

  const doSearch = useCallback(
    async (searchTab?: TabId, searchPage?: number, overrideQuery?: string) => {
      const t = searchTab ?? tab;
      const p = searchPage ?? 1;
      const q = overrideQuery ?? query;
      if (!q.trim()) return;
      setLoading(true);
      setHasSearched(true);
      setShowSavePanel(false);

      const params = new URLSearchParams({
        q: q.trim(),
        type: t,
        page: String(p),
        limit: "20",
      });

      const res = await fetch(`/api/admin/mundane/search?${params}`);
      if (res.ok) {
        const json = await res.json() as {
          results: SearchResult[];
          counts: Counts;
        };
        setResults(json.results ?? []);
        setCounts(json.counts ?? { all: 0, entity: 0, leader: 0, event: 0, forecast: 0 });
        setPage(p);
      }
      setLoading(false);
    },
    [query, tab]
  );

  function handleTabChange(t: TabId) {
    setTab(t);
    doSearch(t, 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTab("all");
    doSearch("all", 1);
  }

  function handleRunSaved(s: SavedSearch) {
    setQuery(s.query);
    setTab("all");
    doSearch("all", 1, s.query);
  }

  async function handleDeleteSaved(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/mundane/search/saved/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  }

  const filteredResults = tab === "all" ? results : results.filter((r) => r.type === tab);

  // Group results by type for "all" view (show up to 5 per section with "View all" tab link)
  const grouped: Record<string, SearchResult[]> = {};
  if (tab === "all") {
    for (const r of filteredResults) {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    }
  }

  const typeOrder: Array<"entity" | "leader" | "event" | "forecast"> = ["entity", "forecast", "leader", "event"];

  return (
    <div className="flex gap-6">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Search className="size-6 text-amber-500" />
              Mundane Search
            </h1>
            <p className="text-muted-foreground">Full-text search across entities, leaders, events, and forecasts.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane">Back to Hub</Link>
          </Button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search entities, leaders, events, forecasts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
          </Button>
          {hasSearched && query.trim() && !showSavePanel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSavePanel(true)}
              className="gap-1.5"
            >
              <Bookmark className="size-4" />
              Save
            </Button>
          )}
        </form>

        {/* Save search panel */}
        {showSavePanel && query.trim() && (
          <SaveSearchPanel
            query={query}
            onSaved={(saved) => {
              setSavedSearches((prev) => [saved, ...prev]);
              setShowSavePanel(false);
            }}
            onCancel={() => setShowSavePanel(false)}
          />
        )}

        {hasSearched && (
          <>
            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-0">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.id
                        ? "border-amber-500 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    <span className="text-xs text-muted-foreground">
                      ({t.id === "all" ? counts.all : (counts[t.id as keyof Counts] ?? 0)})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <ResultSkeleton />
            ) : filteredResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <Search className="size-10 text-muted-foreground/40" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm text-muted-foreground">Try a different search term or check other tabs.</p>
                </CardContent>
              </Card>
            ) : tab === "all" ? (
              // Grouped view
              <div className="space-y-6">
                {typeOrder.map((t) => {
                  const items = grouped[t];
                  if (!items?.length) return null;
                  const tabId = t as TabId;
                  return (
                    <div key={t} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {SECTION_LABEL[t]} ({counts[t as keyof Counts]})
                        </h2>
                        {counts[t as keyof Counts] > 5 && (
                          <button
                            onClick={() => handleTabChange(tabId)}
                            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                          >
                            View all {counts[t as keyof Counts]} <ArrowRight className="size-3" />
                          </button>
                        )}
                      </div>
                      {items.slice(0, 5).map((result) => (
                        <ResultRow key={`${result.type}-${result.id}`} result={result} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Flat list view for specific tab
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <ResultRow key={`${result.type}-${result.id}`} result={result} />
                ))}
                {/* Simple next page trigger */}
                {counts[tab as keyof Counts] > page * 20 && (
                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => doSearch(tab, page + 1)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="size-10 text-muted-foreground/40" />
              <p className="font-medium">Enter a search term to get started</p>
              <p className="text-sm text-muted-foreground">
                Full-text search across all mundane astrology data including entities, leaders, events, and forecasts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved searches sidebar */}
      <div className="w-64 shrink-0">
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookmarkCheck className="size-4 text-amber-500" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {savedLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Bookmark className="size-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No saved searches yet.</p>
                <p className="text-xs text-muted-foreground">Run a search and click Save to save it here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {savedSearches.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-1 rounded-md hover:bg-muted/70 transition-colors"
                  >
                    <button
                      onClick={() => handleRunSaved(s)}
                      className="flex-1 flex items-center gap-2 py-1.5 px-2 text-left min-w-0"
                    >
                      <Clock className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate" title={s.query}>
                        {s.name}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(s.id)}
                      disabled={deletingId === s.id}
                      className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      aria-label="Delete saved search"
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Result row component ──────────────────────────────────────────────────────

function ResultRow({ result }: { result: SearchResult }) {
  const Icon = TYPE_ICON[result.type] ?? Search;
  return (
    <Link
      href={result.href}
      className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/50 transition-colors"
    >
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{result.title}</span>
          <Badge
            variant="outline"
            className={`text-xs capitalize shrink-0 ${TYPE_BADGE_COLOR[result.type] ?? ""}`}
          >
            {result.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">{result.snippet}</p>
      </div>
    </Link>
  );
}
