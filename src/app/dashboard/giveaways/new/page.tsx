"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewGiveawayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const body: Record<string, unknown> = {
      title: data.get("title"),
      prize_description: data.get("prize_description"),
      description: data.get("description") || null,
      starts_at: data.get("starts_at") || null,
      ends_at: data.get("ends_at") || null,
    };

    // Convert date-time-local inputs to ISO strings
    if (body.starts_at) {
      body.starts_at = new Date(body.starts_at as string).toISOString();
    }
    if (body.ends_at) {
      body.ends_at = new Date(body.ends_at as string).toISOString();
    }

    try {
      const res = await fetch("/api/dashboard/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Failed to create giveaway.");
        return;
      }

      const giveaway = await res.json();
      router.push(`/dashboard/giveaways/${giveaway.id}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/giveaways">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Giveaway</h1>
            <p className="text-sm text-muted-foreground">
              Create a giveaway to engage your live audience
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giveaway Details</CardTitle>
          <CardDescription>
            Fill in the details below. You can activate the giveaway from the
            detail page once created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Free Birth Chart Reading Giveaway"
                maxLength={120}
              />
            </div>

            {/* Prize Description */}
            <div className="space-y-1.5">
              <Label htmlFor="prize_description">
                Prize Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prize_description"
                name="prize_description"
                required
                placeholder="Describe what the winner will receive…"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Description (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Additional Description{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Any extra details about the giveaway…"
                rows={2}
                maxLength={1000}
              />
            </div>

            {/* Date range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="starts_at">Start Date & Time</Label>
                <Input
                  id="starts_at"
                  name="starts_at"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ends_at">End Date & Time</Label>
                <Input
                  id="ends_at"
                  name="ends_at"
                  type="datetime-local"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                {loading ? "Creating…" : "Create Giveaway"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/dashboard/giveaways">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
