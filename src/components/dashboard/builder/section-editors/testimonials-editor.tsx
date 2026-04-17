"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TestimonialItem {
  author_name: string;
  author_title?: string;
  quote: string;
  rating?: number;
}

interface TestimonialsContent {
  heading?: string;
  display_mode?: "manual" | "auto";
  display_style?: "grid" | "carousel" | "list";
  items?: TestimonialItem[];
  show_ratings?: boolean;
  max_display?: number;
}

export function TestimonialsEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: TestimonialsContent = {
    heading: "What Clients Say",
    display_mode: "manual",
    display_style: "grid",
    show_ratings: true,
    max_display: 6,
    ...raw,
    items: Array.isArray(raw.items) ? (raw.items as TestimonialItem[]) : [],
  };
  const { values, set, revert, save, saving } = useEditorForm<TestimonialsContent>(section, init);

  const items = values.items ?? [];

  function addItem() {
    if (items.length >= 10) return;
    set("items", [...items, { author_name: "", quote: "" }]);
  }

  function removeItem(idx: number) {
    set("items", items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof TestimonialItem, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    set("items", next);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set("items", next);
  }

  return (
    <div className="space-y-4">
      <TextField label="Heading" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <Field label="Display Mode">
        <Select value={values.display_mode ?? "manual"} onValueChange={(v) => set("display_mode", v as TestimonialsContent["display_mode"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual (enter below)</SelectItem>
            <SelectItem value="auto">Auto (from reviews)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Display Style">
        <Select value={values.display_style ?? "grid"} onValueChange={(v) => set("display_style", v as TestimonialsContent["display_style"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Star Ratings</Label>
        <Switch checked={values.show_ratings ?? true} onCheckedChange={(v) => set("show_ratings", v)} />
      </div>

      {values.display_mode === "manual" && (
        <Field label={`Testimonials (${items.length}/10)`}>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-silver/40 w-4">{i + 1}.</span>
                  <Input
                    value={item.author_name}
                    onChange={(e) => updateItem(i, "author_name", e.target.value)}
                    placeholder="Client name"
                    maxLength={80}
                    className="flex-1 h-8 text-sm bg-white/[0.04] border-white/10 text-cream"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 text-silver/30 hover:text-cream disabled:opacity-20"><ChevronUp className="size-3.5" /></button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-1 text-silver/30 hover:text-cream disabled:opacity-20"><ChevronDown className="size-3.5" /></button>
                    <button onClick={() => removeItem(i)} className="p-1 text-silver/30 hover:text-red-400"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                <Input
                  value={item.author_title ?? ""}
                  onChange={(e) => updateItem(i, "author_title", e.target.value)}
                  placeholder="Title / location (optional)"
                  maxLength={80}
                  className="h-8 text-sm bg-white/[0.04] border-white/10 text-cream"
                />
                <textarea
                  value={item.quote}
                  onChange={(e) => updateItem(i, "quote", e.target.value)}
                  placeholder="Their testimonial..."
                  rows={3}
                  maxLength={600}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
              </div>
            ))}
            {items.length < 10 && (
              <Button size="sm" variant="outline" onClick={addItem} className="w-full border-dashed border-white/20 text-silver/50 hover:text-cream hover:border-white/30">
                <Plus className="mr-1.5 size-3.5" /> Add Testimonial
              </Button>
            )}
          </div>
        </Field>
      )}

      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
