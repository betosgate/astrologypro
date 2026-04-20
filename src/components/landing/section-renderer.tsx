/**
 * Dynamic section renderer — maps section_type to the correct React component.
 * All section components are Server Components for SEO and performance.
 *
 * Usage:
 *   <SectionRenderer section={section} context={ctx} />
 */

import type { LandingPageSection } from "@/types/landing-page-builder";
import { HeroSection } from "./sections/hero-section";
import { BioSection } from "./sections/bio-section";
import { ExpertiseSection } from "./sections/expertise-section";
import { TextContentSection } from "./sections/text-content-section";
import { ImageBannerSection } from "./sections/image-banner-section";
import { CtaSection } from "./sections/cta-section";
import { FaqSection } from "./sections/faq-section";
import { VideoEmbedSection } from "./sections/video-embed-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { GallerySection } from "./sections/gallery-section";
import { RichContentSection } from "./sections/rich-content-section";
import { WhatsIncludedSection } from "./sections/whats-included-section";
import { WhoItsForSection } from "./sections/who-its-for-section";
import { PricingSection } from "./sections/pricing-section";
import { BookingCtaSection } from "./sections/booking-cta-section";

export interface SectionRendererContext {
  service: {
    name: string;
    base_price: number;
    duration_minutes: number;
    description: string | null;
  };
  bookUrl: string;
  bookingEnabled: boolean;
  /** Approved testimonials for auto-source testimonial sections */
  testimonials?: Array<{
    client_name: string;
    text: string;
    rating: number;
    service_type?: string;
    featured?: boolean;
  }>;
}

interface SectionRendererProps {
  section: LandingPageSection;
  context: SectionRendererContext;
}

export function SectionRenderer({ section, context }: SectionRendererProps) {
  // Use published content for public rendering, draft content for preview
  const content = (section.published_content_json ?? section.content_json) as Record<string, unknown>;
  const { service, bookUrl, bookingEnabled, testimonials = [] } = context;

  switch (section.section_type) {
    case "hero":
      return (
        <HeroSection
          content={content as Parameters<typeof HeroSection>[0]["content"]}
          fallback={{
            title: service.name,
            description: service.description,
            bookUrl,
            bookingEnabled,
          }}
        />
      );

    case "pricing":
      return (
        <PricingSection
          content={content as Parameters<typeof PricingSection>[0]["content"]}
          service={service}
          bookUrl={bookUrl}
          bookingEnabled={bookingEnabled}
        />
      );

    case "booking_cta":
      return (
        <BookingCtaSection
          content={content as Parameters<typeof BookingCtaSection>[0]["content"]}
          service={service}
          bookUrl={bookUrl}
          bookingEnabled={bookingEnabled}
        />
      );

    case "bio":
      return <BioSection content={content as Parameters<typeof BioSection>[0]["content"]} />;

    case "expertise":
      return <ExpertiseSection content={content as Parameters<typeof ExpertiseSection>[0]["content"]} />;

    case "text_content":
      return <TextContentSection content={content as unknown as Parameters<typeof TextContentSection>[0]["content"]} />;

    case "image_banner":
      return <ImageBannerSection content={content as unknown as Parameters<typeof ImageBannerSection>[0]["content"]} />;

    case "cta":
      return <CtaSection content={content as unknown as Parameters<typeof CtaSection>[0]["content"]} />;

    case "faq":
      return <FaqSection content={content as unknown as Parameters<typeof FaqSection>[0]["content"]} />;

    case "video_embed":
      return <VideoEmbedSection content={content as unknown as Parameters<typeof VideoEmbedSection>[0]["content"]} />;

    case "testimonials": {
      // Map testimonials to manual item shape
      const autoItems = testimonials.map((t) => ({
        name: t.client_name,
        text: t.text,
        rating: t.rating,
        avatar_url: null,
        date: undefined,
      }));
      return (
        <TestimonialsSection
          content={content as Parameters<typeof TestimonialsSection>[0]["content"]}
          autoItems={autoItems}
        />
      );
    }

    case "gallery":
      return <GallerySection content={content as unknown as Parameters<typeof GallerySection>[0]["content"]} />;

    case "rich_content":
      return <RichContentSection content={content as unknown as Parameters<typeof RichContentSection>[0]["content"]} />;

    case "whats_included":
      return <WhatsIncludedSection content={content as unknown as Parameters<typeof WhatsIncludedSection>[0]["content"]} />;

    case "who_its_for":
      return <WhoItsForSection content={content as unknown as Parameters<typeof WhoItsForSection>[0]["content"]} />;

    default:
      // Unknown section type — skip silently
      return null;
  }
}
