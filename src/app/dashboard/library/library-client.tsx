"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video, Sparkles, Globe, Star, BookOpen, Play, Search, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { APP_URL } from "@/lib/constants";

/* ---------- types ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

interface LibraryClientProps {
  recordings: AnyRow[];
  tarot: AnyRow[];
  charts: AnyRow[];
  astro: AnyRow[];
}

type TabKey = "all" | "recordings" | "tarot" | "charts" | "astro";

/* ---------- helpers ---------- */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDuration(mins: number | null) { return mins ? `${mins} min` : "-"; }
function truncate(s: string | null, len = 60) {
  if (!s) return "-";
  return s.length > len ? s.slice(0, len) + "\u2026" : s;
}
function readingTypeName(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- component ---------- */
export function LibraryClient({ recordings, tarot, charts, astro }: LibraryClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

  const s = search.toLowerCase();

  // Client-side search filter
  const filteredRecordings = s
    ? recordings.filter((r) => r.clients?.full_name?.toLowerCase().includes(s))
    : recordings;
  const filteredTarot = s
    ? tarot.filter((r) => r.client?.full_name?.toLowerCase().includes(s))
    : tarot;
  const filteredCharts = s
    ? charts.filter((r) => r.client?.full_name?.toLowerCase().includes(s))
    : charts;
  const filteredAstro = s
    ? astro.filter((r) => r.client?.full_name?.toLowerCase().includes(s))
    : astro;

  const counts = {
    recordings: recordings.length,
    tarot: tarot.length,
    charts: charts.length,
    astro: astro.length,
  };

  const ALL_TABS: { key: TabKey; label: string; icon: React.ReactNode; countKey: keyof typeof counts | null }[] = [
    { key: "all", label: "All", icon: <BookOpen className="size-4" />, countKey: null },
    { key: "recordings", label: "Recordings", icon: <Video className="size-4" />, countKey: "recordings" },
    { key: "tarot", label: "Tarot", icon: <Star className="size-4" />, countKey: "tarot" },
    { key: "charts", label: "Birth Charts", icon: <Globe className="size-4" />, countKey: "charts" },
    { key: "astro", label: "Astro Toolkit", icon: <Sparkles className="size-4" />, countKey: "astro" },
  ];

  // Hide tabs with no data
  const visibleTabs = ALL_TABS.filter((t) => t.countKey === null || counts[t.countKey] > 0);
  const effectiveTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : "all";

  function copyShareLink(shareId: string) {
    const url = `${APP_URL}/session/${shareId}/recording`;
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied"));
  }

  const show = (tab: TabKey) => effectiveTab === "all" || effectiveTab === tab;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-[#c9a84c]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#f5f0e8]">Session Library</h1>
        </div>
        <p className="mt-1 text-[#f5f0e8]/60">All recordings, readings, and charts from your sessions</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Recordings", value: counts.recordings, icon: <Video className="size-4 text-[#c9a84c]" />, sub: "completed sessions" },
          { label: "Tarot Readings", value: counts.tarot, icon: <Star className="size-4 text-[#c9a84c]" />, sub: "readings delivered" },
          { label: "Birth Charts", value: counts.charts, icon: <Globe className="size-4 text-[#c9a84c]" />, sub: "charts generated" },
          { label: "Astro Readings", value: counts.astro, icon: <Sparkles className="size-4 text-[#c9a84c]" />, sub: "toolkit readings" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-white/10 bg-white/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5f0e8]">{kpi.value}</div>
              <p className="text-xs text-[#f5f0e8]/40">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
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
              variant={effectiveTab === tab.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={
                effectiveTab === tab.key
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

      {/* Content */}
      <div className="space-y-6">
        {/* Recordings */}
        {show("recordings") && counts.recordings > 0 && (
          <Section title="Recordings" icon={<Video className="size-4 text-[#c9a84c]" />} showTitle={effectiveTab === "all"}>
            <TableWrapper>
              <thead>
                <Th>Client</Th><Th>Service</Th><Th>Date</Th><Th>Duration</Th><Th>Notes</Th><Th>Actions</Th>
              </thead>
              <tbody>
                {(filteredRecordings.length === 0 ? recordings : filteredRecordings).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                    <Td>{r.clients?.full_name ?? r.clients?.email ?? "—"}</Td>
                    <Td>{r.services?.name ?? "—"}</Td>
                    <Td>{fmtDate(r.scheduled_at)}</Td>
                    <Td>{fmtDuration(r.actual_duration_minutes)}</Td>
                    <Td>{truncate(r.session_notes)}</Td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                          onClick={() => window.open(r.recording_url, "_blank")}>
                          <Play className="size-3.5 mr-1" />Watch
                        </Button>
                        {r.recording_share_id && (
                          <Button variant="ghost" size="sm" className="text-[#f5f0e8]/60 hover:text-[#f5f0e8]"
                            onClick={() => copyShareLink(r.recording_share_id)}>
                            <Copy className="size-3.5 mr-1" />Share
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
        )}

        {/* Tarot */}
        {show("tarot") && counts.tarot > 0 && (
          <Section title="Tarot Readings" icon={<Star className="size-4 text-[#c9a84c]" />} showTitle={effectiveTab === "all"}>
            <TableWrapper>
              <thead>
                <Th>Client</Th><Th>Spread</Th><Th>Cards</Th><Th>Date</Th><Th>Notes</Th>
              </thead>
              <tbody>
                {(filteredTarot.length === 0 ? tarot : filteredTarot).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                    <Td>{r.client?.full_name ?? r.client?.email ?? "—"}</Td>
                    <Td>{r.spread_name}</Td>
                    <Td>
                      <Badge variant="outline" className="border-white/10 text-[#f5f0e8]/60">
                        {Array.isArray(r.cards) ? r.cards.length : 0} cards
                      </Badge>
                    </Td>
                    <Td>{fmtDate(r.created_at)}</Td>
                    <Td>{truncate(r.notes)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
        )}

        {/* Birth Charts */}
        {show("charts") && counts.charts > 0 && (
          <Section title="Birth Charts" icon={<Globe className="size-4 text-[#c9a84c]" />} showTitle={effectiveTab === "all"}>
            <TableWrapper>
              <thead>
                <Th>Client</Th><Th>Birth Location</Th><Th>Birth Date</Th><Th>Created</Th><Th>Actions</Th>
              </thead>
              <tbody>
                {(filteredCharts.length === 0 ? charts : filteredCharts).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                    <Td>{r.client?.full_name ?? r.client?.email ?? "—"}</Td>
                    <Td>{r.city_label}</Td>
                    <Td>{r.birth_month}/{r.birth_day}/{r.birth_year}</Td>
                    <Td>{fmtDate(r.created_at)}</Td>
                    <td className="py-3">
                      {r.chart_url && (
                        <Button variant="ghost" size="sm" className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                          onClick={() => window.open(r.chart_url, "_blank")}>
                          <ExternalLink className="size-3.5 mr-1" />View Chart
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
        )}

        {/* Astro Toolkit */}
        {show("astro") && counts.astro > 0 && (
          <Section title="Astro Toolkit Readings" icon={<Sparkles className="size-4 text-[#c9a84c]" />} showTitle={effectiveTab === "all"}>
            <TableWrapper>
              <thead>
                <Th>Client</Th><Th>Reading Type</Th><Th>Date</Th><Th>Actions</Th>
              </thead>
              <tbody>
                {(filteredAstro.length === 0 ? astro : filteredAstro).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-[#f5f0e8]/80">
                    <Td>{r.client?.full_name ?? r.client?.email ?? "—"}</Td>
                    <Td>
                      <Badge variant="outline" className="border-white/10 text-[#f5f0e8]/60">
                        {readingTypeName(r.reading_type)}
                      </Badge>
                    </Td>
                    <Td>{fmtDate(r.created_at)}</Td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" className="text-[#c9a84c] hover:text-[#c9a84c]/80"
                        onClick={() => toast.info(JSON.stringify(r.result_data, null, 2).slice(0, 200))}>
                        <ExternalLink className="size-3.5 mr-1" />View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
        )}

        {counts.recordings === 0 && counts.tarot === 0 && counts.charts === 0 && counts.astro === 0 && (
          <Card className="border-white/10 bg-white/[0.02]">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <BookOpen className="size-8 text-[#f5f0e8]/20" />
              <p className="text-sm text-[#f5f0e8]/40">No session data found yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- sub-components ---------- */
function Section({ title, icon, showTitle, children }: {
  title: string; icon: React.ReactNode; showTitle: boolean; children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#f5f0e8]">
            {icon}{title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="pb-2 pr-4 font-medium text-left text-[#f5f0e8]/50">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4">{children}</td>;
}
