"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type PlanetData = {
  name: string;
  longitude: number;
  symbol: string;
};

export type AspectData = {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
};

type AstroWheelProps = {
  planets: PlanetData[];
  houses?: number[];
  aspects?: AspectData[];
  // Bi-wheel: outer ring planets (transits / solar arc)
  outerPlanets?: PlanetData[];
  outerHouses?: number[];
  // Whether to draw cross-ring aspect lines (inner ↔ outer)
  showBiAspects?: boolean;
  // Labels shown inside the chart
  innerLabel?: string;
  outerLabel?: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────────

const SIZE = 600;
const CENTER = SIZE / 2;

// Inner ring radii (natal / inner chart)
const OUTER_R = 260;
const SIGN_INNER_R = 225;
const HOUSE_OUTER_R = SIGN_INNER_R;
const PLANET_R = 193;
const ASPECT_R = 138;
const INNER_CIRCLE_R = 138;

// Outer ring radii (bi-wheel overlay) — 15% larger than OUTER_R
const BIWHEEL_OUTER_R = Math.round(OUTER_R * 1.15); // 299
const BIWHEEL_SIGN_INNER_R = OUTER_R;               // outer ring inner = inner ring outer
const BIWHEEL_PLANET_R = Math.round(OUTER_R * 1.075); // halfway between rings

const ZODIAC_SIGNS = [
  { symbol: "\u2648", name: "Aries" },
  { symbol: "\u2649", name: "Taurus" },
  { symbol: "\u264A", name: "Gemini" },
  { symbol: "\u264B", name: "Cancer" },
  { symbol: "\u264C", name: "Leo" },
  { symbol: "\u264D", name: "Virgo" },
  { symbol: "\u264E", name: "Libra" },
  { symbol: "\u264F", name: "Scorpio" },
  { symbol: "\u2650", name: "Sagittarius" },
  { symbol: "\u2651", name: "Capricorn" },
  { symbol: "\u2652", name: "Aquarius" },
  { symbol: "\u2653", name: "Pisces" },
] as const;

const ASPECT_COLORS: Record<string, string> = {
  conjunction: "#a855f7",   // purple
  sextile: "#60a5fa",       // blue
  square: "#f87171",        // red
  trine: "#4ade80",         // green
  opposition: "#dc2626",    // dark red
};

const ASPECT_DEFS: { name: string; angle: number; orb: number }[] = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "sextile", angle: 60, orb: 8 },
  { name: "square", angle: 90, orb: 8 },
  { name: "trine", angle: 120, orb: 8 },
  { name: "opposition", angle: 180, orb: 8 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Convert ecliptic longitude (0=Aries) to SVG angle.
 * In astrology wheels, 0 Aries is at 9 o'clock (left), signs go counter-clockwise.
 * SVG 0 is 3 o'clock (right). So: svgAngle = 180 - longitude.
 * We convert to radians.
 */
function eclipticToAngle(longitude: number): number {
  const deg = 180 - longitude;
  return (deg * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): [number, number] {
  return [CENTER + radius * Math.cos(angle), CENTER - radius * Math.sin(angle)];
}

function detectAspects(planets: PlanetData[]): AspectData[] {
  const detected: AspectData[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of ASPECT_DEFS) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          detected.push({
            planet1: planets[i].name,
            planet2: planets[j].name,
            type: aspect.name,
            orb: Math.round(orb * 100) / 100,
          });
          break;
        }
      }
    }
  }
  return detected;
}

/** Detect cross-ring aspects between inner (natal) and outer (transit/solar arc) planets */
function detectBiAspects(inner: PlanetData[], outer: PlanetData[]): AspectData[] {
  const detected: AspectData[] = [];
  for (const ip of inner) {
    for (const op of outer) {
      let diff = Math.abs(ip.longitude - op.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const aspect of ASPECT_DEFS) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          detected.push({
            planet1: ip.name,
            planet2: op.name,
            type: aspect.name,
            orb: Math.round(orb * 100) / 100,
          });
          break;
        }
      }
    }
  }
  return detected;
}

// ─── Resolve collisions among planet labels ─────────────────────────────────────

