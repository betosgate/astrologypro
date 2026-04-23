"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, Plus, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBuilder } from "./builder-context";
import type { BlockType, DivinerServiceBlock } from "@/types/landing-page-builder";

const TYPE_LABEL: Record<BlockType, string> = {
  text: "Text block",
  image: "Image block",
  html: "HTML block",
};

const TYPE_DESCRIPTION: Record<BlockType, string> = {
  text: "Plain text with an optional title and paragraphs.",
  image: "Single image with an optional title used as alt text.",
  html: "Custom HTML — sanitized server-side against a strict allowlist.",
};

function findBlock(state: ReturnType<typeof useBuilder>["state"], id: string | null): DivinerServiceBlock | null {
  if (!id) return null;
  return (
    state.blocks.about_diviner.find((b) => b.id === id) ??
    state.blocks.extra.find((b) => b.id === id) ??
    null
  );
}

// ── Editors per block type ─────────────────────────────────────────────────────

function TextBlockEditor({ block }: { block: DivinerServiceBlock }) {
  const { updateBlock } = useBuilder();
  const initialParagraphs = Array.isArray(block.content_json?.paragraphs)
    ? (block.content_json.paragraphs as string[])
    : [];
  const [title, setTitle] = useState(block.title ?? "");
  const [paragraphs, setParagraphs] = useState<string[]>(initialParagraphs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(block.title ?? "");
    setParagraphs(
      Array.isArray(block.content_json?.paragraphs)
        ? (block.content_json.paragraphs as string[])
        : [],
    );
  }, [block.id, block.title, block.content_json]);

  async function save() {
    setSaving(true);
    await updateBlock(block.id, { title: title || null, content_json: { paragraphs } });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-silver/70">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. My approach"
          maxLength={140}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-silver/70">Paragraphs</label>
        {paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={p}
              onChange={(e) => {
                const next = [...paragraphs];
                next[i] = e.target.value;
                setParagraphs(next);
              }}
              rows={3}
              maxLength={4000}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParagraphs(paragraphs.filter((_, j) => j !== i))}
              className="h-auto text-silver/50 hover:text-red-400"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParagraphs([...paragraphs, ""])}
          disabled={paragraphs.length >= 20}
          className="w-full border-dashed border-white/10 text-silver/60"
        >
          <Plus className="mr-1.5 size-3.5" /> Add paragraph
        </Button>
      </div>
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function ImageBlockEditor({ block }: { block: DivinerServiceBlock }) {
  const { updateBlock, templateId } = useBuilder();
  const [title, setTitle] = useState(block.title ?? "");
  const [url, setUrl] = useState(block.primary_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(block.title ?? "");
    setUrl(block.primary_image_url ?? "");
  }, [block.id, block.title, block.primary_image_url]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/upload`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.detail ?? json.title ?? "Upload failed");
      } else {
        setUrl(json.url);
      }
    } catch {
      setUploadError("Network error during upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    await updateBlock(block.id, {
      title: title || null,
      primary_image_url: url.trim() || null,
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-silver/70">Title / alt text</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Describe this image"
          maxLength={140}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-silver/70">External Image URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-silver/70">Or Upload Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="border-white/10 text-cream h-8"
            >
              {uploading ? (
                <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Uploading…</>
              ) : url ? (
                <><UploadCloud className="mr-1.5 size-3.5" /> Change image</>
              ) : (
                <><UploadCloud className="mr-1.5 size-3.5" /> Upload image</>
              )}
            </Button>

            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            )}

            <span className="text-[10px] text-silver/30">
              JPEG, PNG, WebP up to 5MB
            </span>
          </div>
        </div>

        {uploadError && (
          <p className="text-xs text-red-400">{uploadError}</p>
        )}

        {url && (
          <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.06] bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={title || "Preview"}
              className="max-h-64 h-auto w-full object-contain"
            />
          </div>
        )}
      </div>

      <Button onClick={save} disabled={saving || uploading} className="w-full">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function HtmlBlockEditor({ block }: { block: DivinerServiceBlock }) {
  const { updateBlock } = useBuilder();
  const [title, setTitle] = useState(block.title ?? "");
  const [html, setHtml] = useState(block.body_html ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(block.title ?? "");
    setHtml(block.body_html ?? "");
  }, [block.id, block.title, block.body_html]);

  async function save() {
    if (!html.trim()) return;
    setSaving(true);
    await updateBlock(block.id, { title: title || null, body_html: html });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-silver/70">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Custom section"
          maxLength={140}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-silver/70">HTML</label>
        <p className="text-[11px] text-silver/40 leading-snug">
          Sanitized server-side — disallowed tags/attributes will be rejected.
        </p>
        <Textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={12}
          className="font-mono text-xs"
          placeholder="<p>Your HTML here…</p>"
        />
      </div>
      <Button onClick={save} disabled={saving || !html.trim()} className="w-full">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function EditorByType({ block }: { block: DivinerServiceBlock }) {
  switch (block.section_type) {
    case "text":
      return <TextBlockEditor block={block} />;
    case "image":
      return <ImageBlockEditor block={block} />;
    case "html":
      return <HtmlBlockEditor block={block} />;
    default:
      return (
        <div className="py-8 text-center text-sm text-silver/50">
          Unknown block type: {block.section_type}
        </div>
      );
  }
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export function SectionEditorPanel() {
  const { state, selectBlock, deleteBlock } = useBuilder();
  const { selectedBlockId } = state;

  if (!selectedBlockId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="size-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-4">
          <span className="text-2xl">✦</span>
        </div>
        <p className="text-cream/50 text-sm">Select a block to edit it</p>
        <p className="text-silver/30 text-xs mt-1">Or click &ldquo;+ Add Block&rdquo; to create one</p>
      </div>
    );
  }

  const block = findBlock(state, selectedBlockId);
  if (!block) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <h3 className="font-semibold text-cream text-sm">{TYPE_LABEL[block.section_type]}</h3>
          <p className="text-xs text-silver/50">{TYPE_DESCRIPTION[block.section_type]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-silver/40 hover:text-red-400"
            onClick={() => {
              if (confirm(`Remove this ${TYPE_LABEL[block.section_type].toLowerCase()}?`)) {
                deleteBlock(block.id);
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-silver/40 hover:text-cream"
            onClick={() => selectBlock(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {block.moderation_status === "flagged" && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">
            ⚠ This block was flagged by moderation. Editing it will reset it to &ldquo;pending review&rdquo;.
          </div>
        )}
        <EditorByType block={block} />
      </div>
    </div>
  );
}
