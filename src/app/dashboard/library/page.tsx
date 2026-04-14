"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Video,
  Sparkles,
  Globe,
  Star,
  BookOpen,
  Play,
  Search,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { APP_URL } from "@/lib/constants";

/* ---------- types ---------- */
interface RecordingRow {
  id: string;
  scheduled_at: string;
  recording_url: string;
  recording_share_id: string | null;
  actual_duration_minutes: number | null;
  session_notes: string | null;
  services: { name: string } | null;
  clients: { full_name: string; email: string } | null;
}

interface TarotRow {
  id: string;
  user_id: string;
  spread_name: string;
  cards: unknown[];
  notes: string | null;
  share_token: string | null;
  created_at: string;
  client: { full_name: string; email: string } | null;
}

interface ChartRow {
  id: string;
  user_id: string;
  city_label: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  chart_url: string | null;
  created_at: string;
  client: { full_name: string; email: string } | null;
}

interface AstroRow {
  id: string;
  user_id: string;
  reading_type: string;
  input_data: Record<string, unknown>;
  result_data: Record<string, unknown>;
  booking_id: string | null;
  created_at: string;
  client: { full_name: string; email: string } | null;
}

interface LibraryData {
  recordings: RecordingRow[];
  tarot: TarotRow[];
  charts: ChartRow[];
  astro: AstroRow[];
  counts: {
    recordings: number;
    tarot: number;
    charts: number;
    astro: number;
  };
}

type TabKey = "all" | "recordings" | "tarot" | "charts" | "astro";

const ALL_TABS: { key: TabKey; label: string; icon: React.ReactNode; countKey: keyof NonNullable<LibraryData>["counts"] | null }[] = [
  { key: "all", label: "All", icon: <BookOpen className="size-4" />, countKey: null },
  { key: "recordings", label: "Recordings", icon: <Video className="size-4" />, countKey: "recordings" },
  { key: "tarot", label: "Tarot", icon: <Star className="size-4" />, countKey: "tarot" },
  { key: "charts", label: "Birth Charts", icon: <Globe className="size-4" />, countKey: "charts" },
  { key: "astro", label: "Astro Toolkit", icon: <Sparkles className="size-4" />, countKey: "astro" },
];

/* ---------- helpers ---------- */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDuration(mins: number | null) {
  if (!mins) return "-";
  return `${mins} min`;
}

function truncate(s: string | null, len = 60) {
  if (!s) return "-";
  return s.length > len ? s.slice(0, len) + "\u2026" : s;
}

