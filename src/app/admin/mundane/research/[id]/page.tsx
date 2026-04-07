"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FlaskConical, Plus, Loader2, Trash2, ArrowLeft, Archive } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Project = {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  status: string;
  entity_ids: string[];
  leader_ids: string[];
  created_at: string;
  updated_at: string | null;
};

type Note = {
  id: string;
  title: string | null;
  body: string;
  note_type: string;
  created_by: string;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};

const NOTE_TYPE_BADGE: Record<string, string> = {
  general: "bg-gray-100 text-gray-700 border-gray-200",
  observation: "bg-blue-100 text-blue-700 border-blue-200",
  hypothesis: "bg-purple-100 text-purple-700 border-purple-200",
  conclusion: "bg-green-100 text-green-700 border-green-200",
  reference: "bg-amber-100 text-amber-700 border-amber-200",
};

const NOTE_TYPES = ["general", "observation", "hypothesis", "conclusion", "reference"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ResearchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Note form
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState("observation");

  const fetchProject = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/mundane/research/${id}`);
    if (res.ok) {
      setProject(await res.json());
    } else {
      setError("Failed to load project.");
    }
    setLoading(false);
  }, [id]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    const res = await fetch(`/api/admin/mundane/research/${id}/notes`);
    if (res.ok) {
      const json = await res.json();
      setNotes(json.notes ?? []);
    }
    setNotesLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchNotes();
  }, [fetchProject, fetchNotes]);

  async function addNote() {
    if (!noteBody.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/mundane/research/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody.trim(), note_type: noteType }),
    });
    if (res.ok) {
      setNoteBody("");
      fetchNotes();
    }
    setSaving(false);
  }

  async function deleteNote(noteId: string) {
    const res = await fetch(`/api/admin/mundane/research/${id}/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/admin/mundane/research/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setProject((p) => p ? { ...p, status } : p);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Project not found."}</p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/mundane/research"><ArrowLeft className="mr-1.5 size-4" /> Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button size="sm" variant="ghost" asChild className="px-2">
              <Link href="/admin/mundane/research"><ArrowLeft className="size-4" /></Link>
            </Button>
            <FlaskConical className="size-5 text-violet-500" />
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
            <Badge variant="outline" className={`capitalize ${STATUS_BADGE[project.status] ?? ""}`}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-14">Created {formatDate(project.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {project.status === "active" && (
            <>
              <Button size="sm" variant="outline" onClick={() => updateStatus("completed")}>
                Mark Completed
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("archived")}>
                <Archive className="mr-1.5 size-4" /> Archive
              </Button>
            </>
          )}
          {project.status === "archived" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("active")}>
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left panel: project info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Project Details</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <div className="text-sm">
                <span className="font-medium">Type:</span>{" "}
                <span className="capitalize text-muted-foreground">{project.project_type.replace("_", " ")}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Linked Entities:</span>{" "}
                <span className="text-muted-foreground">{project.entity_ids.length || "None"}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Status:</span>{" "}
                <Badge variant="outline" className={`capitalize ${STATUS_BADGE[project.status] ?? ""}`}>
                  {project.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add note form */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="size-4" /> Add Note
              </h3>
              <div className="flex gap-2">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm w-40 shrink-0"
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder="Write your observation, hypothesis, or conclusion..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-y"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={addNote} disabled={saving || !noteBody.trim()}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes list */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Notes ({notes.length})</h3>
            {notesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No notes yet. Add your first observation above.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-card p-3 shadow-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs capitalize ${NOTE_TYPE_BADGE[note.note_type] ?? ""}`}>
                        {note.note_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete note?</AlertDialogTitle>
                          <AlertDialogDescription>This note will be permanently deleted.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteNote(note.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {note.title && <p className="font-medium text-sm">{note.title}</p>}
                  <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
