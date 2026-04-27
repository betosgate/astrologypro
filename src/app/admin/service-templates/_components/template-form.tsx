"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  X,
  ArrowLeft,
  Loader2,
  Upload,
  Expand,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ServiceTemplatePublicPage } from "@/components/services/service-template-public-page";
import {
  getAstrologyTemplateFormPreset,
  getBaseServiceTemplateSlug,
  getServiceTemplateToolkitTabSlug,
  normalizeServiceTemplateFormConfig,
  type ServiceTemplateFormConfig,
} from "@/lib/service-template-form";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateFormData {
  name: string;
  slug: string;
  category: "astrology" | "tarot" | "";
  description: string;
  long_description: string;
  image_url: string;
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
  form_enabled: boolean;
  form_config: ServiceTemplateFormConfig | null;
  is_active: boolean;
}

export const DEFAULT_FORM: TemplateFormData = {
  name: "",
  slug: "",
  category: "",
  description: "",
  long_description: "",
  image_url: "",
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
  form_enabled: true,
  form_config: null,
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
  const initialImageUrl = (initialData?.image_url ?? "").trim();

  const [form, setForm] = useState<TemplateFormData>({
    ...DEFAULT_FORM,
    ...initialData,
    form_config: normalizeServiceTemplateFormConfig(initialData?.form_config ?? null),
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageDialogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [imageDialogOpen]);

  useEffect(() => {
    if (!imageDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageDialogOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imageDialogOpen]);

  useEffect(() => {
    if (form.category !== "astrology" || !form.form_enabled) return;

    const normalized = normalizeServiceTemplateFormConfig(form.form_config);
    if (normalized) return;

    const preset = getAstrologyTemplateFormPreset(form.slug);
    if (!preset) return;

    setForm((current) => ({ ...current, form_config: preset }));
  }, [form.category, form.slug, form.form_enabled, form.form_config]);

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

  function updateFormConfig(updater: (current: ServiceTemplateFormConfig) => ServiceTemplateFormConfig) {
    setForm((current) => {
      const baseConfig =
        normalizeServiceTemplateFormConfig(current.form_config) ??
        getAstrologyTemplateFormPreset(current.slug) ??
        {
          version: 1,
          kind: "astrology_intake" as const,
          mode: "single" as const,
          fields: {
            areaOfInquiry: false,
            question: false,
            futureWeek: false,
            futureMonth: false,
          },
        };

      return {
        ...current,
        form_config: updater(baseConfig),
      };
    });
  }

  function resetAstrologyFormPreset() {
    const preset = getAstrologyTemplateFormPreset(form.slug);
    if (!preset) {
      toast.error("No astrology preset is available for this slug yet.");
      return;
    }
    setForm((current) => ({ ...current, form_config: preset }));
    toast.success("Intake form reset to the product preset.");
  }

  async function handleTemplateImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Template image must be 10 MB or smaller");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload…");
    try {
      const json = await new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "card");

        xhr.open("POST", "/api/admin/tarot/upload");

        xhr.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable) return;
          setUploadProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)));
        });

        xhr.upload.addEventListener("load", () => {
          setUploadProgress(95);
          setUploadStatus("Processing image…");
        });

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onload = () => {
          let response: unknown = null;
          try {
            response = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("Upload failed"));
            return;
          }

          if (xhr.status < 200 || xhr.status >= 300) {
            const message =
              response &&
              typeof response === "object" &&
              "error" in response &&
              typeof response.error === "string"
                ? response.error
                : "Upload failed";
            reject(new Error(message));
            return;
          }

          if (!response || typeof response !== "object" || !("url" in response) || typeof response.url !== "string") {
            reject(new Error("Upload failed"));
            return;
          }

          setUploadProgress(100);
          setUploadStatus("Upload complete.");
          resolve({ url: response.url });
        };

        xhr.send(formData);
      });

      setForm((f) => ({ ...f, image_url: json.url }));
      toast.success("Template image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadProgress(0);
      setUploadStatus(null);
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleRemoveTemplateImage() {
    const imageUrl = form.image_url.trim();
    if (!imageUrl) return;

    setForm((f) => ({ ...f, image_url: "" }));
    setImageDialogOpen(false);
    toast.success(
      imageUrl === initialImageUrl
        ? "Template image cleared. Save the form to apply the removal."
        : "Template image removed",
    );
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
        image_url: form.image_url || null,
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
        form_enabled: form.form_enabled,
        form_config: normalizeServiceTemplateFormConfig(form.form_config),
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
  const resolvedFormConfig = normalizeServiceTemplateFormConfig(form.form_config);
  const astrologyFormPreset = getAstrologyTemplateFormPreset(form.slug);
  const toolkitTabSlug = getServiceTemplateToolkitTabSlug(form.slug);
  const supportsAstrologyBuilder = form.category === "astrology";

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
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
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

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Intake Form</h2>
            <p className="text-sm text-muted-foreground">
              Controls whether CTA buttons open a structured pre-booking form or go straight to booking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="form_enabled"
              checked={form.form_enabled}
              onCheckedChange={(value) => setForm((current) => ({ ...current, form_enabled: value }))}
            />
            <Label htmlFor="form_enabled">Enable Form</Label>
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={form.form_enabled ? "default" : "secondary"}>
              {form.form_enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant="outline">
              {supportsAstrologyBuilder ? "Astrology Builder" : "Tarot Placeholder"}
            </Badge>
            {toolkitTabSlug && (
              <Badge variant="outline" className="font-mono">
                {toolkitTabSlug}
              </Badge>
            )}
          </div>

          {!form.form_enabled ? (
            <p className="text-sm text-muted-foreground">
              The public CTA will skip the form section and go directly to the booking route.
            </p>
          ) : supportsAstrologyBuilder ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Astrology Intake Preset</p>
                  <p className="text-xs text-muted-foreground">
                    Person 1 is always required. Couple mode automatically adds Person 2.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAstrologyFormPreset}
                  disabled={!astrologyFormPreset}
                >
                  Reset To Preset
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Form Mode</Label>
                  <Select
                    value={resolvedFormConfig?.mode ?? "single"}
                    onValueChange={(value) =>
                      updateFormConfig((current) => ({
                        ...current,
                        mode: value === "couple" ? "couple" : "single",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Person</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-xl border bg-background/60 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Required birth blocks</p>
                  <p className="mt-1">
                    {resolvedFormConfig?.mode === "couple"
                      ? "Person 1 and Person 2 birth details."
                      : "Person 1 birth details only."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    key: "areaOfInquiry",
                    label: "Area of Inquiry",
                    hint: "Optional context for the reading focus.",
                  },
                  {
                    key: "question",
                    label: "Specific Question",
                    hint: "Required when enabled. Best for horary-style requests.",
                  },
                  {
                    key: "futureWeek",
                    label: "Future Week",
                    hint: "Useful for weekly transit products.",
                  },
                  {
                    key: "futureMonth",
                    label: "Future Month",
                    hint: "Useful for monthly transit products.",
                  },
                ].map((field) => (
                  <label
                    key={field.key}
                    className="flex items-start gap-3 rounded-xl border bg-background/60 p-4"
                  >
                    <Checkbox
                      checked={
                        resolvedFormConfig?.fields[
                          field.key as keyof ServiceTemplateFormConfig["fields"]
                        ] ?? false
                      }
                      onCheckedChange={(checked) =>
                        updateFormConfig((current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            [field.key]: checked === true,
                          },
                        }))
                      }
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-foreground">
                        {field.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {field.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-background/60 p-4 text-sm text-muted-foreground">
              Tarot templates can keep the form toggle enabled for future use, but the astrology-only builder is intentionally hidden until tarot field requirements are defined. Public CTA buttons will fall back to booking until a supported form config exists.
            </div>
          )}
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
              <SelectTrigger className="w-full">
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

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Template Image</h2>
            <p className="text-sm text-muted-foreground">
              Upload the hero image shown in the public template page and live preview.
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted: JPG, PNG, WebP, GIF. Maximum size: 10 MB.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {form.image_url ? "Change Image" : "Upload Image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleTemplateImageUpload}
          />
        </div>

        <div className="rounded-2xl border bg-muted/10 p-4">
          {uploadingImage && (
            <div className="mb-4 rounded-xl border bg-background/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{uploadStatus ?? "Uploading image..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-white/10" />
            </div>
          )}

          {form.image_url ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <button
                type="button"
                className="group relative h-28 w-full overflow-hidden rounded-xl border bg-muted/20 md:w-44 md:shrink-0"
                onClick={() => setImageDialogOpen(true)}
              >
                <Image
                  src={form.image_url}
                  alt={form.name || "Template image preview"}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  sizes="176px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
                  <Expand className="h-3 w-3" />
                  Preview
                </span>
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Current Hero Image</p>
                  <p className="text-xs text-muted-foreground">
                    Used on the public template page and in the live preview.
                  </p>
                  <p className="break-all text-xs text-muted-foreground">{form.image_url}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageDialogOpen(true)}
                  >
                    <Expand className="mr-2 h-4 w-4" />
                    Preview Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemoveTemplateImage}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-sm text-muted-foreground">
              No template image uploaded yet.
            </div>
          )}

          {imageDialogOpen && form.image_url ? (
            <div
              ref={imageOverlayRef}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={(event) => {
                if (event.target === imageOverlayRef.current) {
                  setImageDialogOpen(false);
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`Preview: ${form.name || "Template image"}`}
            >
              <div className="relative flex h-[85vh] w-full max-w-5xl flex-col rounded-lg border bg-background shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {form.name || "Template Image"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Public hero image preview
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1.5 text-xs"
                    >
                      <a href={form.image_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                        Open in tab
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setImageDialogOpen(false)}
                      aria-label="Close preview"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center overflow-hidden rounded-b-lg bg-black p-4 md:p-6">
                  <img
                    src={form.image_url}
                    alt={form.name || "Template image"}
                    className="max-h-full max-w-full rounded-md object-contain"
                  />
                </div>
              </div>
            </div>
          ) : null}
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
              Uses the same full public layout structure as the diviner service page, rendered from the current template form state.
            </p>
          </div>
          <Badge variant="outline">Preview</Badge>
        </div>

        <div className="max-h-[900px] overflow-y-auto rounded-2xl border border-border bg-background">
          <ServiceTemplatePublicPage
            embedded
            disableLinks
            diviners={[]}
            template={{
              category: form.category || "astrology",
              name: form.name.trim() || "Service Name Preview",
              slug: form.slug.trim() || "service-slug",
              description: form.description.trim() || "Short description preview.",
              long_description: form.long_description.trim() || null,
              image_url: form.image_url.trim() || null,
              form_enabled: form.form_enabled,
              form_config: normalizeServiceTemplateFormConfig(form.form_config),
              duration_minutes: Number.parseInt(form.duration_minutes, 10) || 60,
              base_price: Number.parseFloat(form.base_price) || 0,
              overage_rate: form.overage_rate ? Number.parseFloat(form.overage_rate) : null,
              requires_birth_data: form.requires_birth_data,
              whats_included: form.whats_included
                .map((item) => item.trim())
                .filter(Boolean),
              who_its_for: form.who_its_for
                .map((item) => item.trim())
                .filter(Boolean),
              faq: form.faq
                .map((item) => ({
                  question: item.question.trim(),
                  answer: item.answer.trim(),
                }))
                .filter((item) => item.question && item.answer),
            }}
          />
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
