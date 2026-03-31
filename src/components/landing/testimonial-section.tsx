import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-yellow-500 text-yellow-500"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialSection({ testimonials }: TestimonialSectionProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-center text-2xl font-bold md:text-3xl">
          Client Testimonials
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          What clients are saying about their readings
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative">
              <CardContent className="pt-2">
                <Quote className="mb-3 size-8 text-primary/20" />

                <StarRating rating={testimonial.rating} />

                <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>

                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">{testimonial.client_name}</p>
                  {testimonial.service_type && (
                    <p className="text-xs text-muted-foreground">
                      {testimonial.service_type}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
