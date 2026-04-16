"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const APP_BASE = "https://astrologypro.com";

interface ReadingPage {
  slug: string;
  title: string;
  description: string;
  category: "astrology" | "tarot";
  image: string;
}

const READING_PAGES: ReadingPage[] = [
  // ── Astrology ──────────────────────────────────────────────────
  {
    slug: "nativity-birth-chart",
    title: "Nativity Birth Chart",
    description:
      "The celestial blueprint cast at the moment of birth — reveals core nature, purpose, and life path.",
    category: "astrology",
    image: "/images/services/natal-chart.png",
  },
  {
    slug: "solar-return",
    title: "Solar Return Reading",
    description:
      "Your personal new year chart — maps the themes and opportunities of the year ahead.",
    category: "astrology",
    image: "/images/services/solar-return.png",
  },
  {
    slug: "saturn-return",
    title: "Saturn Return Reading",
    description:
      "The great reset at 29 and 58 — navigate the pressure that reshapes your entire future.",
    category: "astrology",
    image: "/images/services/saturn-return.png",
  },
  {
    slug: "jupiter-return",
    title: "Jupiter Return Reading",
    description:
      "Every 12 years Jupiter comes home — unlock the growth and expansion cycle opening for you.",
    category: "astrology",
    image: "/images/services/jupiter-return.png",
  },
  {
    slug: "mars-return",
    title: "Mars Return Reading",
    description:
      "Every two years Mars resets your drive — understand the action and ambition cycle ahead.",
    category: "astrology",
    image: "/images/services/natal-chart.png",
  },
  {
    slug: "uranus-opposition",
    title: "Uranus Opposition Reading",
    description:
      "The midlife awakening at 42 — channel the disruption into liberation and authentic purpose.",
    category: "astrology",
    image: "/images/services/natal-chart.png",
  },
  {
    slug: "weekly-transits",
    title: "Weekly Transit Forecast",
    description:
      "Know what the planets are activating each week and how to work with the energy, not against it.",
    category: "astrology",
    image: "/images/services/weekly-transits.png",
  },
  {
    slug: "monthly-transits-lunar-return",
    title: "Monthly Transits & Lunar Return",
    description:
      "A month-by-month celestial roadmap combining transits and your personal lunar cycle.",
    category: "astrology",
    image: "/images/services/monthly-transit.png",
  },
  {
    slug: "romantic-relationships",
    title: "Romantic Relationship Reading",
    description:
      "Synastry and composite charts reveal the deeper dynamics, gifts, and lessons of a romantic bond.",
    category: "astrology",
    image: "/images/services/romantic-relationships.png",
  },
  {
    slug: "friendship-relationships",
    title: "Friendship Compatibility Reading",
    description:
      "Explore the astrological chemistry behind any close platonic relationship or partnership.",
    category: "astrology",
    image: "/images/services/friendship-relationships.png",
  },
  {
    slug: "business-relationship",
    title: "Business Relationship Reading",
    description:
      "Assess the strengths, blindspots, and long-term potential of a professional partnership.",
    category: "astrology",
    image: "/images/services/business-relationships.png",
  },
  {
    slug: "predictive-event-horary",
    title: "Horary Question Reading",
    description:
      "A chart cast for the moment a question is asked — the most precise predictive tool in astrology.",
    category: "astrology",
    image: "/images/services/horary.png",
  },
  // ── Tarot ──────────────────────────────────────────────────────
  {
    slug: "3-card-basic-question-spread",
    title: "3-Card Basic Spread",
    description:
      "Past, present, and future — a focused reading for a single clear question.",
    category: "tarot",
    image: "/images/services/3-card-basic.png",
  },
  {
    slug: "5-card-complex-question-spread",
    title: "5-Card Complex Spread",
    description:
      "A deeper exploration of a situation with layers of context, obstacles, and outcome.",
    category: "tarot",
    image: "/images/services/5-card-complex.png",
  },
  {
    slug: "7-card-6-month-forward-review",
    title: "7-Card 6-Month Forecast",
    description:
      "Six months of guidance laid out month by month with an overarching energy card.",
    category: "tarot",
    image: "/images/services/7-card-forecast.png",
  },
  {
    slug: "7-card-horseshoe-spread-major-read",
    title: "7-Card Horseshoe Spread",
    description:
      "A comprehensive seven-position spread covering past influences, present state, and future path.",
    category: "tarot",
    image: "/images/services/7-card-horseshoe.png",
  },
  {
    slug: "10-card-relationship-spread",
    title: "10-Card Relationship Spread",
    description:
      "The definitive tarot reading for love and relationships — covers both people and the bond itself.",
    category: "tarot",
    image: "/images/services/10-card-relationship.png",
  },
  {
    slug: "10-card-celtic-cross-major-read",
    title: "10-Card Celtic Cross",
    description:
      "The classic major reading — a full life-situation analysis across ten precise positions.",
    category: "tarot",
    image: "/images/services/10-card-celtic-cross.png",
  },
  {
    slug: "12-card-astrological-spread-major-read",
    title: "12-Card Astrological Spread",
    description:
      "One card per astrological house — a complete 360° review of every area of your life.",
    category: "tarot",
    image: "/images/services/12-card-astrological.png",
  },
];

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard not available in insecure context
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs flex-1"
      onClick={handleCopy}
      aria-label="Copy affiliate link"
    >
      {copied ? (
        <>
          <Check className="size-3 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy Link
        </>
      )}
    </Button>
  );
}

type Filter = "all" | "astrology" | "tarot";

interface AffiliateMarketingKitProps {
  affiliateId: string;
}

export function AffiliateMarketingKit({ affiliateId }: AffiliateMarketingKitProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible =
    filter === "all"
      ? READING_PAGES
      : READING_PAGES.filter((p) => p.category === filter);

  const counts = {
    all: READING_PAGES.length,
    astrology: READING_PAGES.filter((p) => p.category === "astrology").length,
    tarot: READING_PAGES.filter((p) => p.category === "tarot").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Marketing Kit
          </h2>
          <p className="text-sm text-muted-foreground">
            Share these landing pages to earn commissions. Your unique affiliate
            link is pre-attached.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1 self-start sm:self-auto">
          {(["all", "astrology", "tarot"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "astrology" ? "⭐ Astrology" : "🃏 Tarot"}&nbsp;
              <span className="opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((page) => {
          const affiliateUrl = `${APP_BASE}/readings/${page.slug}?ref=${affiliateId}`;
          const previewUrl = `${APP_BASE}/readings/${page.slug}`;

          return (
            <Card key={page.slug} className="overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative h-36 w-full bg-muted overflow-hidden">
                <Image
                  src={page.image}
                  alt={page.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Category badge overlay */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold ${
                      page.category === "astrology"
                        ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {page.category === "astrology" ? (
                      <><Star className="size-2.5 mr-0.5" />Astrology</>
                    ) : (
                      <>🃏 Tarot</>
                    )}
                  </Badge>
                </div>
              </div>

              <CardContent className="flex flex-col flex-1 gap-3 p-4">
                {/* Title + description */}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-tight">{page.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {page.description}
                  </p>
                </div>

                {/* Affiliate URL preview */}
                <div className="rounded-md border bg-muted px-2.5 py-1.5 overflow-hidden">
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {affiliateUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <CopyLinkButton url={affiliateUrl} />
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={`Preview ${page.title}`}
                  >
                    <ExternalLink className="size-3" />
                    Preview
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
