/**
 * Ritual video mapping + canonical playlist assembly.
 *
 * Source of truth:
 *   docs/tasks/2026-04-27/01-perennial-mandalism-ritual-playlist-player-and-video-mapping.md
 *
 * Pure module — no I/O, no React, no Supabase calls. Safe to import from
 * server pages, route handlers, and client components alike.
 *
 * Hierarchy reminder (used by sortRitualTagsForPlayback):
 *   1. Elemental gate priority: Fire → Water → Air → Earth → Spirit
 *   2. Entity type within a gate: Inner Planets → Outer Planets → Zodiac Signs
 *   3. Zodiac modality within a gate: Cardinal → Fixed → Mutable
 */

// ── S3 base ─────────────────────────────────────────────────────────────────
export const RITUAL_VIDEO_BASE_URL =
  "https://divineritualasset.s3.us-east-1.amazonaws.com";

/** Build a full S3 URL from a bare filename. Filenames are case-sensitive. */
export function ritualVideoUrl(filename: string): string {
  return `${RITUAL_VIDEO_BASE_URL}/${filename}`;
}

// ── Tag → filename map ──────────────────────────────────────────────────────
//
// Keys are the canonical tags persisted on user_ritual_configurations.
// Multiple tags can resolve to the same filename (e.g. the
// `Pentagram_*_Ritual` aliases). All keys are looked up case-sensitively;
// callers can pre-trim whitespace if their saved tags are noisy.
const TAG_TO_FILENAME: Record<string, string> = {
  // Foundational
  Ritual_Opening: "Ritual_Opening.mp4",
  Ritual_Closing: "Ritual_Closing.mp4",

  // Static / preset rituals
  Pentagram_Gate_Banishing_Ritual: "StandardBanishingRitual.mp4",
  Pentagram_Banishing_Ritual: "StandardBanishingRitual.mp4",
  Pentagram_Gate_Invocation_Ritual: "StandardInvocationRitual.mp4",
  Pentagram_Invocation_Ritual: "StandardInvocationRitual.mp4",
  DIB_Gate_Invocation_Ritual: "Core_Invocation_Ritual.mp4",
  DIB_Invocation_Ritual: "Core_Invocation_Ritual.mp4",

  // Gate openings — invocation
  Fire_Gate_Invocation_Ritual: "fire_gate_invocation.mp4",
  Water_Gate_Invocation_Ritual: "water_gate_invocation.mp4",
  Air_Gate_Invocation_Ritual: "air_gate_invocation.mp4",
  Earth_Gate_Invocation_Ritual: "earth_gate_invocation.mp4",
  Spirit_Gate_Invocation_Ritual: "spirit_gate_invocation.mp4",

  // Gate openings — banishing
  Fire_Gate_Banishing_Ritual: "fire_gate_banishing.mp4",
  Water_Gate_Banishing_Ritual: "water_gate_banishing.mp4",
  Air_Gate_Banishing_Ritual: "air_gate_banishing.mp4",
  Earth_Gate_Banishing_Ritual: "earth_gate_banishing.mp4",
  Spirit_Gate_Banishing_Ritual: "spirit_gate_banishing.mp4",

  // Planetary invocations
  Mars_Invocation_Ritual: "mars_invocation.mp4",
  Jupiter_Invocation_Ritual: "jupiter_invocation.mp4",
  Moon_Invocation_Ritual: "moon_invocation.mp4",
  Neptune_Invocation_Ritual: "neptune_invocation.mp4",
  Mercury_Invocation_Ritual: "mercury_invocation.mp4",
  Uranus_Invocation_Ritual: "uranus_invocation.mp4",
  Venus_Invocation_Ritual: "venus_invocation.mp4",
  Saturn_Invocation_Ritual: "saturn_invocation.mp4",
  Sun_Invocation_Ritual: "sun_invocation.mp4",
  Pluto_Invocation_Ritual: "pluto_invocation.mp4",

  // Zodiac invocations
  Aries_Invocation_Ritual: "aries_invocation.mp4",
  Leo_Invocation_Ritual: "leo_invocation.mp4",
  Sagittarius_Invocation_Ritual: "sagittarius_invocation.mp4",
  Cancer_Invocation_Ritual: "cancer_invocation.mp4",
  Scorpio_Invocation_Ritual: "scorpio_invocation.mp4",
  Pisces_Invocation_Ritual: "pisces_invocation.mp4",
  Libra_Invocation_Ritual: "libra_invocation.mp4",
  Aquarius_Invocation_Ritual: "aquarius_invocation.mp4",
  Gemini_Invocation_Ritual: "gemini_invocation.mp4",
  Capricorn_Invocation_Ritual: "capricorn_invocation.mp4",
  Taurus_Invocation_Ritual: "taurus_invocation.mp4",
  Virgo_Invocation_Ritual: "virgo_invocation.mp4",
};

