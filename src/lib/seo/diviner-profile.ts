/**
 * SEO composition helpers for diviner profile pages.
 *
 * Centralises title, description, indexation, and Open Graph rules so
 * individual page files never implement their own ad-hoc fallback logic.
 */

import { APP_URL } from "@/lib/constants";
import { getDivinerAvatarUrl, getDivinerCoverImageUrl } from "@/lib/diviner-images";

// ── Types ────────────────────────────────────────────────────────────────────

export type DivinerSeoFields = {
  username: string;
  display_name: string;
  bio?: string | null;
  tagline?: string | null;
  specialties?: string[] | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  is_active?: boolean | null;
  // SEO override fields (from migration 20260413000180)
  seo_title_override?: string | null;
  seo_description_override?: string | null;
  seo_h1_override?: string | null;
  seo_primary_keyword?: string | null;
  seo_secondary_keywords?: string[] | null;
  seo_og_image_url?: string | null;
  seo_city?: string | null;
  seo_region?: string | null;
  seo_country?: string | null;
  seo_is_remote_global?: boolean | null;
  seo_languages?: string[] | null;
  seo_years_experience?: number | null;
};

export type PublishPolicy = {
  publicPublishBlocked?: boolean;
  blockedSections?: string[];
};

// ── SEO completeness score ───────────────────────────────────────────────────

/**
 * Returns a completeness score 0–100 for the profile's SEO readiness.
 * Profiles below MIN_INDEXABLE_SCORE will receive a robots noindex directive.
 */
export function calcSeoCompletenessScore(diviner: DivinerSeoFields): number {
  const checks: boolean[] = [
    !!diviner.display_name,
    !!(diviner.bio && diviner.bio.length >= 80),
    !!(diviner.tagline && diviner.tagline.length >= 20),
    !!(diviner.specialties && diviner.specialties.length > 0),
    !!diviner.avatar_url,
    !!diviner.cover_image_url,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export const MIN_INDEXABLE_SCORE = 50; // must pass at least 3 of 6 checks

// ── Title composition ────────────────────────────────────────────────────────

/**
 * Builds the page <title> for a diviner profile.
 *
 * Priority order:
 * 1. seo_title_override (admin-controlled, already within 70 chars)
 * 2. display_name + primary specialty phrase + "AstrologyPro"
 * 3. display_name + "- Book a Reading" (fallback)
 */
export function buildProfileTitle(diviner: DivinerSeoFields): string {
  if (diviner.seo_title_override) return diviner.seo_title_override;

  const keyword = diviner.seo_primary_keyword;
  const specialty =
    keyword ??
    (diviner.specialties && diviner.specialties.length > 0
      ? diviner.specialties.slice(0, 2).join(" & ")
      : null);

  if (specialty) {
    return `${diviner.display_name} | ${capitalise(specialty)} | AstrologyPro`;
  }

  return `${diviner.display_name} - Book a Reading`;
}

// ── Description composition ──────────────────────────────────────────────────

/**
 * Builds the meta description for a diviner profile.
 *
 * Priority order:
 * 1. seo_description_override
 * 2. tagline (short, punchy — ideal meta description)
 * 3. bio excerpt + geo or remote signal
 * 4. Generic fallback
 */
export function buildProfileDescription(
  diviner: DivinerSeoFields,
  heroBlocked: boolean,
  bioBlocked: boolean,
): string {
  if (diviner.seo_description_override) return diviner.seo_description_override;

  if (!heroBlocked && diviner.tagline) return diviner.tagline;

  if (!bioBlocked && diviner.bio) {
    const excerpt = diviner.bio.length > 140 ? `${diviner.bio.slice(0, 137)}…` : diviner.bio;
    const geoSuffix = buildGeoSuffix(diviner);
    return geoSuffix ? `${excerpt} ${geoSuffix}` : excerpt;
  }

  const geoSuffix = buildGeoSuffix(diviner);
  return `Book a reading with ${diviner.display_name} on AstrologyPro.${geoSuffix ? " " + geoSuffix : ""}`;
}

// ── Geo / remote suffix ──────────────────────────────────────────────────────

function buildGeoSuffix(diviner: DivinerSeoFields): string {
  if (diviner.seo_is_remote_global) return "Available worldwide via video and chat.";
  if (diviner.seo_city && diviner.seo_country) {
    return `Based in ${diviner.seo_city}, ${diviner.seo_country}.`;
  }
  if (diviner.seo_region && diviner.seo_country) {
    return `Based in ${diviner.seo_region}, ${diviner.seo_country}.`;
  }
  return "";
}

// ── Canonical URL ────────────────────────────────────────────────────────────

/**
 * Always resolves to /{username} — strips all query parameters.
 * This is the single canonical identity URL for the diviner.
 */
export function buildProfileCanonical(username: string): string {
  return `${APP_URL}/${username}`;
}

// ── Indexation policy ────────────────────────────────────────────────────────

export type RobotsDirective = {
  index: boolean;
  follow: boolean;
};

/**
 * Returns the robots directive for a diviner profile page.
 *
 * noindex when:
 * - diviner is not active
 * - publish controls block the public view
 * - SEO completeness score is below MIN_INDEXABLE_SCORE
 */
export function buildProfileRobots(
  diviner: DivinerSeoFields,
  publishBlocked: boolean,
): RobotsDirective {
  if (!diviner.is_active || publishBlocked) {
    return { index: false, follow: false };
  }
  const score = calcSeoCompletenessScore(diviner);
  if (score < MIN_INDEXABLE_SCORE) {
    return { index: false, follow: true };
  }
  return { index: true, follow: true };
}

// ── Open Graph image ─────────────────────────────────────────────────────────

export type OgImageEntry = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * Returns the preferred OG image with correct dimensions and alt text.
 *
 * Fallback order:
 * 1. seo_og_image_url (explicit override)
 * 2. cover_image_url (1200×400 banner)
 * 3. avatar_url (400×400 portrait)
 */
export function buildProfileOgImage(
  diviner: DivinerSeoFields,
  heroBlocked: boolean,
): OgImageEntry | null {
  if (heroBlocked) return null;

  const alt = `${diviner.display_name} — AstrologyPro`;

  if (diviner.seo_og_image_url) {
    return { url: diviner.seo_og_image_url, width: 1200, height: 630, alt };
  }

  const cover = getDivinerCoverImageUrl(diviner.cover_image_url ?? null);
  if (cover) return { url: cover, width: 1200, height: 400, alt };

  const avatar = getDivinerAvatarUrl(diviner.avatar_url ?? null);
  if (avatar) return { url: avatar, width: 400, height: 400, alt };

  return null;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
