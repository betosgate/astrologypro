"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  FlaskConical,
  Globe,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type WeeklyBriefResponse = {
  brief: string;
  generated_at: string;
  entities_covered: string[];
};

type SummarizeResponse = {
  summary: string;
  generated_at: string;
};

type Project = {
  id: string;
  title: string;
  status: string;
};

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 h-7 px-2 text-xs">
      {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── Formatted AI output ───────────────────────────────────────────────────────

function AiOutput({ text }: { text: string }) {
  // Render markdown-style bullet points and numbered lists as styled text
  const lines = text.split("\n");
  return (
    <div className="text-sm space-y-1 leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AiBriefPage() {
  const [brief, setBrief] = useState<WeeklyBriefResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [summary, setSummary] = useState<SummarizeResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Load projects for dropdown
  useEffect(() => {
    fetch("/api/admin/mundane/research?status=active&limit=50")
      .then((r) => r.json())
      .then((d: { projects: Project[] }) => {
        setProjects(d.projects ?? []);
        if (d.projects?.length > 0) {
          setSelectedProjectId(d.projects[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  async function handleGenerateBrief() {
    setBriefLoading(true);
    setBriefError("");
    setBrief(null);

    const res = await fetch("/api/mundane/ai/weekly-brief");
    if (res.ok) {
      const data = await res.json() as WeeklyBriefResponse;
      setBrief(data);
    } else {
      const err = await res.json().catch(() => ({})) as { detail?: string };
      setBriefError(err.detail ?? "Failed to generate brief. Please try again.");
    }
    setBriefLoading(false);
  }

  async function handleSummarize() {
    if (!selectedProjectId) return;
    setSummaryLoading(true);
    setSummaryError("");
    setSummary(null);

    const res = await fetch("/api/mundane/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: selectedProjectId }),
    });

    if (res.ok) {
      const data = await res.json() as SummarizeResponse;
      setSummary(data);
    } else {
      const err = await res.json().catch(() => ({})) as { detail?: string };
      setSummaryError(err.detail ?? "Failed to summarize project. Please try again.");
    }
    setSummaryLoading(false);
  }

  function formatGeneratedAt(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-violet-500" />
            AI Weekly Brief
          </h1>
          <p className="text-muted-foreground">
            AI-generated insights based on your watchlist, upcoming events, and open forecasts.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/mundane">Back to Hub</Link>
        </Button>
      </div>

      {/* Weekly brief card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4 text-violet-500" />
                Weekly Mundane Brief
              </CardTitle>
              <CardDescription className="mt-1">
                Covers your watched entities, upcoming astrological events this week, and open forecasts.
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateBrief}
              disabled={briefLoading}
              className="gap-2"
              size="sm"
            >
              {briefLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {briefLoading ? "Generating..." : brief ? "Regenerate" : "Generate Brief"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {briefError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {briefError}
            </div>
          )}
          {briefLoading && !brief && (
            <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Analyzing your watchlist and upcoming events...</span>
            </div>
          )}
          {brief && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Generated {formatGeneratedAt(brief.generated_at)}
                  {brief.entities_covered.length > 0 && (
                    <span className="ml-2">
                      — covering {brief.entities_covered.join(", ")}
                    </span>
                  )}
                </p>
                <CopyButton text={brief.brief} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <AiOutput text={brief.brief} />
              </div>
            </div>
          )}
          {!brief && !briefLoading && !briefError && (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <Sparkles className="size-8 opacity-30" />
              <p className="text-sm">Click Generate Brief to create your AI weekly summary.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summarize research project card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="size-4 text-emerald-500" />
            Summarize Research Project
          </CardTitle>
          <CardDescription>
            Get a bullet-point AI summary of the notes in a research project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project selector */}
          <div className="flex items-center gap-3">
            {projectsLoading ? (
              <div className="h-9 flex-1 rounded-md bg-muted animate-pulse" />
            ) : projects.length === 0 ? (
              <div className="text-sm text-muted-foreground flex-1">
                No active research projects found.{" "}
                <Link href="/admin/mundane/research" className="text-violet-600 underline">
                  Create one
                </Link>
              </div>
            ) : (
              <select
                className="flex-1 h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSummary(null);
                  setSummaryError("");
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <Button
              onClick={handleSummarize}
              disabled={summaryLoading || !selectedProjectId || projectsLoading}
              size="sm"
              className="gap-2 shrink-0"
            >
              {summaryLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {summaryLoading ? "Summarizing..." : "Summarize"}
            </Button>
          </div>

          {summaryError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {summaryError}
            </div>
          )}

          {summaryLoading && !summary && (
            <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Reading research notes...</span>
            </div>
          )}

          {summary && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Generated {formatGeneratedAt(summary.generated_at)}
                </p>
                <CopyButton text={summary.summary} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <AiOutput text={summary.summary} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
