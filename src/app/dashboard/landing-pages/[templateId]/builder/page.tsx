"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Globe, GlobeLock, Loader2, LayoutTemplate } from "lucide-react";
import { BuilderProvider, useBuilder } from "@/components/dashboard/builder/builder-context";
import { SectionList } from "@/components/dashboard/builder/section-list";
import { SectionEditorPanel } from "@/components/dashboard/builder/section-editor-panel";
import { AddSectionDialog } from "@/components/dashboard/builder/add-section-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        isPublished
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
          : "bg-white/[0.06] text-silver border-white/10",
      )}
    >
      {isPublished ? "Live" : "Offline"}
    </span>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function BuilderToolbar() {
  const { state, togglePublished } = useBuilder();
  const { divinerUsername, serviceSlug, isPublished, isSaving, lastSavedAt, isLoading } = state;

  const previewHref =
    divinerUsername && serviceSlug ? `/${divinerUsername}/services/${serviceSlug}?preview=true` : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-cosmos-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard/landing-pages"
          className="p-1.5 rounded-lg text-silver/50 hover:text-cream hover:bg-white/[0.04] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <LayoutTemplate className="size-4 text-gold/70 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-cream truncate leading-tight">
            Landing Page Builder
          </p>
          {lastSavedAt && !isSaving && (
            <p className="text-[11px] text-silver/40">
              Saved{" "}
              {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {isSaving && (
            <p className="text-[11px] text-silver/40 flex items-center gap-1">
              <Loader2 className="size-2.5 animate-spin" /> Saving…
            </p>
          )}
        </div>
        <StatusBadge isPublished={isPublished} />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {previewHref && (
          <Button size="sm" variant="ghost" asChild className="text-silver/60 hover:text-cream gap-1.5">
            <a href={previewHref} target="_blank" rel="noopener noreferrer">
              <Eye className="size-3.5" /> Preview
            </a>
          </Button>
        )}

        {isPublished ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => togglePublished(false)}
            disabled={isSaving || isLoading}
            className="border-white/10 text-silver/70 hover:text-red-400 hover:border-red-400/30 gap-1.5"
          >
            <GlobeLock className="size-3.5" /> Take Offline
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => togglePublished(true)}
            disabled={isSaving || isLoading}
            className="bg-gold hover:bg-gold-light text-cosmos-900 font-semibold gap-1.5"
          >
            <Globe className="size-3.5" /> Go Live
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────

function BuilderLayout() {
  const { state } = useBuilder();
  const { isLoading } = state;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-silver/50">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Loading builder…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      <div className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-silver/60 uppercase tracking-wide">
            Blocks
          </span>
          <AddSectionDialog />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SectionList />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-cosmos-950/30">
        <SectionEditorPanel />
      </div>
    </div>
  );
}

// ── Page Entry Point ───────────────────────────────────────────────────────────

export default function BuilderPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params);

  return (
    <BuilderProvider templateId={templateId}>
      <div className="min-h-screen bg-cosmos-950 flex flex-col">
        <BuilderToolbar />
        <BuilderLayout />
      </div>
    </BuilderProvider>
  );
}
