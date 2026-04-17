import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface PricingContent {
  show_price?: boolean;
  show_duration?: boolean;
  custom_cta_text?: string | null;
  custom_cta_secondary_text?: string | null;
}

interface PricingSectionProps {
  content: PricingContent;
  service: {
    base_price: number;
    duration_minutes: number;
    name: string;
  };
  bookUrl: string;
  bookingEnabled: boolean;
}

export function PricingSection({ content, service, bookUrl, bookingEnabled }: PricingSectionProps) {
  const { show_price = true, show_duration = true, custom_cta_text, custom_cta_secondary_text } = content;
  const ctaText = custom_cta_text ?? "Book This Reading";

  return (
    <section className="py-10 border-y border-white/5 bg-cosmos-900/50">
      <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-end gap-4">
          {show_price && (
            <span className="font-display text-4xl font-bold text-gold">
              {formatCurrency(Number(service.base_price))}
            </span>
          )}
          {show_duration && (
            <span className="mb-1 flex items-center gap-1.5 text-sm text-silver/60">
              <Clock className="size-3.5" />
              {service.duration_minutes} min
            </span>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2">
          {bookingEnabled ? (
            <Link
              href={bookUrl}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-cosmos-900 transition-all hover:bg-gold-light"
            >
              {ctaText}
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center rounded-lg border border-white/10 px-6 text-sm text-silver/45">
              Booking unavailable
            </span>
          )}
          {custom_cta_secondary_text && (
            <p className="text-xs text-silver/50">{custom_cta_secondary_text}</p>
          )}
        </div>
      </div>
    </section>
  );
}
