"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NatalWheel } from "@/components/community/natal-wheel";
import { ArrowLeft, RefreshCw, Info, Loader2, Star } from "lucide-react";
import Link from "next/link";

type PlanetPosition = {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  retrograde: boolean;
};

type NatalChartData = {
  planets: PlanetPosition[];
  ascendant: { sign: string; degree: number; longitude: number } | null;
  mc: { sign: string; degree: number; longitude: number } | null;
  generatedAt: string;
  birthTime: string | null;
  ageGroup: "child" | "adult";
};

type FamilyMember = {
  id: string;
  full_name: string;
  date_of_birth: string;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  relationship: string | null;
  age_group: "child" | "adult";
  natal_chart: NatalChartData | null;
  chart_updated_at: string | null;
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅",
  Neptune: "♆", Pluto: "♇",
};

const PLANET_DESCRIPTIONS: Record<string, string> = {
  Sun: "Core identity and ego",
  Moon: "Emotions and subconscious",
  Mercury: "Communication and intellect",
  Venus: "Love, beauty and values",
  Mars: "Drive, energy and action",
  Jupiter: "Growth, luck and expansion",
  Saturn: "Structure, karma and discipline",
  Uranus: "Innovation and sudden change",
  Neptune: "Dreams, spirituality and illusion",
  Pluto: "Transformation and power",
};

const ELEMENT: Record<string, string> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

const MODALITY: Record<string, string> = {
  Aries: "Cardinal", Taurus: "Fixed", Gemini: "Mutable", Cancer: "Cardinal",
  Leo: "Fixed", Virgo: "Mutable", Libra: "Cardinal", Scorpio: "Fixed",
  Sagittarius: "Mutable", Capricorn: "Cardinal", Aquarius: "Fixed", Pisces: "Mutable",
};

export default function FamilyMemberChartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    const res = await fetch("/api/community/family");
    if (!res.ok) return;
    const data = await res.json();
    const found = (data.members ?? []).find((m: FamilyMember) => m.id === id);
    if (!found) {
      router.replace("/community/family");
      return;
    }
    setMember(found);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  async function generateChart() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/community/generate-natal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyMemberId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Chart generation failed");
    } else {
      await loadMember();
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) return null;

  const chart = member.natal_chart;
  const dob = new Date(member.date_of_birth + "T12:00:00");
  const ageYears = Math.floor(
    (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/family">
              <ArrowLeft className="mr-1.5 size-4" />
              Family
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {member.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {member.relationship ? `${member.relationship} · ` : ""}Age {ageYears} · {member.age_group === "child" ? "Simplified chart" : "Full natal chart"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateChart}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          {chart ? "Regenerate" : "Generate Chart"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Birth time prompt */}
      {!member.birth_time && (
        <Card className="border-amber-400/30 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Birth time missing</p>
              <p className="text-sm text-amber-700">
                Add a birth time for greater accuracy — the ascendant and house
                positions cannot be calculated without it.{" "}
                <Link href="/community/family" className="underline hover:text-amber-900">
                  Edit profile →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!chart && !generating && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Star className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No chart generated yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click &quot;Generate Chart&quot; to calculate{" "}
                {member.full_name}&apos;s natal chart.
              </p>
            </div>
            <Button onClick={generateChart} disabled={generating}>
              Generate Natal Chart
            </Button>
          </CardContent>
        </Card>
      )}

      {generating && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Calculating positions…</p>
          </CardContent>
        </Card>
      )}

      {chart && !generating && (
        <>
          {/* Visual wheel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Natal Chart Wheel</CardTitle>
              <CardDescription>
                {member.birth_time
                  ? `Born ${dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${member.birth_time}`
                  : `Born ${dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (time unknown)`}
                {(member.birth_city || member.birth_country) &&
                  ` · ${[member.birth_city, member.birth_country].filter(Boolean).join(", ")}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <NatalWheel
                planets={chart.planets}
                ascendantLon={chart.ascendant?.longitude ?? null}
                size={380}
              />
            </CardContent>
          </Card>

          {/* Ascendant & MC — adult only */}
          {chart.ageGroup === "adult" && (chart.ascendant || chart.mc) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {chart.ascendant && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Rising Sign (Ascendant)</CardDescription>
                    <CardTitle className="text-2xl">
                      {chart.ascendant.sign}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {chart.ascendant.degree.toFixed(1)}° ·{" "}
                      {ELEMENT[chart.ascendant.sign]} · {MODALITY[chart.ascendant.sign]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your outward expression and first impressions
                    </p>
                  </CardContent>
                </Card>
              )}
              {chart.mc && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Midheaven (MC)</CardDescription>
                    <CardTitle className="text-2xl">{chart.mc.sign}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {chart.mc.degree.toFixed(1)}° · {ELEMENT[chart.mc.sign]} ·{" "}
                      {MODALITY[chart.mc.sign]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Career path and public reputation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Planet placements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Planet Placements
                {chart.ageGroup === "child" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Simplified (age &lt; 14)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Where each planet was at the moment of birth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {chart.planets.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  >
                    <span className="text-2xl leading-none mt-0.5">
                      {PLANET_GLYPHS[p.name] ?? "●"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{p.name}</span>
                        <span className="text-sm text-muted-foreground">in</span>
                        <span className="font-semibold text-sm">{p.sign}</span>
                        {p.retrograde && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            ℞
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.degree.toFixed(1)}° · {ELEMENT[p.sign]} ·{" "}
                        {MODALITY[p.sign]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PLANET_DESCRIPTIONS[p.name] ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Chart generated{" "}
            {new Date(chart.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {!member.birth_time &&
              " · Birth time unknown — ascendant not shown"}
          </p>
        </>
      )}
    </div>
  );
}
