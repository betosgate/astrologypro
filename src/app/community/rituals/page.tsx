"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/format";

type RitualRow = {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
  last_executed_at: string | null;
  execution_count: number;
  current_step: number;
  is_complete: boolean;
};

const PAGE_SIZE = 10;

export default function CommunityRitualsPage() {
  const router = useRouter();
  const [rituals, setRituals] = useState<RitualRow[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tracks the next offset to request. Kept in a ref alongside state so
  // the IntersectionObserver callback always reads the latest value
  // without needing to be re-bound on every render.
  const nextOffsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Fetches a page of rituals. When `reset` is true the list is replaced
   * (used for the initial load and after a delete). Otherwise the new
   * rows are appended.
   *
   * Duplicate-row protection: even though the API guarantees stable
   * `(created_at DESC, id DESC)` ordering, we still de-dupe by id when
   * appending — defense in depth for any future race (e.g. a row created
   * in another tab while the user is scrolling).
   */
  const fetchPage = useCallback(
    async (offset: number, reset: boolean): Promise<void> => {
      if (reset) {
        setLoadingInitial(true);
        setError(null);
      } else {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const res = await fetch(
          `/api/community/rituals?limit=${PAGE_SIZE}&offset=${offset}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          setError("Failed to load rituals");
          return;
        }

        const data = (await res.json()) as {
          rituals: RitualRow[];
          count: number;
          nextOffset: number;
          hasMore: boolean;
        };

        const incoming = data.rituals ?? [];

        setRituals((previous) => {
          if (reset) return incoming;
          // Append, skipping any ids already present.
          const seen = new Set(previous.map((row) => row.id));
          const merged = previous.slice();
          for (const row of incoming) {
            if (seen.has(row.id)) continue;
            seen.add(row.id);
            merged.push(row);
          }
          return merged;
        });

        setTotalCount(data.count ?? 0);
        nextOffsetRef.current = data.nextOffset ?? offset + incoming.length;
        hasMoreRef.current = Boolean(data.hasMore);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setError("Failed to load rituals");
      } finally {
        if (reset) {
          setLoadingInitial(false);
        } else {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    nextOffsetRef.current = 0;
    hasMoreRef.current = false;
    void fetchPage(0, true);
  }, [fetchPage]);

  // IntersectionObserver-driven infinite scroll. The sentinel is rendered
  // at the bottom of the list; when it enters the viewport we request the
  // next page. Concurrent fetches are guarded by `loadingMoreRef`.
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) return;
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        void fetchPage(nextOffsetRef.current, false);
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
    // We depend on `hasMore` so the observer is re-attached when the
    // sentinel mounts/unmounts (it only renders while there are more
    // pages to load).
  }, [fetchPage, hasMore, loadingInitial]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete ritual "${name}"? This cannot be undone.`))
      return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/community/rituals/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Delete failed");
      setDeleting(null);
      return;
    }
    // Reload from the top — simplest correct behavior. Avoids re-indexing
    // offsets after a row removal in the middle of the loaded set.
    setDeleting(null);
    nextOffsetRef.current = 0;
    hasMoreRef.current = false;
    await fetchPage(0, true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-inner">
              <Flame className="size-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Rituals</h1>
              <p className="text-sm text-muted-foreground">
                Your sacred configurations and invocations.
              </p>
            </div>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-md"
        >
          <Link href="/community/rituals/new">
            <Plus className="mr-2 size-4" />
            Create Ritual
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {loadingInitial ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-amber-400/60" />
        </div>
      ) : rituals.length === 0 ? (
        /* Empty state */
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-background to-orange-950/20 px-8 py-14 text-center shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.1),transparent_70%)]" />
          <div className="relative flex flex-col items-center gap-5">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 ring-1 ring-amber-500/20">
              <Flame className="size-8 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">No rituals yet</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Create your first ritual invocation to begin your sacred practice.
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-md"
            >
              <Link href="/community/rituals/new">
                <Sparkles className="mr-2 size-4" />
                Begin Your First Ritual
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Showing {rituals.length} of {totalCount} ritual
            {totalCount !== 1 ? "s" : ""}
          </p>

          {rituals.map((r) => {
            const isInProgress = r.current_step > 0 && !r.is_complete;
            const isCompleted = r.is_complete && r.last_executed_at;

            return (
              /* Mystical card design with flame icon per ritual */
              <div
                key={r.id}
                className="group relative overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-950/20 via-card to-card transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
              >
                {/* Subtle glow on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_0%_50%,rgba(245,158,11,0.05),transparent_50%)]" />

                <div className="relative flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                  {/* Left: flame + ritual info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Flame icon per ritual — glows amber */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 ring-1 ring-amber-500/20 shadow-inner transition-all group-hover:ring-amber-500/40">
                      <Flame className="size-5 text-amber-400 transition-colors group-hover:text-amber-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">
                        {r.ritual_name}
                      </p>

                      {/* Status line */}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {isInProgress ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 border-amber-400/50 text-amber-500 bg-amber-950/30"
                          >
                            <span className="mr-1 inline-block size-1.5 rounded-full bg-amber-400 animate-pulse" />
                            In Progress — Step {r.current_step}
                          </Badge>
                        ) : isCompleted ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 border-green-500/40 text-green-400 bg-green-950/30"
                          >
                            Last: {formatDate(r.last_executed_at!)}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Never performed
                          </span>
                        )}
                        {r.execution_count > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            · {r.execution_count}× completed
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.ritual_tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300/80 border-none"
                          >
                            {tag.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {r.ritual_tags.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 text-muted-foreground"
                          >
                            +{r.ritual_tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isInProgress ? (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow"
                        onClick={() => router.push(`/community/rituals/${r.id}`)}
                      >
                        <Play className="mr-1.5 size-3.5" />
                        Continue
                      </Button>
                    ) : (
                      /* Navigate button — prominent per spec */
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white hover:from-amber-500 hover:to-orange-500 shadow"
                        onClick={() => router.push(`/community/rituals/${r.id}`)}
                      >
                        <ArrowRight className="mr-1.5 size-3.5" />
                        {r.execution_count > 0 ? "Navigate" : "Navigate"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deleting === r.id}
                      onClick={() => handleDelete(r.id, r.ritual_name)}
                      aria-label={`Delete ritual ${r.ritual_name}`}
                    >
                      {deleting === r.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Infinite-scroll sentinel + loading / end-of-list indicator.
              The sentinel only renders while more pages exist, so the
              IntersectionObserver naturally stops firing once we reach
              the end of the list. */}
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex justify-center py-6"
              aria-hidden="true"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-amber-400/60" />
                  Loading more rituals…
                </div>
              ) : (
                <span className="h-px w-px" />
              )}
            </div>
          ) : (
            rituals.length >= PAGE_SIZE && (
              <p className="py-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground/70">
                You've reached the end
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
