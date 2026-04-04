"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, MapPin, Search, Tag, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

type IngressChart = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  short_description: string | null;
  effective_time_period: string | null;
  event_timestamp: string | null;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  tags: string[];
  sector_focus: string[];
  author_name: string | null;
  is_social_advo: boolean;
};

const IMPORTANCE_COLORS: Record<string, string> = {
  "High Impact": "bg-red-100 text-red-700 border-red-200",
  "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Low Impact": "bg-green-100 text-green-700 border-green-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function IngressChartsPage() {
  const [charts, setCharts] = useState<IngressChart[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [author, setAuthor] = useState("");

  const fetchCharts = useCallback(async (p: number, replace: boolean) => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(p) });
    if (title) sp.set("title", title);
    if (location) sp.set("location", location);
    if (author) sp.set("author", author);

    const res = await fetch(`/api/community/ingress-charts?${sp}`);
    if (res.ok) {
      const json = await res.json();
      setCharts((prev) => replace ? json.charts : [...prev, ...json.charts]);
      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(p);
    }
    setLoading(false);
  }, [title, location, author]);

  useEffect(() => { fetchCharts(1, true); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCharts(1, true);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Ingress Charts</h1>
        </div>
        <p className="text-muted-foreground">
          Planetary ingress events and their astrological interpretations.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Location…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-36"
        />
        <Input
          placeholder="Author…"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-36"
        />
        <Button type="submit" variant="secondary" size="sm">
          <Search className="size-4 mr-1" /> Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setTitle(""); setLocation(""); setAuthor(""); fetchCharts(1, true); }}
        >
          Clear
        </Button>
      </form>

      {total > 0 && (
        <p className="text-sm text-muted-foreground">{total} chart{total !== 1 ? "s" : ""} found</p>
      )}

      {loading && charts.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : charts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Globe className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No ingress charts found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search filters.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {charts.map((chart) => (
              <Link key={chart.id} href={`/community/ingress-charts/${chart.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{chart.title}</CardTitle>
                      {chart.importance && (
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${IMPORTANCE_COLORS[chart.importance] ?? ""}`}
                        >
                          {chart.importance}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {chart.ingress_type && (
                        <span className="text-xs text-muted-foreground">{chart.ingress_type}</span>
                      )}
                      {chart.location_name && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" />{chart.location_name}
                        </span>
                      )}
                    </div>
                    {chart.event_timestamp && (
                      <CardDescription>{formatDate(chart.event_timestamp)}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {chart.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{chart.short_description}</p>
                    )}
                    {chart.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chart.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <Tag className="size-3" />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      {chart.author_name && (
                        <span className="text-xs text-muted-foreground">by {chart.author_name}</span>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchCharts(page + 1, false)}
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
