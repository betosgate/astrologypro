"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WhoItsForContent {
  heading?: string;
  subtitle?: string;
  items?: string[];
}

export function WhoItsForEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: WhoItsForContent = {
    heading: "This Is For You If…",
    subtitle: "",
    ...raw,
    items: Array.isArray(raw.items) ? (raw.items as string[]) : [],
  };
  const { values, set, revert, save, saving } = useEditorForm<WhoItsForContent>(section, init);

  const items = values.items ?? [];

  return (
    <div className="space-y-4">
      <TextField label="Heading" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <TextField label="Subtitle (optional)" value={values.subtitle ?? ""} onChange={(v) => set("subtitle", v)} maxLength={200} />
      <Field label={`Audience Points (${items.length}/15)`}>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gold/60 text-sm">→</span>
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  set("items", next);
                }}
                placeholder="e.g. You're navigating a life transition"
                maxLength={150}
                className="flex-1 h-8 text-sm bg-white/[0.04] border-white/10 text-cream"
              />
              <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="p-1 text-silver/30 hover:text-red-400">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {items.length < 15 && (
            <Button size="sm" variant="outline" onClick={() => set("items", [...items, ""])} className="w-full border-dashed border-white/20 text-silver/50 hover:text-cream hover:border-white/30">
              <Plus className="mr-1.5 size-3.5" /> Add Point
            </Button>
          )}
        </div>
      </Field>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
