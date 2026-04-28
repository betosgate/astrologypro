/**
 * Community-side render of a saved monthly full report.
 *
 * Spec source:
 *   tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle/05-saved-view-and-regenerate.md
 *
 * Server component — renders the previously-saved astro_ai_responses
 * payload directly, without re-mounting the toolkit. That gives us:
 *   - No live AI/compute calls.
 *   - Same data and chart-image fields the user saw on first generation.
 *
 * Hydration mode for the toolkit itself remains a future-task follow-up;
 * this component covers the "view saved" surface area mandated by the
 * spec without touching the 3902-line toolkit page.
 */

import { Card, CardContent } from "@/components/ui/card";

interface SavedReportRow {
  id?: string;
  toolname?: string | null;
  ai_response?: unknown;
  free_natal_wheel_chart?: string | null;
  free_natal_wheel_chart_transit?: string | null;
  natal_chart?: unknown;
  astro_api_data?: unknown;
  created_at?: string | null;
}

/**
 * The saved AI response shape can vary by tool slug. For
 * `tropical_transits_monthly_v3` we expect a Record-of-section
 * objects keyed by section slug. Each section value is typically:
 *   { name?: string, interpretation?: string }
 *
 * We coerce defensively rather than typing strictly so a small shape
 * drift doesn't crash the render.
 */
function asSections(raw: unknown): Array<{ key: string; name: string; html: string }> {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const out: Array<{ key: string; name: string; html: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      // Per-planet arrays — flatten into one section each.
      for (const item of value) {
        if (!item || typeof item !== "object") continue;
        const i = item as Record<string, unknown>;
        out.push({
          key: `${key}:${out.length}`,
          name:
            (typeof i.name === "string" && i.name) ||
            (typeof i.title === "string" && i.title) ||
            key,
          html:
            typeof i.interpretation === "string"
              ? i.interpretation
              : typeof i.content === "string"
              ? i.content
              : "",
        });
      }
    } else if (value && typeof value === "object") {
      const v = value as Record<string, unknown>;
      out.push({
        key,
        name:
          (typeof v.name === "string" && v.name) ||
          (typeof v.title === "string" && v.title) ||
          key,
        html:
          typeof v.interpretation === "string"
            ? v.interpretation
            : typeof v.content === "string"
            ? v.content
            : "",
      });
    } else if (typeof value === "string") {
      out.push({ key, name: key, html: value });
    }
  }
  return out;
}

export function CommunityMonthlySavedView({
  report,
}: {
  report: SavedReportRow | null;
}) {
  if (!report) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          The saved report is unavailable.
        </CardContent>
      </Card>
    );
  }

  const sections = asSections(report.ai_response);
  const wheelUrl = report.free_natal_wheel_chart || null;
  const transitWheelUrl = report.free_natal_wheel_chart_transit || null;

  return (
    <div className="space-y-4">
      {(wheelUrl || transitWheelUrl) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {wheelUrl ? (
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Natal wheel
                </p>
                {wheelUrl.startsWith("<svg") ? (
                  <div
                    className="mt-2 [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: wheelUrl }}
                  />
                ) : (
                  <a
                    href={wheelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Open natal wheel
                  </a>
                )}
              </CardContent>
            </Card>
          ) : null}
          {transitWheelUrl ? (
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transit wheel
                </p>
                {transitWheelUrl.startsWith("<svg") ? (
                  <div
                    className="mt-2 [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: transitWheelUrl }}
                  />
                ) : (
                  <a
                    href={transitWheelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Open transit wheel
                  </a>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            The saved report doesn&apos;t include any AI sections — try
            regenerating to refresh it.
          </CardContent>
        </Card>
      ) : (
        sections.map((s) => (
          <Card key={s.key}>
            <CardContent className="py-4 space-y-2">
              <h3 className="text-sm font-semibold">{s.name}</h3>
              {/*
                AI sections persist HTML strings (lists, paragraphs).
                We render with dangerouslySetInnerHTML matching how the
                toolkit renders. Future hardening can add DOMPurify.
              */}
              {s.html ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">No content saved for this section.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
