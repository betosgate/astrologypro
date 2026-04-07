"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Preset definitions ───────────────────────────────────────────────────────

type PresetId =
  | "banishing_pentagram"
  | "invocation_pentagram"
  | "dib_invocation_pentagram"
  | "planetary_zodiacal";

interface Preset {
  id: PresetId;
  label: string;
  description: string;
  tags?: string[];
}

const PRESETS: Preset[] = [
  {
    id: "banishing_pentagram",
    label: "Standard Banishing Ritual of the Pentagram",
    description: "The classic Lesser Banishing Ritual for clearing and purifying sacred space.",
    tags: ["Ritual_Opening", "Standard_Banishing_Ritual", "Ritual_Closing"],
  },
  {
    id: "invocation_pentagram",
    label: "Standard Invocation Ritual of the Pentagram",
    description: "Invokes elemental forces through the pentagrams for attunement and blessing.",
    tags: ["Ritual_Opening", "Standard_Invocation_Ritual", "Ritual_Closing"],
  },
  {
    id: "dib_invocation_pentagram",
    label: "Divine Infinite Being Invocation Ritual of the Pentagram",
    description: "The DIB-specific invocation ritual for connecting with the higher self.",
    tags: [
      "Ritual_Opening",
      "DIB_Invocation_Ritual",
      "Ritual_Closing",
    ],
  },
  {
    id: "planetary_zodiacal",
    label: "Planetary Zodiacal Invocation Ritual of the Pentagram",
    description: "Build a custom planetary and zodiacal invocation based on your chosen configurations.",
  },
];

// ─── Planetary Zodiacal Configurator constants ────────────────────────────────

type RitualMode = "Invocation" | "Banishing";

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

