"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { TrainingNotes } from "@/components/admin/training-notes";

/**
 * Training Management detail sheet — the right-side slide-out panel that
 * replaces the old preview modals for all four training entity types
 * (programs, categories, lessons, quizzes). Matches the Users admin pattern
 * required by the standardization task: Overview tab + Notes tab, edit /
 * activate-deactivate / delete actions at the bottom.
 */

export type TrainingEntityType = "program" | "category" | "lesson" | "quiz";

export type TrainingEntityRow = {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  /** Pre-rendered key/value rows the caller wants to show in the Overview tab. */
  overview: Array<{ label: string; value: React.ReactNode }>;
  /** Edit page href. */
  editHref: string;
};

interface TrainingEntitySheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: TrainingEntityType;
  row: TrainingEntityRow | null;
  /** Called after a successful activate/deactivate/delete so the parent can refresh. */
  onMutated: () => void;
  /**
   * Fires when notes are added or removed inside the Notes tab. The parent
   * table uses it to update its notes-count column without a full refetch.
   */
  onNotesCountChange?: (entityId: string, nextCount: number) => void;
  /** Which tab to show when the sheet opens. Defaults to "overview". */
  initialTab?: "overview" | "notes";
}

const ENTITY_LABEL: Record<TrainingEntityType, string> = {
  program: "Program",
  category: "Category",
  lesson: "Lesson",
  quiz: "Quiz",
};

const ENTITY_API_PATH: Record<TrainingEntityType, string> = {
  program: "programs",
  category: "categories",
  lesson: "lessons",
  quiz: "quizzes",
};

export function TrainingEntitySheet({
  open,
  onOpenChange,
  entityType,
  row,
  onMutated,
  onNotesCountChange,
  initialTab = "overview",
}: TrainingEntitySheetProps) {
  const [tab, setTab] = useState<"overview" | "notes">(initialTab);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Reset to the requested initial tab every time the sheet opens.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!row) return null;

  const label = ENTITY_LABEL[entityType];

  async function handleToggleActive() {
    if (!row) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/training/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          ids: [row.id],
          action: row.is_active ? "deactivate" : "activate",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success(
        `${label} ${row.is_active ? "deactivated" : "activated"}.`,
      );
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to update ${label}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!row) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/training/${ENTITY_API_PATH[entityType]}/${row.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success(`${label} deleted.`);
      setDeleteOpen(false);
      onOpenChange(false);
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to delete ${label}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-lg truncate">{row.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      row.is_active
                        ? "text-xs bg-green-500/10 text-green-600 border-green-500/30"
                        : "text-xs bg-red-500/10 text-red-600 border-red-500/30"
                    }
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "overview" | "notes")}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-5 pt-3 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="overview"
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm"
            >
              {row.description && (
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="mt-1">{row.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {row.overview.map((item, idx) => (
                  <div key={idx} className="contents">
                    <dt className="text-xs text-muted-foreground pt-0.5">
                      {item.label}
                    </dt>
                    <dd className="text-sm break-words">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>

            <TabsContent
              value="notes"
              className="flex-1 overflow-y-auto px-5 py-4"
            >
              {tab === "notes" ? (
                <>
                  {/* Reuses the existing TrainingNotes client which talks to
                      /api/admin/training/notes. Quiz support requires the
                      20260408000116 migration to widen the entity_type CHECK.
                      Notes count changes propagate up to the parent table so
                      the count column stays in sync without a full refetch. */}
                  <TrainingNotes
                    entityType={entityType}
                    entityId={row.id}
                    autoFocusComposer
                    onCountChange={(n) => onNotesCountChange?.(row.id, n)}
                  />
                </>
              ) : null}
            </TabsContent>
          </Tabs>

          <div className="border-t px-5 py-3 flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={row.editHref}>
                <Pencil className="size-3.5 mr-1.5" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={handleToggleActive}
            >
              {row.is_active ? (
                <>
                  <ShieldOff className="size-3.5 mr-1.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5 mr-1.5" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{row.name}</strong>. This cannot
              be undone. Child records may block the delete — the server
              enforces its own safety guards (for example, a program with
              categories still attached cannot be removed).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
