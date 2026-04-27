/**
 * Ritual identity normalization helpers.
 *
 * Used by the create-ritual flow (UI + API) to determine whether a given
 * (ritual_name, ritual_tags) pair already exists for the current user, so
 * we can reuse the existing record instead of creating a duplicate.
 *
 * Identity rules:
 *   - Two rituals are the same iff they share the same `ritual_name` AND
 *     the same canonical (deduped + sorted) set of `ritual_tags`.
 *   - Comparison is order-insensitive: clicking planets/zodiacs in a
 *     different order must still resolve to the same ritual.
 *   - Tag values are compared case-sensitively (they are programmatic
 *     identifiers like `Pentagram_Banishing_Ritual`, not free text).
 *
 * This module is intentionally pure — no I/O, no Supabase imports — so it
 * can be safely shared between server (API route) and client (UI) code,
 * and unit-tested in isolation.
 */

/**
 * Returns a deduplicated, lexicographically sorted copy of the input tag
 * list. Empty / non-string entries are stripped. Whitespace is trimmed.
 *
 * The output is the canonical "identity" form of a ritual's tag set.
 */
export function normalizeRitualTags(tags: readonly unknown[]): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    cleaned.push(trimmed);
  }
  // Dedup then sort. Sort first would also work, but Set keeps things tidy.
  const unique = Array.from(new Set(cleaned));
  unique.sort();
  return unique;
}

/**
 * Builds a stable string key that uniquely identifies a ritual definition
 * for a given user. Two ritual definitions produce the same key iff they
 * are logically equivalent under {@link isSameRitualDefinition}.
 *
 * Format: `<trimmed ritual_name>::<tag1>|<tag2>|...` where tags are the
 * output of {@link normalizeRitualTags}. The double-colon separator keeps
 * the name segment unambiguous even if a tag happened to contain a colon.
 *
 * NOTE: This key is currently used only in-memory for comparison — it is
 * NOT yet persisted to the database. If/when we add a derived
 * `ritual_identity_key` column with a unique index, this is the function
 * to use for that backfill.
 */
export function buildRitualIdentityKey(
  ritualName: string,
  tags: readonly unknown[]
): string {
  const normalizedName = (ritualName ?? "").trim();
  const normalizedTags = normalizeRitualTags(tags);
  return `${normalizedName}::${normalizedTags.join("|")}`;
}

/**
 * Returns true iff two (name, tags) pairs describe the same ritual under
 * canonical normalization. Use this on the server when scanning a user's
 * existing rituals to find a duplicate before insert.
 */
export function isSameRitualDefinition(
  leftName: string,
  leftTags: readonly unknown[],
  rightName: string,
  rightTags: readonly unknown[]
): boolean {
  return (
    buildRitualIdentityKey(leftName, leftTags) ===
    buildRitualIdentityKey(rightName, rightTags)
  );
}
