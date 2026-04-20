"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RichContentContent {
  heading?: string;
  layout?: "full" | "two-column" | "sidebar-left" | "sidebar-right";
  primary_html?: string;
  secondary_html?: string;
}

export function RichContentEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: RichContentContent = {
    heading: "",
    layout: "full",
    primary_html: "",
    secondary_html: "",
    ...raw,
  };
  const { values, set, revert, save, saving } = useEditorForm<RichContentContent>(section, init);

  const isTwoCol = values.layout === "two-column" || values.layout === "sidebar-left" || values.layout === "sidebar-right";

  return (
    <div className="space-y-4">
      <TextField label="Heading (optional)" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <Field label="Layout">
        <Select value={values.layout ?? "full"} onValueChange={(v) => set("layout", v as RichContentContent["layout"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="two-column">Two Column</SelectItem>
            <SelectItem value="sidebar-left">Sidebar Left</SelectItem>
            <SelectItem value="sidebar-right">Sidebar Right</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label={isTwoCol ? "Primary Column (HTML)" : "Content (HTML)"} hint="Supports bold, italic, headings, lists, links">
        <textarea
          value={values.primary_html ?? ""}
          onChange={(e) => set("primary_html", e.target.value)}
          rows={10}
          placeholder="Enter content here..."
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-mono"
        />
      </Field>
      {isTwoCol && (
        <Field label="Secondary Column (HTML)">
          <textarea
            value={values.secondary_html ?? ""}
            onChange={(e) => set("secondary_html", e.target.value)}
            rows={8}
            placeholder="Enter secondary content..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-mono"
          />
        </Field>
      )}
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
