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
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-60 lg:col-span-2" />
        <Skeleton className="h-60" />
      </div>
    </div>
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
  const bodyParagraphs = Array.isArray(interpretation?.body) ? interpretation.body : [];
  const chartRulerItems = Array.isArray(interpretation?.chartRuler)
    ? interpretation.chartRuler
    : [];
  const challengesAndStrengths = Array.isArray(interpretation?.challengesAndStrengths)
    ? interpretation.challengesAndStrengths
    : [];
  const challenges = challengesAndStrengths.filter((item) => item.type === "challenge");
  const strengths = challengesAndStrengths.filter((item) => item.type === "strength");
  const generalChallengeStrengths = challengesAndStrengths.filter(
    (item) => item.type !== "challenge" && item.type !== "strength",
  );
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
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800 text-gray-300 leading-relaxed space-y-4">
          {bodyParagraphs.length > 0 ? (
            bodyParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>No interpretation content added.</p>
          )}
        </div>
      </div>

      {/* Chart Ruler */}
      {chartRulerItems.length > 0 && (
        <div>
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-bold mb-3">Chart Ruler</h2>
            <div className="space-y-3 text-gray-300">
              {chartRulerItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                  {item.icon && <span className="text-orange-500 text-lg">{item.icon}</span>}
                  <div className="text-sm">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Challenges and Strengths */}
      {challengesAndStrengths.length > 0 && (
        <div>
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-bold mb-3">Challenges and Strengths</h2>
            <div className="space-y-3 text-gray-300">
              {challengesAndStrengths.map((item, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                  {item.icon && <span className="text-orange-500 text-lg">{item.icon}</span>}
                  <div className="text-sm">{item.text}</div>
                </div>
              ))}
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
                <span key={tag} className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tags added.</p>
          )}
          <div className="text-gray-500 text-xs mt-2 cursor-pointer hover:text-gray-400">&lt;Click a tag to view other charts with the same tag&gt;</div>
        </div>
      </div>

      {/* This Chart is Focused On */}
      <div>
        <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
          <h2 className="text-lg font-bold mb-3">This Chart is Focused On:</h2>
          {sectorFocus.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {sectorFocus.map((sector) => (
                <span key={sector} className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                  {displaySector(sector)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No focus sectors added.</p>
          )}
          <div className="text-gray-500 text-xs mt-2 cursor-pointer hover:text-gray-400">&lt;Click a tag to view other charts with the same tag&gt;</div>
        </div>
      </div>

      {/* Related Insights */}
      <div>
        <h2 className="text-xl font-bold mb-4">Related Insights</h2>
        {relatedInsights.length === 0 ? (
          <p className="text-sm text-gray-500">No related insights available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedInsights.map((insight, index) => (
              <div key={getInsightId(insight, index)} className="bg-[#141414] p-6 rounded-lg border border-gray-800 text-sm flex flex-col justify-between">
                <div>
                  <div className="text-gray-500 text-xs mb-1 uppercase font-semibold">{insight.type || "Station"}</div>
                  <h3 className="font-bold mb-2 text-base text-white">{insight.title ?? "Untitled insight"}</h3>
                  
                  <div className="mb-3">
                    <div className="text-gray-500 text-xs mb-1">This Chart Focused On :</div>
                    <div className="flex flex-wrap gap-1">
                      {sectorFocus.length > 0 ? (
                        sectorFocus.map((sector) => (
                          <span key={sector} className="bg-orange-500 text-black px-2 py-0.5 rounded-full text-xs font-medium">{sector}</span>
                        ))
                      ) : (
                        <>
                          <span className="bg-orange-500 text-black px-2 py-0.5 rounded-full text-xs font-medium">governmentAndLeadership</span>
                          <span className="bg-orange-500 text-black px-2 py-0.5 rounded-full text-xs font-medium">socialClimateAndPublicMood</span>
                        </>
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
                  <div className="flex justify-between">
                    <span className="text-gray-500">Author Name:</span>
                    <span>System Generated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Author Email:</span>
                    <span>System Generated</span>
                  </div>
                </div>
              </div>
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
