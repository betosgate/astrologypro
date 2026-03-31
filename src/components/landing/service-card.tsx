import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  category: string;
  is_featured: boolean;
  [key: string]: unknown;
}

interface ServiceCardProps {
  service: Service;
  username: string;
}

export function ServiceCard({ service, username }: ServiceCardProps) {
  return (
    <div
      className={`glass-card group relative flex flex-col rounded-xl p-6 transition-all duration-300 hover:border-white/15 hover:shadow-lg ${
        service.is_featured
          ? "border-gold/20 shadow-[0_0_20px_rgba(201,168,76,0.08)] hover:shadow-[0_0_30px_rgba(201,168,76,0.15)]"
          : ""
      }`}
    >
      {/* Popular badge */}
      {service.is_featured && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
            Popular
          </span>
        </div>
      )}

      {/* Service name */}
      <h3 className="mb-2 font-display text-xl font-semibold text-cream">
        {service.name}
      </h3>

      {/* Description */}
      {service.description && (
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-silver/70">
          {service.description}
        </p>
      )}

      {/* Duration + Price row */}
      <div className="mt-auto flex items-end justify-between pt-4">
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 px-2.5 py-0.5 text-xs text-gold/80">
          <Clock className="size-3" />
          {service.duration_minutes} min
        </span>
        <span className="font-display text-2xl font-semibold text-gold">
          {formatCurrency(Number(service.base_price))}
        </span>
      </div>

      {/* Book link */}
      <Link
        href={`/${username}/book/${service.slug}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
      >
        Book This Reading
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
