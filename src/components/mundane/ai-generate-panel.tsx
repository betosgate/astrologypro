"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  History,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiGeneratePanelProps {
  subjectType?: "entity" | "forecast" | "leader" | "event" | "chart" | "general";
  subjectId?: string;
  subjectLabel?: string;
  aspectType?: string;
  placeholder?: string;
  /** Called after user saves a generation */
  onSave?: (response: string, generationId: string) => void;
  /** If provided, "Apply to [saveToField]" button is shown */
  saveToField?: string;
  saveToId?: string;
}

type RecentGeneration = {
  id: string;
  prompt: string;
  response: string;
  created_at: string;
};

// ─── Placeholder prompts by subject type ─────────────────────────────────────

const PLACEHOLDERS: Record<string, string> = {
  entity: "Analyze the current astrological climate for this entity. What transits are most significant?",
  forecast: "Generate a detailed narrative for this forecast based on the astrological basis provided...",
  leader: "Write a mundane astrology profile for this leader, including key natal signatures and current transits...",
  event: "Interpret this astrological event and its likely mundane effects on the world stage...",
  chart: "Analyze the key signatures in this chart and their mundane significance...",
  general: "What are the key mundane astrology themes for the coming week?",
};

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 h-7 px-2 text-xs">
      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiGeneratePanel({
  subjectType = "general",
  subjectId,
  subjectLabel,
  aspectType,
  placeholder,
  onSave,
  saveToField,
  saveToId,
}: AiGeneratePanelProps) {
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);

  const [response, setResponse] = useState("");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const [recent, setRecent] = useState<RecentGeneration[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const resolvedPlaceholder =
    placeholder ?? PLACEHOLDERS[subjectType] ?? PLACEHOLDERS.general;

  // ── Generate ─────────────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error("Prompt must be at least 10 characters");
      return;
    }

    setLoading(true);
    setResponse("");
    setGenerationId(null);

    try {
      const res = await fetch("/api/mundane/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_type: aspectType ?? subjectType,
          subject_type: subjectId ? subjectType : undefined,
          subject_id: subjectId,
          context: extraContext.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail ?? data.title ?? "Generation failed");
        return;
      }

      setResponse(data.response);
      setGenerationId(data.id ?? null);
      setGeneratedAt(data.generated_at ?? null);
    } catch {
      toast.error("Network error — generation failed");
    } finally {
      setLoading(false);
    }
  }, [prompt, aspectType, subjectType, subjectId, extraContext]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!generationId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/mundane/ai/generate/${generationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved_to_type: aspectType ?? subjectType }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail ?? "Failed to save");
        return;
      }

      toast.success("Generation saved");
      onSave?.(response, generationId);
    } catch {
      toast.error("Network error — save failed");
    } finally {
      setSaving(false);
    }
  }, [generationId, aspectType, subjectType, response, onSave]);

  // ── Apply to field ────────────────────────────────────────────────────────

  const handleApply = useCallback(async () => {
    if (!generationId || !saveToField || !saveToId) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/mundane/ai/generate/${generationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saved_to_type: `${subjectType}_${saveToField}`,
          saved_to_id: saveToId,
          apply_to_field: saveToField,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail ?? "Failed to apply");
        return;
      }

      toast.success(`Applied to ${saveToField}`);
      onSave?.(response, generationId);
    } catch {
      toast.error("Network error — apply failed");
    } finally {
      setApplying(false);
    }
  }, [generationId, saveToField, saveToId, subjectType, response, onSave]);

  // ── Load history ──────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({ limit: "3" });
      if (subjectId) {
        params.set("subject_type", subjectType);
        params.set("subject_id", subjectId);
      }

      const res = await fetch(`/api/mundane/ai/generate?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setRecent(data.generations ?? []);
    } catch {
      // Silently skip history load failures
    } finally {
      setLoadingHistory(false);
    }
  }, [subjectType, subjectId]);

  function toggleHistory() {
    if (!historyOpen) loadHistory();
    setHistoryOpen((v) => !v);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50/80 transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          Generate with AI
          {subjectLabel && (
            <span className="text-xs font-normal text-amber-600 truncate max-w-[200px]">
              — {subjectLabel}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-amber-500 shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-amber-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Prompt textarea */}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={resolvedPlaceholder}
            rows={3}
            maxLength={2000}
            disabled={loading}
            className="resize-none bg-white text-sm"
          />
          <p className="text-xs text-muted-foreground text-right">
            {prompt.length} / 2000
          </p>

          {/* Optional context accordion */}
          <div>
            <button
              type="button"
              onClick={() => setContextOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {contextOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              Add context
            </button>
            {contextOpen && (
              <Textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="Optional: paste chart data, event details, or background context..."
                rows={3}
                maxLength={2000}
                disabled={loading}
                className="resize-none bg-white text-sm mt-2"
              />
            )}
          </div>

          {/* Generate button */}
          <Button
            onClick={generate}
            disabled={loading || prompt.trim().length < 10}
            size="sm"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Generate
              </>
            )}
          </Button>

          {/* Response */}
          {response && (
            <Card className="bg-white border-amber-100">
              <CardContent className="pt-4 space-y-3">
                {/* Rendered text — simple line-break handling */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {response}
                </div>

                {generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(generatedAt).toLocaleString()}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <CopyButton text={response} />

                  {generationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1.5 h-7 px-2 text-xs"
                    >
                      {saving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      Save Generation
                    </Button>
                  )}

                  {saveToField && saveToId && generationId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApply}
                      disabled={applying}
                      className="gap-1.5 h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      {applying ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Apply to {saveToField}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generate}
                    disabled={loading}
                    className="gap-1.5 h-7 px-2 text-xs ml-auto"
                  >
                    <RefreshCw className="size-3.5" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent generations */}
          <div>
            <button
              type="button"
              onClick={toggleHistory}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {historyOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <History className="size-3" />
              Previous generations
            </button>

            {historyOpen && (
              <div className="mt-2 space-y-2">
                {loadingHistory ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
                    <Loader2 className="size-3 animate-spin" /> Loading...
                  </div>
                ) : recent.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No previous generations.</p>
                ) : (
                  recent.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-md border bg-white p-3 text-xs cursor-pointer hover:bg-amber-50 transition-colors"
                      onClick={() => {
                        setResponse(g.response);
                        setGenerationId(g.id);
                        setGeneratedAt(g.created_at);
                        setHistoryOpen(false);
                      }}
                    >
                      <p className="font-medium text-foreground truncate">{g.prompt}</p>
                      <p className="text-muted-foreground line-clamp-2 mt-0.5">{g.response}</p>
                      <p className="text-muted-foreground mt-1">
                        {new Date(g.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
