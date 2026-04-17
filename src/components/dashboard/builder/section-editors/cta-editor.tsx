"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CtaContent {
  heading?: string;
  subheading?: string;
  button_text?: string;
  button_style?: "primary" | "secondary" | "outline";
  show_price_preview?: boolean;
  show_divider_above?: boolean;
}

export function CtaEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: CtaContent = {
    heading: "Ready to Begin?",
    subheading: "",
    button_text: "Book a Session",
    button_style: "primary",
    show_price_preview: false,
    show_divider_above: true,
    ...raw,
  };
  const { values, set, revert, save, saving } = useEditorForm<CtaContent>(section, init);

  return (
    <div className="space-y-4">
      <TextField label="Heading" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <TextField label="Subheading" value={values.subheading ?? ""} onChange={(v) => set("subheading", v)} maxLength={200} />
      <TextField label="Button Text" value={values.button_text ?? ""} onChange={(v) => set("button_text", v)} maxLength={60} />
      <Field label="Button Style">
        <Select value={values.button_style ?? "primary"} onValueChange={(v) => set("button_style", v as CtaContent["button_style"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary (Gold)</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Price Preview</Label>
        <Switch checked={values.show_price_preview ?? false} onCheckedChange={(v) => set("show_price_preview", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Divider Above</Label>
        <Switch checked={values.show_divider_above ?? true} onCheckedChange={(v) => set("show_divider_above", v)} />
      </div>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
