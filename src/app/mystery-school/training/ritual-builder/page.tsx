"use client";

/**
 * Post-Graduation Ritual Builder
 * /mystery-school/training/ritual-builder
 *
 * Protected: requires post_grad_access (graduated_at IS NOT NULL).
 * Non-graduated students see a locked teaser.
 *
 * Features:
 * - Component library (left panel) — categories of ritual building blocks
 * - Ritual canvas (main area) — ordered list with up/down reordering
 * - Save form — name, tags, notes, ritual type, share toggle
 * - Personal library tab — list saved rituals, load or delete
 *
 * No drag-and-drop library. Uses up/down arrow buttons for ordering.
 * No extra dependencies beyond what is already in the project.
 */

import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Layers,
  Lock,
  Save,
  BookOpen,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const DECAN_NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1);

const RITUAL_TYPES = [
  { value: "free_form", label: "Free Form" },
  { value: "personal_transit", label: "Personal Transit" },
  { value: "seasonal", label: "Seasonal" },
  { value: "decan_custom", label: "Decan Custom" },
] as const;

type RitualType = (typeof RITUAL_TYPES)[number]["value"];

// ─── Types ────────────────────────────────────────────────────────────────────

type ComponentType =
  | "grand_invocation"
  | "opening_gates"
  | "planetary_invocation"
  | "sign_invocation"
  | "decan_invocation"
  | "closing_ceremony"
  | "custom_step";

interface RitualComponent {
  id: string;
  type: ComponentType;
  planet?: string;
  sign?: string;
  decan?: number;
  content?: string; // for custom_step
  order: number;
}

interface SavedRitual {
  id: string;
  name: string;
  ritual_type: RitualType;
  tags: string[];
  components: RitualComponent[];
  notes: string | null;
  is_shared_with_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface SaveForm {
  name: string;
  ritual_type: RitualType;
  tags: string;
  notes: string;
  is_shared_with_admin: boolean;
}

// ─── Component library helpers ────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function componentLabel(c: RitualComponent): string {
  switch (c.type) {
    case "grand_invocation":
      return "Grand Invocation";
    case "opening_gates":
      return `Opening of the Gates${c.planet ? ` — ${c.planet}` : ""}${c.sign ? ` in ${c.sign}` : ""}`;
    case "planetary_invocation":
      return `Planetary Invocation — ${c.planet ?? ""}`;
    case "sign_invocation":
      return `Sign Invocation — ${c.sign ?? ""}`;
    case "decan_invocation":
      return `Decan ${c.decan ?? ""} Invocation`;
    case "closing_ceremony":
      return "Closing Ceremony";
    case "custom_step":
      return `Custom Step${c.content ? `: ${c.content.slice(0, 40)}${c.content.length > 40 ? "…" : ""}` : ""}`;
  }
}

// ─── AddComponentPanel ────────────────────────────────────────────────────────

interface AddComponentPanelProps {
  onAdd: (c: RitualComponent) => void;
}

