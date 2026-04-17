"use client";

import { useEditorForm, EditorActions, TextField } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BookingCtaContent {
  cta_text?: string;
  show_price_in_cta?: boolean;
  sticky_on_mobile?: boolean;
}

export function BookingCtaEditor({ section }: EditorProps) {
  const init: BookingCtaContent = {
    cta_text: "Book Now",
    show_price_in_cta: true,
    sticky_on_mobile: true,
    ...(section.draft_content_json ?? section.content_json as object),
  };

  const { values, set, revert, save, saving } = useEditorForm<BookingCtaContent>(section, init);

  return (
    <div className="space-y-4">
      <TextField
        label="Button Text"
        value={values.cta_text ?? "Book Now"}
        onChange={(v) => set("cta_text", v)}
        maxLength={80}
      />
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Price in Button</Label>
        <Switch checked={values.show_price_in_cta ?? true} onCheckedChange={(v) => set("show_price_in_cta", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Sticky on Mobile</Label>
        <Switch checked={values.sticky_on_mobile ?? true} onCheckedChange={(v) => set("sticky_on_mobile", v)} />
      </div>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
