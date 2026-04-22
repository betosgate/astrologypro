/**
 * Server-side HTML sanitizer for landing-page content.
 *
 * Two entry points:
 *
 * - `sanitizeSectionHtml(html)` — LEGACY silent mode. Runs input through a
 *   broad sanitize-html allowlist and returns a cleaned string. Disallowed
 *   tags/attributes are stripped without surfacing. Kept for backward
 *   compatibility with pre-V2 callers while they migrate to the strict mode
 *   below.
 *
 * - `sanitizeDivinerHtml(input)` + `sanitizeDivinerHtmlStrict(input)` — V2
 *   STRICT mode per Task 03 of 2026-04-21/landing-page-simplification. Uses a
 *   tiny allowlist (p/br/strong/em/u/ul/ol/li/h3/h4/blockquote/a). The strict
 *   helper compares normalized input vs. output and throws a
 *   `HtmlSanitizationError` when they differ so the API handler can surface a
 *   422 Problem Details error back to the diviner.
 *
 * Public rendering trusts the stored value because every write path is routed
 * through one of the sanitize helpers. The column value in the DB is therefore
 * always already-clean against the allowlist.
 */

import sanitizeHtml from "sanitize-html";

// ── Legacy (broad) allowlist ─────────────────────────────────────────────────

const LEGACY_ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins",
  "ul", "ol", "li",
  "a",
  "blockquote", "pre", "code",
  "img",
  "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
];

const LEGACY_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  "*": ["class", "id"],
};

const LEGACY_ALLOWED_SCHEMES = ["http", "https", "mailto"];

/**
 * LEGACY sanitizer — permissive allowlist, silent drop. New code should use
 * `sanitizeDivinerHtmlStrict()` instead.
 */
export function sanitizeSectionHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtml(html, {
    allowedTags: LEGACY_ALLOWED_TAGS,
    allowedAttributes: LEGACY_ALLOWED_ATTRS,
    allowedSchemes: LEGACY_ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      img: ["http", "https"],
      a: LEGACY_ALLOWED_SCHEMES,
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal && {
              target: "_blank",
              rel: "noopener noreferrer",
            }),
          },
        };
      },
    },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      const selfClosing = ["br", "hr", "img"].includes(frame.tag);
      return !selfClosing && !frame.text && !frame.mediaChildren?.length;
    },
  });
}

// ── V2 strict allowlist ──────────────────────────────────────────────────────

const DIVINER_ALLOWED_TAGS = [
  "p", "br",
  "strong", "em", "u",
  "ul", "ol", "li",
  "h3", "h4",
  "blockquote",
  "a",
];

const DIVINER_ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title"],
};

const DIVINER_ALLOWED_SCHEMES = ["http", "https", "mailto"];

/**
 * Run user-supplied HTML through the strict V2 allowlist. Silent — returns
 * cleaned output. Use for comparison against the raw input in strict mode.
 */
export function sanitizeDivinerHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return sanitizeHtml(input, {
    allowedTags: DIVINER_ALLOWED_TAGS,
    allowedAttributes: DIVINER_ALLOWED_ATTRS,
    allowedSchemes: DIVINER_ALLOWED_SCHEMES,
    allowedSchemesByTag: { a: DIVINER_ALLOWED_SCHEMES },
    disallowedTagsMode: "discard",
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
  });
}

/**
 * Thrown by `sanitizeDivinerHtmlStrict()` when the sanitizer changed the
 * input. Carries enough detail for the API to return an RFC 9457 422
 * Problem Details response with a `stripped_example` hint.
 */
export class HtmlSanitizationError extends Error {
  readonly strippedExample: string | null;
  readonly sanitized: string;

  constructor(original: string, sanitized: string) {
    super("Disallowed HTML tags or attributes were stripped.");
    this.name = "HtmlSanitizationError";
    this.sanitized = sanitized;
    this.strippedExample = firstDisallowedToken(original);
  }
}

/**
 * Strict mode. Sanitize, compare, throw `HtmlSanitizationError` if the input
 * would be mutated. The caller persists the returned value unchanged; the
 * public renderer can then trust the column value without resanitizing.
 */
export function sanitizeDivinerHtmlStrict(input: string): string {
  const cleaned = sanitizeDivinerHtml(input);
  const normalizedInput = normalizeForComparison(input);
  const normalizedClean = normalizeForComparison(cleaned);
  if (normalizedInput !== normalizedClean) {
    throw new HtmlSanitizationError(input, cleaned);
  }
  return cleaned;
}

/**
 * Compare input vs. sanitizer output after a light normalization pass that
 * ignores insignificant whitespace. Prevents spurious 422s when sanitize-html
 * re-flows whitespace inside permitted tags.
 */
function normalizeForComparison(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Return the first disallowed token in the input that survived the allowlist
 * boundary — useful as a breadcrumb in the 422 response body so the diviner
 * can locate the offending content without us echoing their full submission.
 */
function firstDisallowedToken(input: string): string | null {
  // Cheap structural scan: look for any tag whose name is NOT in the
  // allowlist. Not a full HTML parse — callers treat the output as a hint.
  const tagRegex = /<\s*\/?\s*([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(input)) !== null) {
    const tagName = (match[1] ?? "").toLowerCase();
    if (tagName && !DIVINER_ALLOWED_TAGS.includes(tagName)) {
      return match[0].slice(0, 80);
    }
  }
  // Look for disallowed attributes on allowed tags (javascript: URLs, onclick…)
  const attrRegex = /\s(on[a-zA-Z]+|style)\s*=/;
  const attr = attrRegex.exec(input);
  if (attr) return attr[0].trim();
  const scheme = /(javascript|data|vbscript):/i.exec(input);
  if (scheme) return `${scheme[1]}:`;
  return null;
}

// ── Utilities shared by both modes ───────────────────────────────────────────

/** Lightweight sanitizer for plain-text fields that accidentally contain HTML. */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

/** Validate a URL is safe (http/https only, no javascript: or data:). */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
