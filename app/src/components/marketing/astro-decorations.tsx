/**
 * SVG decorative elements for astrology/tarot themed backgrounds.
 * These are purely decorative, no interactivity needed.
 */

export function ZodiacWheel({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <circle cx="200" cy="200" r="170" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      {/* Division lines for 12 houses */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 200 + 150 * Math.cos(angle);
        const y1 = 200 + 150 * Math.sin(angle);
        const x2 = 200 + 190 * Math.cos(angle);
        const y2 = 200 + 190 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.12"
          />
        );
      })}
      {/* Zodiac symbols (Unicode) placed around the wheel */}
      {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((symbol, i) => {
        const angle = ((i * 30 - 75) * Math.PI) / 180;
        const x = 200 + 180 * Math.cos(angle);
        const y = 200 + 180 * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize="14"
            opacity="0.2"
          >
            {symbol}
          </text>
        );
      })}
      {/* Inner decorative elements */}
      <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <circle cx="200" cy="200" r="8" fill="currentColor" opacity="0.08" />
      {/* Aspect lines (trine, square, opposition) */}
      <line x1="200" y1="50" x2="70" y2="290" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <line x1="70" y1="290" x2="330" y2="290" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <line x1="330" y1="290" x2="200" y2="50" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
    </svg>
  );
}

export function TarotCardOutline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 340"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="5"
        width="190"
        height="330"
        rx="12"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
      <rect
        x="15"
        y="15"
        width="170"
        height="310"
        rx="8"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.1"
      />
      {/* Star pattern inside card */}
      <circle cx="100" cy="170" r="50" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      {/* Pentagram inside */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle1 = ((i * 72 - 90) * Math.PI) / 180;
        const angle2 = (((i * 72 + 144) - 90) * Math.PI) / 180;
        const x1 = 100 + 45 * Math.cos(angle1);
        const y1 = 170 + 45 * Math.sin(angle1);
        const x2 = 100 + 45 * Math.cos(angle2);
        const y2 = 170 + 45 * Math.sin(angle2);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.08"
          />
        );
      })}
      {/* Decorative corners */}
      <path d="M25 25 L45 25 M25 25 L25 45" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <path d="M175 25 L155 25 M175 25 L175 45" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <path d="M25 315 L45 315 M25 315 L25 295" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <path d="M175 315 L155 315 M175 315 L175 295" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
    </svg>
  );
}

export function MoonPhases({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* New Moon */}
      <circle cx="50" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      {/* Waxing Crescent */}
      <circle cx="120" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <path d="M120 22 A18 18 0 0 1 120 58 A10 18 0 0 0 120 22" fill="currentColor" opacity="0.08" />
      {/* First Quarter */}
      <circle cx="190" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <path d="M190 22 A18 18 0 0 1 190 58 L190 22" fill="currentColor" opacity="0.1" />
      {/* Waxing Gibbous */}
      <circle cx="260" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <path d="M260 22 A18 18 0 0 1 260 58 A10 18 0 0 1 260 22" fill="currentColor" opacity="0.12" />
      {/* Full Moon */}
      <circle cx="330" cy="40" r="18" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="0.5" />
      {/* Waning Gibbous */}
      <circle cx="400" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <path d="M400 22 A18 18 0 0 0 400 58 A10 18 0 0 0 400 22" fill="currentColor" opacity="0.1" />
      {/* Last Quarter */}
      <circle cx="470" cy="40" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <path d="M470 22 A18 18 0 0 0 470 58 L470 22" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

export function StarField({ className = "" }: { className?: string }) {
  // Generate deterministic star positions
  const stars = [
    { x: 10, y: 15, r: 1.2, o: 0.3 }, { x: 85, y: 8, r: 0.8, o: 0.2 },
    { x: 45, y: 42, r: 1, o: 0.15 }, { x: 72, y: 28, r: 1.5, o: 0.25 },
    { x: 28, y: 68, r: 0.7, o: 0.2 }, { x: 92, y: 55, r: 1.3, o: 0.18 },
    { x: 55, y: 82, r: 0.9, o: 0.22 }, { x: 18, y: 90, r: 1.1, o: 0.15 },
    { x: 78, y: 75, r: 0.6, o: 0.25 }, { x: 38, y: 20, r: 1.4, o: 0.12 },
    { x: 62, y: 60, r: 0.8, o: 0.2 }, { x: 5, y: 48, r: 1, o: 0.17 },
    { x: 95, y: 35, r: 0.7, o: 0.22 }, { x: 50, y: 5, r: 1.2, o: 0.13 },
    { x: 33, y: 95, r: 0.9, o: 0.2 }, { x: 80, y: 90, r: 1.1, o: 0.15 },
    { x: 15, y: 55, r: 0.6, o: 0.25 }, { x: 68, y: 12, r: 1.3, o: 0.18 },
    { x: 42, y: 52, r: 0.8, o: 0.22 }, { x: 88, y: 72, r: 1, o: 0.16 },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="currentColor"
          opacity={star.o}
        />
      ))}
    </svg>
  );
}

export function ConstellationLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Constellation pattern (simplified Orion-like) */}
      <circle cx="120" cy="40" r="2" fill="currentColor" opacity="0.25" />
      <circle cx="150" cy="35" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="180" cy="42" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="130" cy="80" r="1.5" fill="currentColor" opacity="0.2" />
      <circle cx="150" cy="75" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="170" cy="78" r="1.5" fill="currentColor" opacity="0.2" />
      <circle cx="110" cy="130" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="150" cy="110" r="2" fill="currentColor" opacity="0.25" />
      <circle cx="190" cy="135" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="130" cy="165" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="170" cy="168" r="1.5" fill="currentColor" opacity="0.15" />
      {/* Connecting lines */}
      <line x1="120" y1="40" x2="150" y2="35" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <line x1="150" y1="35" x2="180" y2="42" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <line x1="130" y1="80" x2="150" y2="75" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <line x1="150" y1="75" x2="170" y2="78" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <line x1="120" y1="40" x2="130" y2="80" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      <line x1="180" y1="42" x2="170" y2="78" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      <line x1="150" y1="75" x2="150" y2="110" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      <line x1="110" y1="130" x2="150" y2="110" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      <line x1="150" y1="110" x2="190" y2="135" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
      <line x1="110" y1="130" x2="130" y2="165" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <line x1="190" y1="135" x2="170" y2="168" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
    </svg>
  );
}
