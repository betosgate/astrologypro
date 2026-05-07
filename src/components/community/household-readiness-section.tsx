"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Telescope,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

/**
 * Compact "Household Readiness" dashboard card.
 *
 * Spec sources:
 *   tasks/06.05.2026/community-dashboard-household-readiness-card/
 *     01-audit-current-readiness-card-contract.md
 *     02-redesign-household-readiness-card-ui.md
 *     03-wire-household-readiness-metrics-and-actions.md
 *
 * Design intent:
 *   The legacy `ProfileProgressSection` showed two rings — "Birth Data %"
 *   for the logged-in member and "Household Members %" derived from raw
 *   member count. The latter implied 100% household readiness even when
 *   added members had no birth data, which contradicted the lower
 *   "Your Circle" cards. This component replaces that with a real
 *   summary of three distinct, accurate dimensions:
 *
 *     1. Self birth-data completeness        (`selfBirthDataPercent`)
 *     2. Members with chart-eligible data    (`completeMemberCount / total`)
 *     3. Members with a generated natal chart (`chartsReadyCount`)
 *
 *   It also surfaces the inverse — `missingDetailsCount` — and gates the
 *   "Complete Missing Details" CTA on real outstanding work. When the
 *   household is fully set up the card shifts to chart-access language
 *   (`Manage Family`, `View Charts`) instead of celebrating a hardcoded
 *   100%.
 *
 *   The card intentionally stays compact (no per-member grid) because
 *   the dashboard's lower `Your Circle` section already provides the
 *   detailed per-member view. Duplicating that would add noise without
 *   information.
 */
export interface HouseholdReadinessProps {
  /** Self birth-data percent (0/34/67/100), reused from the dashboard's
   *  primary-member rule — date of birth + birth time + birth city. */
  selfBirthDataPercent: number;
  /** True iff `selfBirthDataPercent === 100` — pre-computed by caller. */
  selfBirthDataComplete: boolean;
  /** Human-readable labels for the missing self birth fields (e.g.
   *  "Date of birth", "Birth time"). Falls back to a generic line when
   *  the caller doesn't pass it. */
  selfMissingFields: string[];
  /** Number of household members (incl. self) whose birth data is
   *  complete enough to generate charts. Uses the chart-flow gate. */
  completeMemberCount: number;
  /** Total visible household members (family rows + primary member). */
  totalMemberCount: number;
  /** Number of household members who still need birth-data details. */
  missingDetailsCount: number;
  /** Number of household members with a generated/saved natal chart. */
  chartsReadyCount: number;
  /** Number of household members eligible for natal-chart generation
   *  right now (i.e. those with complete birth data). The denominator
   *  for the `Charts Ready X / Y` tile. */
  chartsEligibleCount: number;
  /** Where the "Complete Missing Details" CTA should send the user.
   *  Defaults to `/community/family` when omitted. */
  completeDetailsHref?: string;
}

/**
 * Tile color tokens. Green for complete/view-ready, amber/orange for
 * action-needed states. Dark blue card body matches the existing
 * dashboard card style.
 */
function tileTone(
  variant: "ok" | "warn" | "neutral"
): { bg: string; text: string; border: string } {
  switch (variant) {
    case "ok":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-500/30",
      };
    case "warn":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-500/30",
      };
    case "neutral":
    default:
      return {
        bg: "bg-muted/40",
        text: "text-foreground",
        border: "border-border",
      };
  }
}

interface MetricTileProps {
  label: string;
  value: string;
  caption?: string;
  variant: "ok" | "warn" | "neutral";
}

