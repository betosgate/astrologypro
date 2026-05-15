"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";

function IngressChartsListContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") || "";
  const initialSector = searchParams.get("sector") || "";

  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState(initialTag);
  const [sector, setSector] = useState(initialSector);

  useEffect(() => {
    fetchCharts();
  }, [tag, sector]);

  async function fetchCharts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (tag) params.append("tags", tag);
      if (sector) params.append("sectors", sector);
      
      const res = await fetch(`/api/admin/ingress-charts?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setCharts(json.charts || []);
      }
    } catch (error) {
      console.error("Failed to fetch charts", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ingress Charts List</h1>
        <Button asChild variant="outline">
          <Link href="/admin/ingress-charts">Back to Admin</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-muted">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Input
              placeholder="Search title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchCharts();
              }}
            />
            <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Filter by tag..."
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Filter by sector..."
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-48"
          />
          <Button onClick={fetchCharts}>Apply Filters</Button>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charts.map((chart) => (
            <Card key={chart.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{chart.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{chart.location_name}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{chart.short_description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {chart.tags?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-muted rounded-full text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {charts.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No charts found matching the filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function IngressChartsListPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <IngressChartsListContent />
    </Suspense>
  );
}
