import Link from "next/link";
import Image from "next/image";
import { Clock, Star, ArrowRight } from "lucide-react";
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
  imageUrl?: string | null;
}

export function ServiceCard({ service, username, imageUrl }: ServiceCardProps) {
  return (
    <div
      className={`glass-card group relative overflow-hidden rounded-xl transition-all duration-300 hover:border-white/15 hover:shadow-lg ${
        service.is_featured
          ? "border-gold/20 shadow-[0_0_20px_rgba(201,168,76,0.08)] hover:shadow-[0_0_30px_rgba(201,168,76,0.15)]"
          : ""
      }`}
    >
      {/* Popular badge */}
      {service.is_featured && (
        <div className="absolute right-4 top-0 z-10">
          <span className="inline-flex items-center rounded-b-lg border border-t-0 border-gold/40 bg-gold/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
            Popular
          </span>
        </div>
      )}

      {/* Card content — two columns */}
      <div className="flex">
        {/* Left: text content */}
        <div className="flex flex-1 flex-col p-5 pr-3">
          {/* Service name */}
          <h3 className="mb-1.5 font-display text-lg font-semibold leading-tight text-cream">
            {service.name}
          </h3>

          {/* Description */}
          {service.description && (
            <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-silver/60">
              {service.description}
            </p>
          )}

          {/* Duration + Rating row */}
          <div className="mt-auto flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/15 px-2 py-0.5 text-[11px] text-gold/70">
              <Clock className="size-2.5" />
              {service.duration_minutes} min
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#c9a84c]/60">
              <Star className="size-2.5 fill-[#c9a84c]/60" />
              <Star className="size-2.5 fill-[#c9a84c]/60" />
              <Star className="size-2.5 fill-[#c9a84c]/60" />
              <Star className="size-2.5 fill-[#c9a84c]/60" />
              <Star className="size-2.5 fill-[#c9a84c]/60" />
            </span>
          </div>

          {/* Book link */}
          <Link
            href={`/${username}/book/${service.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
          >
            Book This Reading
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Right: price + product image */}
        <div className="flex w-[180px] shrink-0 flex-col sm:w-[200px]">
          {/* Price */}
          <div className="px-4 pt-4 text-right">
            <span className="font-display text-2xl font-semibold text-gold">
              {formatCurrency(Number(service.base_price))}
            </span>
          </div>

          {/* Product image — explicit height, slight inset for styling */}
          {imageUrl && (
            <div className="relative mx-2 mb-2 mt-2 h-[90px] overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={service.name}
                fill
                className="object-cover object-center"
                sizes="200px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
