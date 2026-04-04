/**
 * Ported from Angular ingress-ikon.service.ts (IconMapService)
 *
 * SVG icon strings for all 10 classical planets and 12 zodiac signs.
 * Use as inline SVG or render via dangerouslySetInnerHTML where appropriate.
 */

export type AstroElement = "Fire" | "Earth" | "Air" | "Water" | "Spirit";

export interface AstroIconEntry {
  name: string;
  element: AstroElement;
  svg: string;
}

export const PLANET_ICONS: AstroIconEntry[] = [
  {
    name: "Jupiter",
    element: "Fire",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h12"/><path d="M14 2a10 10 0 0 0-10 10v0"/><path d="M14 22a10 10 0 0 1-10-10v0"/></svg>`,
  },
  {
    name: "Mars",
    element: "Fire",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m19 5-14 14"/></svg>`,
  },
  {
    name: "Mercury",
    element: "Air",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="4"/><path d="M12 10v12"/><path d="M8 18h8"/><path d="M8 14h8"/></svg>`,
  },
  {
    name: "Moon",
    element: "Water",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  {
    name: "Neptune",
    element: "Water",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M12 2a10 10 0 0 0-5.5 18"/><path d="M12 22a10 10 0 0 0 5.5-18"/></svg>`,
  },
  {
    name: "Pluto",
    element: "Spirit",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-5.5 18"/><path d="M12 2v20"/><circle cx="12" cy="8" r="3"/></svg>`,
  },
  {
    name: "Saturn",
    element: "Earth",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h12"/><path d="M14 2a10 10 0 0 0-10 10v0"/><path d="M12 12h2"/></svg>`,
  },
  {
    name: "Sun",
    element: "Spirit",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>`,
  },
  {
    name: "Uranus",
    element: "Air",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M12 12h10"/><path d="M12 12H2"/><path d="M12 12a5 5 0 0 0 5 5v0a5 5 0 0 0-10 0v0a5 5 0 0 0 5-5Z"/></svg>`,
  },
  {
    name: "Venus",
    element: "Earth",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M12 14v8"/><path d="M8 20h8"/></svg>`,
  },
];

export const ZODIAC_ICONS: AstroIconEntry[] = [
  {
    name: "Aquarius",
    element: "Air",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 15 4-4 4 4 4-4 4 4"/><path d="m3 8 4-4 4 4 4-4 4 4"/></svg>`,
  },
  {
    name: "Aries",
    element: "Fire",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M17 5s-5 3-5 7 5 7 5 7"/></svg>`,
  },
  {
    name: "Cancer",
    element: "Water",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 6-6v0a6 6 0 0 1 6 6"/><path d="M18 15a6 6 0 0 1-6 6v0a6 6 0 0 1-6-6"/></svg>`,
  },
  {
    name: "Capricorn",
    element: "Earth",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3v4"/><path d="M16 7a2 2 0 0 1-2 2H6"/><path d="M14 9s-1 1-4 1-4-1-4-1"/><path d="M10 17a4 4 0 1 0-8 0c0-2 2-3 4-3s4 1 4 3Z"/></svg>`,
  },
  {
    name: "Gemini",
    element: "Air",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 18h18"/><path d="M7 6v12"/><path d="M17 6v12"/></svg>`,
  },
  {
    name: "Leo",
    element: "Fire",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 0 1 8 8 8 8 0 0 1-8 8"/><path d="M20 12c0-2.5-2-4-4-4"/><path d="M16 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/></svg>`,
  },
  {
    name: "Libra",
    element: "Air",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 16h16"/><path d="M8 12V8c0-2.2 1.8-4 4-4s4 1.8 4 4v4"/></svg>`,
  },
  {
    name: "Pisces",
    element: "Water",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21a6 6 0 0 1 0-12 6 6 0 0 0 0-6"/><path d="M19 3a6 6 0 0 1 0 12 6 6 0 0 0 0 6"/><path d="M5 12h14"/></svg>`,
  },
  {
    name: "Sagittarius",
    element: "Fire",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-6-6"/><path d="m3 3 6 6"/><path d="M15 3h6v6"/><path d="M9 21H3v-6"/></svg>`,
  },
  {
    name: "Scorpio",
    element: "Water",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h5"/><path d="M9 10s1 0 1-1V5"/><path d="M12 4h1a2 2 0 0 1 2 2v1"/><path d="m14 10 3 3 3-3"/><path d="M17 10v10"/></svg>`,
  },
  {
    name: "Taurus",
    element: "Earth",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3a6 6 0 0 0 12 0"/><path d="M12 21a6 6 0 0 0 0-12 6 6 0 0 0 0 12Z"/></svg>`,
  },
  {
    name: "Virgo",
    element: "Earth",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16"/><path d="M8 4v16"/><path d="M12 4v16"/><path d="M16 4v16"/><path d="M20 4v16"/></svg>`,
  },
];

/** Flat lookup map: name → svg string */
export const ASTRO_ICON_MAP: Record<string, string> = Object.fromEntries(
  [...PLANET_ICONS, ...ZODIAC_ICONS].map((item) => [item.name, item.svg])
);

/** Returns the SVG string for a planet or zodiac sign name, or null if not found. */
export function getAstroIcon(name: string): string | null {
  return ASTRO_ICON_MAP[name] ?? null;
}
