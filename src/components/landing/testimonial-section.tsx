import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  client_name: string;
  rating: number;
  text: string;
  service_type: string | null;
}

interface TestimonialSectionProps {
  testimonials: Testimonial[];
}

function GoldStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-gold text-gold"
              : "fill-white/10 text-white/10"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialSection({ testimonials }: TestimonialSectionProps) {
  if (testimonials.length === 0) return null;

  const featured = testimonials[0];
  const rest = testimonials.slice(1, 5);

  return (
    <section id="reviews" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section heading */}
        <h2 className="mb-2 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
          What Clients Say
        </h2>
        <p className="mx-auto mb-14 max-w-md text-center text-sm text-silver/60">
          Honest reflections from those who have experienced a reading
        </p>

        {/* Featured testimonial */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="relative">
            {/* Gold quotation marks */}
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
              <p className="text-xs text-silver/50">
                {featured.service_type}
              </p>
            )}
          </div>
        </div>

        {/* Grid of additional testimonials */}
        {rest.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((testimonial) => (
              <div
                key={testimonial.id}
                className="glass-card flex flex-col rounded-xl p-5"
              >
                <GoldStars rating={testimonial.rating} />
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
      <div className="cosmic-divider mx-auto mt-20 max-w-6xl md:mt-28" />
    </section>
  );
}
