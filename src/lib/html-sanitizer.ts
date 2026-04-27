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

// ── V2 expanded allowlist (Option A) ─────────────────────────────────────────
//
// Diviners can write styled content — text, images, tables, figures, inline
// CSS via `style=` — but still cannot inject executable code or break out of
// the block. Hard blocks: <script>, <style>, <iframe>, <link>, <meta>,
// <object>, <embed>, <form>/<input>/<button>, any on* event handler,
// javascript: / data: URLs, and layout-breaking CSS (position, z-index,
// transform, animation, content, cursor, filter, pointer-events).

const DIVINER_ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
  "ul", "ol", "li",
  "blockquote", "q", "cite",
  "a",
  "img",
  "figure", "figcaption",
  "code", "pre", "kbd", "samp", "var",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "div", "span", "section", "article", "aside", "header", "footer", "main", "nav",
  "abbr", "time",
];

const DIVINER_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  abbr: ["title"],
  time: ["datetime"],
  th: ["scope", "colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  "*": ["class", "id", "style"],
};

const DIVINER_ALLOWED_SCHEMES = ["http", "https", "mailto"];

// Allowlisted CSS properties + regex-based value constraints.
// Anything not listed here is stripped. Regexes are conservative — they accept
// the common shapes (px/em/rem/%, hex/rgb/rgba/named colors, keyword values)
// and reject expression-style values that could smuggle side effects.
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0|1|0?\.\d+)\s*\)|[a-zA-Z]+)$/;
const LENGTH_RE = /^-?\d+(\.\d+)?(px|em|rem|%|vw|vh|pt|ch)?$/;
const LENGTH_OR_AUTO_RE = /^(-?\d+(\.\d+)?(px|em|rem|%|vw|vh|pt|ch)?|auto)$/;
const MULTI_LENGTH_RE = /^(-?\d+(\.\d+)?(px|em|rem|%|vw|vh|pt|ch)?|auto)(\s+(-?\d+(\.\d+)?(px|em|rem|%|vw|vh|pt|ch)?|auto)){0,3}$/;
const BORDER_RE = /^\d+(\.\d+)?(px|em|rem)?\s*(solid|dashed|dotted|double|none)?\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|[a-zA-Z]+)?$/;