function AddComponentPanel({ onAdd }: AddComponentPanelProps) {
  const formId = useId();
  const [planet, setPlanet] = useState(PLANETS[0]);
  const [sign, setSign] = useState(SIGNS[0]);
  const [decan, setDecan] = useState(1);
  const [customText, setCustomText] = useState("");
  const [openingPlanet, setOpeningPlanet] = useState(PLANETS[0]);
  const [openingSign, setOpeningSign] = useState(SIGNS[0]);

  function add(type: ComponentType, overrides?: Partial<RitualComponent>) {
    onAdd({
      id: makeId(),
      type,
      order: 0, // caller reassigns
      ...overrides,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Component Library
      </p>

      {/* Fixed components */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => add("grand_invocation")}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Grand Invocation
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => add("closing_ceremony")}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Closing Ceremony
        </Button>
      </div>

      {/* Opening of the Gates */}
      <div className="rounded-md border border-border p-3 space-y-2">
        <p className="text-xs font-medium">Opening of the Gates</p>
        <div className="flex gap-2">
          <Select value={openingPlanet} onValueChange={setOpeningPlanet}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANETS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={openingSign} onValueChange={setOpeningSign}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGNS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() =>
            add("opening_gates", {
              planet: openingPlanet,
              sign: openingSign,
            })
          }
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Add Opening
        </Button>
      </div>

      {/* Planetary Invocation */}
      <div className="rounded-md border border-border p-3 space-y-2">
        <p className="text-xs font-medium">Planetary Invocation</p>
        <Select value={planet} onValueChange={setPlanet}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLANETS.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => add("planetary_invocation", { planet })}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Add Planetary
        </Button>
      </div>

      {/* Sign Invocation */}
      <div className="rounded-md border border-border p-3 space-y-2">
        <p className="text-xs font-medium">Sign Invocation</p>
        <Select value={sign} onValueChange={setSign}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGNS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => add("sign_invocation", { sign })}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Add Sign
        </Button>
      </div>

      {/* Decan Invocation */}
      <div className="rounded-md border border-border p-3 space-y-2">
        <p className="text-xs font-medium">Decan Invocation</p>
        <Select
          value={String(decan)}
          onValueChange={(v) => setDecan(Number(v))}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DECAN_NUMBERS.map((d) => (
              <SelectItem key={d} value={String(d)} className="text-xs">
                Decan {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => add("decan_invocation", { decan })}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Add Decan
        </Button>
      </div>

      {/* Custom Free-Text Step */}
      <div className="rounded-md border border-border p-3 space-y-2" id={formId}>
        <p className="text-xs font-medium">Custom Step</p>
        <Textarea
          placeholder="Describe this ritual step…"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="min-h-[60px] text-xs resize-none"
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          disabled={!customText.trim()}
          onClick={() => {
            add("custom_step", { content: customText.trim() });
            setCustomText("");
          }}
        >
          <Plus className="size-3.5 mr-2 shrink-0" />
          Add Custom Step
        </Button>
      </div>
    </div>
  );
}

// ─── RitualCanvas ─────────────────────────────────────────────────────────────

