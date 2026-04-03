"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface IntakeQuestion {
  id: string;
  question_text: string;
  question_type: "text" | "textarea" | "select" | "checkbox";
  options: string[];
  is_required: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
}

interface IntakeForm {
  id: string;
  service_id: string | null;
  questions: IntakeQuestion[];
}

interface IntakeBuilderClientProps {
  divinerId: string;
  services: Service[];
  intakeForms: IntakeForm[];
}

const QUESTION_TYPE_LABELS: Record<IntakeQuestion["question_type"], string> = {
  text: "Short Text",
  textarea: "Long Text",
  select: "Dropdown",
  checkbox: "Checkbox",
};

const EMPTY_QUESTION: Omit<IntakeQuestion, "id"> = {
  question_text: "",
  question_type: "text",
  options: [],
  is_required: false,
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function IntakeBuilderClient({
  divinerId,
  services,
  intakeForms,
}: IntakeBuilderClientProps) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newQ, setNewQ] = useState<Omit<IntakeQuestion, "id">>({
    ...EMPTY_QUESTION,
  });
  const [optionsRaw, setOptionsRaw] = useState("");

  // Build a map of serviceId -> questions (local editable state)
  const initialQMap: Record<string, IntakeQuestion[]> = {};
  for (const svc of services) {
    const form = intakeForms.find((f) => f.service_id === svc.id);
    initialQMap[svc.id] = form?.questions ?? [];
  }
  const [questionMap, setQuestionMap] = useState(initialQMap);

  const currentQuestions = questionMap[selectedServiceId] ?? [];

  function updateQuestions(serviceId: string, questions: IntakeQuestion[]) {
    setQuestionMap((prev) => ({ ...prev, [serviceId]: questions }));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const qs = [...currentQuestions];
    [qs[index - 1], qs[index]] = [qs[index], qs[index - 1]];
    updateQuestions(selectedServiceId, qs);
  }

  function moveDown(index: number) {
    if (index === currentQuestions.length - 1) return;
    const qs = [...currentQuestions];
    [qs[index], qs[index + 1]] = [qs[index + 1], qs[index]];
    updateQuestions(selectedServiceId, qs);
  }

  function deleteQuestion(index: number) {
    const qs = currentQuestions.filter((_, i) => i !== index);
    updateQuestions(selectedServiceId, qs);
  }

  function addQuestion() {
    if (!newQ.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    const options =
      newQ.question_type === "select"
        ? optionsRaw
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

    const question: IntakeQuestion = {
      id: generateId(),
      question_text: newQ.question_text.trim(),
      question_type: newQ.question_type,
      options,
      is_required: newQ.is_required,
    };

    updateQuestions(selectedServiceId, [...currentQuestions, question]);
    setNewQ({ ...EMPTY_QUESTION });
    setOptionsRaw("");
    setSheetOpen(false);
    toast.success("Question added");
  }

  async function handleSave() {
    setSaving(true);
    const existingForm = intakeForms.find(
      (f) => f.service_id === selectedServiceId
    );

    const res = await fetch("/api/intake-forms", {
      method: existingForm ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diviner_id: divinerId,
        service_id: selectedServiceId,
        questions: currentQuestions,
        ...(existingForm ? { id: existingForm.id } : {}),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to save intake form");
      return;
    }

    toast.success("Intake form saved");
    router.refresh();
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      {/* Service selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
          <CardDescription>
            Choose which service to configure intake questions for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {services.map((svc) => (
                <SelectItem key={svc.id} value={svc.id}>
                  {svc.name}
                  {svc.category && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({svc.category})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Questions for selected service */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Questions for{" "}
                <span className="text-primary">{selectedService?.name}</span>
              </CardTitle>
              <CardDescription>
                {currentQuestions.length} question
                {currentQuestions.length !== 1 ? "s" : ""} configured
              </CardDescription>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Question
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Question</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="q-text">Question</Label>
                    <Input
                      id="q-text"
                      placeholder="e.g. What is your main concern for this session?"
                      value={newQ.question_text}
                      onChange={(e) =>
                        setNewQ({ ...newQ, question_text: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="q-type">Answer Type</Label>
                    <Select
                      value={newQ.question_type}
                      onValueChange={(v) =>
                        setNewQ({
                          ...newQ,
                          question_type: v as IntakeQuestion["question_type"],
                        })
                      }
                    >
                      <SelectTrigger id="q-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(QUESTION_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {newQ.question_type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="q-options">Options (one per line)</Label>
                      <Textarea
                        id="q-options"
                        placeholder={"Option A\nOption B\nOption C"}
                        rows={4}
                        value={optionsRaw}
                        onChange={(e) => setOptionsRaw(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="q-required">Required</Label>
                    <Switch
                      id="q-required"
                      checked={newQ.is_required}
                      onCheckedChange={(v) =>
                        setNewQ({ ...newQ, is_required: v })
                      }
                    />
                  </div>
                </div>
                <SheetFooter>
                  <Button onClick={addQuestion} className="w-full">
                    Add Question
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          {currentQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No questions yet. Add questions clients will answer when booking
                this service.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{q.question_text}</p>
                      {q.is_required && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-500/10 text-red-500 border-red-500/20"
                        >
                          Required
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {QUESTION_TYPE_LABELS[q.question_type]}
                      </Badge>
                    </div>
                    {q.options.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Options: {q.options.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="size-4" />
                      <span className="sr-only">Move up</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => moveDown(index)}
                      disabled={index === currentQuestions.length - 1}
                    >
                      <ChevronDown className="size-4" />
                      <span className="sr-only">Move down</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => deleteQuestion(index)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete question</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? "Saving..." : "Save Intake Form"}
        </Button>
      </div>
    </div>
  );
}
