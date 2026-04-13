"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  PLANET_SYMBOLS, ZODIAC_SYMBOLS, ASPECT_SYMBOLS,
  PLANET_IMAGES, ASTRO_HEADER_IMAGES, ASPECT_IMAGES,
  PLANET_KEYWORDS, ASPECT_KEYWORDS,
} from "../constants";
import { parseAspectTitle } from "../utils";

// ─── Manual Planet Icon ──────────────────────────────────────────────────────

export function ManualPlanetIcon({ name, size = "size-7" }: { name: string; size?: string }) {
  const clean = String(name || "").trim().replace(/[(),]/g, "");
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const symbol = PLANET_SYMBOLS[titled] ?? PLANET_SYMBOLS[clean] ?? "•";

  const colors: Record<string, string> = {
    Node: "from-indigo-600 to-purple-700 border-indigo-400/30 shadow-indigo-500/20",
    "Part of Fortune": "from-yellow-400 to-amber-600 border-yellow-300/30 shadow-yellow-500/20",
    Fortune: "from-yellow-400 to-amber-600 border-yellow-300/30 shadow-yellow-500/20",
    Chiron: "from-stone-500 to-emerald-800 border-stone-400/30 shadow-stone-500/20",
    Lilith: "from-slate-700 to-slate-900 border-slate-600/30 shadow-slate-800/20",
    Default: "from-amber-400 to-orange-600 border-amber-300/30 shadow-amber-500/20"
  };

  const colorClass = colors[titled] ?? colors[clean] ?? colors.Default;

  return (
    <div className={cn(
      "flex items-center justify-center rounded-sm bg-gradient-to-br border shadow-md transition-all hover:scale-110",
      colorClass,
      size
    )}>
      <span className="text-white font-bold leading-none select-none drop-shadow-md text-[18px]">
        {symbol}
      </span>
    </div>
  );
}

// ─── Manual Zodiac Icon ──────────────────────────────────────────────────────

export function ManualZodiacIcon({ sign, size = "size-8" }: { sign: string; size?: string }) {
  const symbol = ZODIAC_SYMBOLS[sign] || ZODIAC_SYMBOLS[sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase()] || "";
  if (!symbol) return null;

  const elements: Record<string, string> = {
    Aries: "fire", Leo: "fire", Sagittarius: "fire",
    Taurus: "earth", Virgo: "earth", Capricorn: "earth",
    Gemini: "air", Libra: "air", Aquarius: "air",
    Cancer: "water", Scorpio: "water", Pisces: "water"
  };
  const type = elements[sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase()] || "fire";
  const colors: Record<string, string> = {
    fire: "from-orange-500 to-red-600 border-orange-400/30 shadow-orange-500/20",
    earth: "from-emerald-600 to-green-800 border-emerald-400/30 shadow-emerald-500/20",
    air: "from-blue-400 to-indigo-600 border-blue-300/30 shadow-blue-500/20",
    water: "from-cyan-500 to-blue-700 border-cyan-400/30 shadow-cyan-500/20"
  };

  return (
    <div className={cn(
      "flex items-center justify-center rounded-md bg-gradient-to-br border shadow-lg transition-transform hover:scale-110",
      colors[type],
      size
    )}>
      <span className="text-white font-bold leading-none select-none drop-shadow-md" style={{ fontSize: '1.25rem' }}>
        {symbol}
      </span>
    </div>
  );
}

// ─── Planet Symbol ────────────────────────────────────────────────────────────

export function PlanetSymbol({ name, showImage = true }: { name: string; showImage?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const clean = String(name || "").trim().replace(/[(),]/g, "");
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const imgSrc = PLANET_IMAGES[titled] ?? PLANET_IMAGES[clean];

  return (
    <span className="inline-flex items-center gap-1.5">
      {showImage && imgSrc && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={name}
          className="size-5 object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <ManualPlanetIcon name={name} />
      )}
      <span>{name}</span>
    </span>
  );
}

// ─── Aspect Symbol ───────────────────────────────────────────────────────────

export function AspectSymbol({ type, showText = true }: { type: string; showText?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const clean = String(type || "").trim().replace(/[(),]/g, "");
  const normalized = clean.toLowerCase() === "conjunct" ? "Conjunction" : clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const imgSrc = ASPECT_IMAGES[normalized] ?? ASPECT_IMAGES[clean];

  return (
    <span className="inline-flex items-center gap-1.5">
      {imgSrc && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={type}
          className="size-4 object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-amber-500 text-sm leading-none shrink-0" aria-hidden>
          {ASPECT_SYMBOLS[normalized] ?? ASPECT_SYMBOLS[clean] ?? ""}
        </span>
      )}
      {showText && <span>{type}</span>}
    </span>
  );
}

// ─── Zodiac Symbol ───────────────────────────────────────────────────────────

export function ZodiacSymbol({ sign }: { sign: string }) {
  const [imgError, setImgError] = useState(false);
  const clean = String(sign || "").trim().replace(/[(),]/g, "");
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const imgSrc = ASTRO_HEADER_IMAGES[titled] ?? ASTRO_HEADER_IMAGES[clean];

  return (
    <span className="inline-flex items-center gap-2">
      {imgSrc && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={sign}
          className="size-5 object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <ManualZodiacIcon sign={sign} size="size-5" />
      )}
      <span className="font-medium">{sign}</span>
    </span>
  );
}