function RitualCanvas({
  components,
  onMove,
  onRemove,
}: {
  components: RitualComponent[];
  onMove: (id: string, direction: "up" | "down") => void;
  onRemove: (id: string) => void;
}) {
  if (components.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <Layers className="mx-auto mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Add components from the panel to build your ritual.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="font-medium">Ritual Steps</span>
        <span>{components.length} step{components.length !== 1 ? "s" : ""}</span>
      </div>
      {components.map((c, idx) => (
        <div
          key={c.id}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5"
        >
          <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-right">
            {idx + 1}
          </span>
          <span className="flex-1 min-w-0 text-sm truncate">
            {componentLabel(c)}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={idx === 0}
              onClick={() => onMove(c.id, "up")}
              aria-label="Move up"
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={idx === components.length - 1}
              onClick={() => onMove(c.id, "down")}
              aria-label="Move down"
            >
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(c.id)}
              aria-label="Remove step"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SavePanel ────────────────────────────────────────────────────────────────

function SavePanel({
  form,
  onChange,
  onSave,
  saving,
  canSave,
}: {
  form: SaveForm;
  onChange: (f: Partial<SaveForm>) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Save Ritual
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">
            Ritual Name <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="My Ritual"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Ritual Type</label>
          <Select
            value={form.ritual_type}
            onValueChange={(v) => onChange({ ritual_type: v as RitualType })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RITUAL_TYPES.map((rt) => (
                <SelectItem key={rt.value} value={rt.value} className="text-sm">
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">
            Tags <span className="text-muted-foreground">(comma-separated)</span>
          </label>
          <Input
            placeholder="e.g. mars, aries, morning"
            value={form.tags}
            onChange={(e) => onChange({ tags: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Notes</label>
          <Textarea
            placeholder="Personal notes about this ritual…"
            value={form.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="min-h-[70px] text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="share-admin"
            checked={form.is_shared_with_admin}
            onChange={(e) => onChange({ is_shared_with_admin: e.target.checked })}
            className="size-4 accent-primary"
          />
          <label htmlFor="share-admin" className="text-xs cursor-pointer">
            Share with admin for review
          </label>
        </div>

        <Button
          onClick={onSave}
          disabled={!canSave || saving}
          className="w-full"
          size="sm"
        >
          <Save className="size-3.5 mr-2" />
          {saving ? "Saving…" : "Save Ritual"}
        </Button>
      </div>
    </div>
  );
}

// ─── LibraryPanel ─────────────────────────────────────────────────────────────

function LibraryPanel({
  rituals,
  loading,
  onLoad,
  onDelete,
  deleting,
}: {
  rituals: SavedRitual[];
  loading: boolean;
  onLoad: (r: SavedRitual) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (rituals.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="mx-auto mb-2 size-7 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No saved rituals yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rituals.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{r.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px] py-0">
                {RITUAL_TYPES.find((t) => t.value === r.ritual_type)?.label ?? r.ritual_type}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {r.components.length} step{r.components.length !== 1 ? "s" : ""}
              </span>
              {r.is_shared_with_admin && (
                <Badge variant="outline" className="text-[10px] py-0">
                  Shared
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onLoad(r)}
            >
              Load
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              disabled={deleting === r.id}
              onClick={() => onDelete(r.id)}
              aria-label="Delete ritual"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type CanvasAction =
  | { type: "add"; component: RitualComponent }
  | { type: "move"; id: string; direction: "up" | "down" }
  | { type: "remove"; id: string }
  | { type: "load"; components: RitualComponent[] }
  | { type: "clear" };

function canvasReducer(
  state: RitualComponent[],
  action: CanvasAction
): RitualComponent[] {
  switch (action.type) {
    case "add": {
      const next = [...state, { ...action.component, order: state.length }];
      return next.map((c, i) => ({ ...c, order: i }));
    }
    case "move": {
      const idx = state.findIndex((c) => c.id === action.id);
      if (idx < 0) return state;
      const next = [...state];
      const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return state;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((c, i) => ({ ...c, order: i }));
    }
    case "remove": {
      const next = state.filter((c) => c.id !== action.id);
      return next.map((c, i) => ({ ...c, order: i }));
    }
    case "load":
      return action.components.map((c, i) => ({ ...c, order: i }));
    case "clear":
      return [];
    default:
      return state;
  }
}

export default function RitualBuilderPage() {
  const [components, dispatch] = useReducer(canvasReducer, []);
  const [activeTab, setActiveTab] = useState<"builder" | "library">("builder");
  const [form, setForm] = useState<SaveForm>({
    name: "",
    ritual_type: "free_form",
    tags: "",
    notes: "",
    is_shared_with_admin: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rituals, setRituals] = useState<SavedRitual[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Post-grad access check — resolved via API on mount
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // ── Access check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetch("/api/mystery-school/ritual-builder")
      .then(async (res) => {
        if (res.status === 403) {
          setHasAccess(false);
        } else if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setCheckError((j as { error?: string }).error ?? "Failed to load");
          setHasAccess(false);
        } else {
          const j: { rituals: SavedRitual[] } = await res.json();
          setRituals(j.rituals ?? []);
          setHasAccess(true);
        }
        setAccessChecked(true);
      })
      .catch((e) => {
        setCheckError(e.message ?? "Network error");
        setHasAccess(false);
        setAccessChecked(true);
      });
  }, []);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    const res = await fetch("/api/mystery-school/ritual-builder");
    if (res.ok) {
      const j: { rituals: SavedRitual[] } = await res.json();
      setRituals(j.rituals ?? []);
    }
    setLibraryLoading(false);
  }, []);

  // ── Canvas actions ──────────────────────────────────────────────────────────
  function handleAdd(c: RitualComponent) {
    dispatch({ type: "add", component: c });
  }

  function handleMove(id: string, direction: "up" | "down") {
    dispatch({ type: "move", id, direction });
  }

  function handleRemove(id: string) {
    dispatch({ type: "remove", id });
  }

  function handleLoad(r: SavedRitual) {
    dispatch({ type: "load", components: r.components });
    setForm({
      name: r.name,
      ritual_type: r.ritual_type,
      tags: r.tags.join(", "),
      notes: r.notes ?? "",
      is_shared_with_admin: r.is_shared_with_admin,
    });
    setEditingId(r.id);
    setSaveSuccess(false);
    setSaveError(null);
    setActiveTab("builder");
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || components.length === 0) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      name: form.name.trim(),
      ritual_type: form.ritual_type,
      tags,
      components,
      notes: form.notes.trim() || null,
      is_shared_with_admin: form.is_shared_with_admin,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/mystery-school/ritual-builder/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/mystery-school/ritual-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveError((j as { error?: string }).error ?? "Save failed");
      } else {
        setSaveSuccess(true);
        if (!editingId) {
          // Clear canvas for new ritual after save
          dispatch({ type: "clear" });
          setForm({
            name: "",
            ritual_type: "free_form",
            tags: "",
            notes: "",
            is_shared_with_admin: false,
          });
          setEditingId(null);
        }
        await loadLibrary();
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/mystery-school/ritual-builder/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRituals((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) {
        setEditingId(null);
        dispatch({ type: "clear" });
        setForm({
          name: "",
          ritual_type: "free_form",
          tags: "",
          notes: "",
          is_shared_with_admin: false,
        });
      }
    }
    setDeleting(null);
  }

  // ── Loading / access gate ───────────────────────────────────────────────────
  if (!accessChecked) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (checkError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-destructive">{checkError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Ritual Builder</h1>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <h2 className="mb-2 text-lg font-semibold">
              Post-Graduation Access Only
            </h2>
            <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
              The Ritual Builder unlocks when you graduate from the Mystery
              School — after completing all 36 decans and your full foundation
              work.
            </p>
            <Button asChild variant="outline">
              <Link href="/mystery-school/training/graduation">
                View Graduation Progress
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Full builder UI ─────────────────────────────────────────────────────────
  const canSave = form.name.trim().length > 0 && components.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Ritual Builder</h1>
        </div>
        <p className="text-muted-foreground">
          Design and save personal rituals from your post-graduation component
          library.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setActiveTab("builder")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "builder"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Builder
        </button>
        <button
          onClick={() => {
            setActiveTab("library");
            loadLibrary();
          }}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "library"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Library
          {rituals.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({rituals.length})
            </span>
          )}
        </button>
      </div>

      {activeTab === "builder" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_220px]">
          {/* Left: Component Library */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <AddComponentPanel onAdd={handleAdd} />
            </CardContent>
          </Card>

          {/* Center: Ritual Canvas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editingId ? `Editing: ${form.name || "Unnamed"}` : "New Ritual"}
                </CardTitle>
                {components.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground h-7"
                    onClick={() => {
                      dispatch({ type: "clear" });
                      setEditingId(null);
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <RitualCanvas
                components={components}
                onMove={handleMove}
                onRemove={handleRemove}
              />
            </CardContent>
          </Card>

          {/* Right: Save Panel */}
          <Card>
            <CardContent className="pt-4 pb-4 space-y-4">
              <SavePanel
                form={form}
                onChange={(f) => setForm((prev) => ({ ...prev, ...f }))}
                onSave={handleSave}
                saving={saving}
                canSave={canSave}
              />

              {saveSuccess && (
                <p className="text-xs text-green-600 font-medium">
                  Ritual saved successfully.
                </p>
              )}
              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "library" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Ritual Library</CardTitle>
          </CardHeader>
          <CardContent>
            <LibraryPanel
              rituals={rituals}
              loading={libraryLoading}
              onLoad={handleLoad}
              onDelete={handleDelete}
              deleting={deleting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