function readingTypeName(t: string) {
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- component ---------- */
export default function SessionLibraryPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "all");
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/dashboard/library?${params}`);
      if (!res.ok) throw new Error("Failed to fetch library data");
      const json: LibraryData = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load session library");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function copyShareLink(shareId: string) {
    const url = `${APP_URL}/session/${shareId}/recording`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard");
    });
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  const counts = data?.counts ?? { recordings: 0, tarot: 0, charts: 0, astro: 0 };

  // Only show tabs that have data (hide empty service types)
  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.countKey === null) return true; // always show "All"
    return counts[tab.countKey] > 0;
  });

  // If the active tab no longer has data, fall back to "all"
  const effectiveTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : "all";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-[#c9a84c]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#f5f0e8]">
            Session Library
          </h1>
        </div>
        <p className="mt-1 text-[#f5f0e8]/60">
          All recordings, readings, and charts from your sessions
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Recordings
            </CardTitle>
            <Video className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {counts.recordings.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">completed sessions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Tarot Readings
            </CardTitle>
            <Star className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {counts.tarot.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">readings delivered</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Birth Charts
            </CardTitle>
            <Globe className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {counts.charts.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">charts generated</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Astro Readings
            </CardTitle>
            <Sparkles className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {counts.astro.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">toolkit readings</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#f5f0e8]/40" />
          <Input
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/10 bg-white/[0.04] pl-10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "bg-[#c9a84c]/20 text-[#c9a84c] hover:bg-[#c9a84c]/30"
                  : "text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-white/[0.04]"
              }
            >
              {tab.icon}
              <span className="ml-1.5">{tab.label}</span>
              {tab.countKey && (
                <span className="ml-1 text-[0.65rem] opacity-60">({counts[tab.countKey]})</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-[#c9a84c]" />
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="space-y-6">
          {/* Recordings */}
          {(effectiveTab === "all" || effectiveTab === "recordings") && (
            <Section title="Recordings" icon={<Video className="size-4 text-[#c9a84c]" />} show={effectiveTab === "all"}>
              {data.recordings.length === 0 ? (
                <EmptyState label="No recordings found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[#f5f0e8]/50">
                        <th className="pb-2 pr-4 font-medium">Client</th>
                        <th className="pb-2 pr-4 font-medium">Service</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Duration</th>
                        <th className="pb-2 pr-4 font-medium">Notes</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recordings.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                          <td className="py-3 pr-4">
                            {r.clients?.full_name ?? r.clients?.email ?? "-"}
                          </td>
                          <td className="py-3 pr-4">{r.services?.name ?? "-"}</td>
                          <td className="py-3 pr-4">{fmtDate(r.scheduled_at)}</td>
                          <td className="py-3 pr-4">{fmtDuration(r.actual_duration_minutes)}</td>
                          <td className="py-3 pr-4">{truncate(r.session_notes)}</td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                                onClick={() => window.open(r.recording_url, "_blank")}
                              >
                                <Play className="size-3.5 mr-1" />
                                Watch
                              </Button>
                              {r.recording_share_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#f5f0e8]/60 hover:text-[#f5f0e8]"
                                  onClick={() => copyShareLink(r.recording_share_id!)}
                                >
                                  <Copy className="size-3.5 mr-1" />
                                  Share
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* Tarot */}
          {(effectiveTab === "all" || effectiveTab === "tarot") && (
            <Section title="Tarot Readings" icon={<Star className="size-4 text-[#c9a84c]" />} show={effectiveTab === "all"}>
              {data.tarot.length === 0 ? (
                <EmptyState label="No tarot readings found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[#f5f0e8]/50">
                        <th className="pb-2 pr-4 font-medium">Client</th>
                        <th className="pb-2 pr-4 font-medium">Spread</th>
                        <th className="pb-2 pr-4 font-medium">Cards</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tarot.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                          <td className="py-3 pr-4">
                            {r.client?.full_name ?? r.client?.email ?? "-"}
                          </td>
                          <td className="py-3 pr-4">{r.spread_name}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="border-white/10 text-[#f5f0e8]/60">
                              {Array.isArray(r.cards) ? r.cards.length : 0} cards
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">{fmtDate(r.created_at)}</td>
                          <td className="py-3">{truncate(r.notes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* Birth Charts */}
          {(effectiveTab === "all" || effectiveTab === "charts") && (
            <Section title="Birth Charts" icon={<Globe className="size-4 text-[#c9a84c]" />} show={effectiveTab === "all"}>
              {data.charts.length === 0 ? (
                <EmptyState label="No birth charts found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[#f5f0e8]/50">
                        <th className="pb-2 pr-4 font-medium">Client</th>
                        <th className="pb-2 pr-4 font-medium">Birth Location</th>
                        <th className="pb-2 pr-4 font-medium">Birth Date</th>
                        <th className="pb-2 pr-4 font-medium">Created</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.charts.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                          <td className="py-3 pr-4">
                            {r.client?.full_name ?? r.client?.email ?? "-"}
                          </td>
                          <td className="py-3 pr-4">{r.city_label}</td>
                          <td className="py-3 pr-4">
                            {r.birth_month}/{r.birth_day}/{r.birth_year}
                          </td>
                          <td className="py-3 pr-4">{fmtDate(r.created_at)}</td>
                          <td className="py-3">
                            {r.chart_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                                onClick={() => window.open(r.chart_url!, "_blank")}
                              >
                                <ExternalLink className="size-3.5 mr-1" />
                                View Chart
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* Astro Toolkit */}
          {(effectiveTab === "all" || effectiveTab === "astro") && (
            <Section title="Astro Toolkit Readings" icon={<Sparkles className="size-4 text-[#c9a84c]" />} show={effectiveTab === "all"}>
              {data.astro.length === 0 ? (
                <EmptyState label="No astro toolkit readings found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[#f5f0e8]/50">
                        <th className="pb-2 pr-4 font-medium">Client</th>
                        <th className="pb-2 pr-4 font-medium">Reading Type</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.astro.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                          <td className="py-3 pr-4">
                            {r.client?.full_name ?? r.client?.email ?? "-"}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="border-white/10 text-[#f5f0e8]/60">
                              {readingTypeName(r.reading_type)}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">{fmtDate(r.created_at)}</td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                              onClick={() =>
                                toast.info(
                                  JSON.stringify(r.result_data, null, 2).slice(0, 200)
                                )
                              }
                            >
                              <ExternalLink className="size-3.5 mr-1" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* All tab: combined chronological */}
          {effectiveTab === "all" &&
            data.recordings.length === 0 &&
            data.tarot.length === 0 &&
            data.charts.length === 0 &&
            data.astro.length === 0 && (
              <EmptyState label="No session data found" />
            )}
        </div>
      )}
    </div>
  );
}

/* ---------- sub-components ---------- */

function Section({
  title,
  icon,
  show,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      {show && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#f5f0e8]">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-[#f5f0e8]/40 text-sm">
      {label}
    </div>
  );
}
