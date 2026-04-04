"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Trash2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";

type RitualRow = {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">My Rituals</h1>
          </div>
          <p className="text-muted-foreground">
            Your saved ritual configurations and invocations.
          </p>
        </div>
        <Button asChild size="sm">
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
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rituals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Flame className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No rituals yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first ritual invocation to get started.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/rituals/new">
                <Plus className="mr-2 size-4" />
                Create Your First Ritual
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {rituals.length} ritual{rituals.length !== 1 ? "s" : ""} saved
          </p>
          {rituals.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.ritual_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(r.created_at)} &middot; {r.ritual_tags.length} tag
                    {r.ritual_tags.length !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.ritual_tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {tag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {r.ritual_tags.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        +{r.ritual_tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/community/rituals/${r.id}`)}
                  >
                    <ArrowRight className="mr-1.5 size-3.5" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={deleting === r.id}
                    onClick={() => handleDelete(r.id, r.ritual_name)}
                  >
                    {deleting === r.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
