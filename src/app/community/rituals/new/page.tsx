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
import {
  Flame,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Shield,
  Sparkles,
  Globe,
  Star,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ─────────────────────────────────────────────
// Preset options — canonical tag sets per spec
// ─────────────────────────────────────────────
const PRESET_OPTIONS = [
  {
    name: "Standard Banishing Ritual of the Pentagram",
    shortName: "Banishing",
    description: "Cleanse and purify your sacred space with the foundational pentagram banishing rite.",
    icon: Shield,
    iconColor: "text-blue-400",
    iconBg: "from-blue-900/40 to-blue-800/20",
    borderColor: "hover:border-blue-500/40 group-hover:ring-blue-500/20",
    tags: [
      "Ritual_Opening",
      "Pentagram_Gate_Banishing_Ritual",
      "Pentagram_Banishing_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Standard Invocation Ritual of the Pentagram",
    shortName: "Invocation",
    description: "Invoke higher energies and open the gates with the classic pentagram invocation.",
    icon: Sparkles,
    iconColor: "text-violet-400",
    iconBg: "from-violet-900/40 to-purple-800/20",
    borderColor: "hover:border-violet-500/40 group-hover:ring-violet-500/20",
    tags: [
      "Ritual_Opening",
      "Pentagram_Gate_Invocation_Ritual",
      "Pentagram_Invocation_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Divine Infinite Being Invocation Ritual of the Pentagram",
    shortName: "Divine Infinite Being",
    description: "Connect with the Divine Infinite Being through this sacred invocation ceremony.",
    icon: Globe,
    iconColor: "text-amber-400",
    iconBg: "from-amber-900/40 to-orange-800/20",
    borderColor: "hover:border-amber-500/40 group-hover:ring-amber-500/20",
    tags: [
      "Ritual_Opening",
      "DIB_Gate_Invocation_Ritual",
      "DIB_Invocation_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    name: "Planetary Zodiacal Invocation Ritual of the Pentagram",
    shortName: "Planetary Zodiacal",
    description: "Advanced configurator — choose specific planets and zodiac signs for your ritual.",
    icon: Star,
    iconColor: "text-cyan-400",
    iconBg: "from-cyan-900/40 to-sky-800/20",
    borderColor: "hover:border-cyan-500/40 group-hover:ring-cyan-500/20",
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
  const [savingPreset, setSavingPreset] = useState<string | null>(null);
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
    setSavingPreset(name);
    setError(null);
    const res = await fetch("/api/community/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ritual_name: name, ritual_tags: tags }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create ritual");
      setSavingPreset(null);
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

  // ── Step: Choose preset — 2x2 grid with icons ─────────────────────────────
  if (step === "choose") {
    return (
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <Link
            href="/community/rituals"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← My Rituals
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 ring-1 ring-amber-500/20">
              <Flame className="size-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create a Ritual</h1>
              <p className="text-sm text-muted-foreground">
                Choose a preset or configure a custom planetary invocation.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 2x2 preset grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRESET_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isLoading = savingPreset === option.name;

            return (
              <button
                key={option.name}
                type="button"
                disabled={savingPreset !== null}
                onClick={() => {
                  if (savingPreset !== null) return;
                  if (option.tags === null) {
                    router.push("/community/rituals/new?type=planetary");
                    setStep("custom");
                  } else {
                    submitPreset(option.name, [...option.tags]);
                  }
                }}
                className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 text-left transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${option.borderColor}`}
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.06),transparent_60%)]" />

                <div className="relative space-y-3">
                  {/* Icon + tag count badge row */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${option.iconBg} ring-1 ring-white/5 shadow-inner`}
                    >
                      <Icon className={`size-5 ${option.iconColor}`} />
                    </div>
                    {/* Tag count badge */}
                    {option.tags ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 shrink-0 text-muted-foreground border-border/40"
                      >
                        {option.tags.length} tags
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 shrink-0 text-cyan-400 border-cyan-500/30 bg-cyan-950/20"
                      >
                        Custom
                      </Badge>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <p className="font-semibold text-sm leading-snug">{option.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {option.description}
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground/60">
                      {option.tags ? "Click to start" : "Configure first"}
                    </span>
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step: Custom configurator ───────────────────────────────────────────────
  const previewTags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
  const hasSelections = selectedPlanets.length > 0 || selectedZodiacs.length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            router.push("/community/rituals/new");
            setStep("choose");
            setError(null);
            setStepPreview(null);
          }}
        >
          ← Back to Ritual Options
        </button>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/20 ring-1 ring-cyan-500/20">
            <Star className="size-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configure Your Ritual</h1>
            <p className="text-sm text-muted-foreground">
              Planetary Zodiacal Invocation / Banishing Ritual
            </p>
          </div>
        </div>
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

      {/* Mode selector — prominent toggle */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ritual Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex rounded-xl border border-border/60 bg-muted/20 p-1 gap-1">
            {(["invocation", "banishing"] as RitualMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === "banishing") setSelectedZodiacs([]);
                }}
                className={`flex-1 rounded-lg py-2 px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === m
                    ? m === "invocation"
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Planets — chip style */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planets</CardTitle>
          <CardDescription>Select one or more planets for your ritual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PLANETS.map((planet) => {
              const selected = selectedPlanets.includes(planet);
              return (
                <button
                  key={planet}
                  type="button"
                  onClick={() => toggleItem(planet, selectedPlanets, setSelectedPlanets)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    className="pointer-events-none size-3.5"
                    tabIndex={-1}
                    aria-hidden
                  />
                  {planet}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Zodiac Signs — chip style, disabled in banishing mode */}
      <Card
        className={`border-border/60 transition-opacity ${
          mode === "banishing" ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Zodiac Signs</CardTitle>
            {mode === "banishing" && (
              <Badge variant="secondary" className="text-[10px]">
                Disabled in banishing mode
              </Badge>
            )}
          </div>
          <CardDescription>
            {mode === "invocation"
              ? "Select zodiac signs to include in your invocation."
              : "Zodiac selection is not available for banishing rituals."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ZODIAC_SIGNS.map((sign) => {
              const selected = selectedZodiacs.includes(sign);
              return (
                <button
                  key={sign}
                  type="button"
                  disabled={mode === "banishing"}
                  onClick={() => toggleItem(sign, selectedZodiacs, setSelectedZodiacs)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    className="pointer-events-none size-3.5"
                    tabIndex={-1}
                    aria-hidden
                  />
                  {sign}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview of generated tags + step readiness */}
      {hasSelections && (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Preview — Ritual Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {previewTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0.5 border-amber-500/20 bg-amber-500/5 text-amber-300/80"
                >
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

      <div className="flex gap-3 pt-2">
        <Button
          onClick={submitCustom}
          disabled={saving}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-md"
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          <Flame className="mr-2 size-4" />
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
