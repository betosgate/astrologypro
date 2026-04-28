export const STATIC_RITUAL_TAGS_BY_KEY: Record<string, string[]> = {
  standard_banishing_pentagram: ["Pentagram_Banishing_Ritual"],
  standard_invocation_pentagram: ["Pentagram_Invocation_Ritual"],
  dib_invocation_ritual: ["DIB_Invocation_Ritual"],
};

export const PLANETARY_ZODIACAL_RITUAL_KEY =
  "planetary_zodiacal_invocation";

export function isCommunityCreatableRitualKey(key: string): boolean {
  return (
    key === PLANETARY_ZODIACAL_RITUAL_KEY ||
    Object.prototype.hasOwnProperty.call(STATIC_RITUAL_TAGS_BY_KEY, key)
  );
}

export function getStaticRitualTagsForKey(key: string): string[] | null {
  const tags = STATIC_RITUAL_TAGS_BY_KEY[key];
  return tags ? [...tags] : null;
}
