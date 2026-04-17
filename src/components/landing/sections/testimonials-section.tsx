import { Star } from "lucide-react";

interface ManualTestimonial {
  name: string;
  text: string;
  rating?: number;
  avatar_url?: string | null;
  date?: string;
}

interface TestimonialsContent {
  heading?: string;
  display_style?: "carousel" | "grid" | "list";
  max_display?: number;
  show_rating?: boolean;
  source?: "auto" | "manual";
  manual_items?: ManualTestimonial[];
}

function GoldStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < rating ? "fill-gold text-gold" : "fill-white/10 text-white/10"}`}
        />
      ))}
    </div>
  );
}

interface TestimonialsSectionProps {
  content: TestimonialsContent;
  autoItems?: ManualTestimonial[];
}

export function TestimonialsSection({ content, autoItems = [] }: TestimonialsSectionProps) {
  const {
    heading,
    display_style = "grid",
    max_display = 6,
    show_rating = true,
    source = "auto",
    manual_items = [],
  } = content;

  const items = (source === "manual" ? manual_items : autoItems).slice(0, max_display);
  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            {heading}
          </h2>
        )}

        <div
          className={
            display_style === "list"
              ? "space-y-4"
              : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {items.map((t, i) => (
            <div key={i} className="glass-card flex flex-col rounded-xl p-5">
              {show_rating && t.rating && <GoldStars rating={t.rating} />}
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-silver/70">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <p className="text-sm font-medium text-cream/80">{t.name}</p>
                {t.date && <p className="text-xs text-silver/50">{t.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
