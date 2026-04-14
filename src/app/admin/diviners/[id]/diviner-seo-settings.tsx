"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface DivinerSeoSettings {
  id: string;
  seo_city: string | null;
  seo_region: string | null;
  seo_country: string | null;
  seo_country_code: string | null;
  seo_service_area_mode: "local" | "multi_region" | "remote_global" | null;
  seo_service_areas: string[] | null;
  seo_is_remote_global: boolean;
  seo_languages: string[] | null;
  seo_credentials: string[] | null;
  seo_awards: string[] | null;
  seo_years_experience: number | null;
  seo_same_as_urls: string[] | null;
  seo_press_mentions: string[] | null;
  seo_title_override: string | null;
  seo_description_override: string | null;
  seo_h1_override: string | null;
  seo_primary_keyword: string | null;
  seo_secondary_keywords: string[] | null;
  seo_og_image_url: string | null;
  seo_show_aggregate_rating: boolean;
  seo_show_testimonials_in_schema: boolean;
}

function arrayToTextarea(value?: string[] | null) {
  return value && value.length > 0 ? value.join("\n") : "";
}

export function DivinerSeoSettings({
  divinerId,
  initialSeo,
}: {
  divinerId: string;
  initialSeo: DivinerSeoSettings;
}) {
  const [seo, setSeo] = useState(initialSeo);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof DivinerSeoSettings>(key: K, value: DivinerSeoSettings[K]) {
    setSeo((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/diviners/${divinerId}/seo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...seo,
          seo_service_areas: arrayToTextarea(seo.seo_service_areas),
          seo_languages: arrayToTextarea(seo.seo_languages),
          seo_credentials: arrayToTextarea(seo.seo_credentials),
          seo_awards: arrayToTextarea(seo.seo_awards),
          seo_same_as_urls: arrayToTextarea(seo.seo_same_as_urls),
          seo_press_mentions: arrayToTextarea(seo.seo_press_mentions),
          seo_secondary_keywords: arrayToTextarea(seo.seo_secondary_keywords),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        seo?: DivinerSeoSettings;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save SEO settings");
      }
      if (data.seo) {
        setSeo(data.seo);
      }
      toast.success("SEO settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-sky-500" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="seo-city">City</Label>
            <Input id="seo-city" value={seo.seo_city ?? ""} onChange={(e) => update("seo_city", e.target.value || null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-region">Region</Label>
            <Input id="seo-region" value={seo.seo_region ?? ""} onChange={(e) => update("seo_region", e.target.value || null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-country">Country</Label>
            <Input id="seo-country" value={seo.seo_country ?? ""} onChange={(e) => update("seo_country", e.target.value || null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-country-code">Country Code</Label>
            <Input id="seo-country-code" value={seo.seo_country_code ?? ""} onChange={(e) => update("seo_country_code", e.target.value || null)} maxLength={2} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="seo-service-area-mode">Service Area Mode</Label>
            <select
              id="seo-service-area-mode"
              value={seo.seo_service_area_mode ?? ""}
              onChange={(e) =>
                update(
                  "seo_service_area_mode",
                  (e.target.value || null) as DivinerSeoSettings["seo_service_area_mode"],
                )
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Not set</option>
              <option value="local">local</option>
              <option value="multi_region">multi_region</option>
              <option value="remote_global">remote_global</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-years">Years Experience</Label>
            <Input
              id="seo-years"
              type="number"
              value={seo.seo_years_experience ?? ""}
              onChange={(e) =>
                update(
                  "seo_years_experience",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Remote Global</p>
              <p className="text-xs text-muted-foreground">
                Show worldwide remote availability in metadata and schema.
              </p>
            </div>
            <Switch
              checked={seo.seo_is_remote_global}
              onCheckedChange={(checked) => update("seo_is_remote_global", checked)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seo-service-areas">Service Areas</Label>
            <Textarea
              id="seo-service-areas"
              rows={4}
              value={arrayToTextarea(seo.seo_service_areas)}
              onChange={(e) => update("seo_service_areas", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One area per line"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-languages">Languages</Label>
            <Textarea
              id="seo-languages"
              rows={4}
              value={arrayToTextarea(seo.seo_languages)}
              onChange={(e) => update("seo_languages", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One language per line"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-credentials">Credentials</Label>
            <Textarea
              id="seo-credentials"
              rows={4}
              value={arrayToTextarea(seo.seo_credentials)}
              onChange={(e) => update("seo_credentials", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One credential per line"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-awards">Awards</Label>
            <Textarea
              id="seo-awards"
              rows={4}
              value={arrayToTextarea(seo.seo_awards)}
              onChange={(e) => update("seo_awards", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One award per line"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seo-same-as">SameAs URLs</Label>
            <Textarea
              id="seo-same-as"
              rows={4}
              value={arrayToTextarea(seo.seo_same_as_urls)}
              onChange={(e) => update("seo_same_as_urls", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One URL per line"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-press">Press Mentions</Label>
            <Textarea
              id="seo-press"
              rows={4}
              value={arrayToTextarea(seo.seo_press_mentions)}
              onChange={(e) => update("seo_press_mentions", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One URL per line"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seo-title">SEO Title Override</Label>
            <Input id="seo-title" value={seo.seo_title_override ?? ""} onChange={(e) => update("seo_title_override", e.target.value || null)} maxLength={70} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-primary-keyword">Primary Keyword</Label>
            <Input id="seo-primary-keyword" value={seo.seo_primary_keyword ?? ""} onChange={(e) => update("seo_primary_keyword", e.target.value || null)} maxLength={80} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo-description">SEO Description Override</Label>
            <Textarea id="seo-description" rows={3} value={seo.seo_description_override ?? ""} onChange={(e) => update("seo_description_override", e.target.value || null)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo-h1">SEO H1 Override</Label>
            <Input id="seo-h1" value={seo.seo_h1_override ?? ""} onChange={(e) => update("seo_h1_override", e.target.value || null)} maxLength={120} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo-secondary-keywords">Secondary Keywords</Label>
            <Textarea
              id="seo-secondary-keywords"
              rows={3}
              value={arrayToTextarea(seo.seo_secondary_keywords)}
              onChange={(e) => update("seo_secondary_keywords", e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))}
              placeholder="One keyword per line"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo-og-image">SEO OG Image URL</Label>
            <Input id="seo-og-image" value={seo.seo_og_image_url ?? ""} onChange={(e) => update("seo_og_image_url", e.target.value || null)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Aggregate Rating in Schema</p>
              <p className="text-xs text-muted-foreground">Allow review aggregate data in structured data.</p>
            </div>
            <Switch
              checked={seo.seo_show_aggregate_rating}
              onCheckedChange={(checked) => update("seo_show_aggregate_rating", checked)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Testimonials in Schema</p>
              <p className="text-xs text-muted-foreground">Allow moderated testimonials to feed structured data.</p>
            </div>
            <Switch
              checked={seo.seo_show_testimonials_in_schema}
              onCheckedChange={(checked) => update("seo_show_testimonials_in_schema", checked)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save SEO Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
