"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { TrainingNotes } from "@/components/admin/training-notes";

type Program = { id: string; name: string };

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isSequential, setIsSequential] = useState(false);

  const [form, setForm] = useState({
    training_id: "",
    name: "",
    description: "",
    priority: "0",
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const [catRes, progRes] = await Promise.all([
          fetch(`/api/admin/training/categories/${id}`),
          fetch("/api/admin/training/programs"),
        ]);

        if (!catRes.ok) {
          toast.error("Category not found.");
          router.push("/admin/training");
          return;
        }

        const catData = await catRes.json();
        const progData = progRes.ok ? await progRes.json() : { programs: [] };

        setPrograms(progData.programs ?? []);

        const cat = catData.category;
        setForm({
          training_id: cat.training_id ?? "",
          name: cat.name ?? "",
          description: cat.description ?? "",
          priority: String(cat.priority ?? 0),
          is_active: cat.is_active ?? true,
        });
        setIsSequential(cat.is_sequential ?? false);
      } catch {
        toast.error("Failed to load category.");
        router.push("/admin/training");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.training_id) {
      toast.error("Training program is required.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_id: form.training_id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          priority: parseInt(form.priority, 10) || 0,
          is_active: form.is_active,
          is_sequential: isSequential,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update category.");
        return;
      }

      toast.success("Category updated.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this category? This cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete category.");
        return;
      }
      toast.success("Category deleted.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Edit Category</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Training Category</CardTitle>
          <CardDescription>Edit the details for this category.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Training Program */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="training_id">
                Training Program <span className="text-red-500">*</span>
              </label>
              <select
                id="training_id"
                name="training_id"
                value={form.training_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— Select a program —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="priority">
                Priority
              </label>
              <input
                id="priority"
                name="priority"
                type="number"
                min="0"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Lower number = shown first.
              </p>
            </div>

            {/* Sequential Lock */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-sm font-medium">Sequential Lock</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Users must complete lessons in order within this category
                </p>
              </div>
              <Switch
                checked={isSequential}
                onCheckedChange={setIsSequential}
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="size-4 rounded border-input accent-primary"
              />
              <label className="text-sm font-medium" htmlFor="is_active">
                Active (visible to trainees)
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/training">Cancel</Link>
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TrainingNotes entityType="category" entityId={id} />
    </div>
  );
}
