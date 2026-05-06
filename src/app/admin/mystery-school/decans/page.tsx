"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronUp, Save } from "lucide-react";

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
};

const STEP_TYPES = ["invocation", "gate", "instruction", "affirmation", "closing"];

export default function AdminDecansPage() {
  const [decans, setDecans] = useState<Decan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ritualSteps, setRitualSteps] = useState<Record<string, RitualStep[]>>({});
  const [newStep, setNewStep] = useState({ stepType: "instruction", content: "" });
  const [description, setDescription] = useState<Record<string, string>>({});
  const [tarotCardRef, setTarotCardRef] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<string | null>(null);
  const [addingStep, setAddingStep] = useState(false);

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
      // Fetch steps from general decans endpoint (admin can read authenticated)
      const res = await fetch(`/api/mystery-school/decan/${decan.id}`).then((r) => r.json()).catch(() => null);
      if (res?.ritualSteps) {
        setRitualSteps((prev) => ({ ...prev, [decan.id]: res.ritualSteps }));
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

  function formatDate(month: number, day: number) {
    return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <a href="/admin/mystery-school" className="text-sm text-muted-foreground hover:text-foreground">← Foundation Weeks</a>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold">Decan Rituals</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Add thematic descriptions and ritual steps to each of the 36 decans.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
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
                    <div>
                      <span className="text-sm font-medium">{decan.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(decan.start_month, decan.start_day)} – {formatDate(decan.end_month, decan.end_day)} · {decan.planet}
                        {decan.tarot_card_ref && ` · ${decan.tarot_card_ref}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {decan.ritualStepCount} step{decan.ritualStepCount !== 1 ? "s" : ""}
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
                <CardContent className="pt-0 space-y-5">
                  {/* Description + Tarot Card Ref */}
                  <div className="space-y-1.5">
                    <Label>Thematic Description</Label>
                    <Textarea
                      rows={3}
                      value={description[decan.id] ?? ""}
                      onChange={(e) => setDescription((p) => ({ ...p, [decan.id]: e.target.value }))}
                      placeholder="Describe this decan's energy, themes, and practice focus…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tarot Card Reference</Label>
                    <Input
                      value={tarotCardRef[decan.id] ?? ""}
                      onChange={(e) => setTarotCardRef((p) => ({ ...p, [decan.id]: e.target.value }))}
                      placeholder="e.g. Eight of Wands"
                    />
                    <p className="text-xs text-muted-foreground">
                      The canonical tarot card assigned to this decan. Populated from the standard mapping — override only if needed.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveDescription(decan.id)}
                      disabled={savingDesc === decan.id}
                    >
                      <Save className="mr-1.5 size-3.5" />
                      {savingDesc === decan.id ? "Saving…" : "Save Description &amp; Tarot"}
                    </Button>
                  </div>

                  {/* Existing ritual steps */}
                  {(ritualSteps[decan.id] ?? []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ritual Steps</p>
                      {(ritualSteps[decan.id] ?? []).map((step) => (
                        <div key={step.id} className="rounded-md border px-3 py-2 text-sm">
                          <span className="text-xs font-medium text-muted-foreground mr-2">
                            {step.step_order}. {step.step_type}
                          </span>
                          <span className="text-foreground/80">{step.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add step */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Ritual Step</p>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select
                          className="w-full rounded-md border h-9 px-2 py-1.5 text-sm"
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
                      {addingStep ? "Adding…" : "Add Step"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
