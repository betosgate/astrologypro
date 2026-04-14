"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";

type Workspace = { id: string; name: string };

const PLANS = ["basic", "premium", "enterprise"] as const;

export function AddSubscriberForm({ workspaces }: { workspaces: Workspace[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    workspace_id: workspaces[0]?.id ?? "",
    subscriber_email: "",
    plan: "basic" as string,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.subscriber_email.trim()) { setError("Email is required."); return; }
    if (!form.workspace_id) { setError("Select a workspace."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/mundane/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess(`${form.subscriber_email} added as a subscriber.`);
        setForm((p) => ({ ...p, subscriber_email: "" }));
        router.refresh();
      } else {
        setError(json.detail ?? json.error ?? "Failed to add subscriber.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="size-4 text-sky-500" />
          Add Subscriber
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          {/* Workspace select (only if multiple) */}
          {workspaces.length > 1 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Workspace</label>
              <select
                value={form.workspace_id}
                onChange={(e) => setForm((p) => ({ ...p, workspace_id: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Email *</label>
            <Input
              type="email"
              value={form.subscriber_email}
              onChange={(e) => setForm((p) => ({ ...p, subscriber_email: e.target.value }))}
              placeholder="subscriber@example.com"
              required
            />
          </div>

          {/* Plan */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
            >
              {PLANS.map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={saving} size="sm" className="h-9">
            {saving && <Loader2 className="mr-2 size-3 animate-spin" />}
            {saving ? "Adding…" : "Add Subscriber"}
          </Button>
        </form>

        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-600 mt-2">{success}</p>
        )}
      </CardContent>
    </Card>
  );
}
