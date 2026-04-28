"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Zap, ChevronDown, ChevronUp } from "lucide-react";
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
  isPending: boolean;
  ctaDisabledBase: boolean;
  hasSavedFullReport: boolean;
  month: string;
  highlights: string[];
  planets: Array<{
    name: string;
    glyph: string;
    sign: string;
    degree: number;
    retrograde: boolean;
    aspectCount: number;
    hasChallenging: boolean;
  }>;
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
                <Link
                  href="/diviner"
                  className="text-xs text-primary hover:underline hidden sm:inline"
                >
                  Book a reading →
                </Link>
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
              <CardContent className="border-t pt-4 space-y-5">
                {/* Key Transits / Highlights */}
                {card.highlights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Star className="size-3" />
                      Key Transits
                    </p>
                    <div className="space-y-1.5">
                      {card.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Zap className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Planet Positions */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Planets
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {card.planets.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <span className="text-lg leading-none">
                          {p.glyph}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {p.name}
                            {p.retrograde && (
                              <span className="ml-1 text-xs text-muted-foreground">℞</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.sign} {p.degree.toFixed(1)}°
                            {p.aspectCount > 0 && (
                              <> · {p.aspectCount} aspect{p.aspectCount !== 1 ? "s" : ""}</>
                            )}
                          </p>
                        </div>
                        {p.hasChallenging && (
                          <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                            ⚡
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons in expanded view — like /family */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button size="sm" asChild>
                    <Link href={card.detailedHref}>
                      {card.fullReportCta.kind === "view"
                        ? "View Full Report"
                        : card.fullReportCta.kind === "retry"
                        ? "Retry Full Report"
                        : "Generate Full Report"}
                    </Link>
                  </Button>
                  {card.hasSavedFullReport && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${card.detailedHref}&regenerate=1`}>
                        Regenerate
                      </Link>
                    </Button>
                  )}
                  <Link
                    href="/diviner"
                    className="text-xs text-primary hover:underline sm:hidden"
                  >
                    Book a reading →
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </>
  );
}
