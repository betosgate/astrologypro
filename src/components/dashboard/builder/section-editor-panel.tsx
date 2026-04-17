"use client";

import { lazy, Suspense } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTION_TYPES } from "@/lib/landing-page-section-types";
import { useBuilder } from "./builder-context";
import type { LandingPageSection } from "@/types/landing-page-builder";

// Lazy-load all section editors
const HeroEditor = lazy(() => import("./section-editors/hero-editor").then((m) => ({ default: m.HeroEditor })));
const PricingEditor = lazy(() => import("./section-editors/pricing-editor").then((m) => ({ default: m.PricingEditor })));
const BookingCtaEditor = lazy(() => import("./section-editors/booking-cta-editor").then((m) => ({ default: m.BookingCtaEditor })));
const BioEditor = lazy(() => import("./section-editors/bio-editor").then((m) => ({ default: m.BioEditor })));
const ExpertiseEditor = lazy(() => import("./section-editors/expertise-editor").then((m) => ({ default: m.ExpertiseEditor })));
const TextContentEditor = lazy(() => import("./section-editors/text-content-editor").then((m) => ({ default: m.TextContentEditor })));
const ImageBannerEditor = lazy(() => import("./section-editors/image-banner-editor").then((m) => ({ default: m.ImageBannerEditor })));
const CtaEditor = lazy(() => import("./section-editors/cta-editor").then((m) => ({ default: m.CtaEditor })));
const FaqEditor = lazy(() => import("./section-editors/faq-editor").then((m) => ({ default: m.FaqEditor })));
const VideoEmbedEditor = lazy(() => import("./section-editors/video-embed-editor").then((m) => ({ default: m.VideoEmbedEditor })));
const TestimonialsEditor = lazy(() => import("./section-editors/testimonials-editor").then((m) => ({ default: m.TestimonialsEditor })));
const GalleryEditor = lazy(() => import("./section-editors/gallery-editor").then((m) => ({ default: m.GalleryEditor })));
const RichContentEditor = lazy(() => import("./section-editors/rich-content-editor").then((m) => ({ default: m.RichContentEditor })));
const WhatsIncludedEditor = lazy(() => import("./section-editors/whats-included-editor").then((m) => ({ default: m.WhatsIncludedEditor })));
const WhoItsForEditor = lazy(() => import("./section-editors/who-its-for-editor").then((m) => ({ default: m.WhoItsForEditor })));

function EditorByType({ section }: { section: LandingPageSection }) {
  const props = { section };
  switch (section.section_type) {
    case "hero": return <HeroEditor {...props} />;
    case "pricing": return <PricingEditor {...props} />;
    case "booking_cta": return <BookingCtaEditor {...props} />;
    case "bio": return <BioEditor {...props} />;
    case "expertise": return <ExpertiseEditor {...props} />;
    case "text_content": return <TextContentEditor {...props} />;
    case "image_banner": return <ImageBannerEditor {...props} />;
    case "cta": return <CtaEditor {...props} />;
    case "faq": return <FaqEditor {...props} />;
    case "video_embed": return <VideoEmbedEditor {...props} />;
    case "testimonials": return <TestimonialsEditor {...props} />;
    case "gallery": return <GalleryEditor {...props} />;
    case "rich_content": return <RichContentEditor {...props} />;
    case "whats_included": return <WhatsIncludedEditor {...props} />;
    case "who_its_for": return <WhoItsForEditor {...props} />;
    default:
      return (
        <div className="py-8 text-center text-sm text-silver/50">
          No editor available for section type: {section.section_type}
        </div>
      );
  }
}

export function SectionEditorPanel() {
  const { state, selectSection, deleteSection } = useBuilder();
  const { selectedSectionId, sections } = state;

  if (!selectedSectionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="size-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-4">
          <span className="text-2xl">✦</span>
        </div>
        <p className="text-cream/50 text-sm">Select a section to edit it</p>
        <p className="text-silver/30 text-xs mt-1">Or click &ldquo;+ Add Section&rdquo; to create one</p>
      </div>
    );
  }

  const section = sections.find((s) => s.id === selectedSectionId);
  if (!section) return null;

  const typeDef = SECTION_TYPES[section.section_type];

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <h3 className="font-semibold text-cream text-sm">{typeDef?.label ?? section.section_type}</h3>
          <p className="text-xs text-silver/50">{typeDef?.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!section.is_system && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-silver/40 hover:text-red-400"
              onClick={() => {
                if (confirm(`Remove "${typeDef?.label}" section?`)) {
                  deleteSection(section.id);
                }
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-silver/40 hover:text-cream"
            onClick={() => selectSection(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto p-4">
        {section.moderation_status === "flagged" && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">
            ⚠ This section has been flagged by moderation. Editing it will reset it to &ldquo;pending review&rdquo;.
          </div>
        )}
        <Suspense fallback={<div className="animate-pulse h-40 rounded-xl bg-white/[0.04]" />}>
          <EditorByType section={section} />
        </Suspense>
      </div>
    </div>
  );
}
