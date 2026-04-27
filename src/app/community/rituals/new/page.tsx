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

const PRESET_OPTIONS = [
  {
    name: "Standard Banishing Ritual of the Pentagram",
    shortName: "Banishing",
    description:
      "Cleanse and purify your sacred space with the foundational pentagram banishing rite.",
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
    description:
      "Invoke higher energies and open the gates with the classic pentagram invocation.",
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
    description:
      "Connect with the Divine Infinite Being through this sacred invocation ceremony.",
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
    description:
      "Advanced configurator - choose specific planets and zodiac signs for your ritual.",
    icon: Star,
    iconColor: "text-cyan-400",
    iconBg: "from-cyan-900/40 to-sky-800/20",
    borderColor: "hover:border-cyan-500/40 group-hover:ring-cyan-500/20",
    tags: null,
  },
] as const;

const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

type RitualMode = "invocation" | "banishing";
type Step = "choose" | "custom";
type Element = "Fire" | "Water" | "Air" | "Earth" | "Spirit";
type EntityKind = "inner-planet" | "outer-planet";
type Modality = "Cardinal" | "Fixed" | "Mutable";

type StepPreview = {
  matched_steps: number;
  total_tags: number;
  missing_tags: string[];
} | null;

const ELEMENT_PRIORITY: Element[] = [
  "Fire",
  "Water",
  "Air",
  "Earth",
  "Spirit",
];

const MODALITY_PRIORITY: Modality[] = ["Cardinal", "Fixed", "Mutable"];

const PLANET_METADATA: Record<string, { element: Element; kind: EntityKind }> = {
  Mars: { element: "Fire", kind: "inner-planet" },
  Jupiter: { element: "Fire", kind: "outer-planet" },
  Moon: { element: "Water", kind: "inner-planet" },
  Neptune: { element: "Water", kind: "outer-planet" },
  Mercury: { element: "Air", kind: "inner-planet" },
  Uranus: { element: "Air", kind: "outer-planet" },
  Venus: { element: "Earth", kind: "inner-planet" },
  Saturn: { element: "Earth", kind: "outer-planet" },
  Sun: { element: "Spirit", kind: "inner-planet" },
  Pluto: { element: "Spirit", kind: "outer-planet" },
};

const ZODIAC_METADATA: Record<string, { element: Element; modality: Modality }> = {
  Aries: { element: "Fire", modality: "Cardinal" },
  Leo: { element: "Fire", modality: "Fixed" },
  Sagittarius: { element: "Fire", modality: "Mutable" },
  Cancer: { element: "Water", modality: "Cardinal" },
  Scorpio: { element: "Water", modality: "Fixed" },
  Pisces: { element: "Water", modality: "Mutable" },
  Libra: { element: "Air", modality: "Cardinal" },
  Aquarius: { element: "Air", modality: "Fixed" },
  Gemini: { element: "Air", modality: "Mutable" },
  Capricorn: { element: "Earth", modality: "Cardinal" },
  Taurus: { element: "Earth", modality: "Fixed" },
  Virgo: { element: "Earth", modality: "Mutable" },
};

function sortPlanetsByPriority(planets: string[]): string[] {
  return [...planets].sort((left, right) => {
    const leftMeta = PLANET_METADATA[left];
    const rightMeta = PLANET_METADATA[right];

    const elementDiff =
      ELEMENT_PRIORITY.indexOf(leftMeta.element) -
      ELEMENT_PRIORITY.indexOf(rightMeta.element);
    if (elementDiff !== 0) return elementDiff;

    if (leftMeta.kind === rightMeta.kind) return left.localeCompare(right);
    return leftMeta.kind === "inner-planet" ? -1 : 1;
  });
}

function sortZodiacsByPriority(zodiacs: string[]): string[] {
  return [...zodiacs].sort((left, right) => {
    const leftMeta = ZODIAC_METADATA[left];
    const rightMeta = ZODIAC_METADATA[right];

    const elementDiff =
      ELEMENT_PRIORITY.indexOf(leftMeta.element) -
      ELEMENT_PRIORITY.indexOf(rightMeta.element);
    if (elementDiff !== 0) return elementDiff;

    const modalityDiff =
      MODALITY_PRIORITY.indexOf(leftMeta.modality) -
      MODALITY_PRIORITY.indexOf(rightMeta.modality);
    if (modalityDiff !== 0) return modalityDiff;

    return left.localeCompare(right);
  });
}

function buildCustomTags(
  mode: RitualMode,
  planets: string[],
  zodiacs: string[]
): string[] {
  const tags: string[] = ["Ritual_Opening"];
  const sortedPlanets = sortPlanetsByPriority(planets);
  const sortedZodiacs = sortZodiacsByPriority(zodiacs);
  const activeElements = new Set<Element>();

  for (const planet of sortedPlanets) {
    activeElements.add(PLANET_METADATA[planet].element);
  }

  if (mode === "invocation") {
    for (const zodiac of sortedZodiacs) {
      activeElements.add(ZODIAC_METADATA[zodiac].element);
    }
  }

  const orderedElements = ELEMENT_PRIORITY.filter((element) =>
    activeElements.has(element)
  );

  if (mode === "invocation") {
    for (const element of orderedElements) {
      tags.push(`${element}_Gate_Invocation_Ritual`);

      for (const planet of sortedPlanets) {
        if (PLANET_METADATA[planet].element === element) {
          tags.push(`${planet}_Invocation_Ritual`);
        }
      }

      for (const zodiac of sortedZodiacs) {
        if (ZODIAC_METADATA[zodiac].element === element) {
          tags.push(`${zodiac}_Invocation_Ritual`);
        }
      }
    }
  } else {
    for (const element of orderedElements) {
      tags.push(`${element}_Gate_Banishing_Ritual`);
    }
  }

  tags.push("Ritual_Closing");
  return [...new Set(tags)];
}

