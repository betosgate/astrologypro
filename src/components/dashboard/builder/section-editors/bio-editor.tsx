"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { useState } from "react";
import { useBuilder } from "../builder-context";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BioContent {
  heading?: string;
  body_html?: string;
  image_url?: string;
  image_position?: "left" | "right" | "top" | "background";
}

const POSITIONS = ["left", "right", "top", "background"] as const;

export function BioEditor({ section }: EditorProps) {
  const { templateId } = useBuilder();
  const [uploading, setUploading] = useState(false);

  const init: BioContent = {
    heading: "About Me",
    body_html: "",
    image_url: "",
    image_position: "left",
    ...(section.draft_content_json ?? section.content_json as object),
  };

  const { values, set, revert, save, saving } = useEditorForm<BioContent>(section, init);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Upload failed");
        return;
      }
      const { url } = await res.json();
      set("image_url", url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Network error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Heading"
        value={values.heading ?? "About Me"}
        onChange={(v) => set("heading", v)}
        maxLength={120}
      />

      <Field label="Bio Content" hint="Supports bold, italic, lists, and links">
        <textarea
          value={values.body_html ?? ""}
          onChange={(e) => set("body_html", e.target.value)}
          rows={8}
          placeholder="Write your bio here... (HTML supported)"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cream placeholder:text-silver/30 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
      </Field>

      <Field label="Photo">
        {values.image_url ? (
          <div className="flex items-start gap-3">
            <img
              src={values.image_url}
              alt="Bio photo"
              className="size-24 rounded-xl object-cover border border-white/[0.06]"
            />
            <div className="space-y-2">
              <label className="cursor-pointer">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-cream hover:bg-white/[0.08] transition-colors">
                  <Upload className="size-3.5" />
                  {uploading ? "Uploading..." : "Change"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              <button
                onClick={() => set("image_url", "")}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <X className="size-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-8 text-sm text-silver/50 hover:border-gold/20 hover:text-gold/60 transition-colors">
              <Upload className="size-6" />
              {uploading ? "Uploading..." : "Upload Photo"}
              <span className="text-xs">JPG, PNG, WebP · Max 5MB</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </Field>

      <Field label="Photo Position">
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => set("image_position", pos)}
              className={cn(
                "capitalize rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                values.image_position === pos
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-white/10 bg-white/[0.04] text-silver/60 hover:border-white/20 hover:text-cream"
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </Field>

      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