const ZODIACS = [
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

function buildPlanetaryTags(
  mode: RitualMode,
  planets: string[],
  zodiacs: string[]
): string[] {
  const tags: string[] = ["Ritual_Opening"];

  for (const planet of planets) {
    tags.push(`${planet}_Gate_${mode}_Ritual`);
    tags.push(`${planet}_${mode}_Ritual`);
  }

  if (mode === "Invocation") {
    for (const zodiac of zodiacs) {
      tags.push(`${zodiac}_Gate_Invocation_Ritual`);
      tags.push(`${zodiac}_Invocation_Ritual`);
    }
  }

  tags.push("Ritual_Closing");

  // Deduplicate while preserving order
  return [...new Set(tags)];
}

function buildRitualName(mode: RitualMode, planets: string[], zodiacs: string[]): string {
  const parts: string[] = [];
  if (planets.length > 0) parts.push(planets.join(", "));
  if (zodiacs.length > 0 && mode === "Invocation") parts.push(zodiacs.join(", "));
  const subject = parts.length > 0 ? `${parts.join(" / ")} ` : "";
  return `Planetary Zodiacal ${subject}${mode} Ritual`;
}

// ─── Toggle button used for planets and zodiacs ───────────────────────────────

function ToggleChip({
  label,
  selected,
  disabled,
  onToggle,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-muted",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewRitualPage() {
  const router = useRouter();

  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planetary configurator state
  const [mode, setMode] = useState<RitualMode>("Invocation");
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [selectedZodiacs, setSelectedZodiacs] = useState<string[]>([]);

  function togglePlanet(planet: string) {
    setSelectedPlanets((prev) =>
      prev.includes(planet) ? prev.filter((p) => p !== planet) : [...prev, planet]
    );
  }

  function toggleZodiac(zodiac: string) {
    setSelectedZodiacs((prev) =>
      prev.includes(zodiac) ? prev.filter((z) => z !== zodiac) : [...prev, zodiac]
    );
  }

  function handleModeChange(newMode: RitualMode) {
    setMode(newMode);
    if (newMode === "Banishing") {
      setSelectedZodiacs([]);
    }
  }

  function validate(): { valid: boolean; message?: string } {
    if (!selectedPreset) {
      return { valid: false, message: "Please select a ritual type." };
    }

    if (selectedPreset === "planetary_zodiacal") {
      if (mode === "Banishing" && selectedPlanets.length === 0) {
        return {
          valid: false,
          message: "Banishing mode requires at least one planet.",
        };
      }
      if (
        mode === "Invocation" &&
        selectedPlanets.length === 0 &&
        selectedZodiacs.length === 0
      ) {
        return {
          valid: false,
          message: "Invocation mode requires at least one planet or zodiac sign.",
        };
      }
    }

    return { valid: true };
  }

  async function handleSubmit() {
    const validation = validate();
    if (!validation.valid) {
      setError(validation.message ?? "Invalid selection.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let ritual_name: string;
      let ritual_tags: string[];

      if (selectedPreset === "planetary_zodiacal") {
        ritual_tags = buildPlanetaryTags(mode, selectedPlanets, selectedZodiacs);
        ritual_name = buildRitualName(mode, selectedPlanets, selectedZodiacs);
      } else {
        const preset = PRESETS.find((p) => p.id === selectedPreset)!;
        ritual_name = preset.label;
        ritual_tags = preset.tags!;
      }

      const res = await fetch("/api/rituals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritual_name, ritual_tags }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Failed to create ritual.");
        return;
      }

      const json = await res.json();
      router.push(`/dashboard/rituals/${json.id}/playback`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const previewTags =
    selectedPreset === "planetary_zodiacal"
      ? buildPlanetaryTags(mode, selectedPlanets, selectedZodiacs)
      : selectedPreset
      ? (PRESETS.find((p) => p.id === selectedPreset)?.tags ?? [])
      : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/rituals">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Ritual</h1>
            <p className="text-sm text-muted-foreground">
              Choose a ritual type to begin
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Ritual</CardTitle>
          <CardDescription>
            Select a preset or build a custom planetary configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPreset(preset.id)}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedPreset === preset.id
                  ? "border-primary bg-primary/5"
                  : "border-input bg-background hover:bg-muted"
              )}
              aria-pressed={selectedPreset === preset.id}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selectedPreset === preset.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedPreset === preset.id && (
                    <div className="size-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-snug">{preset.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Section 2: Planetary Zodiacal Configurator (shown when option 4 selected) */}
      {selectedPreset === "planetary_zodiacal" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Ritual</CardTitle>
            <CardDescription>
              Select mode, planets, and zodiac signs to build your custom ritual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode toggle */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Mode</p>
              <div className="flex gap-2">
                {(["Invocation", "Banishing"] as RitualMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    aria-pressed={mode === m}
                    className={cn(
                      "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      mode === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Planet multi-select */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Planets{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (select one or more)
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {PLANETS.map((planet) => (
                  <ToggleChip
                    key={planet}
                    label={planet}
                    selected={selectedPlanets.includes(planet)}
                    onToggle={() => togglePlanet(planet)}
                  />
                ))}
              </div>
            </div>

            {/* Zodiac multi-select */}
            <div className="space-y-2">
              <p
                className={cn(
                  "text-sm font-medium",
                  mode === "Banishing" && "text-muted-foreground"
                )}
              >
                Zodiac Signs{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {mode === "Banishing"
                    ? "(disabled in Banishing mode)"
                    : "(optional for Invocation)"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ZODIACS.map((zodiac) => (
                  <ToggleChip
                    key={zodiac}
                    label={zodiac}
                    selected={selectedZodiacs.includes(zodiac)}
                    disabled={mode === "Banishing"}
                    onToggle={() => toggleZodiac(zodiac)}
                  />
                ))}
              </div>
            </div>

            {/* Tag preview */}
            {previewTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Generated Tags ({previewTags.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tag preview for fixed presets */}
      {selectedPreset && selectedPreset !== "planetary_zodiacal" && previewTags.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Ritual Tags ({previewTags.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {previewTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Submit */}
      <div className="flex items-center gap-3 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedPreset}
          className="flex-1 sm:flex-none"
        >
          {loading ? "Creating…" : "Begin the Ritual"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/rituals">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