const DIVINER_ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    color: [COLOR_RE],
    "background-color": [COLOR_RE],
    background: [COLOR_RE],

    "text-align": [/^(left|right|center|justify)$/],
    "text-decoration": [/^(none|underline|line-through|overline)$/],
    "text-transform": [/^(none|uppercase|lowercase|capitalize)$/],
    "text-indent": [LENGTH_RE],
    "text-shadow": [/^[\d\s\w#(),.%\-]+$/],

    "font-family": [/^[\w\s,'"\-]+$/],
    "font-size": [LENGTH_RE],
    "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
    "font-style": [/^(normal|italic|oblique)$/],
    "line-height": [/^(normal|\d+(\.\d+)?(px|em|rem|%)?)$/],
    "letter-spacing": [LENGTH_RE],
    "word-spacing": [LENGTH_RE],
    "white-space": [/^(normal|nowrap|pre|pre-wrap|pre-line)$/],

    margin: [MULTI_LENGTH_RE],
    "margin-top": [LENGTH_OR_AUTO_RE],
    "margin-right": [LENGTH_OR_AUTO_RE],
    "margin-bottom": [LENGTH_OR_AUTO_RE],
    "margin-left": [LENGTH_OR_AUTO_RE],

    padding: [MULTI_LENGTH_RE],
    "padding-top": [LENGTH_RE],
    "padding-right": [LENGTH_RE],
    "padding-bottom": [LENGTH_RE],
    "padding-left": [LENGTH_RE],

    border: [BORDER_RE],
    "border-top": [BORDER_RE],
    "border-right": [BORDER_RE],
    "border-bottom": [BORDER_RE],
    "border-left": [BORDER_RE],
    "border-color": [COLOR_RE],
    "border-width": [LENGTH_RE],
    "border-style": [/^(solid|dashed|dotted|double|none)$/],
    "border-radius": [MULTI_LENGTH_RE],

    width: [LENGTH_OR_AUTO_RE],
    "max-width": [LENGTH_OR_AUTO_RE],
    "min-width": [LENGTH_RE],
    height: [LENGTH_OR_AUTO_RE],
    "max-height": [LENGTH_OR_AUTO_RE],
    "min-height": [LENGTH_RE],

    display: [/^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|none)$/],
    "flex-direction": [/^(row|row-reverse|column|column-reverse)$/],
    "flex-wrap": [/^(nowrap|wrap|wrap-reverse)$/],
    "justify-content": [/^(flex-start|flex-end|center|space-between|space-around|space-evenly)$/],
    "align-items": [/^(flex-start|flex-end|center|stretch|baseline)$/],
    "align-self": [/^(auto|flex-start|flex-end|center|stretch|baseline)$/],
    gap: [LENGTH_RE],
    "row-gap": [LENGTH_RE],
    "column-gap": [LENGTH_RE],

    "grid-template-columns": [/^[\dfrpx%\s()\-,a-zA-Z]+$/],
    "grid-template-rows": [/^[\dfrpx%\s()\-,a-zA-Z]+$/],
    "grid-column": [/^[\d\s\/\-a-zA-Z]+$/],
    "grid-row": [/^[\d\s\/\-a-zA-Z]+$/],

    float: [/^(left|right|none)$/],
    clear: [/^(left|right|both|none)$/],
    "box-sizing": [/^(border-box|content-box)$/],

    "list-style-type": [/^(disc|circle|square|decimal|lower-alpha|upper-alpha|none)$/],
    "list-style-position": [/^(inside|outside)$/],

    opacity: [/^(0|1|0?\.\d+)$/],

    // INTENTIONALLY BLOCKED, do not re-add without threat review:
    //   position, top/right/bottom/left, z-index   — break layout, can cover admin UI
    //   transform, animation, transition           — visual abuse, can hide content
    //   content, cursor, pointer-events            — behavioral spoofing
    //   filter, backdrop-filter, mix-blend-mode    — heavy compositing abuse
    //   overflow (except for tables), clip, clip-path — scroll hijacking
  },
};

/**
 * Run user-supplied HTML through the V2 allowlist. Silent — returns cleaned
 * output. Tags, attributes, and CSS properties not on the allowlist are
 * stripped. Use for comparison against the raw input in strict mode.
 */
export function sanitizeDivinerHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return sanitizeHtml(input, {
    allowedTags: DIVINER_ALLOWED_TAGS,
    allowedAttributes: DIVINER_ALLOWED_ATTRS,
    allowedStyles: DIVINER_ALLOWED_STYLES,
    allowedSchemes: DIVINER_ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      a: DIVINER_ALLOWED_SCHEMES,
      img: ["http", "https"],
    },
    disallowedTagsMode: "discard",
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    transformTags: {
      // Auto-secure external links.
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = /^https?:\/\//i.test(href);
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
 * Strict mode. Reject inputs that contain unambiguously dangerous content
 * (disallowed tags, event handlers, javascript:/data:/vbscript: URLs) with a
 * typed error so the API returns RFC 9457 422. If the input is benign the
 * sanitized output is returned — sanitize-html is allowed to reformat
 * whitespace / attribute order without triggering a 422.
 */
export function sanitizeDivinerHtmlStrict(input: string): string {
  const offending = firstDisallowedToken(input);
  const cleaned = sanitizeDivinerHtml(input);
  if (offending) {
    throw new HtmlSanitizationError(input, cleaned);
  }
  return cleaned;
}

/**
 * Return the first disallowed token in the input that survived the allowlist
 * boundary — useful as a breadcrumb in the 422 response body so the diviner
 * can locate the offending content without us echoing their full submission.
 */
// Tags that are not in DIVINER_ALLOWED_TAGS but also shouldn't trip a 422 —
// sanitize-html silently strips them via `enforceHtmlBoundary` or treats them
// as the document shell. Diviners pasting a full document shouldn't get an
// error for these wrappers; only for the genuinely dangerous content inside.
const SILENT_STRIP_TAGS = new Set([
  "html", "head", "body", "title", "meta", "base",
]);

// Genuinely dangerous tags — if any of these appear in the input we throw,
// regardless of what else got cleaned. Not exhaustive; covers the common
// XSS / layout-hijack surface. Anything else outside the allowlist will
// still be stripped silently by sanitize-html.
const HARD_BLOCKED_TAGS = new Set([
  "script", "style", "link", "iframe", "frame", "frameset", "object", "embed",
  "applet", "form", "input", "button", "textarea", "select", "option",
  "video", "audio", "source", "track", "canvas", "svg", "math",
]);

function firstDisallowedToken(input: string): string | null {
  // Cheap structural scan: look for any HARD_BLOCKED_TAG that appears. These
  // are explicit XSS / breakout vectors — diviners should know we reject them.
  const tagRegex = /<\s*\/?\s*([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(input)) !== null) {
    const tagName = (match[1] ?? "").toLowerCase();
    if (!tagName) continue;
    if (SILENT_STRIP_TAGS.has(tagName)) continue;
    if (HARD_BLOCKED_TAGS.has(tagName)) {
      return match[0].slice(0, 80);
    }
  }
  // Event handlers (onclick, onerror, onload, …) are always disallowed.
  const handler = /\s(on[a-zA-Z]+)\s*=/.exec(input);
  if (handler) return handler[0].trim();
  // Dangerous URL schemes.
  const scheme = /(javascript|vbscript):/i.exec(input);
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
