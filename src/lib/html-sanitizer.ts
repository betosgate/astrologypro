/**
 * Server-side HTML sanitizer for landing page section content.
 * Must be called before storing body_html in the database.
 *
 * Allowed tags: p, h1–h6, strong, em, u, s, ul, ol, li, a[href,target,rel],
 *               blockquote, br, hr, img[src,alt,width,height], span, div, pre, code
 * Stripped:     script, style, iframe, object, embed, form, input, button,
 *               textarea, select, meta, link, base, noscript, template
 * Stripped attrs: on* (event handlers), style (prevents CSS injection)
 * URLs:          only allow http:, https:, mailto:. Strip javascript:, data:, vbscript:.
 */

import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
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

const ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  "*": ["class", "id"],  // allow class/id for styling; event handlers stripped below
};

const ALLOWED_SCHEMES = ["http", "https", "mailto"];

/** Full HTML sanitizer for rich content sections (body_html) */
export function sanitizeSectionHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      img: ["http", "https"],  // no data: URIs in images
      a: ALLOWED_SCHEMES,
    },
    // Force rel="noopener noreferrer" on external links
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
    // Disallow data: URIs everywhere
    allowProtocolRelative: false,
    // Strip empty tags that carry no content
    exclusiveFilter: (frame) => {
      const selfClosing = ["br", "hr", "img"].includes(frame.tag);
      return !selfClosing && !frame.text && !frame.mediaChildren?.length;
    },
  });
}

/** Lightweight sanitizer for plain-text fields that accidentally contain HTML */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

/** Validate a URL is safe (http/https only, no javascript: or data:) */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
