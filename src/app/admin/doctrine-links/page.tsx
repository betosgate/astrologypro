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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Star } from "lucide-react";

type DoctrineLink = {
  id: string;
  label: string;
  description: string | null;
  url: string;
  link_type: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const LINK_TYPES = [
  { value: "study", label: "Study" },
  { value: "doctrine", label: "Doctrine" },
  { value: "creed", label: "Creed" },
  { value: "resource", label: "Resource" },
  { value: "external", label: "External" },
];

const EMPTY_FORM = {
  label: "",
  description: "",
  url: "",
  link_type: "study",
  icon: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminDoctrineLinksPage() {
  const [links, setLinks] = useState<DoctrineLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLinks() {
    setLoading(true);
    const res = await fetch("/api/admin/doctrine-links");
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadLinks();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  }

  function openEdit(link: DoctrineLink) {
    setEditingId(link.id);
    setForm({
      label: link.label,
      description: link.description ?? "",
      url: link.url,
      link_type: link.link_type,
      icon: link.icon ?? "",
      sort_order: link.sort_order,
      is_active: link.is_active,
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
      label: form.label.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      link_type: form.link_type,
      icon: form.icon.trim() || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/doctrine-links/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/doctrine-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }

      await loadLinks();
      setShowForm(false);
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(link: DoctrineLink) {
    const res = await fetch(`/api/admin/doctrine-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !link.is_active }),
    });
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: !link.is_active } : l))
      );
    }
  }

  async function handleReorder(link: DoctrineLink, direction: "up" | "down") {
    const idx = links.findIndex((l) => l.id === link.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;

    const swapLink = links[swapIdx];
    await Promise.all([
      fetch(`/api/admin/doctrine-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: swapLink.sort_order }),
      }),
      fetch(`/api/admin/doctrine-links/${swapLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: link.sort_order }),
      }),
    ]);
    await loadLinks();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/doctrine-links/${id}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctrine Links</h1>
          <p className="text-muted-foreground">Manage doctrine &amp; creed references in the Community Library.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1.5 size-4" />
          Add Link
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Doctrine Link" : "New Doctrine Link"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Label *</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Central Doctrine"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Link Type</Label>
                  <select
                    value={form.link_type}
                    onChange={(e) => setForm((f) => ({ ...f, link_type: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {LINK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>URL *</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://... or /community/..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description shown to members"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Icon (lucide name, optional)</Label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. star, book-open"
                  />
                </div>
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
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="size-4"
                />
                <Label htmlFor="is_active">Active (visible to members)</Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update Link" : "Add Link"}
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
            <Star className="size-4" />
            All Doctrine Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Star className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No doctrine links yet. Add one above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link, idx) => (
                  <TableRow key={link.id}>
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground w-4">{link.sort_order}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleReorder(link, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleReorder(link, "down")}
                            disabled={idx === links.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{link.label}</p>
                        {link.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {link.link_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {link.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleToggleActive(link)}>
                        <Badge
                          variant="outline"
                          className={
                            link.is_active
                              ? "bg-green-500/10 text-green-600 cursor-pointer"
                              : "bg-red-500/10 text-red-500 cursor-pointer"
                          }
                        >
                          {link.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(link)}>
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
                              <AlertDialogTitle>Delete doctrine link?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{link.label}</strong> will be permanently deleted. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(link.id)}
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
