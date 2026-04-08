"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminNotesSection, type AdminNote } from "@/components/admin/admin-notes-section";

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

export function TrainingNotes({ entityType, entityId }: TrainingNotesProps) {
  const [notes, setNotes] = useState<TrainingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/training/notes?entity_type=${entityType}&entity_id=${entityId}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load notes.");
      }
      const data = await res.json();
      setNotes(data.notes ?? []);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.email) setCurrentAdminEmail(data.email);
      })
      .catch(() => {});
  }, []);

  async function handleAddNote(content: string) {
    const res = await fetch("/api/admin/training/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        content,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to add note.");
    }
    setNotes((prev) => [data.note, ...prev]);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/training/notes/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to delete note.");
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  async function handleEdit(id: string, content: string) {
    const res = await fetch(`/api/admin/training/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to update note.");
    }
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? data.note : note))
    );
  }

  return (
    <AdminNotesSection
      title="Add a training note…"
      notes={notes.map((note): AdminNote => ({
        id: note.id,
        content: note.content,
        created_by: note.created_by,
        created_at: note.created_at,
      }))}
      loading={loading}
      currentAdminEmail={currentAdminEmail}
      onAdd={handleAddNote}
      onDelete={handleDelete}
      onEdit={handleEdit}
    />
  );
}
