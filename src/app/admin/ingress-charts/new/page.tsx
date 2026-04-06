"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const SECTORS = [
  { key: "Government & Leadership", val: "governmentAndLeadership" },
  { key: "Social Climate & Public Mood", val: "socialClimateAndPublicMood" },
  { key: "Weather & Agriculture", val: "weatherAndAgriculture" },
  { key: "Potential Conflicts & Alliances", val: "potentialConflictsAndAlliances" },
  { key: "Public Health & Workforce", val: "publicHealthAndWorkforce" },
  { key: "Communications & Transportation", val: "communicationsAndTransportation" },
  { key: "Justice, Law & Foreign Trade", val: "justiceLawAndForeignTrade" },
  { key: "Natural Disasters", val: "naturalDisasters" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type ChartRulerItem = { icon: string; text: string };
type ChallengeStrengthItem = { type: "challenge" | "strength"; text: string };

// ─── Tag chip input ─────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type a tag and press Enter"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NewIngressChartPage() {
  const router = useRouter();

  // Basic info
  const [title, setTitle] = useState("");
  const [ingressType, setIngressType] = useState("");
  const [importance, setImportance] = useState("High Impact");
  const [shortDescription, setShortDescription] = useState("");
  const [eventTimestamp, setEventTimestamp] = useState("");
  const [effectiveTimePeriod, setEffectiveTimePeriod] = useState("");
  const [eventTimePeriod, setEventTimePeriod] = useState("");
  const [validityStart, setValidityStart] = useState("");
  const [validityEnd, setValidityEnd] = useState("");

  // Location
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [locationTimezone, setLocationTimezone] = useState("");

  // Sectors + tags
  const [sectorFocus, setSectorFocus] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Author
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  // System interpretation
  const [intro, setIntro] = useState("");
  const [bodyParagraphs, setBodyParagraphs] = useState<string[]>([""]);
  const [chartRulerItems, setChartRulerItems] = useState<ChartRulerItem[]>([{ icon: "", text: "" }]);
  const [challengesStrengths, setChallengesStrengths] = useState<ChallengeStrengthItem[]>([
    { type: "challenge", text: "" },
  ]);

  // Sidebar
  const [isPublished, setIsPublished] = useState(false);
  const [isSocialAdvo, setIsSocialAdvo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Body paragraphs helpers
  function updateBody(idx: number, val: string) {
    setBodyParagraphs((prev) => prev.map((p, i) => (i === idx ? val : p)));
  }
  function removeBody(idx: number) {
    setBodyParagraphs((prev) => prev.filter((_, i) => i !== idx));
  }

  // Chart ruler helpers
  function updateChartRuler(idx: number, field: keyof ChartRulerItem, val: string) {
    setChartRulerItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  }
  function removeChartRuler(idx: number) {
    setChartRulerItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // Challenges & strengths helpers
  function updateCS(idx: number, field: keyof ChallengeStrengthItem, val: string) {
    setChallengesStrengths((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: val as "challenge" | "strength" } : item
      )
    );
  }
  function removeCS(idx: number) {
    setChallengesStrengths((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleSector(val: string) {
    setSectorFocus((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      ingress_type: ingressType || null,
      importance,
      short_description: shortDescription || null,
      event_timestamp: eventTimestamp ? new Date(eventTimestamp).toISOString() : null,
      effective_time_period: effectiveTimePeriod || null,
      event_time_period: eventTimePeriod || null,
      validity_start: validityStart || null,
      validity_end: validityEnd || null,
      location_name: locationName || null,
      location_lat: locationLat ? parseFloat(locationLat) : null,
      location_lng: locationLng ? parseFloat(locationLng) : null,
      location_timezone: locationTimezone || null,
      sector_focus: sectorFocus,
      tags,
      author_name: authorName || null,
      author_email: authorEmail || null,
      system_interpretation: {
        intro,
        body: bodyParagraphs.filter(Boolean),
        chartRuler: chartRulerItems.filter((r) => r.text),
        challengesAndStrengths: challengesStrengths.filter((c) => c.text),
      },
      is_published: isPublished,
      is_social_advo: isSocialAdvo,
    };

    try {
      const res = await fetch("/api/admin/ingress-charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }
      router.push("/admin/ingress-charts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Ingress Chart</h1>
        <p className="text-muted-foreground">Create a new mundane astrology ingress chart.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* ── Main column ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. 2026 Aries Ingress — Washington D.C."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ingress_type">Ingress Type</Label>
                    <select
                      id="ingress_type"
                      value={ingressType}
                      onChange={(e) => setIngressType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Select type…</option>
                      <option value="Aries Ingress">Aries Ingress (Spring Equinox)</option>
                      <option value="Cancer Ingress">Cancer Ingress (Summer Solstice)</option>
                      <option value="Libra Ingress">Libra Ingress (Autumn Equinox)</option>
                      <option value="Capricorn Ingress">Capricorn Ingress (Winter Solstice)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="importance">Importance</Label>
                    <select
                      id="importance"
                      value={importance}
                      onChange={(e) => setImportance(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="High Impact">High Impact</option>
                      <option value="Medium Impact">Medium Impact</option>
                      <option value="Low Impact">Low Impact</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    placeholder="A brief overview for the list view."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="event_timestamp">Event Timestamp</Label>
                    <Input
                      id="event_timestamp"
                      type="datetime-local"
                      value={eventTimestamp}
                      onChange={(e) => setEventTimestamp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="effective_time_period">Effective Time Period</Label>
                    <Input
                      id="effective_time_period"
                      value={effectiveTimePeriod}
                      onChange={(e) => setEffectiveTimePeriod(e.target.value)}
                      placeholder="e.g. Mar–Jun 2026"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="event_time_period">Event Time Period</Label>
                    <Input
                      id="event_time_period"
                      value={eventTimePeriod}
                      onChange={(e) => setEventTimePeriod(e.target.value)}
                      placeholder="e.g. Summer 2026"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="validity_start">Validity Start</Label>
                    <Input
                      id="validity_start"
                      type="date"
                      value={validityStart}
                      onChange={(e) => setValidityStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="validity_end">Validity End</Label>
                    <Input
                      id="validity_end"
                      type="date"
                      value={validityEnd}
                      onChange={(e) => setValidityEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location_name">Location Name</Label>
                  <Input
                    id="location_name"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="location_lat">Latitude</Label>
                    <Input
                      id="location_lat"
                      type="number"
                      step="0.0001"
                      value={locationLat}
                      onChange={(e) => setLocationLat(e.target.value)}
                      placeholder="38.9072"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location_lng">Longitude</Label>
                    <Input
                      id="location_lng"
                      type="number"
                      step="0.0001"
                      value={locationLng}
                      onChange={(e) => setLocationLng(e.target.value)}
                      placeholder="-77.0369"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location_timezone">Timezone</Label>
                    <Input
                      id="location_timezone"
                      value={locationTimezone}
                      onChange={(e) => setLocationTimezone(e.target.value)}
                      placeholder="America/New_York"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sector Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sector Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECTORS.map((s) => (
                    <label
                      key={s.val}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={sectorFocus.includes(s.val)}
                        onChange={() => toggleSector(s.val)}
                        className="size-4"
                      />
                      {s.key}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <TagInput tags={tags} onChange={setTags} />
              </CardContent>
            </Card>

            {/* Author */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Author Info</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="author_name">Author Name</Label>
                  <Input
                    id="author_name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author_email">Author Email</Label>
                  <Input
                    id="author_email"
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Interpretation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Interpretation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Intro */}
                <div className="space-y-1.5">
                  <Label htmlFor="intro">Intro Paragraph</Label>
                  <Textarea
                    id="intro"
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    rows={3}
                    placeholder="Opening interpretation…"
                  />
                </div>

                {/* Body paragraphs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Body Paragraphs</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBodyParagraphs((prev) => [...prev, ""])}
                    >
                      <Plus className="mr-1 size-3.5" /> Add Paragraph
                    </Button>
                  </div>
                  {bodyParagraphs.map((para, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Textarea
                        value={para}
                        onChange={(e) => updateBody(idx, e.target.value)}
                        rows={2}
                        placeholder={`Paragraph ${idx + 1}…`}
                        className="flex-1"
                      />
                      {bodyParagraphs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeBody(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chart Ruler items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Chart Ruler Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setChartRulerItems((prev) => [...prev, { icon: "", text: "" }])
                      }
                    >
                      <Plus className="mr-1 size-3.5" /> Add Chart Ruler
                    </Button>
                  </div>
                  {chartRulerItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={item.icon}
                        onChange={(e) => updateChartRuler(idx, "icon", e.target.value)}
                        placeholder="Icon name"
                        className="w-32 shrink-0"
                      />
                      <Input
                        value={item.text}
                        onChange={(e) => updateChartRuler(idx, "text", e.target.value)}
                        placeholder="Description text"
                        className="flex-1"
                      />
                      {chartRulerItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeChartRuler(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Challenges & Strengths */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Challenges &amp; Strengths</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setChallengesStrengths((prev) => [
                          ...prev,
                          { type: "challenge", text: "" },
                        ])
                      }
                    >
                      <Plus className="mr-1 size-3.5" /> Add Item
                    </Button>
                  </div>
                  {challengesStrengths.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="flex gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="radio"
                            name={`cs_type_${idx}`}
                            value="challenge"
                            checked={item.type === "challenge"}
                            onChange={() => updateCS(idx, "type", "challenge")}
                          />
                          Challenge
                        </label>
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="radio"
                            name={`cs_type_${idx}`}
                            value="strength"
                            checked={item.type === "strength"}
                            onChange={() => updateCS(idx, "type", "strength")}
                          />
                          Strength
                        </label>
                      </div>
                      <Input
                        value={item.text}
                        onChange={(e) => updateCS(idx, "text", e.target.value)}
                        placeholder="Description…"
                        className="flex-1"
                      />
                      {challengesStrengths.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeCS(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_published">Published</Label>
                  <Switch
                    id="is_published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_social_advo">Social Advocacy</Label>
                  <Switch
                    id="is_social_advo"
                    checked={isSocialAdvo}
                    onCheckedChange={setIsSocialAdvo}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving…" : "Create Chart"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/ingress-charts">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
