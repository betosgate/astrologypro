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
  Telescope,
} from "lucide-react";
import Link from "next/link";

export type TransitCardData = {
  id: string;
  familyMemberId: string;
  memberName: string;
  harmoniousCount: number;
  challengingCount: number;
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
  highlights: string[];
};

export function TransitCardExpander({
  cards,
}: {
  cards: TransitCardData[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      {cards.map((card) => {
        const isOpen = expandedId === card.id;

        return (
          <Card key={card.id}>
            <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:text-foreground"
                onClick={() => setExpandedId(isOpen ? null : card.id)}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {card.memberName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{card.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.harmoniousCount} supportive · {card.challengingCount} challenging aspects
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {card.chartCtaDisabled ? (
                  <Button size="sm" variant="outline" disabled>
                    <Telescope className="mr-1.5 size-4" />
                    {card.chartCtaLabel}
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href={card.chartHref}>
                      <Telescope className="mr-1.5 size-4" />
                      {card.chartCtaLabel}
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
                    <p className="mt-1 font-medium">
                      {card.harmoniousCount} supportive · {card.challengingCount} challenging
                    </p>
                  </div>
                </div>

                {card.highlights.length > 0 && (
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
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {card.chartCtaDisabled ? (
                    <Button size="sm" variant="outline" disabled>
                      <Telescope className="mr-1.5 size-4" />
                      {card.chartCtaLabel}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={card.chartHref}>
                        <Telescope className="mr-1.5 size-4" />
                        {card.chartCtaLabel}
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
                  {card.hasSavedFullReport && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${card.detailedHref}&regenerate=1`}>
                        Regenerate Transit Report
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/diviner">
                      <BookOpen className="mr-1.5 size-4" />
                      Book Reading
                    </Link>
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </>
  );
}
