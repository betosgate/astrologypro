"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useEditorForm, EditorActions, Field, TextField } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuilder } from "../builder-context";
import { toast } from "sonner";

interface GalleryImage { url: string; caption?: string; alt_text?: string }
interface GalleryContent {
  heading?: string;
  columns?: 2 | 3 | 4;
  images?: GalleryImage[];
  show_captions?: boolean;
}

export function GalleryEditor({ section }: EditorProps) {
  const { templateId } = useBuilder();
  const [uploading, setUploading] = useState(false);
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: GalleryContent = {
    heading: "",
    columns: 3,
    show_captions: true,
    ...raw,
    images: Array.isArray(raw.images) ? (raw.images as GalleryImage[]) : [],
  };
  const { values, set, revert, save, saving } = useEditorForm<GalleryContent>(section, init);

  const images = values.images ?? [];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 12) { toast.error("Maximum 12 images"); return; }
    setUploading(true);
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/upload`, { method: "POST", body: form });
        if (!res.ok) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { url } = await res.json();
        uploaded.push({ url, caption: "", alt_text: file.name.replace(/\.[^.]+$/, "") });
      }
      set("images", [...images, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch { toast.error("Network error"); } finally { setUploading(false); e.target.value = ""; }
  }

  function removeImage(idx: number) {
    set("images", images.filter((_, i) => i !== idx));
  }

  function updateCaption(idx: number, caption: string) {
    const next = [...images];
    next[idx] = { ...next[idx], caption };
    set("images", next);
  }

  return (
    <div className="space-y-4">
      <TextField label="Heading (optional)" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <Field label="Columns">
        <Select value={String(values.columns ?? 3)} onValueChange={(v) => set("columns", Number(v) as GalleryContent["columns"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label={`Images (${images.length}/12)`}>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.url} alt={img.alt_text ?? ""} className="w-full aspect-square rounded-lg object-cover border border-white/[0.06]" />
              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 rounded-full bg-cosmos-900/80 p-0.5 text-silver/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="size-3" />
              </button>
              <input
                value={img.caption ?? ""}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Caption..."
                maxLength={100}
                className="mt-1 w-full rounded text-[10px] bg-white/[0.04] border border-white/10 px-1.5 py-0.5 text-cream placeholder:text-silver/30 focus:outline-none"
              />
            </div>
          ))}
          {images.length < 12 && (
            <label className="cursor-pointer aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 text-silver/40 hover:border-gold/20 hover:text-gold/60 transition-colors">
              <Upload className="size-5" />
              <span className="text-[10px] mt-1">{uploading ? "Uploading…" : "Add"}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </Field>

      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
