export const VALID_PUBLIC_SECTIONS = [
  "hero",
  "bio",
  "services",
  "live",
  "media",
  "testimonials",
  "weekly_subscription",
] as const;

export const VALID_MEDIA_TYPES = [
  "video",
  "audio",
  "article",
  "link",
  "image",
] as const;

export type DivinerPublicSection = (typeof VALID_PUBLIC_SECTIONS)[number];
export type DivinerMediaType = (typeof VALID_MEDIA_TYPES)[number];

export interface DivinerPublishPolicy {
  publicPublishBlocked: boolean;
  blockedPublicSections: DivinerPublicSection[];
  blockedMediaTypes: DivinerMediaType[];
  publishBlockReason: string | null;
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function normalizePublishPolicy(source: Record<string, unknown> | null | undefined): DivinerPublishPolicy {
  const blockedPublicSections = Array.isArray(source?.blocked_public_sections)
    ? dedupe(
        source.blocked_public_sections.filter((value): value is DivinerPublicSection =>
          typeof value === "string" &&
          (VALID_PUBLIC_SECTIONS as readonly string[]).includes(value)
        )
      )
    : [];

  const blockedMediaTypes = Array.isArray(source?.blocked_media_types)
    ? dedupe(
        source.blocked_media_types.filter((value): value is DivinerMediaType =>
          typeof value === "string" &&
          (VALID_MEDIA_TYPES as readonly string[]).includes(value)
        )
      )
    : [];

  return {
    publicPublishBlocked: source?.public_publish_blocked === true,
    blockedPublicSections,
    blockedMediaTypes,
    publishBlockReason:
      typeof source?.publish_block_reason === "string" && source.publish_block_reason.trim()
        ? source.publish_block_reason.trim()
        : null,
  };
}

export function isPublicSectionBlocked(
  policy: DivinerPublishPolicy,
  section: DivinerPublicSection
): boolean {
  return policy.publicPublishBlocked || policy.blockedPublicSections.includes(section);
}

export function isMediaTypeBlocked(
  policy: DivinerPublishPolicy,
  mediaType: string | null | undefined
): boolean {
  return (
    policy.publicPublishBlocked ||
    policy.blockedPublicSections.includes("media") ||
    (typeof mediaType === "string" && policy.blockedMediaTypes.includes(mediaType as DivinerMediaType))
  );
}

export function publishBlockMessage(
  policy: DivinerPublishPolicy,
  fallback: string
): string {
  return policy.publishBlockReason ?? fallback;
}
