"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, BookOpen } from "lucide-react";

type HolyBook = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  file_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  cover_image_url: "",
  file_url: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminHolyBooksPage() {
  const [books, setBooks] = useState<HolyBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBooks() {
    setLoading(true);
    const res = await fetch("/api/admin/holy-books");
    if (res.ok) setBooks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  }

  function openEdit(book: HolyBook) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      description: book.description ?? "",
      cover_image_url: book.cover_image_url ?? "",
      file_url: book.file_url ?? "",
      sort_order: book.sort_order,
      is_active: book.is_active,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      file_url: form.file_url.trim() || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/holy-books/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/holy-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }

      await loadBooks();
      setShowForm(false);
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(book: HolyBook) {
    const res = await fetch(`/api/admin/holy-books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !book.is_active }),
    });
    if (res.ok) {
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, is_active: !book.is_active } : b))
      );
    }
  }

  async function handleReorder(book: HolyBook, direction: "up" | "down") {
    const idx = books.findIndex((b) => b.id === book.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= books.length) return;

    const swapBook = books[swapIdx];
    // Swap sort_order values
    await Promise.all([
      fetch(`/api/admin/holy-books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: swapBook.sort_order }),
      }),
      fetch(`/api/admin/holy-books/${swapBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: book.sort_order }),
      }),
    ]);
    await loadBooks();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/holy-books/${id}`, { method: "DELETE" });
    if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holy Books</h1>
          <p className="text-muted-foreground">Manage sacred texts in the Community Library.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1.5 size-4" />
          Add Book
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Holy Book" : "New Holy Book"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Bhagavad Gita"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description shown to community members"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Cover Image URL</Label>
                  <Input
                    value={form.cover_image_url}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>File URL (PDF link)</Label>
                  <Input
                    value={form.file_url}
                    onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                    placeholder="https://... or storage path"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="size-4"
                  />
                  <Label htmlFor="is_active">Active (visible to members)</Label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update Book" : "Add Book"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4" />
            All Holy Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <BookOpen className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No holy books yet. Add one above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>File URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book, idx) => (
                  <TableRow key={book.id}>
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground w-4">{book.sort_order}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleReorder(book, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleReorder(book, "down")}
                            disabled={idx === books.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{book.title}</p>
                        {book.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {book.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {book.file_url ? (
                        <a
                          href={book.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline truncate block"
                        >
                          {book.file_url}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleToggleActive(book)}>
                        <Badge
                          variant="outline"
                          className={
                            book.is_active
                              ? "bg-green-500/10 text-green-600 cursor-pointer"
                              : "bg-red-500/10 text-red-500 cursor-pointer"
                          }
                        >
                          {book.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(book)}>
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete holy book?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{book.title}</strong> will be permanently deleted. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(book.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
