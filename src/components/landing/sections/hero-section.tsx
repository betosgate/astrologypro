/**
 * Hero Section renderer — server component.
 * Renders the custom hero content from the landing page builder.
 * Falls back to service template data if custom fields are null.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroContent {
  title?: string | null;
  tagline?: string | null;
  banner_url?: string | null;
  overlay_opacity?: number;
}

interface HeroSectionProps {
  content: HeroContent;
  fallback: {
    title: string;
    description: string | null;
    bookUrl: string;
    bookingEnabled: boolean;
  };
}

export function HeroSection({ content, fallback }: HeroSectionProps) {
  const title = content.title || fallback.title;
  const tagline = content.tagline || fallback.description;
  const overlayOpacity = (content.overlay_opacity ?? 40) / 100;

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-cosmos-900">
      {content.banner_url ? (
        <div className="absolute inset-0">
          <Image
            src={content.banner_url}
            alt={title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div
            className="absolute inset-0 bg-cosmos-900"
            style={{ opacity: overlayOpacity }}
          />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 md:py-20 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight text-cream md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {tagline && (
          <p className="mt-4 text-lg leading-relaxed text-silver/70 max-w-2xl mx-auto">
            {tagline}
          </p>
        )}
        {fallback.bookingEnabled && (
          <div className="mt-8">
            <Link
              href={fallback.bookUrl}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light"
            >
              Book Now
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
