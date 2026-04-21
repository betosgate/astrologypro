"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  ArrowLeft,
  Sparkles,
  Sun,
  Moon,
  Star,
  Sunrise,
  CalendarDays,
  Heart,
  Users,
  Briefcase,
  Eye,
  Zap,
  Circle,
  Flame,
  Layers,
  LayoutGrid,
  TrendingUp,
  Anchor,
  HeartHandshake,
  Cross,
  CircleDot,
  Bolt,
  Clock3,
  BadgeDollarSign,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateFormData {
  name: string;
  slug: string;
  category: "astrology" | "tarot" | "";
  description: string;
  long_description: string;
  base_price: string;
  overage_rate: string;
  duration_minutes: string;
  is_primary: boolean;
  requires_birth_data: boolean;
  trigger_event: string;
  display_order: string;
  icon_name: string;
  color: string;
  whats_included: string[];
  who_its_for: string[];
  faq: { question: string; answer: string }[];
  seo_title: string;
  seo_description: string;
  is_active: boolean;
}

export const DEFAULT_FORM: TemplateFormData = {
  name: "",
  slug: "",
  category: "",
  description: "",
  long_description: "",
  base_price: "",
  overage_rate: "",
  duration_minutes: "",
  is_primary: false,
  requires_birth_data: false,
  trigger_event: "",
  display_order: "0",
  icon_name: "",
  color: "",
  whats_included: [],
  who_its_for: [],
  faq: [],
  seo_title: "",
  seo_description: "",
  is_active: true,
};

// Radix Select does not accept an empty-string value, so use a sentinel for
// "no trigger event" and translate to/from empty string at the boundary.
const TRIGGER_EVENT_NONE = "__none__";

const TRIGGER_EVENTS = [
  { value: TRIGGER_EVENT_NONE, label: "None" },
  { value: "solar_return", label: "Solar Return" },
  { value: "jupiter_return", label: "Jupiter Return" },
  { value: "saturn_return", label: "Saturn Return" },
  { value: "mars_return", label: "Mars Return" },
  { value: "uranus_opposition", label: "Uranus Opposition" },
  { value: "lunar_return", label: "Lunar Return" },
];

const ICON_OPTIONS = [
  "Sun", "Moon", "Star", "Sunrise", "CalendarDays", "Heart", "Users", "Briefcase",
  "Eye", "Zap", "Circle", "Flame", "Layers", "LayoutGrid", "TrendingUp",
  "Anchor", "HeartHandshake", "Cross", "CircleDot", "Bolt", "Sparkles",
];

const ICON_COMPONENTS = {
  Sun,
  Moon,
  Star,
  Sunrise,
  CalendarDays,
  Heart,
  Users,
  Briefcase,
  Eye,
  Zap,
  Circle,
  Flame,
  Layers,
  LayoutGrid,
  TrendingUp,
  Anchor,
  HeartHandshake,
  Cross,
  CircleDot,
  Bolt,
  Sparkles,
} as const;

function getPreviewIcon(iconName: string) {
  return ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS] ?? Sparkles;
}

function formatPrice(value: string) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric);
}

