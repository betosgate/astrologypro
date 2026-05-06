"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Interactive bits for `/community/family/[id]`.
 *
 * The parent is a server component that loads the family member row
 * and renders static JSX. This client sibling owns:
 *
 *   - the "Generate Chart" / "View Chart" button (calls
 *     `POST /api/community/generate-natal`, then `router.refresh()` so
 *     the server component re-reads `community_family_members` and
 *     picks up the new `natal_chart` blob for the Chart Ready badge)
 *   - the Generate error banner
 *   - the Login Invite form (calls `POST /api/community/family/[id]/invite`,
 *     then `router.refresh()`).
 *
 * Generate Chart lifecycle is preserved verbatim from the legacy page
 * per Task 03 constraint: "Do not change chart-generation business
 * logic."
 */

export interface FamilyMemberActionsProps {
  /** community_family_members.id */
  id: string;
  /** Whether the member currently has a saved natal_chart blob. */
  hasSavedChart: boolean;
  /** Enable "Generate Chart Now" CTA in the empty-state card. */
  hasBirthDataForChart: boolean;
  /** Show the place-missing-coords amber hint. */
  hasBirthPlaceWithoutCoordinates: boolean;
  /** Whether the member is the logged-in user's own self-row. */
  isSelf: boolean;
  /** Existing invite state from the server. */
  invite: {
    userId: string | null;
    sentAt: string | null;
    acceptedAt: string | null;
  };
}

export function FamilyMemberActions({
  id,
  hasSavedChart,
  hasBirthDataForChart,
  hasBirthPlaceWithoutCoordinates,
  isSelf,
  invite,
}: FamilyMemberActionsProps) {
  const router = useRouter();

  // ── Generate chart ────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function generateChart() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/community/generate-natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyMemberId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenerateError(data.detail ?? data.error ?? "Chart generation failed");
      } else {
        // Let the server component re-read the updated row. The shared
        // toolkit renders live from the admin API, so this primarily
        // refreshes the "Chart Ready" badge and chart_updated_at stamp.
        router.refresh();
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  // ── Invite ────────────────────────────────────────────────────────
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function sendInvite() {
    if (!inviteEmail) return;
    setSendingInvite(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/community/family/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to send invite");
      } else {
        setInviteSuccess(true);
        setShowInviteInput(false);
        setInviteEmail("");
        router.refresh();
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSendingInvite(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header buttons row — mirrors the legacy page's action group */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/community/family/${id}/edit`}>
            <Pencil className="mr-1.5 size-4" />
            Edit Details
          </Link>
        </Button>
        {hasSavedChart ? (
          <Button size="sm" variant="outline" asChild>
            <Link href="#natal-chart">
              <Star className="mr-2 size-4" />
              View Chart
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={generateChart}
            disabled={generating || !hasBirthDataForChart}
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Generate Chart
          </Button>
        )}
      </div>

      {generateError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {generateError}
        </div>
      )}

      {/* Empty-state CTA when no saved chart yet but birth data is complete. */}
      {!hasSavedChart && !generating && hasBirthDataForChart && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-primary" />
            <span>
              No saved chart yet. Generating saves it to this member&apos;s record
              (the live chart below is rendered on demand).
            </span>
          </div>
          <Button size="sm" onClick={generateChart} disabled={generating}>
            Generate Now
          </Button>
        </div>
      )}

      {/* Coordinate-missing hint preserved from the legacy page. */}
      {!hasSavedChart && hasBirthPlaceWithoutCoordinates && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          Select the birth city from suggestions before generating a chart.{" "}
          <Link
            href={`/community/family/${id}/edit`}
            className="font-medium underline hover:text-amber-800 dark:hover:text-amber-100"
          >
            Edit birth place
          </Link>
        </div>
      )}

      {/* Invite section — only for non-self members and only when no login
          is already linked. */}
      {!isSelf && !invite.userId && !invite.sentAt && (
        <div className="rounded-md border p-3 space-y-2">
          {!showInviteInput ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-primary"
              onClick={() => setShowInviteInput(true)}
            >
              <Mail className="mr-1.5 size-3" />
              Send Login Invite
            </Button>
          ) : (
            <div className="space-y-2">
              <input
                type="email"
                className="w-full rounded-md border px-2 py-1.5 text-xs bg-background"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              {inviteError && (
                <p className="text-xs text-destructive">{inviteError}</p>
              )}
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={sendInvite}
                  disabled={sendingInvite || !inviteEmail}
                >
                  {sendingInvite && (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  )}
                  Send
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowInviteInput(false);
                    setInviteEmail("");
                    setInviteError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {inviteSuccess && (
            <p className="text-xs text-green-600">Invite sent successfully.</p>
          )}
        </div>
      )}
    </div>
  );
}
