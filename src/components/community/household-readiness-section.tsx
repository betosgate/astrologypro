"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Sparkles,
  Telescope,
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

function metricTone(
  variant: "ok" | "warn" | "neutral" | "accent"
): { text: string; stroke: string; track: string; iconBg: string } {
  switch (variant) {
    case "ok":
      return {
        text: "text-emerald-700 dark:text-emerald-300",
        stroke: "stroke-emerald-500",
        track: "stroke-emerald-500/15",
        iconBg: "bg-emerald-500/15",
      };
    case "warn":
      return {
        text: "text-amber-700 dark:text-amber-300",
        stroke: "stroke-amber-500",
        track: "stroke-amber-500/15",
        iconBg: "bg-amber-500/15",
      };
    case "accent":
      return {
        text: "text-violet-700 dark:text-violet-300",
        stroke: "stroke-violet-500",
        track: "stroke-violet-500/15",
        iconBg: "bg-violet-500/15",
      };
    case "neutral":
    default:
      return {
        text: "text-foreground",
        stroke: "stroke-sky-500",
        track: "stroke-sky-500/15",
        iconBg: "bg-sky-500/15",
      };
  }
}

interface CircleMetricProps {
  label: string;
  value: string;
  caption?: string;
  progress: number;
  variant: "ok" | "warn" | "neutral" | "accent";
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

function CircleMetric({
  label,
  value,
  caption,
  progress,
  variant,
  icon: Icon,
}: CircleMetricProps) {
  const tone = metricTone(variant);
  const normalized = Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className={`mb-2 flex size-7 items-center justify-center rounded-full ${tone.iconBg}`}>
        <Icon className={`size-3.5 ${tone.text}`} aria-hidden />
      </div>
      <div className="relative size-24">
        <svg className="-rotate-90 size-24" viewBox="0 0 96 96" aria-hidden="true">
          <circle
            cx="48"
            cy="48"
            r="38"
            fill="none"
            strokeWidth="8"
            className={tone.track}
          />
          <circle
            cx="48"
            cy="48"
            r="38"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`${tone.stroke} transition-[stroke-dashoffset] duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold text-foreground">{value}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold leading-tight text-foreground">
        {label}
      </p>
      {caption ? (
        <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
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
  const memberProgress =
    totalMemberCount > 0 ? (completeMemberCount / totalMemberCount) * 100 : 0;
  const chartsProgress =
    chartsEligibleCount > 0
      ? (chartsReadyCount / chartsEligibleCount) * 100
      : 0;
  const missingDetailsProgress = missingDetailsCount === 0 ? 100 : 35;
  const checklistAction = null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              Household Readiness
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Track birth data, charts, and setup progress at a glance.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── Circular readiness indicators ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
          <CircleMetric
            label="Birth Data"
            value={`${selfBirthDataPercent}%`}
            caption={selfBirthDataComplete ? "Complete" : "Needs details"}
            progress={selfBirthDataPercent}
            variant={selfBirthDataComplete ? "ok" : "warn"}
            icon={selfBirthDataComplete ? CircleCheck : CircleAlert}
          />
          <CircleMetric
            label="Members Complete"
            value={`${completeMemberCount} / ${totalMemberCount}`}
            caption={
              totalMemberCount > 0 && completeMemberCount === totalMemberCount
                ? "All set"
                : "Birth data ready"
            }
            progress={memberProgress}
            variant={
              totalMemberCount === 0
                ? "neutral"
                : completeMemberCount === totalMemberCount
                  ? "accent"
                  : "warn"
            }
            icon={Users}
          />
          <CircleMetric
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
                  : `${chartsEligibleCount - chartsReadyCount} remaining`
            }
            progress={chartsProgress}
            variant={
              chartsEligibleCount === 0
                ? "neutral"
                : chartsReadyCount === chartsEligibleCount
                  ? "ok"
                  : "warn"
            }
            icon={Telescope}
          />
          <CircleMetric
            label="Missing Details"
            value={String(missingDetailsCount)}
            caption={
              missingDetailsCount === 0 ? "Nothing pending" : "Needs action"
            }
            progress={missingDetailsProgress}
            variant={missingDetailsCount === 0 ? "ok" : "warn"}
            icon={missingDetailsCount === 0 ? CheckCircle2 : AlertTriangle}
          />
        </div>

        <div className="space-y-2">
          {/* ── Status checklist ──────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Readiness Checklist
            </p>
            {checklistAction}
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <ChecklistRow ok={selfBirthDataComplete} text={selfStatusText} />
            <ChecklistRow
              ok={
                totalMemberCount > 0 && completeMemberCount === totalMemberCount
              }
              text={membersCompleteText}
            />
            <ChecklistRow
              ok={
                chartsEligibleCount > 0 &&
                chartsReadyCount === chartsEligibleCount
              }
              text={chartsText}
            />
            {missingDetailsText ? (
              <ChecklistRow ok={false} text={missingDetailsText} />
            ) : null}
          </ul>
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
