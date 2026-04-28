"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Save-and-link button shown above the toolkit on the community
 * detailed monthly route.
 *
 * Spec source:
 *   tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle/04-save-and-link-full-monthly-report.md
 *
 * Why it exists, and why it's not "fully automatic":
 *   The shared HoroscopeToolkitPage already auto-saves the toolkit
 *   payload to /api/astro-ai/save-astro-ai-response after a successful
 *   generation (wired by the earlier save-persistence partial). That
 *   gives us a `astro_ai_responses` row but does NOT update
 *   `monthly_transits.full_report_id` for this (member, month). This
 *   button bridges that gap by calling the new
 *   /api/community/saved-reports/monthly/link endpoint, which uses
 *   the lookup-saved API to find the most recent matching saved row
 *   for this user + toolname + month + birth identity, then links it
 *   on the row.
 *
 *   Adding a save-on-completion callback into the toolkit is a follow-up
 *   per the existing UI integration plan (FOLLOWUP-ui-integration.md
 *   Phase 2). Until that lands this manual button keeps the lifecycle
 *   working end-to-end without touching the 3902-line toolkit page.
 */

interface Props {
  familyMemberId: string;
  monthKey: string;
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  birthLat?: number | null;
  birthLng?: number | null;
}

export function CommunityMonthlyLinkButton({
  familyMemberId,
  monthKey,
  birthDate,
  birthTime,
  birthCity,
  birthCountry,
  birthLat,
  birthLng,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/community/saved-reports/monthly/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId,
          monthKey,
          // Identity fields the linkage endpoint uses to find the most
          // recent matching auto-saved astro_ai_responses row.
          toolname: "tropical_transits_monthly_v3",
          dateOfBirth: birthDate,
          birthTime,
          birthCity,
          birthCountry,
          birthLat,
          birthLng,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 inline-flex items-center gap-2">
        <CheckCircle2 className="size-4" />
        Saved. Reload this page to see the saved view.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2 flex items-center gap-3 flex-wrap">
      <p className="text-sm text-muted-foreground flex-1 min-w-[16rem]">
        Run the toolkit below. After it finishes, click{" "}
        <strong>Save This Report</strong> to keep it as your saved
        monthly report for {monthKey} — future visits skip live
        generation.
      </p>
      <Button onClick={save} disabled={busy} size="sm">
        <Save className="mr-1.5 size-4" />
        {busy ? "Saving…" : "Save This Report"}
      </Button>
      {err ? (
        <p className="basis-full text-sm text-destructive inline-flex items-center gap-1.5">
          <AlertCircle className="size-4" /> {err}
        </p>
      ) : null}
    </div>
  );
}
