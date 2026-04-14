"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Building2, UserRound, CalendarDays, TrendingUp } from "lucide-react";

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

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "entity", label: "Entities" },
  { id: "leader", label: "Leaders" },
  { id: "event", label: "Events" },
  { id: "forecast", label: "Forecasts" },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MundaneSearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, entity: 0, leader: 0, event: 0, forecast: 0 });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);

  async function doSearch(searchTab?: TabId, searchPage?: number) {
    const t = searchTab ?? tab;
    const p = searchPage ?? 1;
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams({
      q: query.trim(),
      type: t,
      page: String(p),
      limit: "20",
    });

    const res = await fetch(`/api/admin/mundane/search?${params}`);
    if (res.ok) {
      const json = await res.json();
      setResults(json.results ?? []);
      setCounts(json.counts ?? { all: 0, entity: 0, leader: 0, event: 0, forecast: 0 });
      setPage(p);
    }
    setLoading(false);
  }

  function handleTabChange(t: TabId) {
    setTab(t);
    doSearch(t, 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTab("all");
    doSearch("all", 1);
  }

  const filteredResults = tab === "all" ? results : results.filter((r) => r.type === tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6 text-amber-500" />
            Mundane Search
          </h1>
          <p className="text-muted-foreground">Search across entities, leaders, events, and forecasts.</p>
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
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
        </Button>
      </form>

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
                    ({counts[t.id] ?? 0})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Search className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No results found</p>
                <p className="text-sm text-muted-foreground">Try a different search term or check other tabs.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((result) => {
                const Icon = TYPE_ICON[result.type] ?? Search;
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.title}</span>
                        <Badge variant="outline" className={`text-xs capitalize ${TYPE_BADGE_COLOR[result.type] ?? ""}`}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{result.snippet}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
