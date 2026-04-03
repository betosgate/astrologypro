import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  client_name: string;
  rating: number;
  text: string;
  service_type: string | null;
  featured?: boolean;
}

interface TestimonialSectionProps {
  testimonials: Testimonial[];
  averageRating?: number | null;
  reviewCount?: number;
}

function GoldStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "size-3" : "size-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sz,
            i < rating
              ? "fill-gold text-gold"
              : "fill-white/10 text-white/10"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialSection({
  testimonials,
  averageRating,
  reviewCount,
}: TestimonialSectionProps) {
  if (testimonials.length === 0) return null;

  const featured = testimonials.find((t) => t.featured) ?? testimonials[0];
  const rest = testimonials.filter((t) => t.id !== featured.id).slice(0, 4);

  return (
    <section id="reviews" className="py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section heading + rating summary */}
        <div className="mb-14 text-center">
          <h2 className="mb-2 font-display text-3xl font-semibold text-cream md:text-4xl">
            What Clients Say
          </h2>
          {averageRating != null && reviewCount && reviewCount > 0 ? (
            <div className="mt-3 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <GoldStars rating={Math.round(averageRating)} />
                <span className="text-lg font-semibold text-cream">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-silver/60">
                Based on {reviewCount} verified review{reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <p className="mx-auto max-w-md text-sm text-silver/60">
              Honest reflections from those who have experienced a reading
            </p>
          )}
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="relative">
            <span className="pointer-events-none absolute -left-2 -top-6 font-display text-7xl leading-none text-gold/20 md:-left-8 md:-top-8 md:text-8xl">
              &ldquo;
            </span>
            <blockquote className="relative font-display text-xl italic leading-relaxed text-cream/90 md:text-2xl md:leading-relaxed">
              {featured.text}
            </blockquote>
            <span className="pointer-events-none absolute -bottom-10 -right-2 font-display text-7xl leading-none text-gold/20 md:-right-8 md:text-8xl">
              &rdquo;
            </span>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <GoldStars rating={featured.rating} />
            <p className="text-sm font-medium text-cream/80">
              {featured.client_name}
            </p>
            {featured.service_type && (
              <p className="text-xs text-silver/50">{featured.service_type}</p>
            )}
          </div>
        </div>

        {/* Grid of additional testimonials */}
        {rest.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((testimonial) => (
              <div
                key={testimonial.id}
                className="glass-card relative flex flex-col rounded-xl p-5"
              >
                {testimonial.featured && (
                  <div className="absolute right-3 top-3">
                    <Star className="size-3.5 fill-gold text-gold" />
                  </div>
                )}
                <GoldStars rating={testimonial.rating} size="sm" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-silver/70">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <p className="text-sm font-medium text-cream/80">
                    {testimonial.client_name}
                  </p>
                  {testimonial.service_type && (
                    <p className="text-xs text-silver/50">
                      {testimonial.service_type}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cosmic divider */}
      <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
    </section>
  );
}
