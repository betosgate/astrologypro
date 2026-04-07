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
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";

type Series = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  cover_image_url: "",
  is_active: true,
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminBlogSeriesPage() {
  const [items, setItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/blog/series");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: Series) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      cover_image_url: item.cover_image_url ?? "",
      is_active: item.is_active,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  }

  function handleNameChange(v: string) {
    setForm((f) => ({ ...f, name: v, slug: editingId ? f.slug : toSlug(v) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || toSlug(form.name.trim()),
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      is_active: form.is_active,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/blog/series/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/blog/series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }
      await load();
      setShowForm(false);
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: Series) {
    const res = await fetch(`/api/admin/blog/series/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !item.is_active } : i)));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/blog/series/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Series</h1>
          <p className="text-muted-foreground">Group related posts into a series.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1.5 size-4" />
          Add Series
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Series" : "New Series"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Astrology Fundamentals"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="astrology-fundamentals"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description of the series…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cover Image URL</Label>
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="series_is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="size-4"
                />
                <Label htmlFor="series_is_active">Active</Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add Series"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4" />
            All Series
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <BookOpen className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No series yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.slug}</TableCell>
                    <TableCell>
                      <button onClick={() => handleToggleActive(item)}>
                        <Badge
                          variant="outline"
                          className={item.is_active ? "bg-green-500/10 text-green-600 cursor-pointer" : "bg-red-500/10 text-red-500 cursor-pointer"}
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete series?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{item.name}</strong> will be permanently deleted. Posts in this series will have their series cleared.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(item.id)}>
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
