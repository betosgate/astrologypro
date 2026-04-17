import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface BookingCtaContent {
  cta_text?: string;
  show_price_in_cta?: boolean;
  sticky_on_mobile?: boolean;
}

interface BookingCtaSectionProps {
  content: BookingCtaContent;
  service: {
    base_price: number;
    name: string;
  };
  bookUrl: string;
  bookingEnabled: boolean;
}

export function BookingCtaSection({ content, service, bookUrl, bookingEnabled }: BookingCtaSectionProps) {
  const { cta_text = "Book Now", show_price_in_cta = true } = content;

  return (
    <section className="py-14 md:py-20 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-4 font-display text-3xl font-semibold text-cream md:text-4xl">
          Ready to Book Your {service.name}?
        </h2>
        {show_price_in_cta && (
          <p className="mb-8 text-silver/60">
            {formatCurrency(Number(service.base_price))}
          </p>
        )}
        {bookingEnabled ? (
          <Link
            href={bookUrl}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          >
            {cta_text}
          </Link>
        ) : (
          <span className="inline-flex h-12 items-center rounded-lg border border-white/10 px-8 text-sm font-semibold text-silver/45">
            Booking temporarily unavailable
          </span>
        )}
      </div>
    </section>
  );
}
