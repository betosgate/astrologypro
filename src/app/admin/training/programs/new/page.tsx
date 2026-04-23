"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

type Role = { id: string; role_name: string; slug: string; description: string };

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSequential, setIsSequential] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "0",
    is_active: true,
    allowed_roles: [] as string[],
  });

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((d) => setRoles(d.data ?? []));
  }, []);

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
      const res = await fetch("/api/admin/training/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          priority: parseInt(form.priority, 10) || 0,
          is_active: form.is_active,
          allowed_roles: form.allowed_roles,
          is_sequential: isSequential,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create program.");
        return;
      }

      toast.success("Training program created.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">New Training Program</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Training Program</CardTitle>
          <CardDescription>
            Training programs are the top-level containers for training categories and lessons.
          </CardDescription>
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
                placeholder="e.g. Diviner Certification Program"
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
                placeholder="Brief description of this training program"
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

            {/* Sequential Lock */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-sm font-medium">Sequential Lock</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Users must complete categories in order — they cannot skip ahead
                </p>
              </div>
              <Switch
                checked={isSequential}
                onCheckedChange={setIsSequential}
              />
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Create Program"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/training">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
