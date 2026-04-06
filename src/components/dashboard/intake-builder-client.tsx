"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Star,
  StarOff,
  Pencil,
  X,
  Check,
  LayoutTemplate,
  Sparkles,
  Baby,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FIELD_TYPES,
  PRESET_TEMPLATES,
  FIELD_TYPE_DEFAULT_LABELS,
  type IntakeField,
  type IntakeTemplate,
  type FieldType,
} from "@/lib/intake-fields";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  category: string;
  intake_template_id: string | null;
}

interface IntakeBuilderClientProps {
  divinerId: string;
  services: Service[];
  templates: IntakeTemplate[];
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function newField(type: FieldType, sortOrder: number): IntakeField {
  return {
    id: crypto.randomUUID(),
    type,
    label: FIELD_TYPE_DEFAULT_LABELS[type],
    placeholder: "",
    required: false,
    options: [],
    help_text: "",
    sort_order: sortOrder,
  };
}

const COMPOSITE_FIELD_TYPES = new Set<FieldType>(["birth_details", "partner_birth_details"]);

function fieldTypeBadgeClass(type: FieldType): string {
  switch (type) {
    case "birth_details":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "partner_birth_details":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "select":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "checkbox":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    default:
      return "bg-white/5 text-muted-foreground border-white/10";
  }
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.value, f.label])
) as Record<FieldType, string>;

// ────────────────────────────────────────────────────────────
// Sub-component: Field editor dialog
// ────────────────────────────────────────────────────────────

interface FieldEditorDialogProps {
  field: IntakeField | null;
  onSave: (field: IntakeField) => void;
  onClose: () => void;
}

