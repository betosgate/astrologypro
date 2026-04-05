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
import Link from "next/link";
import { TrainingNotes } from "@/components/admin/training-notes";

type Role = { id: string; role_name: string; slug: string; description: string };

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "0",
    is_active: true,
    allowed_roles: [] as string[],
  });

  useEffect(() => {
    async function load() {
      try {
        const [progRes, rolesRes] = await Promise.all([
          fetch(`/api/admin/training/programs/${id}`),
          fetch("/api/admin/roles"),
        ]);

        if (!progRes.ok) {
          toast.error("Program not found.");
          router.push("/admin/training");
          return;
        }

        const progData = await progRes.json();
        const rolesData = rolesRes.ok ? await rolesRes.json() : { data: [] };

        setRoles(rolesData.data ?? []);

        const prog = progData.program;
        setForm({
          name: prog.name ?? "",
          description: prog.description ?? "",
          priority: String(prog.priority ?? 0),
          is_active: prog.is_active ?? true,
          allowed_roles: Array.isArray(prog.allowed_roles) ? prog.allowed_roles : [],
        });
      } catch {
        toast.error("Failed to load program.");
        router.push("/admin/training");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  function toggleRole(slug: string) {
    setForm((prev) => ({
      ...prev,
      allowed_roles: prev.allowed_roles.includes(slug)
        ? prev.allowed_roles.filter((r) => r !== slug)
        : [...prev.allowed_roles, slug],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/programs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          priority: parseInt(form.priority, 10) || 0,
          is_active: form.is_active,
          allowed_roles: form.allowed_roles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update program.");
        return;
      }

      toast.success("Training program updated.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this training program? All categories must be reassigned first.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/programs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete program.");
        return;
      }
      toast.success("Training program deleted.");
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
        <h1 className="text-xl font-bold tracking-tight">Edit Training Program</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Training Program</CardTitle>
          <CardDescription>Edit the details for this training program.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-xs text-muted-foreground">Lower number = shown first.</p>
            </div>

            {/* Allowed Roles */}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Access — Allowed Roles</p>
                <p className="text-xs text-muted-foreground">
                  Leave all unchecked to allow access for every authenticated user.
                </p>
              </div>
              {roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading roles…</p>
              ) : (
                <div className="rounded-md border divide-y">
                  {roles.map((role) => (
                    <label
                      key={role.slug}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowed_roles.includes(role.slug)}
                        onChange={() => toggleRole(role.slug)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium leading-none">{role.role_name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {form.allowed_roles.length === 0 && (
                <p className="text-xs text-amber-600">No roles selected — all authenticated users can access this program.</p>
              )}
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

      <TrainingNotes entityType="program" entityId={id} />
    </div>
  );
}
