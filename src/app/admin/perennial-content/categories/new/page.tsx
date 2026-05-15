"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

const STATUS_OPTIONS = ["active", "inactive"] as const;

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [status, setStatus] = useState<string>("active");
  const [imageUrl, setImageUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/admin/perennial-content/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        status,
        image_url: imageUrl || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create category");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => router.push("/admin/perennial-content/categories"), 800);
  }

  function handleReset() {
    setTitle("");
    setDescription("");
    setPriority(0);
    setStatus("active");
    setImageUrl("");
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/perennial-content/categories">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Category</h1>
          <p className="text-muted-foreground">
            Create a new product category
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Category name"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Category description"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {STATUS_OPTIONS.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="mt-2 max-h-32 rounded object-contain"
                  />
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Category created successfully!
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Creating..." : "Create Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/admin/perennial-content/categories">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
