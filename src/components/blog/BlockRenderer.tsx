import { getCtaBlock, type ContentBlock } from "@/lib/blog";
import Link from "next/link";

// ─────────────────────────────────────────────
// Individual block renderers
// ─────────────────────────────────────────────

function ParagraphBlock({ content }: { content: string }) {
  return (
    <p className="my-5 text-base leading-8 text-[#b8bcd0]/85">{content}</p>
  );
}

function HeadingBlock({ level, content }: { level: 2 | 3 | 4; content: string }) {
  const baseClass =
    "font-semibold tracking-tight text-[#f5f0e8] scroll-mt-24";
  if (level === 2) {
    const anchor = content.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return (
      <h2 id={anchor} className={`mt-10 mb-4 text-2xl sm:text-3xl ${baseClass}`}>
        {content}
      </h2>
    );
  }
  if (level === 3) {
    const anchor = content.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return (
      <h3 id={anchor} className={`mt-8 mb-3 text-xl sm:text-2xl ${baseClass}`}>
        {content}
      </h3>
    );
  }
  return (
    <h4 className={`mt-6 mb-3 text-lg ${baseClass}`}>{content}</h4>
  );
}

function ImageBlock({
  url,
  alt,
  caption,
}: {
  url: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="w-full rounded-2xl object-cover"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-[#b8bcd0]/45">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({
  content,
  attribution,
}: {
  content: string;
  attribution?: string;
}) {
  return (
    <blockquote className="my-8 border-l-2 border-[#c9a84c]/50 pl-5">
      <p className="text-lg italic leading-relaxed text-[#f5f0e8]/80">
        &ldquo;{content}&rdquo;
      </p>
      {attribution && (
        <footer className="mt-3 text-sm text-[#b8bcd0]/50">— {attribution}</footer>
      )}
    </blockquote>
  );
}

const CALLOUT_STYLES: Record<
  "info" | "warning" | "tip",
  { border: string; bg: string; icon: string; label: string }
> = {
  info: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    icon: "ℹ",
    label: "text-sky-400",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: "⚠",
    label: "text-amber-400",
  },
  tip: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: "✦",
    label: "text-emerald-400",
  },
};

function CalloutBlock({
  variant,
  content,
}: {
  variant: "info" | "warning" | "tip";
  content: string;
}) {
  const s = CALLOUT_STYLES[variant];
  return (
    <div
      className={`my-6 flex gap-3 rounded-xl border ${s.border} ${s.bg} px-5 py-4`}
    >
      <span className={`shrink-0 text-base leading-6 ${s.label}`} aria-hidden="true">
        {s.icon}
      </span>
      <p className={`text-sm leading-7 ${s.label}`}>{content}</p>
    </div>
  );
}

function DividerBlock() {
  return (
    <hr className="my-10 border-white/[0.07]" />
  );
}

async function CtaBlockRenderer({ ctaBlockId }: { ctaBlockId: string }) {
  const cta = await getCtaBlock(ctaBlockId);
  if (!cta) return null;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-6 text-center">
      <h3 className="text-lg font-semibold text-[#f5f0e8]">{cta.headline}</h3>
      {cta.body && (
        <p className="mt-2 text-sm text-[#b8bcd0]/70">{cta.body}</p>
      )}
      <Link
        href={cta.cta_url}
        className="mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110"
        style={{ background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)" }}
      >
        {cta.cta_label}
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main renderer
// ─────────────────────────────────────────────

export async function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div>
      {await Promise.all(
        blocks.map(async (block, i) => {
          switch (block.type) {
            case "paragraph":
              return <ParagraphBlock key={i} content={block.content} />;
            case "heading":
              return <HeadingBlock key={i} level={block.level} content={block.content} />;
            case "image":
              return (
                <ImageBlock
                  key={i}
                  url={block.url}
                  alt={block.alt}
                  caption={block.caption}
                />
              );
            case "quote":
              return (
                <QuoteBlock key={i} content={block.content} attribution={block.attribution} />
              );
            case "callout":
              return (
                <CalloutBlock key={i} variant={block.variant} content={block.content} />
              );
            case "divider":
              return <DividerBlock key={i} />;
            case "cta":
              return <CtaBlockRenderer key={i} ctaBlockId={block.ctaBlockId} />;
            default:
              return null;
          }
        })
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TOC generator (used by sidebar)
// ─────────────────────────────────────────────

export type TocItem = { level: 2 | 3 | 4; text: string; anchor: string };

export function extractToc(blocks: ContentBlock[]): TocItem[] {
  return blocks
    .filter((b): b is Extract<ContentBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({
      level: b.level,
      text: b.content,
      anchor: b.content.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
}
