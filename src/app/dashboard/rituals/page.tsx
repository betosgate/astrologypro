"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Play, Plus, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Ritual {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RitualsPage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRituals = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rituals?page=${p}&limit=10`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Failed to load rituals.");
        return;
      }
      const json = await res.json();
      setRituals(json.rituals ?? []);
      setPagination(json.pagination ?? null);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRituals(page);
  }, [fetchRituals, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Rituals</h1>
            <p className="text-sm text-muted-foreground">
              Your configured Perennial rituals
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/rituals/new">
            <Plus className="mr-2 size-4" />
            Create New Ritual
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading rituals…
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchRituals(page)}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && rituals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Sparkles className="size-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No rituals yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No rituals yet. Create your first ritual.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/rituals/new">
                <Plus className="mr-2 size-4" />
                Create Your First Ritual
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ritual list */}
      {!loading && !error && rituals.length > 0 && (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Ritual Name
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rituals.map((ritual) => (
                  <tr key={ritual.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{ritual.ritual_name}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {ritual.ritual_tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {ritual.ritual_tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ritual.ritual_tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(ritual.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/rituals/${ritual.id}/playback`}>
                          <Play className="mr-1.5 size-3.5" />
                          Play
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages} &middot;{" "}
                {pagination.total} rituals
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.total_pages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.total_pages, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
