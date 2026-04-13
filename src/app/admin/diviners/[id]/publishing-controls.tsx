"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  type DivinerMediaType,
  type DivinerPublicSection,
  VALID_MEDIA_TYPES,
  VALID_PUBLIC_SECTIONS,
} from "@/lib/diviner-publishing";

const SECTION_LABELS: Record<DivinerPublicSection, string> = {
  hero: "Hero and profile header",
  bio: "Bio tab",
  services: "Services and offerings",
  live: "Live stream and check-in",
  media: "Media gallery",
  testimonials: "Testimonials",
  weekly_subscription: "Weekly subscription offer",
};

const MEDIA_LABELS: Record<DivinerMediaType, string> = {
  video: "Video",
  audio: "Audio",
  article: "Article",
  link: "Link",
  image: "Image",
};

interface PublishingControlsProps {
  divinerId: string;
  initialPolicy: {
    publicPublishBlocked: boolean;
    blockedPublicSections: DivinerPublicSection[];
    blockedMediaTypes: DivinerMediaType[];
    publishBlockReason: string | null;
  };
}

export function PublishingControls({
  divinerId,
  initialPolicy,
}: PublishingControlsProps) {
  const [publicPublishBlocked, setPublicPublishBlocked] = useState(initialPolicy.publicPublishBlocked);
  const [blockedPublicSections, setBlockedPublicSections] = useState<DivinerPublicSection[]>(
    initialPolicy.blockedPublicSections
  );
  const [blockedMediaTypes, setBlockedMediaTypes] = useState<DivinerMediaType[]>(
    initialPolicy.blockedMediaTypes
  );
  const [publishBlockReason, setPublishBlockReason] = useState(initialPolicy.publishBlockReason ?? "");
  const [saving, setSaving] = useState(false);

  function toggleSection(section: DivinerPublicSection, checked: boolean) {
    setBlockedPublicSections((current) =>
      checked ? Array.from(new Set([...current, section])) : current.filter((value) => value !== section)
    );
  }

  function toggleMediaType(mediaType: DivinerMediaType, checked: boolean) {
    setBlockedMediaTypes((current) =>
      checked ? Array.from(new Set([...current, mediaType])) : current.filter((value) => value !== mediaType)
    );
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/diviners/${divinerId}/publishing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicPublishBlocked,
          blockedPublicSections,
          blockedMediaTypes,
          publishBlockReason,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save publish controls");
      }

      toast.success("Publishing controls updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save publish controls");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4 text-amber-500" />
          Publishing Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Block all public publishing</p>
            <p className="text-xs text-muted-foreground">
              Hides the entire public diviner presence from publishing, regardless of section-level settings.
            </p>
          </div>
          <Switch
            checked={publicPublishBlocked}
            onCheckedChange={setPublicPublishBlocked}
            disabled={saving}
            aria-label="Block all public publishing"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Block specific public sections</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {VALID_PUBLIC_SECTIONS.map((section) => (
              <label
                key={section}
                className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
              >
                <Checkbox
                  checked={blockedPublicSections.includes(section)}
                  onCheckedChange={(checked) => toggleSection(section, checked === true)}
                  disabled={saving || publicPublishBlocked}
                />
                <span className="text-sm">{SECTION_LABELS[section]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Block media types</p>
          <p className="text-xs text-muted-foreground">
            Use this when the diviner can still publish media generally, but not specific formats.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {VALID_MEDIA_TYPES.map((mediaType) => (
              <label
                key={mediaType}
                className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
              >
                <Checkbox
                  checked={blockedMediaTypes.includes(mediaType)}
                  onCheckedChange={(checked) => toggleMediaType(mediaType, checked === true)}
                  disabled={saving || publicPublishBlocked || blockedPublicSections.includes("media")}
                />
                <span className="text-sm">{MEDIA_LABELS[mediaType]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="publish-block-reason">Admin reason</Label>
          <Textarea
            id="publish-block-reason"
            value={publishBlockReason}
            onChange={(event) => setPublishBlockReason(event.target.value)}
            rows={3}
            placeholder="Optional note shown to admins and used in blocked route responses."
            disabled={saving}
          />
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save publishing controls"}
        </Button>
      </CardContent>
    </Card>
  );
}
