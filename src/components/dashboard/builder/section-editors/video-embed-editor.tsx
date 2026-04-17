"use client";

import { useEditorForm, EditorActions, TextField, Field } from "./base-editor";
import type { EditorProps } from "./base-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VideoEmbedContent {
  heading?: string;
  video_source?: "youtube" | "vimeo" | "upload";
  video_url?: string;
  caption?: string;
  autoplay?: boolean;
  show_controls?: boolean;
  aspect_ratio?: "16:9" | "4:3" | "1:1";
}

export function VideoEmbedEditor({ section }: EditorProps) {
  const raw = (section.draft_content_json ?? section.content_json) as Record<string, unknown>;
  const init: VideoEmbedContent = {
    heading: "",
    video_source: "youtube",
    video_url: "",
    caption: "",
    autoplay: false,
    show_controls: true,
    aspect_ratio: "16:9",
    ...raw,
  };
  const { values, set, revert, save, saving } = useEditorForm<VideoEmbedContent>(section, init);

  const placeholder =
    values.video_source === "youtube"
      ? "https://www.youtube.com/watch?v=..."
      : values.video_source === "vimeo"
      ? "https://vimeo.com/..."
      : "https://...";

  return (
    <div className="space-y-4">
      <TextField label="Heading (optional)" value={values.heading ?? ""} onChange={(v) => set("heading", v)} maxLength={120} />
      <Field label="Video Source">
        <Select value={values.video_source ?? "youtube"} onValueChange={(v) => set("video_source", v as VideoEmbedContent["video_source"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="upload">Direct URL</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <TextField label="Video URL" value={values.video_url ?? ""} onChange={(v) => set("video_url", v)} placeholder={placeholder} />
      <TextField label="Caption (optional)" value={values.caption ?? ""} onChange={(v) => set("caption", v)} maxLength={300} />
      <Field label="Aspect Ratio">
        <Select value={values.aspect_ratio ?? "16:9"} onValueChange={(v) => set("aspect_ratio", v as VideoEmbedContent["aspect_ratio"])}>
          <SelectTrigger className="bg-white/[0.04] border-white/10 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Show Controls</Label>
        <Switch checked={values.show_controls ?? true} onCheckedChange={(v) => set("show_controls", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-cream">Autoplay</Label>
        <Switch checked={values.autoplay ?? false} onCheckedChange={(v) => set("autoplay", v)} />
      </div>
      <EditorActions onSave={save} onRevert={revert} saving={saving} />
    </div>
  );
}
