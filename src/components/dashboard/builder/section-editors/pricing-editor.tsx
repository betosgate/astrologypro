"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PricingContent {
  show_price?: boolean;
  show_duration?: boolean;
  custom_cta_text?: string;
  custom_cta_secondary_text?: string;
}

export function PricingEditor({ section }: EditorProps) {
  const init: PricingContent = {
    show_price: true,
    show_duration: true,
    custom_cta_text: "",
    custom_cta_secondary_text: "",
    ...(section.draft_content_json ?? section.content_json as object),
  };

  const { values, set, revert, save, saving } = useEditorForm<PricingContent>(section, init);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Price</Label>
        <Switch checked={values.show_price ?? true} onCheckedChange={(v) => set("show_price", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Duration</Label>
        <Switch checked={values.show_duration ?? true} onCheckedChange={(v) => set("show_duration", v)} />
      </div>
      <TextField
        label="Custom CTA Text"
        value={values.custom_cta_text ?? ""}
        onChange={(v) => set("custom_cta_text", v)}
        placeholder="Book This Reading"
        maxLength={80}
      />
      <TextField
        label="Secondary CTA Text"
        value={values.custom_cta_secondary_text ?? ""}
        onChange={(v) => set("custom_cta_secondary_text", v)}
        placeholder="e.g. Instant confirmation"
        maxLength={80}
      />
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
