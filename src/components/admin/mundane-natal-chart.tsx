"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanetEntry = {
  name?: string;
  sign?: string;
  degree?: number | string;
  house?: number | string;
  retrograde?: boolean;
  [key: string]: unknown;
};

type HouseEntry = {
  house?: number | string;
  sign?: string;
  degree?: number | string;
  [key: string]: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIMARY_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

function extractPlanets(data: Record<string, unknown>): PlanetEntry[] {
  // Handle array under "planets" key
  if (Array.isArray(data.planets)) {
    return (data.planets as PlanetEntry[]).filter((p) =>
      PRIMARY_PLANETS.some((name) => p.name?.toLowerCase() === name.toLowerCase())
    );
  }
  // Handle flat object keys matching planet names
  const found: PlanetEntry[] = [];
  for (const name of PRIMARY_PLANETS) {
    const key = Object.keys(data).find((k) => k.toLowerCase() === name.toLowerCase());
    if (key && typeof data[key] === "object" && data[key] !== null) {
      found.push({ name, ...(data[key] as Record<string, unknown>) });
    }
  }
  return found;
}

function extractHouses(data: Record<string, unknown>): HouseEntry[] {
  if (Array.isArray(data.houses)) {
    return data.houses as HouseEntry[];
  }
  return [];
}

function extractAscendant(data: Record<string, unknown>): string | null {
  if (data.ascendant && typeof data.ascendant === "object") {
    const asc = data.ascendant as Record<string, unknown>;
    const sign = asc.sign ?? asc.Sign;
    const degree = asc.degree ?? asc.Degree ?? asc.deg;
    if (sign) return degree ? `${String(sign)} ${Number(degree).toFixed(2)}°` : String(sign);
  }
  if (typeof data.ascendant === "string") return data.ascendant;
  if (typeof data.asc === "string") return data.asc;
  return null;
}

function formatDegree(val: unknown): string {
  if (val == null) return "—";
  const n = Number(val);
  return isNaN(n) ? String(val) : `${n.toFixed(2)}°`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MundaneNatalChartProps {
  natalChartData: Record<string, unknown> | null;
}

export function MundaneNatalChart({ natalChartData }: MundaneNatalChartProps) {
  if (!natalChartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="size-4 text-muted-foreground" />
            Natal Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No chart data — click Calculate Chart to generate.
          </p>
        </CardContent>
      </Card>
    );
  }

  const planets = extractPlanets(natalChartData);
  const houses = extractHouses(natalChartData);
  const ascendant = extractAscendant(natalChartData);
  const hasPlanets = planets.length > 0;
  const hasHouses = houses.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="size-4 text-muted-foreground" />
          Natal Chart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Ascendant */}
        {ascendant && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-28 shrink-0">Ascendant</span>
            <Badge variant="outline" className="font-mono text-xs">{ascendant}</Badge>
          </div>
        )}

        {/* Planets table */}
        {hasPlanets && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Planets</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Planet</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Sign</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Degree</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">House</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Rx</th>
                  </tr>
                </thead>
                <tbody>
                  {planets.map((p, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-1.5 px-2 font-medium">{p.name ?? "—"}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{String(p.sign ?? "—")}</td>
                      <td className="py-1.5 px-2 text-muted-foreground font-mono text-xs">
                        {formatDegree(p.degree)}
                      </td>
                      <td className="py-1.5 px-2 text-muted-foreground">
                        {p.house != null ? String(p.house) : "—"}
                      </td>
                      <td className="py-1.5 px-2">
                        {p.retrograde ? (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">Rx</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Houses table */}
        {hasHouses && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Houses</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">House</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Sign</th>
                    <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Degree</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((h, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-1.5 px-2 font-medium">{h.house != null ? String(h.house) : i + 1}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{String(h.sign ?? "—")}</td>
                      <td className="py-1.5 px-2 text-muted-foreground font-mono text-xs">
                        {formatDegree(h.degree)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw fallback if API returned unrecognised structure */}
        {!hasPlanets && !hasHouses && !ascendant && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Raw Data</p>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {JSON.stringify(natalChartData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