function FieldEditorDialog({ field, onSave, onClose }: FieldEditorDialogProps) {
  const [draft, setDraft] = useState<IntakeField>(
    field ?? newField("text", 0)
  );
  const [optionsRaw, setOptionsRaw] = useState<string>(
    (field?.options ?? []).join(", ")
  );

  function handleTypeChange(type: FieldType) {
    setDraft((prev) => ({
      ...prev,
      type,
      label: prev.label === FIELD_TYPE_DEFAULT_LABELS[prev.type]
        ? FIELD_TYPE_DEFAULT_LABELS[type]
        : prev.label,
    }));
  }

  function handleSave() {
    if (!draft.label.trim()) {
      toast.error("Label is required");
      return;
    }
    const options =
      draft.type === "select"
        ? optionsRaw
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
    onSave({ ...draft, label: draft.label.trim(), options });
  }

  const isComposite = COMPOSITE_FIELD_TYPES.has(draft.type);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Field" : "Add Field"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Field Type</Label>
            <Select value={draft.type} onValueChange={(v) => handleTypeChange(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Composite type info */}
          {isComposite && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-sm text-purple-300">
              {draft.type === "birth_details" ? (
                <div className="flex items-center gap-2">
                  <Baby className="size-4 shrink-0" />
                  <span>
                    This block expands to: Birth Date, Birth Time (with Unknown
                    option), and Birth City.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="size-4 shrink-0" />
                  <span>
                    This block expands to: Partner&apos;s Birth Date, Partner&apos;s Birth
                    Time, and Partner&apos;s Birth City.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Field label shown to client"
            />
          </div>

          {/* Placeholder — not for composite or checkbox */}
          {!isComposite && draft.type !== "checkbox" && (
            <div className="space-y-1.5">
              <Label htmlFor="field-placeholder">
                Placeholder{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="field-placeholder"
                value={draft.placeholder ?? ""}
                onChange={(e) => setDraft({ ...draft, placeholder: e.target.value })}
                placeholder="Hint text inside the field"
              />
            </div>
          )}

          {/* Options — only for select */}
          {draft.type === "select" && (
            <div className="space-y-1.5">
              <Label htmlFor="field-options">
                Options{" "}
                <span className="text-xs text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                id="field-options"
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                placeholder="Option A, Option B, Option C"
              />
            </div>
          )}

          {/* Help text */}
          <div className="space-y-1.5">
            <Label htmlFor="field-help">
              Help Text{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="field-help"
              value={draft.help_text ?? ""}
              onChange={(e) => setDraft({ ...draft, help_text: e.target.value })}
              placeholder="Additional hint shown below the field"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="field-required" className="cursor-pointer">
              Required
            </Label>
            <Switch
              id="field-required"
              checked={draft.required}
              onCheckedChange={(v) => setDraft({ ...draft, required: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 size-4" />
            {field ? "Save Changes" : "Add Field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export function IntakeBuilderClient({
  divinerId,
  services,
  templates: initialTemplates,
}: IntakeBuilderClientProps) {
  const router = useRouter();

  // Template list state
  const [templates, setTemplates] = useState<IntakeTemplate[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplates[0]?.id ?? null
  );

  // Service assignments — map of serviceId -> templateId | null
  const [serviceAssignments, setServiceAssignments] = useState<
    Record<string, string | null>
  >(
    Object.fromEntries(services.map((s) => [s.id, s.intake_template_id]))
  );

  // Editor draft state
  const [draftName, setDraftName] = useState<string>("");
  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftIsDefault, setDraftIsDefault] = useState<boolean>(false);
  const [draftFields, setDraftFields] = useState<IntakeField[]>([]);
  const [isNewTemplate, setIsNewTemplate] = useState<boolean>(false);

  // Field editor dialog
  const [editingField, setEditingField] = useState<IntakeField | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [addingField, setAddingField] = useState<boolean>(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingAssignment, setSavingAssignment] = useState<string | null>(null);

  // ── Load template into editor ──────────────────────────────
  const loadTemplate = useCallback((t: IntakeTemplate) => {
    setSelectedTemplateId(t.id);
    setDraftName(t.name);
    setDraftDescription(t.description ?? "");
    setDraftIsDefault(t.is_default);
    setDraftFields(t.fields.slice().sort((a, b) => a.sort_order - b.sort_order));
    setIsNewTemplate(false);
  }, []);

  // ── Start new template ────────────────────────────────────
  function startNew() {
    setSelectedTemplateId(null);
    setDraftName("New Template");
    setDraftDescription("");
    setDraftIsDefault(false);
    setDraftFields([]);
    setIsNewTemplate(true);
  }

  // ── Load preset ───────────────────────────────────────────
  function loadPreset(key: string) {
    const preset = PRESET_TEMPLATES[key];
    if (!preset) return;
    setSelectedTemplateId(null);
    setDraftName(preset.name);
    setDraftDescription("");
    setDraftIsDefault(false);
    setDraftFields(
      preset.fields.map((f) => ({ ...f, id: crypto.randomUUID() }))
    );
    setIsNewTemplate(true);
  }

  // ── Field operations ──────────────────────────────────────
  function addFieldOfType(type: FieldType) {
    const newF = newField(type, draftFields.length);
    setEditingField(newF);
    setEditingFieldIndex(null); // null = add mode
    setAddingField(true);
  }

  function openEditField(field: IntakeField, index: number) {
    setEditingField({ ...field });
    setEditingFieldIndex(index);
    setAddingField(false);
  }

  function handleFieldSave(saved: IntakeField) {
    if (addingField) {
      setDraftFields((prev) => [
        ...prev,
        { ...saved, sort_order: prev.length },
      ]);
    } else if (editingFieldIndex !== null) {
      setDraftFields((prev) =>
        prev.map((f, i) => (i === editingFieldIndex ? saved : f))
      );
    }
    setEditingField(null);
    setEditingFieldIndex(null);
    setAddingField(false);
  }

  function closeFieldEditor() {
    setEditingField(null);
    setEditingFieldIndex(null);
    setAddingField(false);
  }

  function deleteField(index: number) {
    setDraftFields((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((f, i) => ({ ...f, sort_order: i }))
    );
  }

  function moveField(index: number, direction: "up" | "down") {
    setDraftFields((prev) => {
      const arr = [...prev];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= arr.length) return prev;
      [arr[index], arr[swapWith]] = [arr[swapWith], arr[index]];
      return arr.map((f, i) => ({ ...f, sort_order: i }));
    });
  }

  // ── Save (create or update) ────────────────────────────────
  async function handleSave() {
    if (!draftName.trim()) {
      toast.error("Template name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: draftName.trim(),
        description: draftDescription.trim() || undefined,
        fields: draftFields,
        is_default: draftIsDefault,
      };

      let res: Response;
      if (isNewTemplate || !selectedTemplateId) {
        res = await fetch("/api/dashboard/intake-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/dashboard/intake-templates/${selectedTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save template");
      }

      const body = (await res.json()) as { data: IntakeTemplate };
      const saved = body.data;

      setTemplates((prev) => {
        // If is_default just got set, unset it on all others
        const updated = prev.map((t) =>
          saved.is_default && t.id !== saved.id
            ? { ...t, is_default: false }
            : t
        );
        const existingIdx = updated.findIndex((t) => t.id === saved.id);
        if (existingIdx >= 0) {
          updated[existingIdx] = saved;
          return updated;
        }
        return [...updated, saved];
      });

      setSelectedTemplateId(saved.id);
      setIsNewTemplate(false);
      toast.success(isNewTemplate ? "Template created" : "Template saved");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete template ───────────────────────────────────────
  async function handleDelete(templateId: string) {
    setDeletingId(templateId);
    try {
      const res = await fetch(`/api/dashboard/intake-templates/${templateId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete template");
      }

      const remaining = templates.filter((t) => t.id !== templateId);
      setTemplates(remaining);

      // Clear service assignments that referenced this template
      setServiceAssignments((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([svcId, tplId]) => [
            svcId,
            tplId === templateId ? null : tplId,
          ])
        )
      );

      if (selectedTemplateId === templateId) {
        if (remaining.length > 0) {
          loadTemplate(remaining[0]);
        } else {
          startNew();
        }
      }

      toast.success("Template deleted");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  // ── Service assignment ────────────────────────────────────
  async function handleServiceAssignment(serviceId: string, templateId: string | null) {
    setSavingAssignment(serviceId);
    try {
      const res = await fetch(
        `/api/dashboard/services/${serviceId}/intake-template`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: templateId }),
        }
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to update assignment");
      }

      setServiceAssignments((prev) => ({ ...prev, [serviceId]: templateId }));
      toast.success("Assignment updated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSavingAssignment(null);
    }
  }

  // ── Selected template & editor ─────────────────────────────
  const hasEditor = isNewTemplate || selectedTemplateId !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── Left panel: template list ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Templates
          </h2>
          <div className="flex gap-1">
            {/* Load Preset dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs">
                  <Sparkles className="size-3" />
                  Preset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                  <DropdownMenuItem key={key} onClick={() => loadPreset(key)}>
                    {preset.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={startNew}
            >
              <Plus className="size-3" />
              New
            </Button>
          </div>
        </div>

        {templates.length === 0 && !isNewTemplate && (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
            <LayoutTemplate className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No templates yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &ldquo;New&rdquo; or load a preset to start.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          {isNewTemplate && (
            <div className="rounded-lg border border-[#c9a84c]/40 bg-[#c9a84c]/5 px-3 py-2.5">
              <p className="text-sm font-medium text-[#c9a84c]">
                {draftName || "New Template"}
              </p>
              <p className="text-xs text-muted-foreground">Unsaved</p>
            </div>
          )}

          {templates.map((t) => (
            <div
              key={t.id}
              className={`group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                selectedTemplateId === t.id && !isNewTemplate
                  ? "border-[#c9a84c]/40 bg-[#c9a84c]/5"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
              }`}
              onClick={() => loadTemplate(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.fields.length} field{t.fields.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {t.is_default && (
                    <Star className="size-3.5 fill-[#c9a84c] text-[#c9a84c]" />
                  )}
                  {confirmDeleteId === t.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        disabled={deletingId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t.id);
                        }}
                      >
                        <Check className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(t.id);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: editor + assignments ── */}
      <div className="space-y-6">
        {hasEditor ? (
          <>
            {/* Template meta */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <h2 className="text-base font-semibold">Template Details</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-name">Template Name</Label>
                  <Input
                    id="tpl-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. Natal Chart Reading"
                  />
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2 pb-0.5">
                    <Switch
                      id="tpl-default"
                      checked={draftIsDefault}
                      onCheckedChange={setDraftIsDefault}
                    />
                    <Label htmlFor="tpl-default" className="cursor-pointer flex items-center gap-1.5">
                      {draftIsDefault ? (
                        <Star className="size-3.5 fill-[#c9a84c] text-[#c9a84c]" />
                      ) : (
                        <StarOff className="size-3.5 text-muted-foreground" />
                      )}
                      Set as default
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-desc">
                  Description{" "}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="tpl-desc"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="What kind of reading is this template for?"
                  rows={2}
                />
              </div>
            </div>

            {/* Field builder */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Fields</h2>
                  <p className="text-xs text-muted-foreground">
                    {draftFields.length} field{draftFields.length !== 1 ? "s" : ""} in
                    this template
                  </p>
                </div>

                {/* Add Field dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="size-4" />
                      Add Field
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    {FIELD_TYPES.map((ft) => (
                      <DropdownMenuItem
                        key={ft.value}
                        onClick={() => addFieldOfType(ft.value)}
                      >
                        {ft.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {draftFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <LayoutTemplate className="mb-2 size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No fields yet. Click &ldquo;Add Field&rdquo; to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {draftFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.015] p-3"
                    >
                      <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground/40" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{field.label}</p>
                          {field.required && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 py-0"
                            >
                              Required
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 ${fieldTypeBadgeClass(field.type)}`}
                          >
                            {FIELD_TYPE_LABEL[field.type]}
                          </Badge>
                        </div>

                        {/* Composite type hint */}
                        {COMPOSITE_FIELD_TYPES.has(field.type) && (
                          <p className="text-xs text-muted-foreground">
                            {field.type === "birth_details"
                              ? "Expands to: Birth Date + Birth Time + Birth City"
                              : "Expands to: Partner's Birth Date + Birth Time + Birth City"}
                          </p>
                        )}

                        {/* Select options */}
                        {field.type === "select" && field.options && field.options.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Options: {field.options.join(", ")}
                          </p>
                        )}

                        {/* Help text */}
                        {field.help_text && (
                          <p className="text-xs text-muted-foreground italic">
                            {field.help_text}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => moveField(idx, "up")}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="size-3.5" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => moveField(idx, "down")}
                          disabled={idx === draftFields.length - 1}
                        >
                          <ChevronDown className="size-3.5" />
                          <span className="sr-only">Move down</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEditField(field, idx)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit field</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => deleteField(idx)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete field</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[130px]">
                {saving ? "Saving..." : isNewTemplate ? "Create Template" : "Save Template"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
            <LayoutTemplate className="mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Select a template or create a new one.
            </p>
          </div>
        )}

        {/* Service assignments */}
        {services.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Service Assignments</h2>
              <p className="text-xs text-muted-foreground">
                Link a template to each service. Clients will see the assigned template
                when submitting intake for that service.
              </p>
            </div>

            <div className="space-y-3">
              {services.map((svc) => {
                const assignedId = serviceAssignments[svc.id] ?? null;
                const assignedTemplate = templates.find((t) => t.id === assignedId);

                return (
                  <div
                    key={svc.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{svc.name}</p>
                      {assignedTemplate ? (
                        <p className="text-xs text-[#c9a84c]">
                          {assignedTemplate.name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No intake template
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={assignedId ?? "__none__"}
                        onValueChange={(v) =>
                          handleServiceAssignment(svc.id, v === "__none__" ? null : v)
                        }
                        disabled={savingAssignment === svc.id}
                      >
                        <SelectTrigger className="h-8 w-56 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            None (no intake required)
                          </SelectItem>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                              {t.is_default ? " (default)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Field editor dialog */}
      {(editingField !== null || addingField) && editingField && (
        <FieldEditorDialog
          field={addingField ? null : editingField}
          onSave={handleFieldSave}
          onClose={closeFieldEditor}
        />
      )}

      {/* Suppress unused prop warning */}
      <span className="hidden">{divinerId}</span>
    </div>
  );
}