export default function CreateRitualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(
    searchParams.get("type") === "planetary" ? "custom" : "choose"
  );
  const [saving, setSaving] = useState(false);
  const [savingPreset, setSavingPreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RitualMode>("invocation");
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [selectedZodiacs, setSelectedZodiacs] = useState<string[]>([]);
  const [stepPreview, setStepPreview] = useState<StepPreview>(null);

  function toggleItem(
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((previous) =>
      previous.includes(item)
        ? previous.filter((value) => value !== item)
        : [...previous, item]
    );
  }

  useEffect(() => {
    if (step !== "custom") return;

    if (selectedPlanets.length === 0 && selectedZodiacs.length === 0) {
      return;
    }

    const tags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
    const controller = new AbortController();

    fetch(`/api/community/rituals/preview-steps?tags=${tags.join(",")}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data) setStepPreview(data);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [step, mode, selectedPlanets, selectedZodiacs]);

  async function submitPreset(name: string, tags: string[]) {
    setSavingPreset(name);
    setError(null);

    const response = await fetch("/api/community/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ritual_name: name, ritual_tags: tags }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to create ritual");
      setSavingPreset(null);
      return;
    }

    const { ritual } = await response.json();
    router.push(`/community/rituals/${ritual.id}`);
  }

  async function submitCustom() {
    setError(null);

    if (mode === "banishing" && selectedPlanets.length === 0) {
      setError("Banishing ritual requires at least one planet.");
      return;
    }

    if (
      mode === "invocation" &&
      selectedPlanets.length === 0 &&
      selectedZodiacs.length === 0
    ) {
      setError("Invocation ritual requires at least one planet or zodiac sign.");
      return;
    }

    const tags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
    const ritualName = "Planetary Zodiacal Invocation Ritual of the Pentagram";

    setSaving(true);
    const response = await fetch("/api/community/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ritual_name: ritualName, ritual_tags: tags }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to create ritual");
      setSaving(false);
      return;
    }

    const { ritual } = await response.json();
    router.push(`/community/rituals/${ritual.id}`);
  }

  if (step === "choose") {
    return (
      <div className="max-w-2xl space-y-8">
        <div>
          <Link
            href="/community/rituals"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            My Rituals
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 ring-1 ring-amber-500/20">
              <Flame className="size-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Create a Ritual
              </h1>
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
                    return;
                  }

                  void submitPreset(option.name, [...option.tags]);
                }}
                className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 text-left transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${option.borderColor}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.06),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${option.iconBg} ring-1 ring-white/5 shadow-inner`}
                    >
                      <Icon className={`size-5 ${option.iconColor}`} />
                    </div>
                    {option.tags ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {option.tags.length} tags
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-cyan-500/30 bg-cyan-950/20 px-1.5 py-0.5 text-[10px] text-cyan-400"
                      >
                        Custom
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold leading-snug">
                      {option.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

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

  const previewTags = buildCustomTags(mode, selectedPlanets, selectedZodiacs);
  const hasSelections =
    selectedPlanets.length > 0 || selectedZodiacs.length > 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            router.push("/community/rituals/new");
            setStep("choose");
            setError(null);
            setStepPreview(null);
          }}
        >
          Back to Ritual Options
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/20 ring-1 ring-cyan-500/20">
            <Star className="size-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Configure Your Ritual
            </h1>
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
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ritual Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
            {(["invocation", "banishing"] as RitualMode[]).map((ritualMode) => (
              <button
                key={ritualMode}
                type="button"
                onClick={() => {
                  setMode(ritualMode);
                  if (ritualMode === "banishing") setSelectedZodiacs([]);
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === ritualMode
                    ? ritualMode === "invocation"
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ritualMode.charAt(0).toUpperCase() + ritualMode.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planets</CardTitle>
          <CardDescription>
            Select one or more planets for your ritual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PLANETS.map((planet) => {
              const selected = selectedPlanets.includes(planet);
              return (
                <button
                  key={planet}
                  type="button"
                  onClick={() =>
                    toggleItem(planet, selectedPlanets, setSelectedPlanets)
                  }
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

      <Card
        className={`border-border/60 transition-opacity ${
          mode === "banishing" ? "pointer-events-none opacity-40" : ""
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
                  onClick={() =>
                    toggleItem(sign, selectedZodiacs, setSelectedZodiacs)
                  }
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

      {hasSelections && (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Preview - Ritual Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {previewTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 text-[10px] text-amber-300/80"
                >
                  {tag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {stepPreview ? (
                stepPreview.matched_steps > 0 ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                ) : (
                  <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                )
              ) : null}

              {stepPreview && (
                <span className="text-xs text-muted-foreground">
                  {stepPreview.matched_steps > 0
                    ? `This ritual has ${stepPreview.matched_steps} step${
                        stepPreview.matched_steps !== 1 ? "s" : ""
                      } ready`
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
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-500 hover:to-orange-500"
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