function resolveCollisions(
  items: { angle: number; name: string; symbol: string; longitude: number }[],
  minSeparationDeg: number
): { angle: number; name: string; symbol: string; longitude: number }[] {
  if (items.length <= 1) return items;

  // Sort by angle (degrees)
  const sorted = [...items].sort((a, b) => a.angle - b.angle);

  // Simple iterative push-apart
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < sorted.length; i++) {
      const next = (i + 1) % sorted.length;
      let diff = sorted[next].angle - sorted[i].angle;
      if (diff < 0) diff += 360;
      if (diff < minSeparationDeg) {
        const push = (minSeparationDeg - diff) / 2;
        sorted[i].angle -= push;
        sorted[next].angle += push;
        if (sorted[i].angle < 0) sorted[i].angle += 360;
        if (sorted[next].angle >= 360) sorted[next].angle -= 360;
      }
    }
  }

  return sorted;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function AstroWheel({
  planets,
  houses,
  aspects,
  outerPlanets,
  outerHouses,
  showBiAspects = true,
  innerLabel,
  outerLabel,
}: AstroWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isBiWheel = Boolean(outerPlanets && outerPlanets.length > 0);

  // Effective radii depend on whether we are in bi-wheel mode.
  // In bi-wheel mode the zodiac ring shrinks to leave room for the outer ring.
  const effectiveOuterR   = isBiWheel ? OUTER_R        : OUTER_R;
  const effectiveSignInR  = isBiWheel ? SIGN_INNER_R   : SIGN_INNER_R;

  const computedAspects = useMemo(
    () => aspects ?? detectAspects(planets),
    [aspects, planets]
  );

  const computedBiAspects = useMemo(
    () => (isBiWheel && showBiAspects && outerPlanets)
      ? detectBiAspects(planets, outerPlanets)
      : [],
    [isBiWheel, showBiAspects, planets, outerPlanets]
  );

  // Prepare planet positions with collision resolution
  const resolvedPlanets = useMemo(() => {
    const items = planets.map((p) => ({
      angle: ((180 - p.longitude) % 360 + 360) % 360,
      name: p.name,
      symbol: p.symbol,
      longitude: p.longitude,
    }));
    return resolveCollisions(items, 8);
  }, [planets]);

  const resolvedOuterPlanets = useMemo(() => {
    if (!outerPlanets) return [];
    const items = outerPlanets.map((p) => ({
      angle: ((180 - p.longitude) % 360 + 360) % 360,
      name: p.name,
      symbol: p.symbol,
      longitude: p.longitude,
    }));
    return resolveCollisions(items, 8);
  }, [outerPlanets]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Background
    svg
      .append("rect")
      .attr("width", SIZE)
      .attr("height", SIZE)
      .attr("rx", 8)
      .attr("fill", "#0f172a");

    // ─── Outer bi-wheel ring (drawn FIRST, behind zodiac) ─────────────────

    if (isBiWheel) {
      const biArcGen = d3
        .arc<unknown>()
        .innerRadius(BIWHEEL_SIGN_INNER_R)
        .outerRadius(BIWHEEL_OUTER_R);

      const biGroup = svg.append("g").attr("transform", `translate(${CENTER},${CENTER})`);

      ZODIAC_SIGNS.forEach((sign, i) => {
        const startDeg = i * 30;
        const endDeg = (i + 1) * 30;
        const d3Start = (startDeg * Math.PI) / 180 - Math.PI / 2;
        const d3End = (endDeg * Math.PI) / 180 - Math.PI / 2;

        biGroup
          .append("path")
          .attr(
            "d",
            biArcGen({
              startAngle: d3Start,
              endAngle: d3End,
              innerRadius: BIWHEEL_SIGN_INNER_R,
              outerRadius: BIWHEEL_OUTER_R,
            })
          )
          .attr("fill", i % 2 === 0 ? "rgba(14,165,233,0.10)" : "rgba(14,165,233,0.05)")
          .attr("stroke", "rgba(14,165,233,0.35)")
          .attr("stroke-width", 0.5);

        // Sign glyph
        const midDeg = startDeg + 15;
        const midAngle = eclipticToAngle(midDeg);
        const midR = (BIWHEEL_SIGN_INNER_R + BIWHEEL_OUTER_R) / 2;
        const [gx, gy] = polarToXY(midAngle, midR);

        svg
          .append("text")
          .attr("x", gx)
          .attr("y", gy)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 11)
          .attr("fill", "rgba(14,165,233,0.7)")
          .text(sign.symbol);
      });

      // Outer bi-wheel border
      svg
        .append("circle")
        .attr("cx", CENTER)
        .attr("cy", CENTER)
        .attr("r", BIWHEEL_OUTER_R)
        .attr("fill", "none")
        .attr("stroke", "rgba(14,165,233,0.5)")
        .attr("stroke-width", 1);

      // Sign boundary lines on outer ring
      for (let i = 0; i < 12; i++) {
        const deg = i * 30;
        const angle = eclipticToAngle(deg);
        const [x1, y1] = polarToXY(angle, BIWHEEL_SIGN_INNER_R);
        const [x2, y2] = polarToXY(angle, BIWHEEL_OUTER_R);
        svg
          .append("line")
          .attr("x1", x1).attr("y1", y1)
          .attr("x2", x2).attr("y2", y2)
          .attr("stroke", "rgba(14,165,233,0.35)")
          .attr("stroke-width", 0.5);
      }
    }

    // ─── Zodiac inner ring ────────────────────────────────────────────────

    const arcGen = d3
      .arc<unknown>()
      .innerRadius(effectiveSignInR)
      .outerRadius(effectiveOuterR);

    const signGroup = svg.append("g").attr("transform", `translate(${CENTER},${CENTER})`);

    ZODIAC_SIGNS.forEach((sign, i) => {
      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;
      const d3Start = (startDeg * Math.PI) / 180 - Math.PI / 2;
      const d3End = (endDeg * Math.PI) / 180 - Math.PI / 2;

      signGroup
        .append("path")
        .attr(
          "d",
          arcGen({
            startAngle: d3Start,
            endAngle: d3End,
            innerRadius: effectiveSignInR,
            outerRadius: effectiveOuterR,
          })
        )
        .attr("fill", i % 2 === 0 ? "rgba(251,191,36,0.12)" : "rgba(251,191,36,0.06)")
        .attr("stroke", "rgba(251,191,36,0.4)")
        .attr("stroke-width", 0.5);

      // Sign glyph
      const midDeg = startDeg + 15;
      const midAngle = eclipticToAngle(midDeg);
      const midR = (effectiveSignInR + effectiveOuterR) / 2;
      const [gx, gy] = polarToXY(midAngle, midR);

      svg
        .append("text")
        .attr("x", gx)
        .attr("y", gy)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 18)
        .attr("fill", "rgba(251,191,36,0.9)")
        .text(sign.symbol);
    });

    // Sign boundary lines on inner ring
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const angle = eclipticToAngle(deg);
      const [x1, y1] = polarToXY(angle, effectiveSignInR);
      const [x2, y2] = polarToXY(angle, effectiveOuterR);
      svg
        .append("line")
        .attr("x1", x1).attr("y1", y1)
        .attr("x2", x2).attr("y2", y2)
        .attr("stroke", "rgba(251,191,36,0.4)")
        .attr("stroke-width", 0.5);
    }

    // Inner circle
    svg
      .append("circle")
      .attr("cx", CENTER).attr("cy", CENTER)
      .attr("r", INNER_CIRCLE_R)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 0.5);

    // Inner border of zodiac ring
    svg
      .append("circle")
      .attr("cx", CENTER).attr("cy", CENTER)
      .attr("r", effectiveSignInR)
      .attr("fill", "none")
      .attr("stroke", "rgba(251,191,36,0.4)")
      .attr("stroke-width", 0.5);

    // Outer border of zodiac ring
    svg
      .append("circle")
      .attr("cx", CENTER).attr("cy", CENTER)
      .attr("r", effectiveOuterR)
      .attr("fill", "none")
      .attr("stroke", isBiWheel ? "rgba(14,165,233,0.5)" : "rgba(251,191,36,0.5)")
      .attr("stroke-width", 1);

    // ─── House cusps ──────────────────────────────────────────────────────

    if (houses && houses.length === 12) {
      houses.forEach((cusp, i) => {
        const angle = eclipticToAngle(cusp);
        const [x1, y1] = polarToXY(angle, INNER_CIRCLE_R);
        const [x2, y2] = polarToXY(angle, HOUSE_OUTER_R);

        const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;

        svg
          .append("line")
          .attr("x1", x1).attr("y1", y1)
          .attr("x2", x2).attr("y2", y2)
          .attr("stroke", isCardinal ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)")
          .attr("stroke-width", isCardinal ? 1.5 : 0.5);

        // House number
        const nextCusp = houses[(i + 1) % 12];
        let midLong = (cusp + nextCusp) / 2;
        if (nextCusp < cusp) midLong = ((cusp + nextCusp + 360) / 2) % 360;
        const midAngle = eclipticToAngle(midLong);
        const labelR = (INNER_CIRCLE_R + HOUSE_OUTER_R) / 2;
        const [lx, ly] = polarToXY(midAngle, labelR);

        svg
          .append("text")
          .attr("x", lx).attr("y", ly)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 10)
          .attr("fill", "rgba(255,255,255,0.3)")
          .text(String(i + 1));
      });
    }

    // ─── Inner natal aspect lines ─────────────────────────────────────────

    const planetLongMap: Record<string, number> = {};
    planets.forEach((p) => {
      planetLongMap[p.name] = p.longitude;
    });

    computedAspects.forEach((asp) => {
      const long1 = planetLongMap[asp.planet1];
      const long2 = planetLongMap[asp.planet2];
      if (long1 == null || long2 == null) return;

      const a1 = eclipticToAngle(long1);
      const a2 = eclipticToAngle(long2);
      const [x1, y1] = polarToXY(a1, ASPECT_R);
      const [x2, y2] = polarToXY(a2, ASPECT_R);

      svg
        .append("line")
        .attr("x1", x1).attr("y1", y1)
        .attr("x2", x2).attr("y2", y2)
        .attr("stroke", ASPECT_COLORS[asp.type] ?? "#888")
        .attr("stroke-width", 0.8)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", asp.type === "opposition" || asp.type === "square" ? "4,3" : "none");
    });

    // ─── Cross-ring bi-wheel aspect lines ─────────────────────────────────

    if (isBiWheel && showBiAspects) {
      const outerLongMap: Record<string, number> = {};
      (outerPlanets ?? []).forEach((p) => {
        outerLongMap[p.name] = p.longitude;
      });

      computedBiAspects.forEach((asp) => {
        // planet1 = inner (natal), planet2 = outer (transit/SA)
        const long1 = planetLongMap[asp.planet1];
        const long2 = outerLongMap[asp.planet2];
        if (long1 == null || long2 == null) return;

        const a1 = eclipticToAngle(long1);
        const a2 = eclipticToAngle(long2);
        // Draw from inner aspect circle to outer planet ring
        const [x1, y1] = polarToXY(a1, ASPECT_R);
        const [x2, y2] = polarToXY(a2, BIWHEEL_PLANET_R);

        svg
          .append("line")
          .attr("x1", x1).attr("y1", y1)
          .attr("x2", x2).attr("y2", y2)
          .attr("stroke", ASPECT_COLORS[asp.type] ?? "#888")
          .attr("stroke-width", 0.6)
          .attr("stroke-opacity", 0.45)
          .attr("stroke-dasharray", "3,3");
      });
    }

    // ─── Tooltip container ────────────────────────────────────────────────

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "astro-wheel-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(15,23,42,0.95)")
      .style("color", "#fbbf24")
      .style("padding", "4px 8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("border", "1px solid rgba(251,191,36,0.3)")
      .style("display", "none")
      .style("z-index", "9999");

    // ─── Inner (natal) planets — amber/gold ───────────────────────────────

    resolvedPlanets.forEach((p) => {
      const angleRad = (p.angle * Math.PI) / 180;
      const planetX = CENTER + PLANET_R * Math.cos(angleRad);
      const planetY = CENTER - PLANET_R * Math.sin(angleRad);

      // Tick from zodiac ring inner edge
      const tickAngle = eclipticToAngle(p.longitude);
      const [tx1, ty1] = polarToXY(tickAngle, effectiveSignInR);
      const [tx2, ty2] = polarToXY(tickAngle, effectiveSignInR - 8);

      svg
        .append("line")
        .attr("x1", tx1).attr("y1", ty1)
        .attr("x2", tx2).attr("y2", ty2)
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 0.5);

      // Planet dot
      svg
        .append("circle")
        .attr("cx", planetX).attr("cy", planetY)
        .attr("r", 4)
        .attr("fill", getPlanetColor(p.name))
        .attr("stroke", "rgba(255,255,255,0.5)")
        .attr("stroke-width", 0.5);

      // Planet symbol
      svg
        .append("text")
        .attr("x", planetX)
        .attr("y", planetY - 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 14)
        .attr("fill", "#ffffff")
        .attr("cursor", "pointer")
        .text(p.symbol)
        .on("mouseenter", (event: MouseEvent) => {
          const signIndex = Math.floor(p.longitude / 30);
          const signDeg = p.longitude % 30;
          const signName = ZODIAC_SIGNS[signIndex]?.name ?? "?";
          tooltip
            .style("display", "block")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px")
            .text(`${p.name}: ${Math.floor(signDeg)}\u00B0${signName} (natal)`);
        })
        .on("mousemove", (event: MouseEvent) => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
        })
        .on("mouseleave", () => {
          tooltip.style("display", "none");
        });
    });

    // ─── Outer (transit / solar arc) planets — teal/blue ─────────────────

    if (isBiWheel) {
      resolvedOuterPlanets.forEach((p) => {
        const angleRad = (p.angle * Math.PI) / 180;
        const planetX = CENTER + BIWHEEL_PLANET_R * Math.cos(angleRad);
        const planetY = CENTER - BIWHEEL_PLANET_R * Math.sin(angleRad);

        // Tick on outer zodiac ring inner edge
        const tickAngle = eclipticToAngle(p.longitude);
        const [tx1, ty1] = polarToXY(tickAngle, BIWHEEL_SIGN_INNER_R);
        const [tx2, ty2] = polarToXY(tickAngle, BIWHEEL_SIGN_INNER_R + 8);

        svg
          .append("line")
          .attr("x1", tx1).attr("y1", ty1)
          .attr("x2", tx2).attr("y2", ty2)
          .attr("stroke", "rgba(14,165,233,0.5)")
          .attr("stroke-width", 0.5);

        // Planet dot (teal)
        svg
          .append("circle")
          .attr("cx", planetX).attr("cy", planetY)
          .attr("r", 3)
          .attr("fill", "#0ea5e9")
          .attr("stroke", "rgba(255,255,255,0.4)")
          .attr("stroke-width", 0.5);

        // Planet symbol — smaller, teal
        svg
          .append("text")
          .attr("x", planetX)
          .attr("y", planetY - 9)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 11)
          .attr("fill", "#0ea5e9")
          .attr("cursor", "pointer")
          .text(p.symbol)
          .on("mouseenter", (event: MouseEvent) => {
            const signIndex = Math.floor(p.longitude / 30);
            const signDeg = p.longitude % 30;
            const signName = ZODIAC_SIGNS[signIndex]?.name ?? "?";
            tooltip
              .style("display", "block")
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 10 + "px")
              .style("color", "#0ea5e9")
              .text(`${p.name}: ${Math.floor(signDeg)}\u00B0${signName}`);
          })
          .on("mousemove", (event: MouseEvent) => {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 10 + "px");
          })
          .on("mouseleave", () => {
            tooltip.style("display", "none").style("color", "#fbbf24");
          });
      });
    }

    // ─── Ring labels ──────────────────────────────────────────────────────

    if (innerLabel) {
      svg
        .append("text")
        .attr("x", CENTER)
        .attr("y", CENTER + INNER_CIRCLE_R - 12)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 9)
        .attr("fill", "rgba(251,191,36,0.55)")
        .text(innerLabel);
    }

    if (outerLabel && isBiWheel) {
      svg
        .append("text")
        .attr("x", CENTER)
        .attr("y", CENTER - BIWHEEL_OUTER_R + 14)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 9)
        .attr("fill", "rgba(14,165,233,0.7)")
        .text(outerLabel);
    }

    return () => {
      d3.selectAll(".astro-wheel-tooltip").remove();
    };
  }, [
    planets,
    houses,
    computedAspects,
    resolvedPlanets,
    isBiWheel,
    outerPlanets,
    outerHouses,
    resolvedOuterPlanets,
    computedBiAspects,
    showBiAspects,
    innerLabel,
    outerLabel,
    effectiveOuterR,
    effectiveSignInR,
  ]);

  return (
    <div className="flex items-center justify-center w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[600px] min-w-[320px]"
        style={{ aspectRatio: "1 / 1" }}
      />
    </div>
  );
}

// ─── Planet colors ──────────────────────────────────────────────────────────────

function getPlanetColor(name: string): string {
  const colors: Record<string, string> = {
    Sun: "#fbbf24",
    Moon: "#e2e8f0",
    Mercury: "#a78bfa",
    Venus: "#f472b6",
    Mars: "#ef4444",
    Jupiter: "#fb923c",
    Saturn: "#94a3b8",
    Uranus: "#22d3ee",
    Neptune: "#818cf8",
    Pluto: "#a3a3a3",
    "North Node": "#86efac",
    "South Node": "#fca5a5",
    Chiron: "#fde047",
  };
  return colors[name] ?? "#ffffff";
}
