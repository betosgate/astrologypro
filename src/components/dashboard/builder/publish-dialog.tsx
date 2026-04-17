"use client";

import { useState } from "react";
import { Globe, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBuilder } from "./builder-context";

export function PublishDialog() {
  const { state, publishPage } = useBuilder();
  const [publishing, setPublishing] = useState(false);
  const { sections, landingPage } = state;

  const draftSections = sections.filter((s) => s.is_draft);
  const disabledSections = sections.filter((s) => !s.is_enabled && !s.is_system);
  const flaggedSections = sections.filter((s) =>
    s.moderation_status === "flagged" || s.moderation_status === "rejected"
  );

  const hasBlockers = flaggedSections.length > 0 ||
    landingPage?.moderation_status === "flagged" ||
    landingPage?.moderation_status === "rejected";

  async function handlePublish() {
    setPublishing(true);
    await publishPage();
    setPublishing(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="bg-gold hover:bg-gold-light text-cosmos-900 font-semibold"
          disabled={state.isSaving}
        >
          <Globe className="mr-1.5 size-4" />
          Publish
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Landing Page</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm">
              <p className="text-silver/70">
                This will make your landing page publicly visible.
              </p>

              {hasBlockers && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/8 p-3 text-red-400">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Publish blocked</p>
                    <p className="text-xs mt-1">
                      {flaggedSections.length > 0
                        ? `${flaggedSections.length} section(s) flagged by moderation. Fix issues before publishing.`
                        : "This page has been flagged by moderation."}
                    </p>
                  </div>
                </div>
              )}

              {draftSections.length > 0 && !hasBlockers && (
                <div>
                  <p className="text-silver/60 mb-2">Changes to publish:</p>
                  <ul className="space-y-1">
                    {draftSections.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-cream/80">
                        <span className="size-1.5 rounded-full bg-gold/60 shrink-0" />
                        {s.section_type.replace(/_/g, " ")}
                        {s.title ? ` — "${s.title}"` : ""}
                      </li>
                    ))}
                    {draftSections.length > 5 && (
                      <li className="text-silver/50">+ {draftSections.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {disabledSections.length > 0 && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-silver/50 text-xs">
                    ⚠ {disabledSections.length} section(s) are disabled and will not appear on the public page.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePublish}
            disabled={publishing || hasBlockers}
            className="bg-gold hover:bg-gold-light text-cosmos-900 font-semibold"
          >
            {publishing ? "Publishing..." : "Publish Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
