import { ASPECT_TYPE_WORDS, MONTH_NAMES } from "./constants";
import type { BirthInput } from "./types";

export function parseDecimalTz(offset: string): number {
  const sign = offset[0] === "-" ? -1 : 1;
  const [h, m] = offset.slice(1).split(":").map(Number);
  return sign * (h + (m || 0) / 60);
}

export function parseBirth(b: BirthInput) {
  const [year, month, day] = b.dob.split("-").map(Number);
  const [hour, min] = b.tob.split(":").map(Number);
  return { day, month, year, hour, min, lat: b.city!.lat, lon: b.city!.lng, tzone: parseDecimalTz(b.city!.timezone.offset_string) };
}

export function freeWheelBody(b: BirthInput) {
  const [year, month, day] = b.dob.split("-").map(Number);
  const [hours, minutes] = b.tob.split(":").map(Number);
  return { hours, minutes, date: day, month, year, latitude: b.city!.lat, longitude: b.city!.lng, timezone: parseDecimalTz(b.city!.timezone.offset_string) };
}

export function pad(n: number) { return n.toString().padStart(2, "0"); }

export function getPlanetDegree(planets: any[], name: string) {
  const p = planets?.find((x: any) => x.name?.toLowerCase() === name.toLowerCase());
  return p?.full_degree ?? null;
}

export function getAspectOrbColor(orb: number, type: string, ap: string, asp: string): string {
  const ranges: Record<string, number> = { Sun: 2.5, Moon: 2, Mercury: 2.2, Venus: 2.3, Mars: 2.4, Jupiter: 3, Saturn: 3.2, Uranus: 3.5, Neptune: 3.7, Pluto: 4 };
  let nearExact = ((ranges[ap] ?? 3) + (ranges[asp] ?? 3)) / 2;
  if (type === "Conjunction" || type === "Opposition") nearExact += 0.5;
  else if (type === "Sextile") nearExact -= 0.2;
  const orbVal = (["Conjunction", "Opposition"].includes(type)) ? 8 : 6;
  const abs = Math.abs(orb);
  if (abs <= nearExact) return "#eb910a";
  if (abs <= 1.5 * nearExact) return orb < 0 ? "#b8b205" : "#226404";
  if (abs <= orbVal / 3) return orb < 0 ? "#faf562" : "#52fc03";
  if (abs <= (2 * orbVal) / 3) return orb < 0 ? "#ecff46" : "#76ff81";
  return orb < 0 ? "#fffdba" : "#a6ffad";
}

export function getPlanetInterpClass(planetName: string): string {
  const key = planetName?.toLowerCase().trim();
  const map: Record<string, string> = {
    sun: "planet-interp-sun",
    moon: "planet-interp-moon",
    mercury: "planet-interp-mercury",
    venus: "planet-interp-venus",
    mars: "planet-interp-mars",
    jupiter: "planet-interp-jupiter",
    saturn: "planet-interp-saturn",
    uranus: "planet-interp-uranus",
    neptune: "planet-interp-neptune",
    pluto: "planet-interp-pluto",
  };
  return map[key] ?? "interp-gradient-default";
}

export function getRelationshipBgClass(itemTitle: string, tabSlug?: string, sectionKey?: string): string {
  const isRel = tabSlug && ["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2", "horary_chart_v2"].includes(tabSlug);
  if (!isRel) return "interp-gradient-default";

  const lower = itemTitle.toLowerCase();

  // 1. Planet-specific detection (Highest Priority)
  if (lower.includes("sun")) return "planet-interp-sun";
  if (lower.includes("moon")) return "planet-interp-moon";
  if (lower.includes("mercury")) return "planet-interp-mercury";
  if (lower.includes("venus")) return "planet-interp-venus";
  if (lower.includes("mars")) return "planet-interp-mars";
  if (lower.includes("jupiter")) return "planet-interp-jupiter";
  if (lower.includes("saturn")) return "planet-interp-saturn";
  if (lower.includes("uranus")) return "planet-interp-uranus";
  if (lower.includes("neptune")) return "planet-interp-neptune";
  if (lower.includes("pluto")) return "planet-interp-pluto";

  // Karmic bodies
  if (lower.includes("node") || lower.includes("chiron")) return "section-karmic-indicators";

  // 2. Elemental fallback
  if (lower.includes("fire")) return "planet-interp-mars";
  if (lower.includes("water")) return "planet-interp-neptune";
  if (lower.includes("air")) return "planet-interp-mercury";
  if (lower.includes("earth")) return "planet-interp-venus";

  // 3. Section fallback
  if (sectionKey === "timing_and_transits") return "section-timing-transits";
  if (sectionKey === "karmic_and_soulmate_indicators") return "section-karmic-indicators";
  if (sectionKey === "compatibility_score_or_summary") return "planet-interp-sun";

  return "interp-gradient-default";
}

export function parseAspectTitle(title?: string): { p1: string; aspectType: string; p2: string } {
  if (!title) return { p1: "", aspectType: "", p2: "" };
  const parts = title.split(/\s+/);
  const idx = parts.findIndex((p) => ASPECT_TYPE_WORDS.some((at) => at.toLowerCase() === p.toLowerCase()));
  if (idx < 0) return { p1: parts[0] ?? "", aspectType: parts[1] ?? "", p2: parts.slice(2).join(" ") };
  const rawType = parts[idx];
  const aspectType = rawType.toLowerCase() === "conjunct" ? "Conjunction" : rawType;
  return {
    p1: parts.slice(0, idx).join(" "),
    aspectType,
    p2: parts.slice(idx + 1).join(" "),
  };
}

export function getMonthName(m: number): string { return MONTH_NAMES[(m ?? 1) - 1] ?? String(m); }

export function convertTo12HourFormat(hour: number, min: number): string {
  const h = Number(hour ?? 0);
  const m = Number(min ?? 0);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export const emptyBirth = (): BirthInput => ({ dob: "", tob: "", city: null });
export const defaultForm = () => ({
  person1: emptyBirth(), person2: emptyBirth(),
  areaOfInquiry: "", question: "", futureWeek: "", futureMonth: "",
});
