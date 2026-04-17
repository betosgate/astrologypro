"use client";

import { useEditorForm, EditorActions, TextField, TextAreaField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HeroContent {
  title?: string;
  tagline?: string;
  banner_url?: string;
  overlay_opacity?: number;
}

export function HeroEditor({ section }: EditorProps) {
  const init: HeroContent = {
    title: "",
    tagline: "",
    banner_url: "",
    overlay_opacity: 40,
    ...(section.draft_content_json ?? section.content_json as object),
  };

  const { values, set, revert, save, saving } = useEditorForm<HeroContent>(section, init);

  return (
    <div className="space-y-4">
      <TextField
        label="Custom Title (optional)"
        value={values.title ?? ""}
        onChange={(v) => set("title", v)}
        placeholder="Falls back to service template name"
        maxLength={120}
        hint="Leave blank to use the service name"
      />
      <TextField
        label="Tagline / Subtitle"
        value={values.tagline ?? ""}
        onChange={(v) => set("tagline", v)}
        placeholder="A short compelling description..."
        maxLength={200}
      />
      <TextField
        label="Banner Image URL"
        value={values.banner_url ?? ""}
        onChange={(v) => set("banner_url", v)}
        placeholder="https://... (use Upload button for images)"
      />
      <Field label={`Overlay Opacity: ${values.overlay_opacity ?? 40}%`} hint="Controls how dark the overlay is on the banner image">
        <input
          type="range"
          min={0}
          max={100}
          value={values.overlay_opacity ?? 40}
          onChange={(e) => set("overlay_opacity", parseInt(e.target.value))}
          className="w-full accent-gold"
        />
      </Field>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
