/**
 * BlockRenderer — renders one diviner-authored block in the V2 layout.
 *
 * Added in Task 02 of the 2026-04-21 landing-page-simplification.
 *
 * Contract:
 *   - `text` — escapes everything; renders a heading (title) and paragraphs
 *     from content_json.paragraphs.
 *   - `image` — responsive <img> with object-fit: cover; title used as alt text.
 *   - `html` — dangerouslySetInnerHTML with body_html. Body has ALREADY been
 *     sanitized server-side at write time (Task 03 strict-allowlist pipeline);
 *     this renderer trusts the stored value. No runtime sanitization.
 *
 * Visually reuses the legacy template's `glass-card` spacing so blocks look
 * native inside the page.
 */

import type { DivinerServiceBlock } from "@/types/landing-page-builder";

interface BlockRendererProps {
  block: DivinerServiceBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  // Enabled-only is enforced at the query layer, but belt-and-braces here too.
  if (!block.is_enabled) return null;
  if (block.moderation_status === "flagged" || block.moderation_status === "rejected") {
    return null;
  }

  switch (block.section_type) {
    case "text":
      return <TextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "html":
      return <HtmlBlock block={block} />;
    default:
      // Defensive: unknown type → render nothing (never throw in a public route).
      return null;
  }
}

// ── Text block ───────────────────────────────────────────────────────────────

function TextBlock({ block }: { block: DivinerServiceBlock }) {
  const content = block.content_json as { paragraphs?: unknown } | null;
  const rawParagraphs = content?.paragraphs;
  const paragraphs = Array.isArray(rawParagraphs)
    ? rawParagraphs.filter((p): p is string => typeof p === "string" && p.trim() !== "")
    : [];

  if (!block.title && paragraphs.length === 0) return null;

  return (
    <section className="glass-card rounded-2xl p-6 md:p-8 my-4">
      {block.title ? (
        <h3 className="text-xl md:text-2xl font-semibold text-cosmos-100 mb-3">
          {block.title}
        </h3>
      ) : null}
      <div className="space-y-3 text-cosmos-200 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

// ── Image block ──────────────────────────────────────────────────────────────

function ImageBlock({ block }: { block: DivinerServiceBlock }) {
  if (!block.primary_image_url) return null;
  const alt = block.title ?? "";

  return (
    <section className="my-4">
      <figure className="glass-card rounded-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.primary_image_url}
          alt={alt}
          loading="lazy"
          className="w-full h-auto object-cover"
        />
        {block.title ? (
          <figcaption className="px-6 py-3 text-sm text-cosmos-300 text-center">
            {block.title}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}

// ── HTML block ───────────────────────────────────────────────────────────────

function HtmlBlock({ block }: { block: DivinerServiceBlock }) {
  const html = block.body_html?.trim();
  if (!html) return null;

  return (
    <section className="glass-card rounded-2xl p-6 md:p-8 my-4">
      {block.title ? (
        <h3 className="text-xl md:text-2xl font-semibold text-cosmos-100 mb-3">
          {block.title}
        </h3>
      ) : null}
      {/*
        Content sanitized at write time via sanitizeDivinerHtmlStrict().
        Strict allowlist: p, br, strong, em, u, ul, ol, li, h3, h4,
        blockquote, a[href,title] with http/https/mailto schemes only.
        Any disallowed input is rejected with 422 before it reaches the DB.
      */}
      <div
        className="diviner-html-block text-cosmos-200 leading-relaxed space-y-3 [&_a]:text-amber-300 [&_a]:underline [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400/40 [&_blockquote]:pl-4 [&_blockquote]:italic"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

// ── List helper ──────────────────────────────────────────────────────────────

/**
 * Render an ordered list of blocks for one slot. Emits nothing when empty so
 * the legacy template doesn't sprout empty divs for diviners who use zero
 * blocks.
 */
export function BlockSlotRenderer({ blocks }: { blocks: DivinerServiceBlock[] }) {
  const visible = blocks.filter(
    (b) =>
      b.is_enabled &&
      b.moderation_status !== "flagged" &&
      b.moderation_status !== "rejected",
  );
  if (visible.length === 0) return null;
  return (
    <div className="space-y-4">
      {visible.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
