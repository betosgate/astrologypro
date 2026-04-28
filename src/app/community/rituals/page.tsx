"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildRitualPlaylist } from "@/lib/community/ritual-video-map";

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

type RitualStatusFilter = "all" | "completed" | "in-progress" | "never-performed";

const PAGE_SIZE = 10;

function getDisplayTags(ritualName: string, tags: string[]): string[] {
  if (ritualName === "Planetary Zodiacal Invocation Ritual of the Pentagram") {
    return tags;
  }

  const primaryTags = tags.filter(
    (tag) => !tag.startsWith("Ritual_") && !tag.includes("_Gate_")
  );

  return primaryTags.length > 0 ? primaryTags : tags;
}

export default function CommunityRitualsPage() {
  const router = useRouter();
  const [rituals, setRituals] = useState<RitualRow[]>([]);
  const [expandedTagRitualIds, setExpandedTagRitualIds] = useState<Set<string>>(
    () => new Set()
  );
  const [ritualNameOptions, setRitualNameOptions] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [ritualToDelete, setRitualToDelete] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRitualName, setSelectedRitualName] = useState("all");
  const [selectedStatus, setSelectedStatus] =
    useState<RitualStatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const nextOffsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentFilterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedRitualName !== "all") {
      params.set("ritualName", selectedRitualName);
    }
    if (selectedStatus !== "all") {
      params.set("status", selectedStatus);
    }
    if (appliedDateFrom && appliedDateTo) {
      params.set("dateFrom", appliedDateFrom);
      params.set("dateTo", appliedDateTo);
    }
    return params.toString();
  }, [appliedDateFrom, appliedDateTo, selectedRitualName, selectedStatus]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      setAppliedDateFrom((previous) => (previous === dateFrom ? previous : dateFrom));
      setAppliedDateTo((previous) => (previous === dateTo ? previous : dateTo));
      return;
    }

    if (!dateFrom && !dateTo && (appliedDateFrom || appliedDateTo)) {
      setAppliedDateFrom("");
      setAppliedDateTo("");
    }
  }, [appliedDateFrom, appliedDateTo, dateFrom, dateTo]);

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
        const query = new URLSearchParams(currentFilterParams);
        query.set("limit", PAGE_SIZE.toString());
        query.set("offset", offset.toString());

        const response = await fetch(
          `/api/community/rituals?${query.toString()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          setError("Failed to load rituals");
          return;
        }

        const data = (await response.json()) as {
          rituals: RitualRow[];
          ritualNames: string[];
          count: number;
          nextOffset: number;
          hasMore: boolean;
        };

        const incoming = data.rituals ?? [];

        setRituals((previous) => {
          if (reset) return incoming;

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
        setRitualNameOptions(data.ritualNames ?? []);
        nextOffsetRef.current = data.nextOffset ?? offset + incoming.length;
        hasMoreRef.current = Boolean(data.hasMore);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setError("Failed to load rituals");
      } finally {
        if (reset) {
          setLoadingInitial(false);
          setHasLoadedOnce(true);
        } else {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      }
    },
    [currentFilterParams]
  );

  useEffect(() => {
    nextOffsetRef.current = 0;
    hasMoreRef.current = false;
    void fetchPage(0, true);
  }, [fetchPage, currentFilterParams]);

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
  }, [fetchPage, hasMore, loadingInitial]);

  async function performDelete() {
    if (!ritualToDelete) return;
    const { id } = ritualToDelete;

    setDeleting(id);
    setError(null);
    setRitualToDelete(null);

    const response = await fetch(`/api/community/rituals/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Delete failed");
      setDeleting(null);
      return;
    }

    setDeleting(null);
    nextOffsetRef.current = 0;
    hasMoreRef.current = false;
    await fetchPage(0, true);
  }

  function toggleExpandedTags(ritualId: string) {
    setExpandedTagRitualIds((previous) => {
      const next = new Set(previous);
      if (next.has(ritualId)) {
        next.delete(ritualId);
      } else {
        next.add(ritualId);
      }
      return next;
    });
  }

  const hasActiveFilters =
    selectedRitualName !== "all" ||
    selectedStatus !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-500 hover:to-orange-500"
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

      {hasLoadedOnce && (
        <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-950/15 via-card to-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Ritual Name
              </p>
              <Select
                value={selectedRitualName}
                onValueChange={setSelectedRitualName}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All rituals" />
                </SelectTrigger>
                <SelectContent>
                  {["all", ...ritualNameOptions].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "All rituals" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px]">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as RitualStatusFilter)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="never-performed">Never performed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[160px]">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Date From
              </p>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="min-w-[160px]">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Date To
              </p>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={!hasActiveFilters}
              onClick={() => {
                setSelectedRitualName("all");
                setSelectedStatus("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="border-amber-500/20"
            >
              <X className="mr-2 size-4" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {loadingInitial && !hasLoadedOnce ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-amber-400/60" />
        </div>
      ) : rituals.length === 0 && !hasActiveFilters ? (
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
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-500 hover:to-orange-500"
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

          {loadingInitial && hasLoadedOnce ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-amber-400/60" />
            </div>
          ) : null}

          {!loadingInitial &&
            rituals.map((ritual) => {
            const isInProgress = ritual.current_step > 0 && !ritual.is_complete;
            const isCompleted = ritual.is_complete && ritual.last_executed_at;
            const displayTags = getDisplayTags(
              ritual.ritual_name,
              ritual.ritual_tags
            );
            const totalSteps = buildRitualPlaylist(ritual.ritual_tags).length;
            const completedSteps = isCompleted
              ? totalSteps
              : Math.max(ritual.current_step - 1, 0);
            const tagsExpanded = expandedTagRitualIds.has(ritual.id);
            const visibleTags = tagsExpanded
              ? displayTags
              : displayTags.slice(0, 3);
            const hiddenTagCount = Math.max(displayTags.length - 3, 0);

            return (
              <div
                key={ritual.id}
                className="group relative overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-950/20 via-card to-card transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(245,158,11,0.05),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 ring-1 ring-amber-500/20 shadow-inner transition-all group-hover:ring-amber-500/40">
                      <Flame className="size-5 text-amber-400 transition-colors group-hover:text-amber-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug">
                        {ritual.ritual_name}
                      </p>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {isInProgress ? (
                          <Badge
                            variant="outline"
                            className="border-amber-400/50 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-500"
                          >
                            <span className="mr-1 inline-block size-1.5 rounded-full bg-amber-400 animate-pulse" />
                            In Progress - {completedSteps} of {totalSteps} completed
                          </Badge>
                        ) : isCompleted ? (
                          <Badge
                            variant="outline"
                            className="border-green-500/40 bg-green-950/30 px-1.5 py-0.5 text-[10px] text-green-400"
                          >
                            Last: {formatDate(ritual.last_executed_at!)}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Never performed
                          </span>
                        )}

                        {ritual.execution_count > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            · {ritual.execution_count}x completed
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {visibleTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="border-none bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300/80"
                          >
                            {tag.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {hiddenTagCount > 0 && !tagsExpanded && (
                          <button
                            type="button"
                            onClick={() => toggleExpandedTags(ritual.id)}
                            className="rounded-md"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/40"
                            >
                              +{hiddenTagCount} more
                            </Badge>
                          </button>
                        )}
                        {tagsExpanded && hiddenTagCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandedTags(ritual.id)}
                            className="rounded-md"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/40"
                            >
                              Show less
                            </Badge>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isInProgress ? (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow hover:from-amber-500 hover:to-orange-500"
                        onClick={() =>
                          router.push(`/community/rituals/${ritual.id}/playback`)
                        }
                      >
                        <Play className="mr-1.5 size-3.5" />
                        Continue
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white shadow hover:from-amber-500 hover:to-orange-500"
                        onClick={() => router.push(`/community/rituals/${ritual.id}`)}
                      >
                        <ArrowRight className="mr-1.5 size-3.5" />
                        Navigate
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleting === ritual.id}
                      onClick={() => setRitualToDelete({ id: ritual.id, name: ritual.ritual_name })}
                      aria-label={`Delete ritual ${ritual.ritual_name}`}
                    >
                      {deleting === ritual.id ? (
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

          {!loadingInitial && rituals.length === 0 && (
            <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-950/10 via-card to-card px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No rituals match the current filters."
                  : "No rituals yet."}
              </p>
            </div>
          )}

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex justify-center py-6"
              aria-hidden="true"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-amber-400/60" />
                  Loading more rituals...
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

      <ConfirmDialog
        open={!!ritualToDelete}
        onOpenChange={(open) => !open && setRitualToDelete(null)}
        title="Delete Ritual"
        description={`Are you sure you want to delete "${ritualToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={performDelete}
        variant="destructive"
      />
    </div>
  );
}
