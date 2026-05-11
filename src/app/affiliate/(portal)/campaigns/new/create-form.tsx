"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PickerOption {
  id: string;
  label: string;
}

type Mode = "per-diviner" | "general";

interface CampaignCreateFormProps {
  assignmentOptions: PickerOption[];
  templateOptions: PickerOption[];
  preselectedAssignmentId: string | null;
  preselectedTemplateId: string | null;
  initialMode: Mode;
}

export function CampaignCreateForm({
  assignmentOptions,
  templateOptions,
  preselectedAssignmentId,
  preselectedTemplateId,
  initialMode,
}: CampaignCreateFormProps) {
  const router = useRouter();

  const initialAssignment =
    preselectedAssignmentId &&
    assignmentOptions.some((o) => o.id === preselectedAssignmentId)
      ? preselectedAssignmentId
      : assignmentOptions[0]?.id ?? "";

  const initialTemplate =
    preselectedTemplateId &&
    templateOptions.some((o) => o.id === preselectedTemplateId)
      ? preselectedTemplateId
      : templateOptions[0]?.id ?? "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [assignmentId, setAssignmentId] = useState(initialAssignment);
  const [templateId, setTemplateId] = useState(initialTemplate);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showModeToggle =
    assignmentOptions.length > 0 && templateOptions.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give your campaign a name.");
      return;
    }

    if (mode === "per-diviner" && !assignmentId) {
      toast.error("Pick a product first.");
      return;
    }
    if (mode === "general" && !templateId) {
      toast.error("Pick a general product first.");
      return;
    }

    setSubmitting(true);
    try {
      const url =
        mode === "per-diviner"
          ? `/api/affiliate/assignments/${assignmentId}/campaigns`
          : `/api/affiliate/general-campaigns`;
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        channel: channel.trim() || undefined,
        utm_source: utmSource.trim() || undefined,
        utm_medium: utmMedium.trim() || undefined,
        utm_campaign: utmCampaign.trim() || undefined,
      };
      if (mode === "general") {
        payload.service_template_id = templateId;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as
        | { data?: { campaign_id: string } }
        | { detail?: string; title?: string };

      if (!res.ok) {
        const err = body as { detail?: string; title?: string };
        toast.error(err.detail ?? err.title ?? "Failed to create campaign");
        setSubmitting(false);
        return;
      }
      const ok = body as { data?: { campaign_id: string } };
      toast.success("Campaign created");
      if (ok.data?.campaign_id) {
        router.push(`/affiliate/campaigns/${ok.data.campaign_id}`);
        router.refresh();
      } else {
        router.push("/affiliate/campaigns");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {showModeToggle && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
              {(
                [
                  { value: "per-diviner", label: "Per-diviner" },
                  { value: "general", label: "General product" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  disabled={submitting}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Per-diviner campaigns reference a partnership a diviner has
              given you. General campaigns let you promote platform-wide
              products at a rate set by the platform.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "per-diviner" ? (
            <div className="space-y-2">
              <Label htmlFor="assignment">Product</Label>
              <Select
                value={assignmentId}
                onValueChange={setAssignmentId}
                disabled={submitting || assignmentOptions.length === 0}
              >
                <SelectTrigger id="assignment" className="w-full">
                  <SelectValue placeholder="Pick a product…" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignmentOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  You don&rsquo;t have any active per-diviner assignments.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="template">General product</Label>
              <Select
                value={templateId}
                onValueChange={setTemplateId}
                disabled={submitting || templateOptions.length === 0}
              >
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Pick a product…" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No general programs are currently enabled.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Campaign name</Label>
            <Input
              id="name"
              maxLength={120}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Tarot Push, Newsletter Q3"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              For your tracking only — never shown to people who click your
              link.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where will this campaign run? What audience?"
              disabled={submitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Channel (optional)</Label>
            <Input
              id="channel"
              maxLength={50}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g. instagram, email, podcast"
              disabled={submitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UTM tags (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="utm_source">utm_source</Label>
            <Input
              id="utm_source"
              maxLength={100}
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm_medium">utm_medium</Label>
            <Input
              id="utm_medium"
              maxLength={100}
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm_campaign">utm_campaign</Label>
            <Input
              id="utm_campaign"
              maxLength={100}
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              disabled={submitting}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create campaign
        </Button>
      </div>
    </form>
  );
}