// ─── Astro Header Parts ──────────────────────────────────────────────────────

export function AstroHeaderParts({ title }: { title?: string }) {
  if (!title) return null;
  const { p1, aspectType, p2 } = parseAspectTitle(title);
  const terms = [p1, aspectType, p2].filter(Boolean);

  function getImg(term: string) {
    const clean = term.trim().replace(/[(),]/g, "");
    if (!clean) return null;
    if (ASTRO_HEADER_IMAGES[clean]) return ASTRO_HEADER_IMAGES[clean];
    const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    return ASTRO_HEADER_IMAGES[titled];
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap w-full">
      {terms.map((term, i) => {
        const img = getImg(term);
        const isZodiac = ZODIAC_SYMBOLS[term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()];

        return (
          <span key={i} className="flex items-center gap-1.5 grow-0">
            <span className="font-bold uppercase tracking-widest text-current whitespace-nowrap">{term}</span>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="size-5 object-contain shrink-0" />
            ) : isZodiac ? (
              <ManualZodiacIcon sign={term} />
            ) : PLANET_SYMBOLS[term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()] || PLANET_SYMBOLS[term] ? (
              <ManualPlanetIcon name={term} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

// ─── Smart Heading ───────────────────────────────────────────────────────────

export function SmartHeading({ title, className, iconSize = "size-5", textSize = "text-sm" }: { title?: string; className?: string; iconSize?: string; textSize?: string }) {
  if (!title) return null;
  const words = title.split(/\s+/);
  return (
    <div className={cn("flex items-center justify-center gap-x-2 gap-y-1 flex-wrap", className)}>
      {words.map((word, i) => {
        const clean = word.replace(/[(),.:]/g, "").trim();
        const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();

        const planetImg = PLANET_IMAGES[titled];
        const isPlanet = PLANET_SYMBOLS[titled];
        const isZodiac = ZODIAC_SYMBOLS[titled];

        return (
          <span key={i} className="flex items-center gap-2">
            <span className={cn("font-bold uppercase tracking-wider whitespace-nowrap", textSize)}>{word}</span>
            {planetImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={planetImg} alt="" className={cn(iconSize, "object-contain shrink-0")} />
            ) : isPlanet ? (
              <ManualPlanetIcon name={titled} size={iconSize} />
            ) : isZodiac ? (
              <ManualZodiacIcon sign={titled} size={iconSize} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

// ─── Word Association Chips ──────────────────────────────────────────────────

export function WordAssociationChips({ aspecting, type, aspected }: { aspecting: string; type: string; aspected: string }) {
  const p1keys = (PLANET_KEYWORDS[aspecting] ?? []).slice(0, 6);
  const typeKeys = (ASPECT_KEYWORDS[type] ?? []).slice(0, 5);
  const p2keys = (PLANET_KEYWORDS[aspected] ?? []).slice(0, 6);

  if (!p1keys.length && !typeKeys.length && !p2keys.length) return null;

  return (
    <div className="px-4 py-3 bg-muted/10 border-t">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 text-center">{aspecting}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {p1keys.map((kw: string) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-400/20">{kw}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 text-center">{type}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {typeKeys.map((kw: string) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] font-medium border border-purple-400/20">{kw}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 text-center">{aspected}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {p2keys.map((kw: string) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-400/20">{kw}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Orb Circle SVG ──────────────────────────────────────────────────────────

export function OrbCircle({ orb, color }: { orb: number; color: string }) {
  const maxOrb = 10;
  const clampedOrb = Math.min(Math.abs(orb), maxOrb);
  const angle = (clampedOrb / maxOrb) * 2 * Math.PI - Math.PI / 2;
  const needleX = 100 + 65 * Math.cos(angle);
  const needleY = 100 + 65 * Math.sin(angle);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    return { x1: 100 + 88 * Math.cos(a), y1: 100 + 88 * Math.sin(a), x2: 100 + 78 * Math.cos(a), y2: 100 + 78 * Math.sin(a) };
  });
  return (
    <svg width="36" height="36" viewBox="0 0 200 200" className="shrink-0">
      <circle cx="100" cy="100" r="90" fill={color} />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
      ))}
      <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="black" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="black" />
    </svg>
  );
}

// ─── Aspects Legend ──────────────────────────────────────────────────────────

export function AspectsLegend() {
  const items = [
    { color: "#eb910a", label: "Orange", desc: "Very close to exact — strong immediate influence" },
    { color: "#226404", label: "Dark Green", desc: "Just past the exact degree" },
    { color: "#b8b205", label: "Dark Yellow", desc: "Just before the exact degree" },
    { color: "#52fc03", label: "Green", desc: "Moderately past target" },
    { color: "#faf562", label: "Yellow", desc: "Moderately before target" },
    { color: "#76ff81", label: "Light Green", desc: "Further past target" },
    { color: "#ecff46", label: "Light Yellow", desc: "Further before target" },
  ];
  return (
    <div className="mb-4 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">Aspect Proximity Indicator</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border border-border/50 shrink-0" style={{ background: item.color }} />
            <span className="text-[11px] text-muted-foreground"><b>{item.label}:</b> {item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
