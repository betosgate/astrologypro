"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Share2,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { PLANET_SYMBOLS, ZODIAC_SYMBOLS, PLANET_IMAGES } from "@/app/admin/horoscope/constants";
import { ManualPlanetIcon, ManualZodiacIcon } from "@/app/admin/horoscope/components/astro-icons";

export const dynamic = "force-dynamic";

const RELATED_INSIGHT_LIMIT = 6;

const IMPORTANCE_BADGE: Record<string, string> = {
  "High Impact": "bg-red-100 text-red-700 border-red-200",
  "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Low Impact": "bg-green-100 text-green-700 border-green-200",
};

const SECTOR_DISPLAY: Record<string, string> = {
  governmentAndLeadership: "Government & Leadership",
  socialClimateAndPublicMood: "Social Climate & Public Mood",
  weatherAndAgriculture: "Weather & Agriculture",
  potentialConflictsAndAlliances: "Potential Conflicts & Alliances",
  publicHealthAndWorkforce: "Public Health & Workforce",
  communicationsAndTransportation: "Communications & Transportation",
  justiceLawAndForeignTrade: "Justice, Law & Foreign Trade",
  naturalDisasters: "Natural Disasters",
};

type ChartRulerItem = {
  icon?: string;
  text?: string;
};

type ChallengeStrengthItem = {
  type?: "challenge" | "strength" | string;
  icon?: string;
  text?: string;
};

type SystemInterpretation = {
  title?: string;
  shortDescription?: string;
  intro?: string;
  body?: string[];
  htmlContent?: string;
  chartRuler?: ChartRulerItem[];
  challengesAndStrengths?: ChallengeStrengthItem[];
  primaryChallenge?: string;
  primaryStrength?: string;
};

type RelatedInsight = {
  _id?: string;
  id?: string;
  typeIcon?: string;
  type?: string;
  title?: string;
  description?: string;
  link?: string;
  eventTimePeriod?: string;
  event_time_period?: string;
  effective_timePeriod?: string;
  effective_time_period?: string;
};

type IngressChart = {
  id: string;
  mongo_id?: string | null;
  legacy_user_id?: string | null;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  short_description: string | null;
  effective_time_period: string | null;
  event_time_period: string | null;
  event_timestamp: string | null;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lon: number | null;
  location_timezone: string | null;
  system_interpretation: SystemInterpretation | null;
  tags: string[];
  sector_focus: string[];
  author_name: string | null;
  author_email: string | null;
  is_social_advo: boolean;
  is_published: boolean;
  created_at: string;
  relatedInsights?: RelatedInsight[];
  hasMore?: boolean;
};

function displaySector(value: string) {
  return SECTOR_DISPLAY[value] ?? value;
}

