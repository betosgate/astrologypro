"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, RefreshCw, Loader2, AlertCircle, ChevronDown, ChevronUp, Star } from "lucide-react";
import Link from "next/link";

type FamilyMember = {
  id: string;
  full_name: string;
  natal_chart: unknown | null;
};

type Aspect = {
  planetA: string;
  planetB: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
};

type SynastryData = {
  personAName: string;
  personBName: string;
  aspects: Aspect[];
  score: number;
  summary: string;
};

type RelationshipChart = {
  id: string;
  person_a_id: string;
  person_b_id: string;
  chart_data: SynastryData;
  generated_at: string;
};

export default function ChartsPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [charts, setCharts] = useState<RelationshipChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/community/relationship-charts");
    if (res.ok) {
      const data = await res.json();
      setFamilyMembers(data.familyMembers ?? []);
      setCharts(data.charts ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getChartForPair(aId: string, bId: string) {
    const [a, b] = [aId, bId].sort();
    return charts.find(
      (c) => c.person_a_id === a && c.person_b_id === b
    );
  }

  async function generateChart(personAId: string, personBId: string) {
    const key = [personAId, personBId].sort().join("-");
    setGenerating(key);
    setError(null);

    const res = await fetch("/api/community/relationship-charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personAId, personBId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to generate chart");
    } else {
      await load();
    }
    setGenerating(null);
  }

  // Build all unique pairings
  const pairs: { a: FamilyMember; b: FamilyMember }[] = [];
  for (let i = 0; i < familyMembers.length; i++) {
    for (let j = i + 1; j < familyMembers.length; j++) {
      pairs.push({ a: familyMembers[i], b: familyMembers[j] });
    }
  }

  const membersWithoutCharts = familyMembers.filter((m) => !m.natal_chart);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Relationship Charts</h1>
          </div>
          <p className="text-muted-foreground">
            Synastry charts for every pair in your family.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Prereq notice */}
      {membersWithoutCharts.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-50/40">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800 font-medium">Generate natal charts first</p>
            <p className="text-sm text-amber-700 mt-1">
              {membersWithoutCharts.map((m) => m.full_name).join(", ")}{" "}
              {membersWithoutCharts.length === 1 ? "needs" : "need"} a natal chart before synastry can be calculated.{" "}
              <Link href="/community/family" className="underline hover:text-amber-900">
                Go to Family →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : familyMembers.length < 2 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Heart className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Not enough family members</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add at least 2 family members to generate relationship charts.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/family">Manage Family</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pairs.map(({ a, b }) => {
            const pairKey = [a.id, b.id].sort().join("-");
            const chart = getChartForPair(a.id, b.id);
            const synastry = chart?.chart_data;
            const isLoading = generating === pairKey;
            const bothHaveCharts = !!a.natal_chart && !!b.natal_chart;
            const isOpen = expandedId === pairKey;

            return (
              <Card key={pairKey}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => synastry && setExpandedId(isOpen ? null : pairKey)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Heart className="size-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">
                        {a.full_name} &amp; {b.full_name}
                      </p>
                      {synastry && (
                        <p className="text-xs text-muted-foreground">
                          {synastry.aspects.length} aspects ·{" "}
                          {synastry.aspects.filter((x) => x.isHarmonious).length} harmonious ·{" "}
                          {synastry.aspects.filter((x) => !x.isHarmonious).length} challenging
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {synastry && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${
                              i < Math.round(synastry.score / 20)
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {synastry.score}%
                        </span>
                      </div>
                    )}
                    {!synastry && bothHaveCharts && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          generateChart(a.id, b.id);
                        }}
                      >
                        {isLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    )}
                    {synastry && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            generateChart(a.id, b.id);
                          }}
                        >
                          {isLoading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <RefreshCw className="size-3" />
                          )}
                        </Button>
                        {isOpen ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </div>
                </button>

                {isOpen && synastry && (
                  <CardContent className="border-t pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground italic">
                      {synastry.summary}
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Aspects
                      </p>
                      <div className="grid gap-1.5">
                        {synastry.aspects.map((aspect, i) => (
                          <div
                            key={i}
                            className={[
                              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
                              aspect.isHarmonious
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200",
                            ].join(" ")}
                          >
                            <span
                              className={
                                aspect.isHarmonious ? "text-green-800" : "text-red-800"
                              }
                            >
                              <span className="font-medium">{synastry.personAName}&apos;s {aspect.planetA}</span>
                              {" "}{aspect.aspectType.toLowerCase()}{" "}
                              <span className="font-medium">{synastry.personBName}&apos;s {aspect.planetB}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  aspect.isHarmonious
                                    ? "border-green-300 text-green-700"
                                    : "border-red-300 text-red-700"
                                }`}
                              >
                                {aspect.aspectType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {aspect.orb}° orb
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
