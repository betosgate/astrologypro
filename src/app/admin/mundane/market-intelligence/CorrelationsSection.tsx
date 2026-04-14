"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import CorrelatePanel, { type CorrelationResult } from "./CorrelatePanel";

type DataSource = {
  id: string;
  name: string;
  source_type: string;
};

type Correlation = CorrelationResult;

type Props = {
  sources: DataSource[];
  initialCorrelations: Correlation[];
  sourceNameMap: Record<string, string>;
};

function coeffBadgeClass(c: number | null): string {
  if (c === null) return "bg-gray-100 text-gray-500 border-gray-200";
  if (c > 0.5) return "bg-green-100 text-green-700 border-green-200";
  if (c < -0.5) return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CorrelationsSection({
  sources,
  initialCorrelations,
  sourceNameMap,
}: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const [correlations, setCorrelations] = useState<Correlation[]>(initialCorrelations);

  function handleNewCorrelation(result: Correlation) {
    setCorrelations((prev) => {
      const updated = [result, ...prev];
      return updated.sort(
        (a, b) => Math.abs(b.correlation_coefficient ?? 0) - Math.abs(a.correlation_coefficient ?? 0)
      );
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Astrological Correlations</h2>
        <Button
          size="sm"
          variant={showPanel ? "secondary" : "default"}
          onClick={() => setShowPanel((v) => !v)}
        >
          <Zap className="mr-1.5 size-4" />
          {showPanel ? "Hide Form" : "Compute Correlation"}
        </Button>
      </div>

      {showPanel && (
        <CorrelatePanel
          sources={sources}
          onClose={() => setShowPanel(false)}
          onSuccess={(r) => {
            handleNewCorrelation(r);
            setShowPanel(false);
          }}
        />
      )}

      {correlations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No correlations computed yet. Click &ldquo;Compute Correlation&rdquo; to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Astro Event
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Planet
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Data Source
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Coefficient
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Samples
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Coverage
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Period
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {correlations.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="capitalize font-medium">
                      {c.astro_event_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {c.planet ?? <span className="text-gray-300 text-xs">any</span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">
                    {sourceNameMap[c.data_source_id] ?? c.data_source_id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Badge
                      variant="outline"
                      className={`tabular-nums font-mono text-xs ${coeffBadgeClass(c.correlation_coefficient)}`}
                    >
                      {c.correlation_coefficient !== null
                        ? (c.correlation_coefficient > 0 ? "+" : "") +
                          c.correlation_coefficient.toFixed(4)
                        : "—"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {c.sample_count ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {c.significance_level !== null
                      ? `${(c.significance_level * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {c.date_range_start && c.date_range_end
                      ? `${formatDate(c.date_range_start)} – ${formatDate(c.date_range_end)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
