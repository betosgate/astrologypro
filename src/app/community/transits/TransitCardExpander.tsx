"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { PerennialReadingButton } from "@/components/community/perennial-reading-cta";
import type { MonthlyTransitReportSummaryItem } from "@/lib/community/monthly-transit-report-summary";

export type TransitCardData = {
  id: string;
  familyMemberId: string;
  memberName: string;
  harmoniousCount: number;
  challengingCount: number;
  /**
   * True only when a real, validated monthly transit summary exists for
   * this row. When false, the supportive/challenging counts are NOT
   * meaningful — they default to zero because the source payload was
   * missing/invalid, not because the sky is empty. Consumers must use
   * this flag to gate aspect-count rendering so we don't display the
   * misleading "0 supportive · 0 challenging" subtitle as a fallback.
   *
   * Spec: tasks/06.05.2026/community-transits-profile-and-display-fixes/02-hide-misleading-zero-aspect-counts.md
   */
  hasValidTransitSummary: boolean;
  /**
   * Neutral one-line label shown in place of the aspect-count subtitle
   * when no valid summary exists (e.g. "Summary not available yet").
   * `null` only when the aspect-count subtitle itself is being shown.
   */
  transitSummaryLabel: string | null;
  fullReportCta: {
    label: string;
    kind: "generate" | "view" | "retry";
  };
  detailedHref: string;
  chartHref: string;
  chartCtaLabel: string;
  chartCtaDisabled: boolean;
  isPending: boolean;
  ctaDisabledBase: boolean;
  hasSavedFullReport: boolean;
  month: string;
  reportStatusLabel: string;
  reportSummaryItems: MonthlyTransitReportSummaryItem[];
  highlights: string[];
};

export function TransitCardExpander({
  cards,
  initialExpandedFamilyMemberId,
}: {
  cards: TransitCardData[];
  initialExpandedFamilyMemberId?: string | null;
}) {
  const initialExpandedCard = initialExpandedFamilyMemberId
    ? cards.find((card) => card.familyMemberId === initialExpandedFamilyMemberId)
    : null;
  const [expandedId, setExpandedId] = useState<string | null>(
    initialExpandedCard?.id ?? null
  );

  return (
    <>
      {cards.map((card) => {
        const isOpen = expandedId === card.id;
        const chartCtaLabel =
          card.chartCtaLabel === "View Natal Chart"
            ? "View Natal Chart"
            : card.chartCtaLabel === "Generating Natal Chart..."
              ? "Generating Natal Chart..."
              : "Generate Natal Chart";
        const hasReportSummary = card.reportSummaryItems.length > 0;
        const summaryLabel = hasReportSummary
          ? `${card.reportSummaryItems.length} report highlight${
              card.reportSummaryItems.length === 1 ? "" : "s"
            }`
          : card.hasValidTransitSummary
            ? `${card.harmoniousCount} supportive · ${card.challengingCount} challenging aspects`
            : card.transitSummaryLabel ?? "Summary not available yet";
        const snapshotLabel = hasReportSummary
          ? `${card.reportSummaryItems.length} report-derived highlight${
              card.reportSummaryItems.length === 1 ? "" : "s"
            }`
          : card.hasValidTransitSummary
            ? `${card.harmoniousCount} supportive · ${card.challengingCount} challenging`
            : card.transitSummaryLabel ?? "Summary not available yet";

        return (
          <Card key={card.id}>
            <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left transition-colors hover:text-foreground"
                onClick={() => setExpandedId(isOpen ? null : card.id)}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {card.memberName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{card.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {summaryLabel}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {card.chartCtaDisabled ? (
                  <Button size="sm" variant="outline" disabled>
                    <Telescope className="mr-1.5 size-4" />
                    {chartCtaLabel}
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href={card.chartHref}>
                      <Telescope className="mr-1.5 size-4" />
                      {chartCtaLabel}
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  size="sm"
                  variant={
                    card.fullReportCta.kind === "view" ? "default" : "outline"
                  }
                  disabled={card.ctaDisabledBase || card.isPending}
                >
                  <Link href={card.detailedHref}>
                    {card.isPending ? "Generating…" : card.fullReportCta.label}
                  </Link>
                </Button>
                {isOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {isOpen && (
              <CardContent className="border-t pt-4 space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-md border px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Month
                    </p>
                    <p className="mt-1 font-medium">{card.month}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <FileText className="size-3.5" />
                      Report
                    </p>
                    <p className="mt-1 font-medium">{card.reportStatusLabel}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Snapshot
                    </p>
                    <p className="mt-1 font-medium">{snapshotLabel}</p>
                  </div>
                </div>

                {hasReportSummary ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transit Snapshot
                    </p>
                    <ul className="space-y-2">
                      {card.reportSummaryItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                        >
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <span>
                            <span className="font-medium text-foreground">
                              {item.date ? `${item.date}: ` : ""}
                              {item.title}
                            </span>
                            {item.description ? ` - ${item.description}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : card.hasSavedFullReport ? (
                  <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                    Saved report found, but no summary-ready monthly transit
                    items were available in the report payload.
                  </div>
                ) : card.highlights.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transit Snapshot
                    </p>
                    <div className="space-y-1.5">
                      {card.highlights.map((h, i) => (
                        <p
                          key={i}
                          className="line-clamp-2 text-sm leading-relaxed text-muted-foreground"
                        >
                          {h}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {card.chartCtaDisabled ? (
                    <Button size="sm" variant="outline" disabled>
                      <Telescope className="mr-1.5 size-4" />
                      {chartCtaLabel}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={card.chartHref}>
                        <Telescope className="mr-1.5 size-4" />
                        {chartCtaLabel}
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <Link href={card.detailedHref}>
                      {card.fullReportCta.kind === "view"
                        ? "View Transit Report"
                        : card.fullReportCta.kind === "retry"
                        ? "Retry Transit Report"
                        : "Generate Transit Report"}
                    </Link>
                  </Button>
                  {/*
                    Regeneration is intentionally hidden for now.
                    Keep this CTA code in place so it can be restored without
                    rebuilding the action.
                  */}
                  {/* {card.hasSavedFullReport && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${card.detailedHref}&regenerate=1`}>
                        Regenerate Transit Report
                      </Link>
                    </Button>
                  )} */}
                  <PerennialReadingButton size="sm" variant="ghost">
                    <BookOpen className="mr-1.5 size-4" />
                    Book Reading - 5% Discount
                  </PerennialReadingButton>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </>
  );
}