/** Returns the S3 URL for a tag, or null if the tag is unmapped. */
export function getRitualVideoUrlForTag(tag: string): string | null {
  const filename = TAG_TO_FILENAME[tag];
  return filename ? ritualVideoUrl(filename) : null;
}

/** Returns the bare filename for a tag, or null if unmapped. */
export function getRitualVideoFilenameForTag(tag: string): string | null {
  return TAG_TO_FILENAME[tag] ?? null;
}

// ── Canonical sort priorities ───────────────────────────────────────────────

const ELEMENT_ORDER: Record<string, number> = {
  fire: 0,
  water: 1,
  air: 2,
  earth: 3,
  spirit: 4,
};

const ZODIAC_TO_ELEMENT_AND_MODALITY: Record<
  string,
  { element: keyof typeof ELEMENT_ORDER; modality: 0 | 1 | 2 }
> = {
  // Cardinal=0, Fixed=1, Mutable=2
  aries: { element: "fire", modality: 0 },
  leo: { element: "fire", modality: 1 },
  sagittarius: { element: "fire", modality: 2 },
  cancer: { element: "water", modality: 0 },
  scorpio: { element: "water", modality: 1 },
  pisces: { element: "water", modality: 2 },
  libra: { element: "air", modality: 0 },
  aquarius: { element: "air", modality: 1 },
  gemini: { element: "air", modality: 2 },
  capricorn: { element: "earth", modality: 0 },
  taurus: { element: "earth", modality: 1 },
  virgo: { element: "earth", modality: 2 },
};

// Inner=0, Outer=1 — used for Inner→Outer ordering inside a gate.
const PLANET_TO_ELEMENT_AND_RANK: Record<
  string,
  { element: keyof typeof ELEMENT_ORDER; rank: 0 | 1 }
> = {
  mars: { element: "fire", rank: 0 },
  jupiter: { element: "fire", rank: 1 },
  moon: { element: "water", rank: 0 },
  neptune: { element: "water", rank: 1 },
  mercury: { element: "air", rank: 0 },
  uranus: { element: "air", rank: 1 },
  venus: { element: "earth", rank: 0 },
  saturn: { element: "earth", rank: 1 },
  sun: { element: "spirit", rank: 0 },
  pluto: { element: "spirit", rank: 1 },
};

// ── Tag classification ─────────────────────────────────────────────────────

export type RitualPlaylistKind =
  | "opening"
  | "closing"
  | "gate"
  | "invocation"
  | "static";

interface ClassifiedTag {
  tag: string;
  kind: RitualPlaylistKind;
  /** Element bucket within which this tag is grouped (gates + invocations). */
  element: keyof typeof ELEMENT_ORDER | null;
  /**
   * Sub-rank inside the element bucket:
   *   gate          → 0 (always first within the element)
   *   inner planet  → 1
   *   outer planet  → 2
   *   zodiac        → 3 + modality (0/1/2)
   */
  withinElementRank: number;
}

function classifyTag(tag: string): ClassifiedTag {
  if (tag === "Ritual_Opening") {
    return { tag, kind: "opening", element: null, withinElementRank: 0 };
  }
  if (tag === "Ritual_Closing") {
    return { tag, kind: "closing", element: null, withinElementRank: 0 };
  }

  // Static / preset rituals — preserved in input order, no element grouping.
  if (
    tag === "Pentagram_Gate_Banishing_Ritual" ||
    tag === "Pentagram_Banishing_Ritual" ||
    tag === "Pentagram_Gate_Invocation_Ritual" ||
    tag === "Pentagram_Invocation_Ritual" ||
    tag === "DIB_Gate_Invocation_Ritual" ||
    tag === "DIB_Invocation_Ritual"
  ) {
    return { tag, kind: "static", element: null, withinElementRank: 0 };
  }

  // Gate (banishing OR invocation): "<Element>_Gate_..._Ritual"
  const gateMatch = tag.match(
    /^(Fire|Water|Air|Earth|Spirit)_Gate_(?:Invocation|Banishing)_Ritual$/
  );
  if (gateMatch) {
    const element = gateMatch[1].toLowerCase() as keyof typeof ELEMENT_ORDER;
    return { tag, kind: "gate", element, withinElementRank: 0 };
  }

  // Planet invocation: "<Planet>_Invocation_Ritual"
  const planetMatch = tag.match(/^([A-Z][a-z]+)_Invocation_Ritual$/);
  if (planetMatch) {
    const lower = planetMatch[1].toLowerCase();
    const planet = PLANET_TO_ELEMENT_AND_RANK[lower];
    if (planet) {
      // rank 1 = inner, 2 = outer
      return {
        tag,
        kind: "invocation",
        element: planet.element,
        withinElementRank: planet.rank === 0 ? 1 : 2,
      };
    }
    const zodiac = ZODIAC_TO_ELEMENT_AND_MODALITY[lower];
    if (zodiac) {
      // 3 + modality (0/1/2) keeps zodiacs after both inner and outer planets.
      return {
        tag,
        kind: "invocation",
        element: zodiac.element,
        withinElementRank: 3 + zodiac.modality,
      };
    }
  }

  // Unknown tag — keep it visible but unclassified. Sort pushes these to
  // the end of the middle section, before Closing.
  return { tag, kind: "invocation", element: null, withinElementRank: 99 };
}

