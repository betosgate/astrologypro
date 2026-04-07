"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertCircle, Loader2, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ─────────────────────────────────────────────
// Preset options — canonical tag sets per spec
// ─────────────────────────────────────────────
const PRESET_OPTIONS = [
  {
    name: "Standard Banishing Ritual of the Pentagram",
    tags: [
      "Ritual_Opening",
      "Pentagram_Gate_Banishing_Ritual",
      "Pentagram_Banishing_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Standard Invocation Ritual of the Pentagram",
    tags: [
      "Ritual_Opening",
      "Pentagram_Gate_Invocation_Ritual",
      "Pentagram_Invocation_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Divine Infinite Being Invocation Ritual of the Pentagram",
    tags: [
      "Ritual_Opening",
      "DIB_Gate_Invocation_Ritual",
      "DIB_Invocation_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Planetary Zodiacal Invocation Ritual of the Pentagram",
    tags: null, // custom — opens configurator
  },
] as const;

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

type RitualMode = "invocation" | "banishing";

function buildCustomTags(
  mode: RitualMode,
  planets: string[],
  zodiacs: string[]
): string[] {
  const tags = new Set<string>(["Ritual_Opening"]);

  if (mode === "invocation") {
    for (const p of planets) {
      tags.add(`${p}_Gate_Invocation_Ritual`);
      tags.add(`${p}_Invocation_Ritual`);
    }
    for (const z of zodiacs) {
      tags.add(`${z}_Gate_Invocation_Ritual`);
      tags.add(`${z}_Invocation_Ritual`);
    }
  } else {
    // banishing — zodiac disabled per spec
    for (const p of planets) {
      tags.add(`${p}_Gate_Banishing_Ritual`);
      tags.add(`${p}_Banishing_Ritual`);
    }
  }

  tags.add("Ritual_Closing");
  return Array.from(tags);
}

type Step = "choose" | "custom";

type StepPreview = {
  matched_steps: number;
  total_tags: number;
  missing_tags: string[];
} | null;

export default function CreateRitualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // If ?type=planetary in URL, open configurator directly
  const [step, setStep] = useState<Step>(
    searchParams.get("type") === "planetary" ? "custom" : "choose"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom configurator state
  const [mode, setMode] = useState<RitualMode>("invocation");
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [selectedZodiacs, setSelectedZodiacs] = useState<string[]>([]);

  // Step preview state
  const [stepPreview, setStepPreview] = useState<StepPreview>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  function toggleItem(
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  // Fetch step preview whenever tags change in custom configurator
  useEffect(() => {
    if (step !== "custom") return;

    const tags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
    if (selectedPlanets.length === 0 && selectedZodiacs.length === 0) {
      setStepPreview(null);
      return;
    }

    const controller = new AbortController();
    setLoadingPreview(true);

    fetch(`/api/community/rituals/preview-steps?tags=${tags.join(",")}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setStepPreview(data);
        setLoadingPreview(false);
      })
      .catch(() => {
        setLoadingPreview(false);
      });

    return () => controller.abort();
  }, [step, mode, selectedPlanets, selectedZodiacs]);

  async function submitPreset(name: string, tags: string[]) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/community/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ritual_name: name, ritual_tags: tags }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create ritual");
      setSaving(false);
      return;
    }
    const { ritual } = await res.json();
    router.push(`/community/rituals/${ritual.id}`);
  }

  async function submitCustom() {
    setError(null);

    // Validation matching Angular rules
    if (mode === "banishing" && selectedPlanets.length === 0) {
      setError("Banishing ritual requires at least one planet.");
      return;
    }
    if (mode === "invocation" && selectedPlanets.length === 0 && selectedZodiacs.length === 0) {
      setError("Invocation ritual requires at least one planet or zodiac sign.");
      return;
    }

    const tags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
    const ritualName = "Planetary Zodiacal Invocation Ritual of the Pentagram";

    setSaving(true);
    const res = await fetch("/api/community/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ritual_name: ritualName, ritual_tags: tags }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create ritual");
      setSaving(false);
      return;
    }
    const { ritual } = await res.json();
    router.push(`/community/rituals/${ritual.id}`);
  }

  // ── Step: Choose preset or custom ──────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Link
            href="/community/rituals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← My Rituals
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Flame className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Create a Ritual</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Choose a preset ritual or configure a custom planetary invocation.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {PRESET_OPTIONS.map((option) => (
            <Card
              key={option.name}
              className="cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => {
                if (!saving) {
                  if (option.tags === null) {
                    router.push("/community/rituals/new?type=planetary");
                    setStep("custom");
                  } else {
                    submitPreset(option.name, [...option.tags]);
                  }
                }
              }}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{option.name}</p>
                  {option.tags ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {option.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {t.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure planets and zodiac signs
                    </p>
                  )}
                </div>
                {saving && option.tags !== null ? (
                  <Loader2 className="size-4 animate-spin shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Step: Custom configurator ───────────────────────────────────────────────
  const previewTags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
  const hasSelections = selectedPlanets.length > 0 || selectedZodiacs.length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            router.push("/community/rituals/new");
            setStep("choose");
            setError(null);
            setStepPreview(null);
          }}
        >
          ← Back to Ritual Options
        </button>
        <div className="flex items-center gap-2 mt-2">
          <Flame className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Configure Your Ritual</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Planetary Zodiacal Invocation / Banishing Ritual
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto shrink-0">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Mode selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ritual Mode</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {(["invocation", "banishing"] as RitualMode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => {
                setMode(m);
                if (m === "banishing") setSelectedZodiacs([]);
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Planets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planets</CardTitle>
          <CardDescription>Select one or more planets for your ritual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 sm:grid-cols-3">
            {PLANETS.map((planet) => (
              <div key={planet} className="flex items-center gap-2">
                <Checkbox
                  id={`planet-${planet}`}
                  checked={selectedPlanets.includes(planet)}
                  onCheckedChange={() => toggleItem(planet, selectedPlanets, setSelectedPlanets)}
                />
                <Label htmlFor={`planet-${planet}`} className="cursor-pointer text-sm">
                  {planet}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zodiac Signs — disabled in banishing mode */}
      <Card className={mode === "banishing" ? "opacity-40 pointer-events-none" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Zodiac Signs
            {mode === "banishing" && (
              <Badge variant="secondary" className="text-xs">Disabled in banishing mode</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {mode === "invocation"
              ? "Select zodiac signs to include in your invocation."
              : "Zodiac selection is disabled for banishing rituals."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 sm:grid-cols-3">
            {ZODIAC_SIGNS.map((sign) => (
              <div key={sign} className="flex items-center gap-2">
                <Checkbox
                  id={`zodiac-${sign}`}
                  checked={selectedZodiacs.includes(sign)}
                  disabled={mode === "banishing"}
                  onCheckedChange={() => toggleItem(sign, selectedZodiacs, setSelectedZodiacs)}
                />
                <Label
                  htmlFor={`zodiac-${sign}`}
                  className={`text-sm ${mode === "banishing" ? "cursor-default" : "cursor-pointer"}`}
                >
                  {sign}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview of generated tags + step readiness */}
      {hasSelections && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Preview — Ritual Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {previewTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0.5">
                  {tag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>

            {/* Step readiness indicator */}
            <div className="flex items-center gap-2 text-sm">
              {loadingPreview ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : stepPreview ? (
                stepPreview.matched_steps > 0 ? (
                  <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                )
              ) : null}
              {!loadingPreview && stepPreview && (
                <span className="text-xs text-muted-foreground">
                  {stepPreview.matched_steps > 0
                    ? `This ritual has ${stepPreview.matched_steps} step${stepPreview.matched_steps !== 1 ? "s" : ""} ready`
                    : "Ritual instructions are being prepared by your guide"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={submitCustom} disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Begin the Ritual
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            router.push("/community/rituals/new");
            setStep("choose");
            setError(null);
            setStepPreview(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
