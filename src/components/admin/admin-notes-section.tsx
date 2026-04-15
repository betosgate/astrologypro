"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, User, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";

export type AdminNote = {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminNotesSection({
  title = "Add an admin note…",
  emptyLabel = "No notes yet",
  autoFocusComposer = false,
  notes,
  loading,
  currentAdminEmail,
  onAdd,
  onDelete,
  onEdit,
}: {
  title?: string;
  emptyLabel?: string;
  autoFocusComposer?: boolean;
  notes: AdminNote[];
  loading?: boolean;
  currentAdminEmail?: string | null;
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (id: string, content: string) => Promise<void>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!autoFocusComposer) return;
    textareaRef.current?.focus();
  }, [autoFocusComposer]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [notes]
  );

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    try {
      await onDelete(noteId);
      toast.success("Note deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveEdit(noteId: string) {
    if (!editingText.trim() || !onEdit) return;
    setSavingEdit(true);
    try {
      await onEdit(noteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText("");
      toast.success("Note updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="resize-none"
          placeholder={title}
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !draft.trim()}>
          {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          Add Note
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => {
            const isOwner =
              !!currentAdminEmail && note.created_by === currentAdminEmail;
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className="group space-y-2 rounded-lg border p-3 text-sm"
              >
                {isEditing ? (
                  <Textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="leading-relaxed text-foreground">{note.content}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {note.created_by}
                    <span className="opacity-50">·</span>
                    <Clock className="size-3" />
                    {formatDateTime(note.created_at)}
                  </span>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={savingEdit || !editingText.trim()}
                          className="flex items-center gap-1 text-green-500 transition-colors hover:text-green-400 disabled:opacity-40"
                        >
                          {savingEdit ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingText("");
                          }}
                          className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {onEdit && isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingText(note.content);
                            }}
                            className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          disabled={deletingId === note.id}
                          className="ml-1 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive/80"
                        >
                          {deletingId === note.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </>
                    )}
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
