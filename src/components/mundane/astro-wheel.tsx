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
};

// ─── Constants ──────────────────────────────────────────────────────────────────

const SIZE = 600;
const CENTER = SIZE / 2;

// Radii
const OUTER_R = 280;
const SIGN_INNER_R = 245;
const HOUSE_OUTER_R = SIGN_INNER_R;
const PLANET_R = 210;
const ASPECT_R = 150;
const INNER_CIRCLE_R = 150;

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
  conjunction: "#4ade80",
  sextile: "#60a5fa",
  square: "#f87171",
  trine: "#4ade80",
  opposition: "#f87171",
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

export function AstroWheel({ planets, houses, aspects }: AstroWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const computedAspects = useMemo(
    () => aspects ?? detectAspects(planets),
    [aspects, planets]
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

    // ─── Zodiac outer ring ────────────────────────────────────────────────

    const arcGen = d3
      .arc<unknown>()
      .innerRadius(SIGN_INNER_R)
      .outerRadius(OUTER_R);

    const signGroup = svg.append("g").attr("transform", `translate(${CENTER},${CENTER})`);

    ZODIAC_SIGNS.forEach((sign, i) => {
      // In astrology: 0 Aries at 9 o'clock (left = pi radians), counter-clockwise.
      // Each sign spans 30 degrees counter-clockwise.
      // For D3 arc: startAngle/endAngle are clockwise from 12 o'clock.
      // To map: ecliptic 0 (Aries start) at 9 o'clock = 3pi/2 in D3 clockwise-from-top
      // Actually let's think in terms of SVG coordinate:
      // ecliptic degree D -> SVG angle (from 3 o'clock, counter-clockwise) = 180 - D
      // D3 arc uses angle from 12 o'clock, clockwise.
      // SVG angle A (from 3 o'clock CCW) -> D3 angle = pi/2 - A (in radians)
      // So ecliptic D -> D3 angle = pi/2 - (180-D)*pi/180 = pi/2 - pi + D*pi/180 = D*pi/180 - pi/2

      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;
      const d3Start = (startDeg * Math.PI) / 180 - Math.PI / 2;
      const d3End = (endDeg * Math.PI) / 180 - Math.PI / 2;

      // Alternating background
      signGroup
        .append("path")
        .attr(
          "d",
          arcGen({
            startAngle: d3Start,
            endAngle: d3End,
            innerRadius: SIGN_INNER_R,
            outerRadius: OUTER_R,
          })
        )
        .attr("fill", i % 2 === 0 ? "rgba(251,191,36,0.12)" : "rgba(251,191,36,0.06)")
        .attr("stroke", "rgba(251,191,36,0.4)")
        .attr("stroke-width", 0.5);

      // Sign glyph - place at center of arc segment
      const midDeg = startDeg + 15;
      const midAngle = eclipticToAngle(midDeg);
      const midR = (SIGN_INNER_R + OUTER_R) / 2;
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

    // Sign boundary lines on outer ring
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const angle = eclipticToAngle(deg);
      const [x1, y1] = polarToXY(angle, SIGN_INNER_R);
      const [x2, y2] = polarToXY(angle, OUTER_R);
      svg
        .append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "rgba(251,191,36,0.4)")
        .attr("stroke-width", 0.5);
    }

    // Inner circle
    svg
      .append("circle")
      .attr("cx", CENTER)
      .attr("cy", CENTER)
      .attr("r", INNER_CIRCLE_R)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 0.5);

    // Inner border of zodiac ring
    svg
      .append("circle")
      .attr("cx", CENTER)
      .attr("cy", CENTER)
      .attr("r", SIGN_INNER_R)
      .attr("fill", "none")
      .attr("stroke", "rgba(251,191,36,0.4)")
      .attr("stroke-width", 0.5);

    // Outer border
    svg
      .append("circle")
      .attr("cx", CENTER)
      .attr("cy", CENTER)
      .attr("r", OUTER_R)
      .attr("fill", "none")
      .attr("stroke", "rgba(251,191,36,0.5)")
      .attr("stroke-width", 1);

    // ─── House cusps ──────────────────────────────────────────────────────

    if (houses && houses.length === 12) {
      houses.forEach((cusp, i) => {
        const angle = eclipticToAngle(cusp);
        const [x1, y1] = polarToXY(angle, INNER_CIRCLE_R);
        const [x2, y2] = polarToXY(angle, HOUSE_OUTER_R);

        // ASC (house 1) and MC (house 10) are thicker
        const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;

        svg
          .append("line")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
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
          .attr("x", lx)
          .attr("y", ly)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 10)
          .attr("fill", "rgba(255,255,255,0.3)")
          .text(String(i + 1));
      });
    }

    // ─── Aspect lines ─────────────────────────────────────────────────────

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
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", ASPECT_COLORS[asp.type] ?? "#888")
        .attr("stroke-width", 0.8)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", asp.type === "opposition" || asp.type === "square" ? "4,3" : "none");
    });

    // ─── Planets ──────────────────────────────────────────────────────────

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

    resolvedPlanets.forEach((p) => {
      const displayAngle = (p.angle * Math.PI) / 180;
      // Convert display angle (degrees from 3 o'clock CCW) to cartesian
      const px = CENTER + PLANET_R * Math.cos((displayAngle * Math.PI) / 180);
      const py = CENTER - PLANET_R * Math.sin((displayAngle * Math.PI) / 180);

      // Actually p.angle is already in degrees (from 3 o'clock CCW sense: 180 - longitude)
      // We need radians for cos/sin
      const angleRad = (p.angle * Math.PI) / 180;
      const planetX = CENTER + PLANET_R * Math.cos(angleRad);
      const planetY = CENTER - PLANET_R * Math.sin(angleRad);

      // Small tick from zodiac ring inner to planet position area
      const tickAngle = eclipticToAngle(p.longitude);
      const [tx1, ty1] = polarToXY(tickAngle, SIGN_INNER_R);
      const [tx2, ty2] = polarToXY(tickAngle, SIGN_INNER_R - 8);

      svg
        .append("line")
        .attr("x1", tx1)
        .attr("y1", ty1)
        .attr("x2", tx2)
        .attr("y2", ty2)
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 0.5);

      // Planet dot
      svg
        .append("circle")
        .attr("cx", planetX)
        .attr("cy", planetY)
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
            .text(`${p.name}: ${Math.floor(signDeg)}\u00B0${signName}`);
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

    return () => {
      d3.selectAll(".astro-wheel-tooltip").remove();
    };
  }, [planets, houses, computedAspects, resolvedPlanets]);

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
