"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TextContent { heading?: string; subtitle?: string; body_html: string; text_alignment?: string; background_color?: string }

export function TextContentEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: TextContent = { heading: "", subtitle: "", body_html: "", text_alignment: "left", background_color: "", ...raw };
  const { values, set, revert, save, saving } = useEditorForm<TextContent>(section, init);

  return (
    <div className="space-y-4">
      <TextField label="Heading" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <TextField label="Subtitle" value={values.subtitle ?? ""} onChange={(v) => set("subtitle", v)} maxLength={200} />
      <Field label="Content (HTML)" hint="Supports bold, italic, headings, lists, links">
        <textarea value={values.body_html ?? ""} onChange={(e) => set("body_html", e.target.value)} rows={10} placeholder="Enter content here..." className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-mono" />
      </Field>
      <Field label="Text Alignment">
        <Select value={values.text_alignment ?? "left"} onValueChange={(v) => set("text_alignment", v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
