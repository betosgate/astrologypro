"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TrainingNote {
  id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

interface TrainingNotesProps {
  entityType: "program" | "category" | "lesson";
  entityId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortEmail(email: string): string {
  return email.split("@")[0];
}

export function TrainingNotes({ entityType, entityId }: TrainingNotesProps) {
  const [notes, setNotes] = useState<TrainingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/training/notes?entity_type=${entityType}&entity_id=${entityId}`
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to load notes.");
        return;
      }
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch {
      toast.error("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAddNote() {
    if (!draft.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/training/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          content: draft.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add note.");
        return;
      }
      setDraft("");
      await fetchNotes();
    } catch {
      toast.error("Failed to add note.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/training/notes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete note.");
        return;
      }
      await fetchNotes();
    } catch {
      toast.error("Failed to delete note.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Notes</p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm break-words">{note.content}</p>
                <p className="text-xs text-muted-foreground">
                  {shortEmail(note.created_by)} · {formatDate(note.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                disabled={deletingId === note.id}
                className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                aria-label="Delete note"
              >
                {deletingId === note.id ? "…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add a note…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddNote}
          disabled={submitting || !draft.trim()}
        >
          {submitting ? "Adding…" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}
