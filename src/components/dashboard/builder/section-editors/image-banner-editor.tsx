"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBuilder } from "../builder-context";
import { toast } from "sonner";

interface ImageBannerContent { image_url: string; alt_text?: string; caption?: string; link_url?: string; aspect_ratio?: string; full_width?: boolean }

export function ImageBannerEditor({ section }: EditorProps) {
  const { templateId } = useBuilder();
  const [uploading, setUploading] = useState(false);
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: ImageBannerContent = { image_url: "", alt_text: "", caption: "", link_url: "", aspect_ratio: "16:9", full_width: false, ...raw };
  const { values, set, revert, save, saving } = useEditorForm<ImageBannerContent>(section, init);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/upload`, { method: "POST", body: form });
      if (!res.ok) { toast.error("Upload failed"); return; }
      const { url } = await res.json(); set("image_url", url); toast.success("Image uploaded");
    } catch { toast.error("Network error"); } finally { setUploading(false); e.target.value = ""; }
  }

  return (
    <div className="space-y-4">
      <Field label="Image">
        {values.image_url ? (
          <div className="relative">
            <img src={values.image_url} alt={values.alt_text} className="w-full rounded-xl object-cover max-h-48 border border-white/[0.06]" />
            <button onClick={() => set("image_url", "")} className="absolute top-2 right-2 rounded-full bg-cosmos-900/80 p-1 text-silver/60 hover:text-red-400"><X className="size-4" /></button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-8 text-sm text-silver/50 hover:border-gold/20 hover:text-gold/60">
              <Upload className="size-6" />{uploading ? "Uploading..." : "Upload Image"}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </Field>
      <TextField label="Alt Text" value={values.alt_text ?? ""} onChange={(v) => set("alt_text", v)} maxLength={200} hint="Describe the image for accessibility" />
      <TextField label="Caption" value={values.caption ?? ""} onChange={(v) => set("caption", v)} maxLength={300} />
      <TextField label="Link URL (optional)" value={values.link_url ?? ""} onChange={(v) => set("link_url", v)} placeholder="https://..." />
      <Field label="Aspect Ratio">
        <Select value={values.aspect_ratio ?? "16:9"} onValueChange={(v) => set("aspect_ratio", v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="auto">Auto</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Full Width</Label>
        <Switch checked={values.full_width ?? false} onCheckedChange={(v) => set("full_width", v)} />
      </div>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
