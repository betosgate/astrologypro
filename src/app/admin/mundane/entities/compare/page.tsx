"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitCompare, Loader2, AlertCircle } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EntityOption = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
};

type Aspect = {
  planetA: string;
  planetB: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
};

type CompositePlanet = {
  name: string;
  longitude: number;
  sign: string;
  degree: number;
};

type CompareResult = {
  entity_a: { id: string; name: string };
  entity_b: { id: string; name: string };
  synastry: {
    aspects: Aspect[];
    score: number;
    summary: string;
  };
  composite: {
    planets: CompositePlanet[];
  };
};

type CompareTab = "aspects" | "composite";

// ─── Aspect constants ──────────────────────────────────────────────────────────

const ASPECT_GLYPH: Record<string, string> = {
  Conjunction: "☌",
  Opposition: "☍",
  Trine: "△",
  Square: "□",
  Sextile: "⚹",
  Quincunx: "⚻",
};

const ASPECT_COLOR: Record<string, string> = {
  Conjunction: "text-purple-600 bg-purple-50 border-purple-200",
  Trine: "text-green-600 bg-green-50 border-green-200",
  Sextile: "text-blue-600 bg-blue-50 border-blue-200",
  Square: "text-red-600 bg-red-50 border-red-200",
  Opposition: "text-red-800 bg-red-100 border-red-300",
  Quincunx: "text-amber-600 bg-amber-50 border-amber-200",
};

const ASPECT_CELL_BG: Record<string, string> = {
  Conjunction: "bg-purple-50 text-purple-700",
  Trine: "bg-green-50 text-green-700",
  Sextile: "bg-blue-50 text-blue-700",
  Square: "bg-red-50 text-red-700",
  Opposition: "bg-red-100 text-red-800",
  Quincunx: "bg-amber-50 text-amber-700",
};

const PLANET_ORDER = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const ZODIAC_GLYPH: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

// ─── Entity Selector Component ─────────────────────────────────────────────────

