import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { APP_URL } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getServiceCategoryLabel, isTimeBasedPublicService } from "@/lib/public-services";
import { getServiceLandingTemplates } from "@/lib/service-landings";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";

export const metadata: Metadata = {
  title: "All Reading Services | AstrologyPro",
  description:
    "Browse all astrology and tarot services available on AstrologyPro, then choose the right diviner by availability or profile.",
  alternates: { canonical: `${APP_URL}/services` },
};

export default async function ServicesHubPage() {
  const templates = await getServiceLandingTemplates();
  const grouped = templates.reduce<Record<string, typeof templates>>((acc, template) => {
    const key = template.category ?? "other";
    acc[key] ??= [];
    acc[key].push(template);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_35%),linear-gradient(180deg,_#0b1020_0%,_#111827_100%)] text-white">
      <MarketingHeader />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-amber-300/80">
            Service Directory
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Choose the service first, then choose the right diviner.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
            Every service page explains the offer clearly, then lets you compare
            diviners by availability or by profile before you book.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {Object.entries(grouped).map(([category, services]) => (
            <section key={category} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-200">
                  <Sparkles className="size-3" />
                  {getServiceCategoryLabel(category)}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <article
                    key={service.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-white">
                        {service.name}
                      </h2>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        <Clock className="mr-1 inline size-3" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {service.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-medium text-amber-300">
                        from {formatCurrency(Number(service.base_price))}
                      </span>
                      <span className="text-slate-400">
                        {isTimeBasedPublicService(service) ? "Time-based" : "Evergreen"}
                      </span>
                    </div>
                    <div className="mt-6">
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/20"
                      >
                        Compare Diviners
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
