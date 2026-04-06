"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReadingRow } from "./page";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ReadingCard({
  reading,
  onDelete,
}: {
  reading: ReadingRow;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [localShareToken, setLocalShareToken] = useState(reading.share_token);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await fetch(`/api/community/tarot/readings/${reading.id}`, { method: "DELETE" });
      onDelete(reading.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [reading.id, onDelete]);

  const handleShare = useCallback(async () => {
    setShareLoading(true);
    try {
      if (!localShareToken) {
        const res = await fetch(`/api/community/tarot/readings/${reading.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generate_share: true }),
        });
        const json = await res.json();
        const token: string = json.reading?.share_token;
        if (token) setLocalShareToken(token);
        const url = `${window.location.origin}/community/tarot/share/${token}`;
        await navigator.clipboard.writeText(url);
      } else {
        const url = `${window.location.origin}/community/tarot/share/${localShareToken}`;
        await navigator.clipboard.writeText(url);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } finally {
      setShareLoading(false);
    }
  }, [reading.id, localShareToken]);

  return (
    <Card className="flex flex-col border bg-card transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 pt-4 pb-4">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <Badge variant="secondary" className="text-xs">
              {reading.spread_name}
            </Badge>
            <p className="text-xs text-muted-foreground">{formatDate(reading.created_at)}</p>
          </div>
          {/* Share icon indicator */}
          <button
            type="button"
            onClick={handleShare}
            disabled={shareLoading}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            aria-label={localShareToken ? "Copy share link" : "Generate share link"}
            title={localShareToken ? "Copy share link" : "Share this reading"}
          >
            <span
              className={`text-lg ${localShareToken ? "text-emerald-400" : "text-muted-foreground/40 hover:text-muted-foreground"} transition-colors`}
            >
              ⬡
            </span>
          </button>
        </div>

        {/* Card preview chips */}
        {reading.cards_preview.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reading.cards_preview.map((c) => (
              <Badge
                key={`${c.position}-${c.card_name}`}
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 border-indigo-800/40 text-indigo-300"
              >
                {c.is_reversed ? `Rev. ${c.card_name}` : c.card_name}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {reading.notes && (
          <p className="text-xs italic text-muted-foreground line-clamp-2">
            {reading.notes.slice(0, 100)}
            {reading.notes.length > 100 ? "…" : ""}
          </p>
        )}

        {/* Share copied feedback */}
        {shareCopied && (
          <p className="text-xs text-emerald-400">Share link copied to clipboard.</p>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button asChild size="sm" className="bg-indigo-700 hover:bg-indigo-600">
            <Link href={`/community/tarot/readings/${reading.id}`}>View</Link>
          </Button>

          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete this reading?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReadingHistoryClient({
  readings: initialReadings,
}: {
  readings: ReadingRow[];
}) {
  const [readings, setReadings] = useState(initialReadings);

  const handleDelete = useCallback((id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (readings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All readings on this page have been deleted.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {readings.map((reading) => (
        <ReadingCard key={reading.id} reading={reading} onDelete={handleDelete} />
      ))}
    </div>
  );
}
