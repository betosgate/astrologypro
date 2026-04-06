"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Users } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Sequence = {
  id: string;
  sequence_name: string;
  display_name: string;
  description: string | null;
  is_paused: boolean;
  paused_at: string | null;
  subscriber_count: number;
  updated_at: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminEmailSequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function fetchSequences() {
    setLoading(true);
    const res = await fetch("/api/admin/email-sequences");
    if (res.ok) {
      const json = await res.json();
      setSequences(json.sequences ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSequences();
  }, []);

  async function togglePause(seq: Sequence) {
    setToggling(seq.id);
    const newPaused = !seq.is_paused;
    const res = await fetch(`/api/admin/email-sequences/${seq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_paused: newPaused }),
    });
    if (res.ok) {
      setSequences((prev) =>
        prev.map((s) =>
          s.id === seq.id
            ? {
                ...s,
                is_paused: newPaused,
                paused_at: newPaused ? new Date().toISOString() : null,
              }
            : s
        )
      );
    }
    setToggling(null);
  }

  const activeCount = sequences.filter((s) => !s.is_paused).length;
  const pausedCount = sequences.filter((s) => s.is_paused).length;
  const totalSubscribers = sequences.length > 0
    ? Math.max(...sequences.map((s) => s.subscriber_count))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Email Sequences</h1>
        <p className="text-muted-foreground">
          Pause or resume automated community email sequences.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active Sequences" value={activeCount} />
        <StatCard label="Paused Sequences" value={pausedCount} />
        <StatCard label="Community Members" value={totalSubscribers} />
      </div>

      {/* Sequence list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No email sequences found</p>
            <p className="text-sm text-muted-foreground">
              Run the migration to seed the sequence controls.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Info */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{seq.display_name}</span>
                    <Badge
                      variant="outline"
                      className={
                        seq.is_paused
                          ? "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                          : "border-green-300 text-green-600 bg-green-50 dark:bg-green-950/30"
                      }
                    >
                      {seq.is_paused ? "Paused" : "Active"}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {seq.subscriber_count.toLocaleString()} subscribers
                    </span>
                  </div>

                  {seq.description && (
                    <p className="text-sm text-muted-foreground">
                      {seq.description}
                    </p>
                  )}

                  {seq.is_paused && seq.paused_at && (
                    <p className="text-xs text-amber-500">
                      Paused on {formatDate(seq.paused_at)}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground font-mono">
                    {seq.sequence_name}
                  </p>
                </div>

                {/* Pause / Resume toggle */}
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {seq.is_paused ? "Paused" : "Active"}
                  </span>
                  {toggling === seq.id ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={!seq.is_paused}
                      onCheckedChange={() => togglePause(seq)}
                      aria-label={`Toggle ${seq.display_name}`}
                    />
                  )}
                  <Button
                    size="sm"
                    variant={seq.is_paused ? "default" : "outline"}
                    onClick={() => togglePause(seq)}
                    disabled={toggling === seq.id}
                    className="w-20"
                  >
                    {toggling === seq.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : seq.is_paused ? (
                      "Resume"
                    ) : (
                      "Pause"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