function EntitySelector({
  label,
  entities,
  selectedId,
  onSelect,
  disabledId,
}: {
  label: string;
  entities: EntityOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabledId: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = entities.filter(
    (e) =>
      e.id !== disabledId &&
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.region ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const selected = entities.find((e) => e.id === selectedId);

  return (
    <Card className="border">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <input
          type="text"
          placeholder="Search entities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {selected && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium">
            {selected.flag_emoji && <span>{selected.flag_emoji}</span>}
            <span className="flex-1 truncate">{selected.name}</span>
            <Badge variant="outline" className="text-xs capitalize">{selected.entity_type}</Badge>
          </div>
        )}
        <div className="max-h-44 overflow-y-auto rounded-md border divide-y">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No entities found</p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => { onSelect(e.id); setSearch(""); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-muted ${
                  e.id === selectedId ? "bg-muted font-medium" : ""
                }`}
              >
                {e.flag_emoji && <span className="shrink-0">{e.flag_emoji}</span>}
                <span className="flex-1 truncate">{e.name}</span>
                {e.region && <span className="text-xs text-muted-foreground shrink-0">{e.region}</span>}
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Aspect Grid ───────────────────────────────────────────────────────────────

function AspectGrid({
  aspects,
  nameA,
  nameB,
}: {
  aspects: Aspect[];
  nameA: string;
  nameB: string;
}) {
  // Build lookup: planetA + planetB → aspect
  const lookup = new Map<string, Aspect>();
  for (const asp of aspects) {
    lookup.set(`${asp.planetA}|${asp.planetB}`, asp);
  }

  // Only include planets that appear in aspects
  const planetsA = PLANET_ORDER.filter((p) => aspects.some((a) => a.planetA === p));
  const planetsB = PLANET_ORDER.filter((p) => aspects.some((a) => a.planetB === p));

  if (planetsA.length === 0 || planetsB.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No aspects found between these entities&apos; primary charts.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground border border-border bg-muted/40 w-24">
              {nameA} ↓ / {nameB} →
            </th>
            {planetsB.map((pB) => (
              <th key={pB} className="p-2 text-center font-medium border border-border bg-muted/40 w-16">
                <span title={pB}>{PLANET_GLYPH[pB] ?? pB}</span>
                <div className="text-muted-foreground font-normal">{pB}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planetsA.map((pA) => (
            <tr key={pA}>
              <td className="p-2 font-medium border border-border bg-muted/20">
                <span title={pA}>{PLANET_GLYPH[pA] ?? pA}</span>
                {" "}{pA}
              </td>
              {planetsB.map((pB) => {
                const asp = lookup.get(`${pA}|${pB}`);
                if (!asp) {
                  return (
                    <td key={pB} className="p-2 text-center border border-border text-muted-foreground/20">
                      –
                    </td>
                  );
                }
                const cellClass = ASPECT_CELL_BG[asp.aspectType] ?? "bg-muted text-foreground";
                return (
                  <td
                    key={pB}
                    className={`p-2 text-center border border-border font-medium ${cellClass}`}
                    title={`${pA} ${asp.aspectType} ${pB} (orb: ${asp.orb}°)`}
                  >
                    <div className="text-base leading-none">{ASPECT_GLYPH[asp.aspectType] ?? asp.aspectType}</div>
                    <div className="text-xs mt-0.5 opacity-80">{asp.orb}°</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Key Aspects List ──────────────────────────────────────────────────────────

function KeyAspectsList({ aspects }: { aspects: Aspect[] }) {
  const top10 = [...aspects]
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 10);

  return (
    <div className="space-y-1">
      {top10.map((asp, i) => {
        const badgeClass = ASPECT_COLOR[asp.aspectType] ?? "text-gray-600 bg-gray-50 border-gray-200";
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card text-sm"
          >
            <span className="w-5 text-center font-medium text-muted-foreground">{i + 1}</span>
            <span className="w-20 font-medium truncate">
              {PLANET_GLYPH[asp.planetA] ?? ""} {asp.planetA}
            </span>
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0.5 font-medium ${badgeClass}`}
            >
              {ASPECT_GLYPH[asp.aspectType] ?? asp.aspectType} {asp.aspectType}
            </Badge>
            <span className="w-20 font-medium truncate">
              {PLANET_GLYPH[asp.planetB] ?? ""} {asp.planetB}
            </span>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              orb {asp.orb}°
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function SynastrySmumary({
  result,
}: {
  result: CompareResult;
}) {
  const aspects = result.synastry.aspects;
  const tightest = aspects.reduce<Aspect | null>(
    (acc, a) => (!acc || a.orb < acc.orb ? a : acc),
    null
  );
  const stressPoints = aspects
    .filter((a) => !a.isHarmonious && a.orb <= 3)
    .sort((a, b) => a.orb - b.orb);
  const harmonyPoints = aspects
    .filter((a) => a.isHarmonious && a.orb <= 3)
    .sort((a, b) => a.orb - b.orb);

  const scoreColor =
    result.synastry.score >= 70
      ? "text-green-600"
      : result.synastry.score >= 50
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="text-center">
          <div className={`text-4xl font-bold tabular-nums ${scoreColor}`}>
            {result.synastry.score}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Harmony Score</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.synastry.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Strongest connection */}
        {tightest && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Strongest Connection</p>
            <p className="text-sm font-medium">
              {PLANET_GLYPH[tightest.planetA] ?? ""} {tightest.planetA}{" "}
              <span className={ASPECT_COLOR[tightest.aspectType]?.split(" ")[0] ?? ""}>
                {ASPECT_GLYPH[tightest.aspectType] ?? tightest.aspectType}
              </span>{" "}
              {PLANET_GLYPH[tightest.planetB] ?? ""} {tightest.planetB}
            </p>
            <p className="text-xs text-muted-foreground">
              {tightest.aspectType} — orb {tightest.orb}°
            </p>
          </div>
        )}

        {/* Stress points */}
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notable Stress Points</p>
          {stressPoints.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tight stress aspects (&lt;3°)</p>
          ) : (
            stressPoints.slice(0, 3).map((a, i) => (
              <p key={i} className="text-sm text-red-700">
                {PLANET_GLYPH[a.planetA] ?? ""} {a.planetA} {ASPECT_GLYPH[a.aspectType]} {PLANET_GLYPH[a.planetB] ?? ""} {a.planetB}
                <span className="text-xs ml-1 text-muted-foreground">({a.orb}°)</span>
              </p>
            ))
          )}
        </div>

        {/* Harmony indicators */}
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Harmony Indicators</p>
          {harmonyPoints.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tight harmonious aspects (&lt;3°)</p>
          ) : (
            harmonyPoints.slice(0, 3).map((a, i) => (
              <p key={i} className="text-sm text-green-700">
                {PLANET_GLYPH[a.planetA] ?? ""} {a.planetA} {ASPECT_GLYPH[a.aspectType]} {PLANET_GLYPH[a.planetB] ?? ""} {a.planetB}
                <span className="text-xs ml-1 text-muted-foreground">({a.orb}°)</span>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Composite Table ──────────────────────────────────────────────────────────

function CompositeTable({ planets }: { planets: CompositePlanet[] }) {
  const ordered = PLANET_ORDER
    .map((name) => planets.find((p) => p.name === name))
    .filter(Boolean) as CompositePlanet[];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Planet</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Sign</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Degree in Sign</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Ecliptic Longitude</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ordered.map((p) => (
            <tr key={p.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2 font-medium">
                <span className="mr-1.5">{PLANET_GLYPH[p.name] ?? ""}</span>
                {p.name}
              </td>
              <td className="px-4 py-2">
                <span className="mr-1">{ZODIAC_GLYPH[p.sign] ?? ""}</span>
                {p.sign}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{p.degree.toFixed(2)}°</td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{p.longitude.toFixed(2)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompareEntitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramA = searchParams.get("entity_a") ?? "";
  const paramB = searchParams.get("entity_b") ?? "";

  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [selectedA, setSelectedA] = useState(paramA);
  const [selectedB, setSelectedB] = useState(paramB);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CompareTab>("aspects");

  // Fetch all entities for selectors
  useEffect(() => {
    async function load() {
      setLoadingEntities(true);
      try {
        // Fetch up to 200 entities ordered by name
        const res = await fetch("/api/admin/mundane/entities?page=1&limit=200");
        if (res.ok) {
          const json = await res.json();
          setEntities(json.entities ?? []);
        }
      } finally {
        setLoadingEntities(false);
      }
    }
    load();
  }, []);

  // Auto-run comparison when both URL params are present on load
  const runComparison = useCallback(async (aId: string, bId: string) => {
    if (!aId || !bId) return;
    setLoadingResult(true);
    setError(null);
    try {
      const res = await fetch("/api/mundane/entities/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_a_id: aId, entity_b_id: bId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError((err as { detail?: string }).detail ?? "Failed to compute synastry");
        setResult(null);
        return;
      }
      const data = await res.json() as CompareResult;
      setResult(data);
    } catch {
      setError("Network error — could not reach the server");
      setResult(null);
    } finally {
      setLoadingResult(false);
    }
  }, []);

  useEffect(() => {
    if (paramA && paramB) {
      runComparison(paramA, paramB);
    }
  }, [paramA, paramB, runComparison]);

  function handleCompare() {
    if (!selectedA || !selectedB) return;
    const url = `/admin/mundane/entities/compare?entity_a=${selectedA}&entity_b=${selectedB}`;
    router.push(url);
    // Also run immediately (in case params didn't change)
    if (selectedA === paramA && selectedB === paramB) {
      runComparison(selectedA, selectedB);
    }
  }

  const entityA = result?.entity_a ?? entities.find((e) => e.id === paramA);
  const entityB = result?.entity_b ?? entities.find((e) => e.id === paramB);

  const headerLabel =
    entityA && entityB
      ? `${entityA.name} ↔ ${entityB.name}`
      : "Compare Entities";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" asChild>
          <Link href="/admin/mundane/entities">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="size-6 text-violet-500" />
            {headerLabel}
          </h1>
          <p className="text-muted-foreground text-sm">
            Synastry aspects and composite midpoints between two entity charts.
          </p>
        </div>
      </div>

      {/* Entity selectors */}
      {loadingEntities ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading entities…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <EntitySelector
              label="Entity A"
              entities={entities}
              selectedId={selectedA}
              onSelect={setSelectedA}
              disabledId={selectedB}
            />
            <EntitySelector
              label="Entity B"
              entities={entities}
              selectedId={selectedB}
              onSelect={setSelectedB}
              disabledId={selectedA}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCompare}
              disabled={!selectedA || !selectedB || loadingResult}
            >
              {loadingResult ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Computing…
                </>
              ) : (
                <>
                  <GitCompare className="mr-2 size-4" />
                  Compare
                </>
              )}
            </Button>
            {(!selectedA || !selectedB) && (
              <p className="text-sm text-muted-foreground">Select two entities to compare.</p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && !loadingResult && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="border-b">
            <div className="flex gap-0">
              {(["aspects", "composite"] as CompareTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === t
                      ? "border-violet-500 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "aspects" ? "Synastry Aspects" : "Composite Chart"}
                </button>
              ))}
            </div>
          </div>

          {/* Synastry tab */}
          {activeTab === "aspects" && (
            <div className="space-y-6">
              {/* Summary */}
              <section>
                <h2 className="text-base font-semibold mb-3">Summary</h2>
                <SynastrySmumary result={result} />
              </section>

              {/* Key Aspects */}
              <section>
                <h2 className="text-base font-semibold mb-3">
                  Top 10 Strongest Aspects{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    (sorted by orb tightness)
                  </span>
                </h2>
                <KeyAspectsList aspects={result.synastry.aspects} />
              </section>

              {/* Aspect Grid */}
              <section>
                <h2 className="text-base font-semibold mb-3">
                  Aspect Grid
                </h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 mb-4 text-xs">
                      {Object.entries(ASPECT_GLYPH).map(([type, glyph]) => (
                        <span
                          key={type}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium ${ASPECT_COLOR[type] ?? ""}`}
                        >
                          {glyph} {type}
                        </span>
                      ))}
                    </div>
                    <AspectGrid
                      aspects={result.synastry.aspects}
                      nameA={result.entity_a.name}
                      nameB={result.entity_b.name}
                    />
                  </CardContent>
                </Card>
              </section>
            </div>
          )}

          {/* Composite tab */}
          {activeTab === "composite" && (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                Composite positions use the midpoint method — for each planet, the midpoint of the shorter arc between the two entity longitudes.
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Composite Planets — {result.entity_a.name} / {result.entity_b.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <CompositeTable planets={result.composite.planets} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no params yet */}
      {!result && !loadingResult && !error && !paramA && !paramB && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GitCompare className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Select two entities above and click <strong>Compare</strong> to run a synastry comparison.
          </p>
        </div>
      )}
    </div>
  );
}
