"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Trash2, Loader2, AlertCircle, Play, ArrowRight, Sparkles } from "lucide-react";
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

export default function CommunityRitualsPage() {
  const router = useRouter();
  const [rituals, setRituals] = useState<RitualRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/community/rituals");
    if (res.ok) {
      const data = await res.json();
      setRituals(data.rituals ?? []);
    } else {
      setError("Failed to load rituals");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete ritual "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/community/rituals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Delete failed");
    } else {
      await load();
    }
    setDeleting(null);
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

      {loading ? (
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
            {rituals.length} ritual{rituals.length !== 1 ? "s" : ""} saved
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
        </div>
      )}
    </div>
  );
}
