"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, GlobeLock, Loader2, LayoutTemplate } from "lucide-react";
import { BuilderProvider, useBuilder } from "@/components/dashboard/builder/builder-context";
import { SectionList } from "@/components/dashboard/builder/section-list";
import { SectionEditorPanel } from "@/components/dashboard/builder/section-editor-panel";
import { AddSectionDialog } from "@/components/dashboard/builder/add-section-dialog";
import { PublishDialog } from "@/components/dashboard/builder/publish-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | undefined }) {
  const map: Record<string, { label: string; className: string }> = {
    published:   { label: "Published",   className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    draft:       { label: "Draft",       className: "bg-white/[0.06] text-silver border-white/10" },
    preview:     { label: "Preview",     className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    unpublished: { label: "Unpublished", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    archived:    { label: "Archived",    className: "bg-red-500/15 text-red-400 border-red-500/20" },
  };
  const cfg = map[status ?? "draft"] ?? map.draft;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function BuilderToolbar() {
  const { state, unpublishPage } = useBuilder();
  const { landingPage, divinerUsername, serviceSlug, isSaving, lastSavedAt, isLoading } = state;

  const isPublished = landingPage?.status === "published";
  const previewHref = divinerUsername && serviceSlug
    ? `/${divinerUsername}/services/${serviceSlug}?preview=true`
    : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-cosmos-900/60 backdrop-blur-sm">
      {/* Left: back + title */}
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
            {landingPage?.custom_page_title || "Landing Page Builder"}
          </p>
          {lastSavedAt && !isSaving && (
            <p className="text-[11px] text-silver/40">
              Saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {isSaving && (
            <p className="text-[11px] text-silver/40 flex items-center gap-1">
              <Loader2 className="size-2.5 animate-spin" /> Saving…
            </p>
          )}
        </div>
        <StatusBadge status={landingPage?.status} />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Preview link — opens the live route with ?preview=true */}
        {landingPage && previewHref && (
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="text-silver/60 hover:text-cream gap-1.5"
          >
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="size-3.5" />
              Preview
            </a>
          </Button>
        )}

        {isPublished ? (
          <Button
            size="sm"
            variant="outline"
            onClick={unpublishPage}
            disabled={isSaving || isLoading}
            className="border-white/10 text-silver/70 hover:text-red-400 hover:border-red-400/30 gap-1.5"
          >
            <GlobeLock className="size-3.5" />
            Unpublish
          </Button>
        ) : (
          <PublishDialog />
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
      {/* ── Left: Section List ── */}
      <div className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-silver/60 uppercase tracking-wide">Sections</span>
          <AddSectionDialog />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SectionList />
        </div>
      </div>

      {/* ── Right: Editor Panel ── */}
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
