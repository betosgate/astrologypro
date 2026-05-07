"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronDown, ChevronUp, Pencil, Save, Trash2, X } from "lucide-react";
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

type Decan = {
  id: string;
  decan_number: number;
  sign: string;
  planet: string;
  title: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  description: string | null;
  tarot_card_ref: string | null;
  ritualStepCount: number;
};

type RitualStep = {
  id: string;
  step_order: number;
  step_type: string;
  content: string;
  is_published?: boolean;
};

const STEP_TYPES = ["invocation", "gate", "instruction", "affirmation", "closing"];

export default function AdminDecansPage() {
  const [decans, setDecans] = useState<Decan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ritualSteps, setRitualSteps] = useState<Record<string, RitualStep[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});
  const [newStep, setNewStep] = useState({ stepType: "instruction", content: "" });
  const [description, setDescription] = useState<Record<string, string>>({});
  const [tarotCardRef, setTarotCardRef] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<string | null>(null);
  const [addingStep, setAddingStep] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState({ stepType: "instruction", content: "" });
  const [savingStepId, setSavingStepId] = useState<string | null>(null);
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/mystery-school/decans")
      .then((r) => r.json())
      .then((d) => setDecans(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function expand(decan: Decan) {
    if (expandedId === decan.id) { setExpandedId(null); return; }
    setExpandedId(decan.id);
    setDescription((prev) => ({ ...prev, [decan.id]: decan.description ?? "" }));
    setTarotCardRef((prev) => ({ ...prev, [decan.id]: decan.tarot_card_ref ?? "" }));

    if (!ritualSteps[decan.id]) {
      setLoadingSteps((prev) => ({ ...prev, [decan.id]: true }));
      try {
        const res = await fetch(`/api/admin/mystery-school/decans/${decan.id}`)
          .then((r) => r.json())
          .catch(() => null);
        if (res?.rituals) {
          setRitualSteps((prev) => ({ ...prev, [decan.id]: res.rituals }));
        }
      } finally {
        setLoadingSteps((prev) => ({ ...prev, [decan.id]: false }));
      }
    }
  }

  async function saveDescription(decanId: string) {
    setSavingDesc(decanId);
    await fetch("/api/admin/mystery-school/decans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decanId,
        description: description[decanId],
        tarotCardRef: tarotCardRef[decanId] ?? null,
        content: "noop",
      }),
    });
    setDecans((prev) =>
      prev.map((d) =>
        d.id === decanId
          ? { ...d, description: description[decanId], tarot_card_ref: tarotCardRef[decanId] || null }
          : d
      )
    );
    setSavingDesc(null);
  }

  async function addStep(decanId: string) {
    if (!newStep.content.trim()) return;
    setAddingStep(true);
    const steps = ritualSteps[decanId] ?? [];
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.step_order)) + 1 : 1;
    const res = await fetch("/api/admin/mystery-school/decans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decanId,
        stepOrder: nextOrder,
        stepType: newStep.stepType,
        content: newStep.content,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setRitualSteps((prev) => ({ ...prev, [decanId]: [...(prev[decanId] ?? []), created] }));
      setDecans((prev) => prev.map((d) => d.id === decanId ? { ...d, ritualStepCount: d.ritualStepCount + 1 } : d));
      setNewStep({ stepType: "instruction", content: "" });
    }
    setAddingStep(false);
  }

  function startEditStep(step: RitualStep) {
    setEditingStepId(step.id);
    setEditingStep({ stepType: step.step_type, content: step.content });
  }

  async function saveStep(decanId: string, stepId: string) {
    if (!editingStep.content.trim()) return;
    setSavingStepId(stepId);
    const res = await fetch(`/api/admin/mystery-school/decan-rituals/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step_type: editingStep.stepType,
        content: editingStep.content,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const updated = data.ritual as RitualStep;
      setRitualSteps((prev) => ({
        ...prev,
        [decanId]: (prev[decanId] ?? []).map((step) =>
          step.id === stepId ? updated : step,
        ),
      }));
      setEditingStepId(null);
    }
    setSavingStepId(null);
  }

  async function deleteStep(decanId: string, stepId: string) {
    setDeletingStepId(stepId);
    const res = await fetch(`/api/admin/mystery-school/decan-rituals/${stepId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRitualSteps((prev) => ({
        ...prev,
        [decanId]: (prev[decanId] ?? []).filter((step) => step.id !== stepId),
      }));
      setDecans((prev) =>
        prev.map((d) =>
          d.id === decanId
            ? { ...d, ritualStepCount: Math.max(0, d.ritualStepCount - 1) }
            : d,
        ),
      );
      if (editingStepId === stepId) setEditingStepId(null);
    }
    setDeletingStepId(null);
  }

  function formatDate(month: number, day: number) {
    return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/mystery-school" className="text-sm text-muted-foreground hover:text-foreground">← Foundation Weeks</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold">Decan Content</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Manage thematic descriptions, tarot mapping, and ritual steps for each of the 36 decans.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[74px] w-full rounded-xl bg-card border border-border/40 shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {decans.map((decan) => (
            <Card key={decan.id}>
              <CardHeader className="py-3 px-4">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => expand(decan)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-right text-xs font-bold text-muted-foreground">{decan.decan_number}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{decan.title}</span>
                        {decan.description && (
                          <Badge variant="outline" className="text-[10px]">
                            Thematic content
                          </Badge>
                        )}
                        {decan.tarot_card_ref && (
                          <Badge variant="outline" className="text-[10px]">
                            Tarot mapped
                          </Badge>
                        )}
                      </div>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(decan.start_month, decan.start_day)} – {formatDate(decan.end_month, decan.end_day)} · {decan.planet}
                        {decan.tarot_card_ref && ` · ${decan.tarot_card_ref}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {decan.ritualStepCount} ritual step{decan.ritualStepCount !== 1 ? "s" : ""}
                    </Badge>
                    {expandedId === decan.id ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CardHeader>

              {expandedId === decan.id && (
                <CardContent className="space-y-5 border-t border-border/60 pt-5">
                  {/* Description + Tarot Card Ref */}
                  <section className="rounded-lg border border-border/70 bg-background/35 p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold">Thematic Description</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Student-facing overview for this decan&apos;s energy and practice focus.
                      </p>
                    </div>
                    <Textarea
                      rows={4}
                      value={description[decan.id] ?? ""}
                      onChange={(e) => setDescription((p) => ({ ...p, [decan.id]: e.target.value }))}
                      placeholder="Describe this decan's energy, themes, and practice focus..."
                    />
                  </section>
                  <section className="rounded-lg border border-border/70 bg-background/35 p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold">Tarot Mapping</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          The canonical tarot card assigned to this decan. Override only if needed.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveDescription(decan.id)}
                        disabled={savingDesc === decan.id}
                        className="shrink-0"
                      >
                        <Save className="mr-1.5 size-3.5" />
                        {savingDesc === decan.id ? "Saving..." : "Save Content"}
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tarot Card Reference</Label>
                      <Input
                        value={tarotCardRef[decan.id] ?? ""}
                        onChange={(e) => setTarotCardRef((p) => ({ ...p, [decan.id]: e.target.value }))}
                        placeholder="e.g. Eight of Wands"
                      />
                    </div>
                  </section>

                  {/* Existing ritual steps */}
                  <section className="rounded-lg border border-border/70 bg-background/35 p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold">Ritual Steps</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ordered steps shown in the Mystery School ritual runner.
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {(ritualSteps[decan.id] ?? []).length} step{(ritualSteps[decan.id] ?? []).length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {loadingSteps[decan.id] ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full bg-background/50 border border-border/40 opacity-60" />
                        <Skeleton className="h-12 w-full bg-background/50 border border-border/40 opacity-60" />
                        <Skeleton className="h-12 w-full bg-background/50 border border-border/40 opacity-60" />
                      </div>
                    ) : (ritualSteps[decan.id] ?? []).length > 0 ? (
                      <div className="space-y-2">
                      {(ritualSteps[decan.id] ?? []).map((step) => (
                        <div key={step.id} className="rounded-md border border-border/60 bg-background/50 px-3 py-3 text-sm">
                          {editingStepId === step.id ? (
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">Type</Label>
                                  <select
                                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                                    value={editingStep.stepType}
                                    onChange={(e) =>
                                      setEditingStep((s) => ({ ...s, stepType: e.target.value }))
                                    }
                                  >
                                    {STEP_TYPES.map((t) => <option key={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                  <Label className="text-xs">Content</Label>
                                  <Textarea
                                    rows={3}
                                    value={editingStep.content}
                                    onChange={(e) =>
                                      setEditingStep((s) => ({ ...s, content: e.target.value }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveStep(decan.id, step.id)}
                                  disabled={savingStepId === step.id || !editingStep.content.trim()}
                                >
                                  <Save className="mr-1.5 size-3.5" />
                                  {savingStepId === step.id ? "Saving…" : "Save Step"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingStepId(null)}
                                >
                                  <X className="mr-1.5 size-3.5" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                  {step.step_order}. {step.step_type}
                                  {step.is_published === false && (
                                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px]">
                                      unpublished
                                    </span>
                                  )}
                                </div>
                                <p className="whitespace-pre-wrap text-foreground/80">{step.content}</p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
                                  onClick={() => startEditStep(step)}
                                  aria-label="Edit ritual step"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 text-destructive hover:text-destructive"
                                      disabled={deletingStepId === step.id}
                                      aria-label="Delete ritual step"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this ritual step from the decan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteStep(decan.id, step.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete Step
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                        No ritual steps have been added for this decan yet.
                      </div>
                    )}
                  </section>

                  {/* Add step */}
                  <section className="rounded-lg border border-border/70 bg-background/35 p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold">Add Ritual Step</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        New steps are appended after the current final step.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={newStep.stepType}
                          onChange={(e) => setNewStep((s) => ({ ...s, stepType: e.target.value }))}
                        >
                          {STEP_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <Label className="text-xs">Content</Label>
                        <Textarea
                          rows={3}
                          value={newStep.content}
                          onChange={(e) => setNewStep((s) => ({ ...s, content: e.target.value }))}
                          placeholder="Enter the ritual step text…"
                        />
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addStep(decan.id)} disabled={addingStep}>
                      <Plus className="mr-1.5 size-3.5" />
                      {addingStep ? "Adding..." : "Add Step"}
                    </Button>
                  </section>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
