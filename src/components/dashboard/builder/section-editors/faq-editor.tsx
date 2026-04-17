"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  heading?: string;
  items: FaqItem[];
}

export function FaqEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: FaqContent = {
    heading: "Frequently Asked Questions",
    ...raw,
    items: Array.isArray(raw.items) ? (raw.items as FaqItem[]) : [],
  };

  const { values, set, revert, save, saving } = useEditorForm<FaqContent>(section, init);

  function addItem() {
    if (values.items.length >= 20) return;
    set("items", [...values.items, { question: "", answer: "" }]);
  }

  function removeItem(idx: number) {
    set("items", values.items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: "question" | "answer", val: string) {
    const next = [...values.items];
    next[idx] = { ...next[idx], [field]: val };
    set("items", next);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...values.items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set("items", next);
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Heading"
        value={values.heading ?? "Frequently Asked Questions"}
        onChange={(v) => set("heading", v)}
        maxLength={120}
      />

      <Field label={`Questions (${values.items.length}/20)`}>
        <div className="space-y-3">
          {values.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-silver/40 w-4">{i + 1}.</span>
                <Input
                  value={item.question}
                  onChange={(e) => updateItem(i, "question", e.target.value)}
                  placeholder="Question..."
                  maxLength={300}
                  className="flex-1 h-8 text-sm bg-white/[0.04] border-white/10 text-cream"
                />
                <div className="flex gap-1">
                  <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 text-silver/30 hover:text-cream disabled:opacity-20">
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button onClick={() => moveItem(i, 1)} disabled={i === values.items.length - 1} className="p-1 text-silver/30 hover:text-cream disabled:opacity-20">
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button onClick={() => removeItem(i)} className="p-1 text-silver/30 hover:text-red-400">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={item.answer}
                onChange={(e) => updateItem(i, "answer", e.target.value)}
                placeholder="Answer..."
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
          ))}

          {values.items.length < 20 && (
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
              className="w-full border-dashed border-white/20 text-silver/50 hover:text-cream hover:border-white/30"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Question
            </Button>
          )}
        </div>
      </Field>

      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