// ── Sorting ─────────────────────────────────────────────────────────────────

/**
 * Returns the supplied tags in canonical playback order:
 *   Opening → (gate then planets/zodiacs grouped by element) → Closing
 *
 * Stable: tags that compare equal preserve their input order.
 * Idempotent: sorting an already-sorted list yields the same list.
 */
export function sortRitualTagsForPlayback(tags: string[]): string[] {
  // Dedupe while preserving first-seen order (the saved tag list usually
  // has no dupes, but clients can be sloppy).
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const tag of tags) {
    if (!seen.has(tag)) {
      seen.add(tag);
      unique.push(tag);
    }
  }

  // Carry the original index so we can break ties without disturbing
  // input order (Array.sort is stable on modern JS engines but being
  // explicit is cheap and unmistakable).
  const decorated = unique.map((tag, originalIndex) => ({
    ...classifyTag(tag),
    originalIndex,
  }));

  decorated.sort((a, b) => {
    // Section: opening (0) → middle (1) → closing (2).
    const sectionA = a.kind === "opening" ? 0 : a.kind === "closing" ? 2 : 1;
    const sectionB = b.kind === "opening" ? 0 : b.kind === "closing" ? 2 : 1;
    if (sectionA !== sectionB) return sectionA - sectionB;

    // Inside the middle section: order by element bucket first.
    if (sectionA === 1) {
      const elemA = a.element ? ELEMENT_ORDER[a.element] : 99;
      const elemB = b.element ? ELEMENT_ORDER[b.element] : 99;
      if (elemA !== elemB) return elemA - elemB;

      // Same element: gate(0) → inner(1) → outer(2) → zodiac(3..5).
      if (a.withinElementRank !== b.withinElementRank) {
        return a.withinElementRank - b.withinElementRank;
      }
    }

    // Final tiebreaker: input order.
    return a.originalIndex - b.originalIndex;
  });

  return decorated.map((d) => d.tag);
}

// ── Playlist assembly ──────────────────────────────────────────────────────

export interface RitualPlaylistItem {
  /** Canonical tag from user_ritual_configurations.ritual_tags. */
  tag: string;
  /** Human-readable title derived from the tag (underscores → spaces). */
  title: string;
  /** Full S3 URL, or null when the tag has no mapping (renderer should warn). */
  videoUrl: string | null;
  /** Bare S3 filename, or null when unmapped. */
  filename: string | null;
  /** 1-indexed position in the playlist for display. */
  sequence: number;
  /** Coarse type used for badges and section grouping in the UI. */
  kind: RitualPlaylistKind;
  /** True when no S3 mapping exists — renderer must show a fallback. */
  missing: boolean;
}

/** Pretty-prints a tag for the playlist row title. */
function tagToTitle(tag: string): string {
  return tag.replace(/_/g, " ");
}

/**
 * Build the canonical, ordered playlist from a list of saved tags.
 *
 * Behaviour:
 *  - Re-orders tags via `sortRitualTagsForPlayback` so the persisted tag
 *    array doesn't have to be canonically ordered to play correctly.
 *  - Tags without an S3 mapping survive in the playlist as items with
 *    `missing = true`; the UI is responsible for the fallback treatment.
 *    We never silently drop a tag (acceptance criteria: missing assets
 *    must not be silently skipped).
 */
export function buildRitualPlaylist(tags: string[]): RitualPlaylistItem[] {
  const ordered = sortRitualTagsForPlayback(tags);
  return ordered.map((tag, idx) => {
    const filename = getRitualVideoFilenameForTag(tag);
    const classified = classifyTag(tag);
    return {
      tag,
      title: tagToTitle(tag),
      videoUrl: filename ? ritualVideoUrl(filename) : null,
      filename,
      sequence: idx + 1,
      kind: classified.kind,
      missing: filename === null,
    };
  });
}
