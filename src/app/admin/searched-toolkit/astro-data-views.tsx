"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  PlanetSymbol, 
  ZodiacSymbol, 
  AspectSymbol, 
  OrbCircle,
  AspectsLegend 
} from "../horoscope/components/astro-icons";
import { 
  PLANET_IMAGES, 
  LADDER_PLANET_IMAGES, 
  ZODIAC_SYMBOLS, 
  PLANET_SYMBOLS 
} from "../horoscope/constants";
import { getAspectOrbColor } from "../horoscope/utils";

// ─── House Information Table ──────────────────────────────────────────────────

export function HousesTable({ houses }: { houses: any[] }) {
  if (!houses || houses.length === 0) return null;
  return (
    <div className="horoscope-table-container">
      <div className="horoscope-table-header">
        <h3>House Information</h3>
      </div>
      <div className="horoscope-table-wrapper">
        <table className="horoscope-table house-information-table">
          <thead>
            <tr>
              {["House", "Sign", "Degree"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {houses.map((h: any, i: number) => (
              <tr key={`house-row-${h.house ?? i}-${i}`}>
                <td className="font-semibold text-center">House {h.house}</td>
                <td>
                  <div className="flex justify-center">
                    <ZodiacSymbol sign={h.sign} />
                  </div>
                </td>
                <td className="td-mono text-center">{Number(h.degree).toFixed(2)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Ladder Chart (Distribution Analysis) ─────────────────────────────────────

export function LadderChart({ houses }: { houses: any[] }) {
  if (!houses || houses.length === 0) return null;
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="p-8 overflow-x-auto">
        <div className="flex flex-col gap-1 min-w-[850px] font-sans">
          {houses.map((h: any, houseIndex: number) => {
            const hNum = Number(h.house);
            const gridPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "Node", "Part of Fortune", "Chiron"];
            const skipBlocks = hNum === 1 || hNum === 12;
            let planetIdx = hNum - 1;
            if (hNum === 10) planetIdx = 10;
            if (hNum === 11) planetIdx = 11;
            if (hNum === 12) planetIdx = 12;

            const pName = gridPlanets[planetIdx] || "Sun";
            const pImg = LADDER_PLANET_IMAGES[pName] ?? PLANET_IMAGES[pName];
            const forcedIconIdx = skipBlocks ? 0 : (hNum - 1);

            return (
              <div key={`house-track-${h.house ?? houseIndex}-${houseIndex}`} className="flex items-center gap-4 py-0 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 w-40 shrink-0 h-8">
                  <div className="w-12">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">H{h.house}</p>
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-black text-xl leading-none">
                      {ZODIAC_SYMBOLS[h.sign] ?? "•"}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-500 ml-2">
                      {Number(h.full_degree || h.degree).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5 flex-1 items-center justify-start ml-2 text-black">
                  {Array.from({ length: forcedIconIdx + 1 }).map((_, colIdx) => {
                    const isIcon = colIdx === forcedIconIdx;
                    if (isIcon) {
                      return (
                        <div key="icon" className="w-10 h-6 flex items-center justify-center shrink-0">
                          {pImg && pName !== "Part of Fortune" ? (
                            <img src={pImg} alt={pName} className="size-5 object-contain" />
                          ) : (
                            <span className="flex items-center justify-center">
                              {pName === "Part of Fortune" ? (
                                <div className="size-4 border border-amber-600 rounded-full flex items-center justify-center translate-y-[1px]">
                                  <span className="text-[9px] font-black leading-none -translate-y-[0.5px] text-amber-600">✕</span>
                                </div>
                              ) : (
                                <span className={cn(
                                  "text-lg font-bold",
                                  pName === "Node" ? "text-indigo-600" :
                                    pName === "Chiron" ? "text-emerald-600" :
                                      "text-amber-600"
                                )}>
                                  {PLANET_SYMBOLS[pName] ?? "✦"}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return <div key={colIdx} className="w-10 h-6 bg-black shrink-0" />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Planets Table ────────────────────────────────────────────────────────────

export function PlanetsTable({ planets }: { planets: any[] }) {
  if (!planets || planets.length === 0) return null;
  return (
    <div className="horoscope-table-container">
      <div className="horoscope-table-header">
        <h3>Planet Information</h3>
      </div>
      <div className="horoscope-table-wrapper">
        <table className="horoscope-table">
          <thead>
            <tr>
              {["Planet", "Sign", "Full Degree", "House", "Norm Degree", "Speed", "Retro?"].map((h) => (
                <th key={h} className="text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planets.map((p, i) => (
              <tr key={p.name ?? i}>
                <td className="td-planet">
                  <div className="flex items-center gap-2">
                    <PlanetSymbol name={p.name} />
                  </div>
                </td>
                <td><ZodiacSymbol sign={p.sign} /></td>
                <td className="td-mono text-center">{Number(p.full_degree).toFixed(2)}°</td>
                <td className="text-center">{p.house}</td>
                <td className="td-mono text-center">{Number(p.norm_degree).toFixed(2)}°</td>
                <td className="td-mono text-center">{Number(p.speed).toFixed(2)}</td>
                <td className="text-center font-medium">
                  {p.is_retro === "true" || p.is_retro === true ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Aspects Table ────────────────────────────────────────────────────────────

export function AspectsTable({ aspects, planets }: { aspects: any[]; planets: any[] }) {
  if (!aspects || aspects.length === 0) return null;

  const degMap: Record<string, number> = {};
  for (const p of (planets ?? [])) {
    degMap[p.name] = Number(p.full_degree);
  }

  const enriched = aspects.map((a: any) => ({
    ...a,
    aspecting_degree: degMap[a.aspecting_planet] ? parseFloat(degMap[a.aspecting_planet].toFixed(2)) : null,
    aspected_degree: degMap[a.aspected_planet] ? parseFloat(degMap[a.aspected_planet].toFixed(2)) : null,
    color: getAspectOrbColor(Number(a.orb ?? 0), a.type, a.aspecting_planet, a.aspected_planet),
  }));

  return (
    <div className="space-y-4">
      <AspectsLegend />
      <div className="horoscope-table-container">
        <div className="horoscope-table-header py-3 bg-black">
          <h3 className="text-white">Aspects</h3>
        </div>
        <div className="horoscope-table-wrapper">
          <table className="horoscope-table">
            <thead>
              <tr>
                {["Aspected Planet", "Aspecting Planet", "Orb", "Diff", "Aspected Degree", "Aspecting Degree", "Type"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((a: any, i: number) => (
                <tr key={i}>
                  <td className="text-left"><PlanetSymbol name={a.aspected_planet} /></td>
                  <td className="text-left"><PlanetSymbol name={a.aspecting_planet} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <OrbCircle orb={Number(a.orb ?? 0)} color={a.color} />
                      <span className="td-mono">{Number(a.orb ?? 0).toFixed(2)}°</span>
                    </div>
                  </td>
                  <td className="td-mono text-left">{a.diff}</td>
                  <td className="td-mono text-left">{a.aspected_degree ?? "—"}°</td>
                  <td className="td-mono text-left">{a.aspecting_degree ?? "—"}°</td>
                  <td className="text-left">
                    <AspectSymbol type={a.type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