function formatDuration(value: string) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return "Custom duration";
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} min`;
}

function compactText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TemplateFormProps {
  initialData?: Partial<TemplateFormData>;
  templateId?: string; // undefined = create mode
  divinerCount?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TemplateForm({ initialData, templateId, divinerCount = 0 }: TemplateFormProps) {
  const router = useRouter();
  const isEdit = !!templateId;

  const [form, setForm] = useState<TemplateFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const PreviewIcon = getPreviewIcon(form.icon_name);
  const accentColor = form.color.trim() || (form.category === "tarot" ? "#7c3aed" : "#d97706");
  const visibleIncluded = form.whats_included.filter((item) => item.trim());
  const visibleAudience = form.who_its_for.filter((item) => item.trim());
  const visibleFaq = form.faq.filter((item) => item.question.trim() || item.answer.trim());

  // ── Auto-slug from name (create mode only) ────────────────────────────────
  function handleNameChange(name: string) {
    setForm((f) => {
      const update: Partial<TemplateFormData> = { name };
      if (!isEdit && (f.slug === "" || f.slug === slugify(f.name))) {
        update.slug = slugify(name);
      }
      return { ...f, ...update };
    });
  }

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // ── Array field helpers ───────────────────────────────────────────────────
  function addBullet(field: "whats_included" | "who_its_for") {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  }

  function updateBullet(field: "whats_included" | "who_its_for", idx: number, val: string) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[idx] = val;
      return { ...f, [field]: arr };
    });
  }

  function removeBullet(field: "whats_included" | "who_its_for", idx: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  }

  function addFaq() {
    setForm((f) => ({ ...f, faq: [...f.faq, { question: "", answer: "" }] }));
  }

  function updateFaq(idx: number, key: "question" | "answer", val: string) {
    setForm((f) => {
      const arr = [...f.faq];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...f, faq: arr };
    });
  }

  function removeFaq(idx: number) {
    setForm((f) => ({ ...f, faq: f.faq.filter((_, i) => i !== idx) }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        long_description: form.long_description,
        base_price: parseFloat(form.base_price),
        overage_rate: form.overage_rate ? parseFloat(form.overage_rate) : null,
        duration_minutes: parseInt(form.duration_minutes),
        is_primary: form.is_primary,
        requires_birth_data: form.requires_birth_data,
        trigger_event: form.trigger_event || null,
        display_order: parseInt(form.display_order) || 0,
        icon_name: form.icon_name || null,
        color: form.color || null,
        whats_included: form.whats_included.filter(Boolean),
        who_its_for: form.who_its_for.filter(Boolean),
        faq: form.faq.filter((f) => f.question || f.answer),
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        is_active: form.is_active,
      };

      const url = isEdit
        ? `/api/admin/service-templates/${templateId}`
        : "/api/admin/service-templates";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details && typeof json.details === "object") {
          setErrors(json.details as Record<string, string>);
          toast.error("Please fix the validation errors");
        } else {
          toast.error(json.error ?? "Save failed");
        }
        return;
      }

      if (json.warning) toast.warning(json.warning);
      if (json.reactivated) {
        toast.success("Template reactivated with updated details");
      } else {
        toast.success(isEdit ? "Template updated" : "Template created");
      }

      router.push("/admin/service-templates");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nativity Birth Chart"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="nativity-birth-chart"
              className="font-mono text-sm"
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as "astrology" | "tarot" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="astrology">⭐ Astrology</SelectItem>
                <SelectItem value="tarot">🃏 Tarot</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Trigger Event</Label>
            <Select
              value={form.trigger_event || TRIGGER_EVENT_NONE}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  trigger_event: v === TRIGGER_EVENT_NONE ? "" : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_EVENTS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Brief summary shown on service cards"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="long_description">Long Description</Label>
          <Textarea
            id="long_description"
            value={form.long_description}
            onChange={(e) => setForm((f) => ({ ...f, long_description: e.target.value }))}
            rows={5}
            placeholder="Detailed description shown on the service landing page"
          />
        </div>
      </section>

      <Separator />

      {/* Pricing & Duration */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pricing &amp; Duration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="base_price">Base Price ($) *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              value={form.base_price}
              onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
              placeholder="125.00"
            />
            {errors.base_price && <p className="text-xs text-destructive">{errors.base_price}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="overage_rate">Overage Rate ($/min)</Label>
            <Input
              id="overage_rate"
              type="number"
              step="0.01"
              min="0"
              value={form.overage_rate}
              onChange={(e) => setForm((f) => ({ ...f, overage_rate: e.target.value }))}
              placeholder="2.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="1"
              value={form.duration_minutes}
              onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
              placeholder="60"
            />
            {errors.duration_minutes && (
              <p className="text-xs text-destructive">{errors.duration_minutes}</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Configuration */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Configuration</h2>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="is_primary"
              checked={form.is_primary}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_primary: v }))}
            />
            <Label htmlFor="is_primary">Is Primary Service</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="requires_birth_data"
              checked={form.requires_birth_data}
              onCheckedChange={(v) => setForm((f) => ({ ...f, requires_birth_data: v }))}
            />
            <Label htmlFor="requires_birth_data">Requires Birth Data</Label>
          </div>
        </div>
      </section>

      <Separator />

      {/* Display */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Display</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <Select
              value={form.icon_name || TRIGGER_EVENT_NONE}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  icon_name: v === TRIGGER_EVENT_NONE ? "" : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TRIGGER_EVENT_NONE}>None</SelectItem>
                {ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Color (hex)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="#6366f1"
                className="font-mono"
              />
              {form.color && (
                <div
                  className="h-10 w-10 rounded border flex-shrink-0"
                  style={{ backgroundColor: form.color }}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Landing Page Content */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Landing Page Content</h2>

        {/* What's Included */}
        <div className="space-y-2">
          <Label>What&apos;s Included</Label>
          {form.whats_included.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateBullet("whats_included", idx, e.target.value)}
                placeholder="e.g. Full natal chart PDF"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeBullet("whats_included", idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBullet("whats_included")}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add bullet
          </Button>
        </div>

        {/* Who It's For */}
        <div className="space-y-2">
          <Label>Who This Is For</Label>
          {form.who_its_for.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateBullet("who_its_for", idx, e.target.value)}
                placeholder="e.g. People born under Aries"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeBullet("who_its_for", idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBullet("who_its_for")}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add bullet
          </Button>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <Label>FAQ</Label>
          {form.faq.map((item, idx) => (
            <div key={idx} className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs">Q&amp;A {idx + 1}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFaq(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateFaq(idx, "question", e.target.value)}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                rows={2}
                placeholder="Answer"
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFaq}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Q&amp;A
          </Button>
        </div>
      </section>

      <Separator />

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">SEO</h2>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="seo_title">SEO Title</Label>
            <span className="text-xs text-muted-foreground">{form.seo_title.length}/70</span>
          </div>
          <Input
            id="seo_title"
            value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value.slice(0, 70) }))}
            placeholder="Nativity Birth Chart Reading | AstrologyPro"
            maxLength={70}
          />
          {errors.seo_title && <p className="text-xs text-destructive">{errors.seo_title}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="seo_description">SEO Description</Label>
            <span className="text-xs text-muted-foreground">{form.seo_description.length}/160</span>
          </div>
          <Textarea
            id="seo_description"
            value={form.seo_description}
            onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value.slice(0, 160) }))}
            rows={2}
            placeholder="Deep dive into your natal chart with our expert astrologers…"
            maxLength={160}
          />
          {errors.seo_description && (
            <p className="text-xs text-destructive">{errors.seo_description}</p>
          )}
        </div>
      </section>

      <Separator />

      {/* Live Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <p className="text-sm text-muted-foreground">
              Reflects the current form state and previews how this template will present in the UI.
            </p>
          </div>
          <Badge variant="outline">Preview</Badge>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-stone-950 via-slate-950 to-stone-900 text-stone-50 shadow-sm">
          <div
            className="border-b border-white/10 px-6 py-6"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30 0%, rgba(15, 23, 42, 0.92) 45%, rgba(12, 10, 9, 0.96) 100%)`,
            }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="border-0 bg-white/12 text-stone-100">
                    {form.category === "tarot" ? "Tarot" : "Astrology"}
                  </Badge>
                  {form.is_primary && (
                    <Badge className="border-0 bg-amber-400 text-stone-950">Primary</Badge>
                  )}
                  {form.requires_birth_data && (
                    <Badge variant="secondary" className="border-0 bg-white/12 text-stone-100">
                      Birth data required
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15"
                    style={{ backgroundColor: `${accentColor}33` }}
                  >
                    <PreviewIcon className="h-7 w-7" style={{ color: accentColor }} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">
                      {compactText(form.name, "Service Name Preview")}
                    </h3>
                    <p className="max-w-3xl text-sm leading-6 text-stone-300">
                      {compactText(
                        form.description,
                        "Brief service summary will appear here once a short description is provided."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid min-w-[220px] gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-stone-300">
                    <BadgeDollarSign className="h-4 w-4" />
                    Price
                  </span>
                  <span className="font-medium text-stone-50">{formatPrice(form.base_price)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-stone-300">
                    <Clock3 className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-medium text-stone-50">{formatDuration(form.duration_minutes)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-300">Slug</span>
                  <code className="rounded bg-white/10 px-2 py-1 text-xs text-stone-100">
                    {compactText(form.slug, "service-slug")}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.25fr_0.85fr]">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Long Description
                </h4>
                <p className="text-sm leading-7 text-stone-300">
                  {compactText(
                    form.long_description,
                    "A more complete landing-page description will render here once long description content is added."
                  )}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                    What&apos;s Included
                  </h4>
                  <div className="space-y-2">
                    {(visibleIncluded.length > 0 ? visibleIncluded : [
                      "Included-item bullets will appear here.",
                    ]).map((item, index) => (
                      <div key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-stone-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Who This Is For
                  </h4>
                  <div className="space-y-2">
                    {(visibleAudience.length > 0 ? visibleAudience : [
                      "Audience-fit bullets will appear here.",
                    ]).map((item, index) => (
                      <div key={`${item}-${index}`} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-stone-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                  FAQ Preview
                </h4>
                <div className="space-y-3">
                  {(visibleFaq.length > 0 ? visibleFaq : [
                    {
                      question: "FAQ items will appear here.",
                      answer: "Add question-and-answer rows above to populate this preview.",
                    },
                  ]).map((item, index) => (
                    <div key={`${item.question}-${index}`} className="rounded-xl border border-white/8 bg-white/5 p-4">
                      <p className="text-sm font-medium text-stone-100">
                        {item.question || "Untitled question"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        {item.answer || "Answer will appear here."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Search Snippet
                </h4>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-medium text-emerald-300">
                    {compactText(form.seo_title, "SEO title preview")}
                  </p>
                  <p className="mt-1 text-xs text-emerald-400">
                    astrologypro.com/services/{compactText(form.slug, "service-slug")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {compactText(
                      form.seo_description,
                      "SEO description preview will appear here once metadata is filled."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Status */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Status</h2>

        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={form.is_active}
            onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            disabled={isEdit && divinerCount > 0 && !form.is_active}
          />
          <Label htmlFor="is_active">Active</Label>
          {isEdit && divinerCount > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({divinerCount} diviner{divinerCount !== 1 ? "s" : ""} using this template)
            </span>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/service-templates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