function ordinalSuffix(day: number) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not set";

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const time = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${day}${ordinalSuffix(day)} ${month}, ${year} ${time}`;
}

function formatEventTime(iso: string | null | undefined) {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAuthorDetail(chart: IngressChart) {
  return chart.author_name || chart.author_email || chart.legacy_user_id || "System Generated";
}

function getInsightId(insight: RelatedInsight, index: number) {
  return insight._id || insight.id || insight.link || `related-${index}`;
}

function getInsightPeriod(insight: RelatedInsight) {
  return (
    insight.eventTimePeriod ||
    insight.event_time_period ||
    insight.effective_timePeriod ||
    insight.effective_time_period ||
    ""
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Details Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#141414] p-4 rounded-lg border border-gray-800">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>

      {/* System Interpretation Skeleton */}
      <div className="bg-[#141414] p-6 rounded-lg border border-gray-800 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Two Column Layout for Ruler and Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      {/* Related Insights Skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-[#141414] p-8 rounded-lg border border-gray-800 space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="border-t border-gray-800 pt-4 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function processHtmlWithIcons(html: string) {
  if (!html) return "";
  let result = html;
  
  // Handle Planets (Images)
  for (const [name, imgUrl] of Object.entries(PLANET_IMAGES)) {
    if (!imgUrl) continue;
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(regex, `$& <span class="astro-icon inline-flex items-center justify-center w-[21px] h-[19px]"><img src="${imgUrl}" class="w-full h-full object-contain" alt="${name}" /></span>`);
  }
  
  // Handle Zodiacs (Symbols)
  for (const [name, symbol] of Object.entries(ZODIAC_SYMBOLS)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(regex, `$& <span class="astro-icon inline-flex items-center justify-center w-[21px] h-[19px]"><span class="font-normal text-xl text-white">${symbol}</span></span>`);
  }
  
  return result;
}

function WordWithIcon({ word, iconColor = "text-white", useSymbolsForPlanets = false }: { word: string; iconColor?: string; useSymbolsForPlanets?: boolean }) {
  const clean = word.replace(/[(),.:]/g, "").trim();
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();

  const planetSymbol = PLANET_SYMBOLS[titled];
  const planetImg = PLANET_IMAGES[titled];
  const zodiacSymbol = ZODIAC_SYMBOLS[titled];

  return (
    <span className="inline-flex items-center gap-1">
      <span>{word}</span>
      {useSymbolsForPlanets && planetSymbol ? (
        <span className="astro-icon inline-flex items-center justify-center w-[21px] h-[19px]">
          <span className={`font-normal text-xl ${iconColor}`} aria-hidden="true">
            {planetSymbol}
          </span>
        </span>
      ) : planetImg ? (
        <span className="astro-icon inline-flex items-center justify-center w-[21px] h-[19px]">
          <img src={planetImg} alt={word} className="w-full h-full object-contain" />
        </span>
      ) : zodiacSymbol ? (
        <span className="astro-icon inline-flex items-center justify-center w-[21px] h-[19px]">
          <span className={`font-normal text-xl ${iconColor}`} aria-hidden="true">
            {zodiacSymbol}
          </span>
        </span>
      ) : null}
    </span>
  );
}

function RichText({ text, iconColor = "text-white", useSymbolsForPlanets = false }: { text: string; iconColor?: string; useSymbolsForPlanets?: boolean }) {
  if (!text) return null;
  const words = text.split(/\s+/);
  return (
    <span className="inline-flex flex-wrap gap-x-1">
      {words.map((word, i) => (
        <WordWithIcon key={i} word={word} iconColor={iconColor} useSymbolsForPlanets={useSymbolsForPlanets} />
      ))}
    </span>
  );
}

function RelatedInsightCard({ insight }: { insight: RelatedInsight }) {
  const [showAllSectors, setShowAllSectors] = useState(false);
  const sectors = insight.sector_focus ?? [];

  const visibleSectors = showAllSectors ? sectors : sectors.slice(0, 2);
  const hasMore = sectors.length > 2;

  return (
    <Link href={`/admin/ingress-charts/${insight.id}`} className="bg-[#141414] p-6 rounded-lg border border-gray-800 text-sm flex flex-col justify-between hover:border-gray-700 transition-colors">
      <div>
        <div className="text-gray-500 text-xs mb-1 uppercase font-semibold">{insight.type || "Station"}</div>
        <h3 className="font-bold mb-2 text-base text-white">{insight.title ?? "Untitled insight"}</h3>

        <p className="text-gray-400 text-xs line-clamp-2 mb-3">
          {insight.short_description || "This period heralds significant introspection and transformation, with a focus on communication and leadership."}
        </p>

        <div className="mb-3">
          <div className="text-gray-500 text-xs mb-1">This Chart Focused On :</div>
          <div className="flex flex-wrap gap-1 items-center">
            {visibleSectors.length > 0 ? (
              visibleSectors.map((sector) => (
                <span key={sector} className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">{sector}</span>
              ))
            ) : (
              <>
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">governmentAndLeadership</span>
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">socialClimateAndPublicMood</span>
              </>
            )}
            {hasMore && !showAllSectors && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAllSectors(true);
                }}
                className="text-primary text-xs font-medium hover:underline"
              >
                +{sectors.length - 2} more
              </button>
            )}
            {hasMore && showAllSectors && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAllSectors(false);
                }}
                className="text-primary text-xs font-medium hover:underline"
              >
                less
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3 space-y-1 text-xs text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-500">Event Time:</span>
          <span>{getInsightPeriod(insight) || "May 04, 2025"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Period:</span>
          <span>{getInsightPeriod(insight) || "May 01, 2025 - Aug 10, 2025"}</span>
        </div>
      </div>
    </Link>
  );
}

export default function AdminIngressChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [chart, setChart] = useState<IngressChart | null>(null);
  const [relatedInsights, setRelatedInsights] = useState<RelatedInsight[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const infiniteAnchorRef = useRef<HTMLDivElement | null>(null);

  const loadMoreInsights = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const res = await fetch(
      `/api/admin/ingress-charts/${id}?skip=${skip}&limit=${RELATED_INSIGHT_LIMIT}`,
    );

    if (res.ok) {
      const data = (await res.json()) as IngressChart;
      const newInsights = data.relatedInsights ?? [];
      setRelatedInsights((prev) => [...prev, ...newInsights]);
      setSkip((prev) => prev + newInsights.length);
      setHasMore(data.hasMore ?? false);
    }

    setLoadingMore(false);
  }, [hasMore, id, loadingMore, skip]);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      const res = await fetch(
        `/api/admin/ingress-charts/${id}?skip=0&limit=${RELATED_INSIGHT_LIMIT}`,
      );

      if (cancelled) return;

      if (!res.ok) {
        setError("Ingress chart not found.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as IngressChart;
      const firstInsights = data.relatedInsights ?? [];
      setChart(data);
      setRelatedInsights(firstInsights);
      setSkip(firstInsights.length);
      setHasMore(data.hasMore ?? false);
      setLoading(false);
    }

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const anchor = infiniteAnchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreInsights();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [loadMoreInsights]);

  if (loading) return <LoadingState />;

  if (error || !chart) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error || "Ingress chart not found."}</p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/ingress-charts">
            <ArrowLeft className="mr-1.5 size-4" /> Back to Ingress Charts
          </Link>
        </Button>
      </div>
    );
  }

  const interpretation = chart.system_interpretation;
  const shortDescription = interpretation?.shortDescription;
  const htmlContent = interpretation?.htmlContent;
  const bodyParagraphs = Array.isArray(interpretation?.body) ? interpretation.body : [];

  const chartRuler = interpretation?.chartRuler;
  const isChartRulerArray = Array.isArray(chartRuler);
  const chartRulerObject = !isChartRulerArray ? chartRuler as any : null;
  const chartRulerItems = isChartRulerArray ? chartRuler as any[] : [];

  const primaryStrength = interpretation?.primaryStrength;
  const primaryChallenge = interpretation?.primaryChallenge;

  const sectorFocus = chart.sector_focus ?? [];
  const tags = chart.tags ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/ingress-charts" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{chart.title}</h1>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141414] p-4 rounded-lg text-sm border border-gray-800">
        <div>
          <div className="text-gray-500 uppercase text-xs mb-1">Location</div>
          <div className="font-semibold">{chart.location_name || "USA"}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-xs mb-1">Event Time</div>
          <div className="font-semibold">{formatDateTime(chart.event_timestamp)}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-xs mb-1">Period</div>
          <div className="font-semibold">
            {chart.validity_start && chart.validity_end
              ? `${formatDate(chart.validity_start)} - ${formatDate(chart.validity_end)}`
              : chart.effective_time_period || chart.event_time_period || "Not set"}
          </div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-xs mb-1">Created Date</div>
          <div className="font-semibold">{formatDateTime(chart.created_at)}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-xs mb-1">Importance</div>
          <div className="flex items-center gap-1 font-semibold">
            <span className={`w-2 h-2 rounded-full ${chart.importance === "High Impact" ? "bg-red-500" : chart.importance === "Medium Impact" ? "bg-yellow-500" : "bg-green-500"}`}></span>
            <span>{chart.importance || "High Impact"}</span>
          </div>
        </div>
      </div>

      {/* System Interpretation */}
      <div>
        <h2 className="text-xl font-bold mb-3">System Interpretation</h2>
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800 text-gray-300 leading-normal space-y-4">
          {shortDescription && (
            <p className="font-semibold text-white">
              <RichText text={shortDescription} />
            </p>
          )}
          {htmlContent ? (
            <div
              className="prose prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: processHtmlWithIcons(htmlContent) }}
            />
          ) : bodyParagraphs.length > 0 ? (
            bodyParagraphs.map((paragraph, index) => (
              <p key={index}><RichText text={paragraph} /></p>
            ))
          ) : (
            <p>No interpretation content added.</p>
          )}
        </div>
      </div>

      {/* Chart Ruler */}
      {(chartRulerItems.length > 0 || chartRulerObject) && (
        <div>
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-bold mb-3">Chart Ruler</h2>
            <div className="space-y-3 text-gray-300 leading-normal">
              {chartRulerObject ? (
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white mt-0.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className="font-bold text-white whitespace-nowrap">Ruler:</span>
                    <span><RichText text={chartRulerObject.ruler} /></span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white mt-0.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className="font-bold text-white whitespace-nowrap">Position:</span>
                    <span><RichText text={chartRulerObject.position} /></span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white mt-0.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className="font-bold text-white whitespace-nowrap">Meaning:</span>
                    <span><RichText text={chartRulerObject.meaning} /></span>
                  </div>
                </div>
              ) : (
                chartRulerItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="text-sm"><RichText text={item.text} /></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenges and Strengths */}
      {(primaryStrength || primaryChallenge) && (
        <div>
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-bold mb-3">Challenges and Strengths</h2>
            <div className="space-y-4 text-gray-300 leading-normal">
              {primaryStrength && (
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    Strength
                  </h3>
                  <p className="text-sm mt-1"><RichText text={primaryStrength} /></p>
                </div>
              )}
              {primaryChallenge && (
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    Challenge
                  </h3>
                  <p className="text-sm mt-1"><RichText text={primaryChallenge} /></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
          <h2 className="text-lg font-bold mb-3">Tags</h2>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/admin/ingress-charts-list?tag=${encodeURIComponent(tag)}`} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium inline-flex items-center justify-center hover:bg-primary/80 transition-colors">
                  <RichText text={tag} iconColor="text-black" useSymbolsForPlanets={true} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tags added.</p>
          )}
          <div className="text-gray-400 text-sm mt-2 cursor-pointer hover:text-white">* Click a tag to view other charts with the same tag.</div>
        </div>
      </div>

      {/* This Chart is Focused On */}
      <div>
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
          <h2 className="text-lg font-bold mb-3">This Chart is Focused On:</h2>
          {sectorFocus.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {sectorFocus.map((sector) => (
                <Link key={sector} href={`/admin/ingress-charts-list?sector=${encodeURIComponent(sector)}`} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/80 transition-colors">
                  {displaySector(sector)}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No focus sectors added.</p>
          )}
          <div className="text-gray-400 text-sm mt-2 cursor-pointer hover:text-white">* Click a tag to view other charts with the same tag.</div>
        </div>
      </div>

      {/* Related Insights */}
      <div>
        <h2 className="text-xl font-bold mb-4">Related Insights</h2>
        {relatedInsights.length === 0 ? (
          <p className="text-sm text-gray-500">No related insights available.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {relatedInsights.map((insight, index) => (
              <RelatedInsightCard key={getInsightId(insight, index)} insight={insight} />
            ))}
          </div>
        )}

        <div ref={infiniteAnchorRef} className="h-1" />
        {loadingMore && (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading more insights...
          </div>
        )}
      </div>
    </div>
  );
}
