"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContractAmendmentRollout, ContractTemplate } from "@/lib/contract-orchestration";

const ROLE_OPTIONS = [
  "client",
  "community",
  "mystery_school",
  "diviner",
  "trainee",
  "advocate",
] as const;

export function ContractAmendmentsClient({
  initialRollouts,
  templates,
}: {
  initialRollouts: ContractAmendmentRollout[];
  templates: ContractTemplate[];
}) {
  const [rollouts, setRollouts] = useState(initialRollouts);
  const [amendmentTemplateId, setAmendmentTemplateId] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [consolidatedTemplateId, setConsolidatedTemplateId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const amendmentTemplates = useMemo(
    () => templates.filter((template) => template.version_kind === "amendment"),
    [templates],
  );

  const consolidatedTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          template.version_kind === "consolidated" || template.is_current_consolidated,
      ),
    [templates],
  );

  async function refreshRollouts() {
    const res = await fetch("/api/admin/contracts/amendments", {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      rollouts?: ContractAmendmentRollout[];
    };
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to refresh amendment rollouts");
    }
    setRollouts(data.rollouts ?? []);
  }

  async function refreshPreview(nextRoles: string[]) {
    if (nextRoles.length === 0) {
      setPreviewCount(null);
      return;
    }

    const res = await fetch(
      `/api/admin/contracts/amendments?preview_roles=${encodeURIComponent(nextRoles.join(","))}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      uniqueUserCount?: number;
    };
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to preview amendment audience");
    }
    setPreviewCount(data.uniqueUserCount ?? 0);
  }

  async function createRollout() {
    if (!amendmentTemplateId || targetRoles.length === 0) {
      toast.error("Choose an amendment template and at least one role");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/contracts/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amendment_template_id: amendmentTemplateId,
          target_roles: targetRoles,
          consolidated_template_id: consolidatedTemplateId || null,
          notes: notes || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        rollout?: ContractAmendmentRollout;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create amendment rollout");
      }

      setRollouts((current) => [data.rollout!, ...current]);
      setAmendmentTemplateId("");
      setTargetRoles([]);
      setConsolidatedTemplateId("");
      setNotes("");
      setPreviewCount(null);
      toast.success("Amendment rollout drafted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateRolloutState(
    rolloutId: string,
    action: "activate" | "paused" | "superseded",
  ) {
    try {
      const res = await fetch(`/api/admin/contracts/amendments/${rolloutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update amendment rollout");
      }
      await refreshRollouts();
      toast.success(
        action === "activate"
          ? "Amendment rollout activated"
          : action === "paused"
            ? "Amendment rollout paused"
            : "Amendment rollout superseded",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  function toggleRole(roleKey: string) {
    const nextRoles = targetRoles.includes(roleKey)
      ? targetRoles.filter((value) => value !== roleKey)
      : [...targetRoles, roleKey];
    setTargetRoles(nextRoles);
    refreshPreview(nextRoles).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to preview audience");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Amendment Rollouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amendment-template">Amendment Template</Label>
              <Select
                value={amendmentTemplateId || undefined}
                onValueChange={setAmendmentTemplateId}
              >
                <SelectTrigger id="amendment-template" className="w-full">
                  <SelectValue placeholder="Select amendment template" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  {amendmentTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title} ({template.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consolidated-template">Future-User Consolidated Template</Label>
              <Select
                value={consolidatedTemplateId || "none"}
                onValueChange={(value) => setConsolidatedTemplateId(value === "none" ? "" : value)}
              >
                <SelectTrigger id="consolidated-template" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">No linked consolidated template</SelectItem>
                  {consolidatedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title} ({template.version_kind})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((roleKey) => (
                <Button
                  key={roleKey}
                  type="button"
                  variant={targetRoles.includes(roleKey) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRole(roleKey)}
                >
                  {roleKey}
                </Button>
              ))}
            </div>
            {previewCount !== null ? (
              <p className="text-xs text-muted-foreground">
                Snapshot audience if activated now: {previewCount} existing users
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amendment-notes">Notes</Label>
            <Textarea
              id="amendment-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Internal rollout notes"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={createRollout} disabled={saving}>
              {saving ? "Creating..." : "Create Draft Rollout"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {rollouts.map((rollout) => (
          <Card key={rollout.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {rollout.amendment_template?.title ?? "Amendment rollout"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {rollout.amendment_template?.contract_key ?? rollout.amendment_template_id}
                </p>
              </div>
              <Badge variant={rollout.rollout_state === "active" ? "default" : "secondary"}>
                {rollout.rollout_state}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Roles: {rollout.target_roles.join(", ")}</span>
                <span>Affected users: {rollout.affected_user_count}</span>
                <span>Accepted: {rollout.status_counts?.accepted ?? 0}</span>
                <span>Pending: {rollout.status_counts?.pending ?? 0}</span>
                <span>
                  Consolidated path:{" "}
                  {rollout.consolidated_template?.title ?? "Not linked"}
                </span>
              </div>
              {rollout.notes ? (
                <p className="text-sm text-muted-foreground">{rollout.notes}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {rollout.rollout_state === "draft" ? (
                  <Button size="sm" onClick={() => updateRolloutState(rollout.id, "activate")}>
                    Activate
                  </Button>
                ) : null}
                {rollout.rollout_state === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRolloutState(rollout.id, "paused")}
                  >
                    Pause
                  </Button>
                ) : null}
                {rollout.rollout_state !== "superseded" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateRolloutState(rollout.id, "superseded")}
                  >
                    Mark Superseded
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {rollouts.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No amendment rollouts yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
