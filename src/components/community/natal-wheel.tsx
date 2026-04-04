"use client";

/**
 * SVG Natal Chart Wheel — displays planets around a zodiac wheel.
 * Lightweight, no external dependencies.
 */

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅",
  Neptune: "♆", Pluto: "♇",
};

const ELEMENT_COLORS: Record<string, string> = {
  // Fire
  Aries: "#ef4444", Leo: "#f97316", Sagittarius: "#eab308",
  // Earth
  Taurus: "#84cc16", Virgo: "#22c55e", Capricorn: "#10b981",
  // Air
  Gemini: "#06b6d4", Libra: "#3b82f6", Aquarius: "#8b5cf6",
  // Water
  Cancer: "#6366f1", Scorpio: "#a855f7", Pisces: "#ec4899",
};

interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  retrograde: boolean;
}

interface NatalWheelProps {
  planets: PlanetPosition[];
  ascendantLon?: number | null;
  size?: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function NatalWheel({
  planets,
  ascendantLon,
  size = 400,
}: NatalWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.47;
  const signBandR = outerR;
  const signBandInner = outerR * 0.82;
  const planetR = outerR * 0.65;

  // Offset so Aries starts at the ascendant (or 0° if no asc)
  const ascOffset = ascendantLon ?? 0;

  function lonToAngle(lon: number) {
    return ((lon - ascOffset + 360) % 360);
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="max-w-full"
      aria-label="Natal chart wheel"
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={signBandInner} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={outerR * 0.45} fill="none" stroke="#f3f4f6" strokeWidth={0.5} />

      {/* Zodiac sign segments */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const startAngle = lonToAngle(i * 30);
        const midAngle = lonToAngle(i * 30 + 15);
        const color = ELEMENT_COLORS[sign] ?? "#94a3b8";

        // Sector arc
        const startPt = polarToCartesian(cx, cy, signBandR, startAngle);
        const endPt = polarToCartesian(cx, cy, signBandR, startAngle + 30);
        const innerStart = polarToCartesian(cx, cy, signBandInner, startAngle);
        const innerEnd = polarToCartesian(cx, cy, signBandInner, startAngle + 30);

        const sectorPath = [
          `M ${innerStart.x} ${innerStart.y}`,
          `L ${startPt.x} ${startPt.y}`,
          `A ${signBandR} ${signBandR} 0 0 1 ${endPt.x} ${endPt.y}`,
          `L ${innerEnd.x} ${innerEnd.y}`,
          `A ${signBandInner} ${signBandInner} 0 0 0 ${innerStart.x} ${innerStart.y}`,
          "Z",
        ].join(" ");

        const symbolPos = polarToCartesian(
          cx,
          cy,
          (signBandR + signBandInner) / 2,
          midAngle
        );

        return (
          <g key={sign}>
            <path d={sectorPath} fill={color} fillOpacity={0.12} stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
            <text
              x={symbolPos.x}
              y={symbolPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.04}
              fill={color}
              opacity={0.85}
            >
              {ZODIAC_SYMBOLS[sign]}
            </text>
          </g>
        );
      })}

      {/* House dividers (simple 12 spokes from inner ring) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = lonToAngle(i * 30);
        const inner = polarToCartesian(cx, cy, outerR * 0.45, angle);
        const outer = polarToCartesian(cx, cy, signBandInner, angle);
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="#d1d5db"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Ascendant line */}
      {ascendantLon !== null && ascendantLon !== undefined && (
        <>
          {(() => {
            const angle = lonToAngle(ascendantLon);
            const p1 = polarToCartesian(cx, cy, signBandInner, angle);
            const p2 = polarToCartesian(cx, cy, outerR * 0.45, angle);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#f59e0b"
                strokeWidth={1.5}
              />
            );
          })()}
          <text
            x={polarToCartesian(cx, cy, signBandInner * 1.02, lonToAngle(ascendantLon)).x}
            y={polarToCartesian(cx, cy, signBandInner * 1.02, lonToAngle(ascendantLon)).y}
            fontSize={size * 0.03}
            fill="#f59e0b"
            textAnchor="middle"
          >
            ASC
          </text>
        </>
      )}

      {/* Planets */}
      {planets.map((planet) => {
        const angle = lonToAngle(planet.longitude);
        const pos = polarToCartesian(cx, cy, planetR, angle);
        const symbol = PLANET_SYMBOLS[planet.name] ?? planet.name[0];
        const color = ELEMENT_COLORS[planet.sign] ?? "#6b7280";

        return (
          <g key={planet.name}>
            <circle cx={pos.x} cy={pos.y} r={size * 0.028} fill="white" stroke={color} strokeWidth={0.8} />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.035}
              fill={color}
            >
              {symbol}
            </text>
            {planet.retrograde && (
              <text
                x={pos.x + size * 0.022}
                y={pos.y - size * 0.022}
                fontSize={size * 0.022}
                fill="#9ca3af"
              >
                ℞
              </text>
            )}
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={outerR * 0.12} fill="white" stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}
