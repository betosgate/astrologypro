"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type RoleOption = {
  slug: string;
  label: string;
  description: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { slug: "trainee", label: "Trainee", description: "Trainee (primary training role)" },
  { slug: "astrologer", label: "Astrologer", description: "Astrologer" },
  { slug: "tarot_reader", label: "Tarot Reader", description: "Tarot Reader" },
  { slug: "social_advocate", label: "Social Advocate", description: "Social Advocate" },
  { slug: "affiliate", label: "Affiliate", description: "Affiliate" },
  { slug: "mystery_school", label: "Mystery School Member", description: "Mystery School Member" },
  {
    slug: "perennial_mandalism",
    label: "Perennial Mandalism Member",
    description: "Perennial Mandalism Member",
  },
  { slug: "customer", label: "Customer", description: "Customer" },
];

export default function TrainingSettingsPage() {
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/training/settings")
      .then((r) => r.json())
      .then((d) => {
        setAllowedRoles(d.settings?.allowed_roles ?? []);
        setLastUpdated(d.settings?.updated_at ?? null);
      })
      .catch(() => toast.error("Failed to load training settings."))
      .finally(() => setFetching(false));
  }, []);

  function toggleRole(slug: string) {
    setAllowedRoles((prev) =>
      prev.includes(slug) ? prev.filter((r) => r !== slug) : [...prev, slug]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/training/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_roles: allowedRoles }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save settings.");
        return;
      }

      setLastUpdated(data.settings?.updated_at ?? null);
      setSaved(true);
      toast.success("Training settings saved.");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">
            Training /{" "}
            <span className="font-medium text-foreground">Settings</span>
          </p>
          <h1 className="text-xl font-bold tracking-tight">Training Settings</h1>
        </div>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Training Center Access</CardTitle>
                <CardDescription className="mt-1">
                  Select which user roles can access the trainee training center.
                </CardDescription>
              </div>
              {allowedRoles.length === 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                  All roles
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border divide-y">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.slug}
                  className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={allowedRoles.includes(role.slug)}
                    onChange={() => toggleRole(role.slug)}
                    className="mt-0.5 size-4 accent-primary"
                    aria-label={role.label}
                  />
                  <div>
                    <p className="text-sm font-medium leading-none">{role.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {allowedRoles.length === 0 && (
              <p className="text-xs text-amber-600">
                No roles selected — all authenticated users can access the training center.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Settings"}
                </Button>
                {saved && (
                  <span className="text-xs text-green-600 font-medium">
                    Saved successfully
                  </span>
                )}
              </div>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {new Date(lastUpdated).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