function MetricTile({ label, value, caption, variant }: MetricTileProps) {
  const tone = tileTone(variant);
  return (
    <div
      className={`rounded-lg border ${tone.border} ${tone.bg} px-3 py-2.5 flex flex-col gap-0.5 min-w-0`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
        {label}
      </p>
      <p className={`text-base font-semibold leading-tight ${tone.text}`}>
        {value}
      </p>
      {caption ? (
        <p className="text-[10px] text-muted-foreground leading-tight truncate">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

interface ChecklistRowProps {
  ok: boolean;
  text: string;
}

function ChecklistRow({ ok, text }: ChecklistRowProps) {
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  const color = ok
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-amber-600 dark:text-amber-400";
  return (
    <li className="flex items-start gap-2 text-xs">
      <Icon className={`size-3.5 shrink-0 mt-0.5 ${color}`} aria-hidden="true" />
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {text}
      </span>
    </li>
  );
}

export function HouseholdReadinessSection({
  selfBirthDataPercent,
  selfBirthDataComplete,
  selfMissingFields,
  completeMemberCount,
  totalMemberCount,
  missingDetailsCount,
  chartsReadyCount,
  chartsEligibleCount,
  completeDetailsHref = "/community/family",
}: HouseholdReadinessProps) {
  const everythingReady =
    selfBirthDataComplete &&
    missingDetailsCount === 0 &&
    chartsEligibleCount > 0 &&
    chartsReadyCount === chartsEligibleCount;

  // Self status line — show specific missing fields when known so the
  // user doesn't have to click through to find out what's blocking.
  const selfStatusText = selfBirthDataComplete
    ? "Your birth data is complete"
    : selfMissingFields.length > 0
      ? `Add to your profile: ${selfMissingFields
          .map((f) => f.toLowerCase())
          .join(", ")}`
      : "Your birth data is incomplete";

  // Members complete summary line.
  const membersCompleteText =
    totalMemberCount === 0
      ? "No household members yet"
      : `${completeMemberCount} of ${totalMemberCount} member${
          totalMemberCount === 1 ? "" : "s"
        } have complete birth data`;

  // Charts summary line — only meaningful when at least one member is
  // chart-eligible; otherwise the count is structurally zero and would
  // look misleading next to the household-empty state.
  const chartsText =
    chartsEligibleCount === 0
      ? "No members eligible for charts yet"
      : `${chartsReadyCount} of ${chartsEligibleCount} natal chart${
          chartsEligibleCount === 1 ? "" : "s"
        } generated`;

  // Missing-details row: only shown when there is real outstanding work.
  const missingDetailsText =
    missingDetailsCount > 0
      ? `${missingDetailsCount} member${
          missingDetailsCount === 1 ? "" : "s"
        } still need birth details`
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          Household Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Top metric row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricTile
            label="Your Birth Data"
            value={`${selfBirthDataPercent}%`}
            caption={selfBirthDataComplete ? "Complete" : "Needs details"}
            variant={selfBirthDataComplete ? "ok" : "warn"}
          />
          <MetricTile
            label="Members Complete"
            value={`${completeMemberCount} / ${totalMemberCount}`}
            caption={
              totalMemberCount > 0 && completeMemberCount === totalMemberCount
                ? "All set"
                : "Birth data ready"
            }
            variant={
              totalMemberCount === 0
                ? "neutral"
                : completeMemberCount === totalMemberCount
                  ? "ok"
                  : "warn"
            }
          />
          <MetricTile
            label="Charts Ready"
            value={
              chartsEligibleCount === 0
                ? "0"
                : `${chartsReadyCount} / ${chartsEligibleCount}`
            }
            caption={
              chartsEligibleCount === 0
                ? "Pending birth data"
                : chartsReadyCount === chartsEligibleCount
                  ? "All generated"
                  : "Generate charts"
            }
            variant={
              chartsEligibleCount === 0
                ? "neutral"
                : chartsReadyCount === chartsEligibleCount
                  ? "ok"
                  : "warn"
            }
          />
          <MetricTile
            label="Missing Details"
            value={String(missingDetailsCount)}
            caption={
              missingDetailsCount === 0 ? "Nothing pending" : "Needs action"
            }
            variant={missingDetailsCount === 0 ? "ok" : "warn"}
          />
        </div>

        {/* ── Status checklist ────────────────────────────────────────── */}
        <ul className="space-y-1.5">
          <ChecklistRow ok={selfBirthDataComplete} text={selfStatusText} />
          <ChecklistRow
            ok={
              totalMemberCount > 0 && completeMemberCount === totalMemberCount
            }
            text={membersCompleteText}
          />
          <ChecklistRow
            ok={
              chartsEligibleCount > 0 && chartsReadyCount === chartsEligibleCount
            }
            text={chartsText}
          />
          {missingDetailsText ? (
            <ChecklistRow ok={false} text={missingDetailsText} />
          ) : null}
        </ul>

        {/* ── Action area ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {missingDetailsCount > 0 ? (
            <Button asChild size="sm" className="flex-1 sm:flex-none">
              <Link href={completeDetailsHref}>
                <UserPlus className="mr-1.5 size-3.5" />
                Complete Missing Details
              </Link>
            </Button>
          ) : null}
          <Button
            asChild
            size="sm"
            variant={missingDetailsCount > 0 ? "outline" : "default"}
            className="flex-1 sm:flex-none"
          >
            <Link href="/community/family">
              <UserCheck className="mr-1.5 size-3.5" />
              Manage Family
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Link href="/community/charts">
              <Telescope className="mr-1.5 size-3.5" />
              View Charts
            </Link>
          </Button>
        </div>

        {/* When everything is set up, soften the card with a positive
            confirmation line so the user knows there is nothing pending. */}
        {everythingReady ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Household setup is complete — explore charts and transits.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
