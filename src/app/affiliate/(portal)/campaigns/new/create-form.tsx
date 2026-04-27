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

interface AssignmentOption {
  id: string;
  label: string;
}

export function CampaignCreateForm({
  options,
  preselectedAssignmentId,
}: {
  options: AssignmentOption[];
  preselectedAssignmentId: string | null;
}) {
  const router = useRouter();
  const initialAssignment =
    preselectedAssignmentId &&
    options.some((o) => o.id === preselectedAssignmentId)
      ? preselectedAssignmentId
      : options[0]?.id ?? "";

  const [assignmentId, setAssignmentId] = useState(initialAssignment);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignmentId) {
      toast.error("Pick a product first.");
      return;
    }
    if (!name.trim()) {
      toast.error("Give your campaign a name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/affiliate/assignments/${assignmentId}/campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            channel: channel.trim() || undefined,
            utm_source: utmSource.trim() || undefined,
            utm_medium: utmMedium.trim() || undefined,
            utm_campaign: utmCampaign.trim() || undefined,
          }),
        },
      );
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
      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignment">Product</Label>
            <Select
              value={assignmentId}
              onValueChange={setAssignmentId}
              disabled={submitting}
            >
              <SelectTrigger id="assignment">
                <SelectValue placeholder="Pick a product…" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
