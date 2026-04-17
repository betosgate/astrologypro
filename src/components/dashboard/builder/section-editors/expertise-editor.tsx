"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExpertiseItem { label: string; description?: string; icon?: string }
interface ExpertiseContent {
  heading?: string;
  subtitle?: string;
  display_style?: "tags" | "bullets" | "cards" | "icons";
  items?: ExpertiseItem[];
}

export function ExpertiseEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: ExpertiseContent = {
    heading: "My Specialties",
    subtitle: "",
    display_style: "tags",
    ...raw,
    items: Array.isArray(raw.items) ? raw.items as ExpertiseItem[] : [],
  };
  const { values, set, revert, save, saving } = useEditorForm<ExpertiseContent>(section, init);

  const items = values.items ?? [];

  return (
    <div className="space-y-4">
      <TextField label="Heading" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <TextField label="Subtitle" value={values.subtitle ?? ""} onChange={(v) => set("subtitle", v)} maxLength={200} />
      <Field label="Display Style">
        <Select value={values.display_style ?? "tags"} onValueChange={(v) => set("display_style", v as ExpertiseContent["display_style"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tags">Tags</SelectItem>
            <SelectItem value="bullets">Bullets</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="icons">Icons</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label={`Items (${items.length}/20)`}>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={item.label} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; set("items", n); }} placeholder="Label" className="flex-1 h-8 text-sm bg-white/[0.04] border-white/10 text-cream" maxLength={100} />
              <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="p-1 text-silver/30 hover:text-red-400"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
          {items.length < 20 && (
            <Button size="sm" variant="outline" onClick={() => set("items", [...items, { label: "" }])} className="w-full border-dashed border-white/20 text-silver/50">
              <Plus className="mr-1.5 size-3.5" /> Add Item
            </Button>
          )}
        </div>
      </Field>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
