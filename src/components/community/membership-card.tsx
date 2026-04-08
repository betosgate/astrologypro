"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useState } from "react";
import { UpdatePaymentModal } from "@/components/community/update-payment-modal";

export interface MembershipSubscription {
  membership_type: string;
  plan_type: string;
  plan_label: string;
  /** Tier display name from pm_plan_tiers, e.g. "Perennial Mandalism — Family" */
  tier_name?: string | null;
  status: string;
  amount: number;
  currency: string;
  billing_cycle?: "monthly" | "annual" | null;
  /** ISO date string for next renewal — from current_period_end (Stripe) or expires_at */
  renewal_date: string | null;
  created_at: string;
  member_count: number;
  max_members: number;
}

interface MembershipCardProps {
  subscription: MembershipSubscription;
  /** Authenticated user's email — passed to payment modal */
  userEmail?: string | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  trialing: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  past_due: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  cancelled: "bg-red-500/15 text-red-700 border-red-500/30",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

export function MembershipCard({ subscription, userEmail }: MembershipCardProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const statusClass =
    STATUS_BADGE_CLASSES[subscription.status] ??
    "bg-muted text-muted-foreground border-border";

  const renewalLabel =
    subscription.status === "cancelled" ? "Cancelled On" : "Renewal";

  const isFamily = subscription.plan_type === "family";
  const canUpgrade =
    subscription.membership_type === "perennial_mandalism" ||
    (subscription.membership_type === "perennial_mandalism" && isFamily);

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/community/billing-portal", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPortalError(data.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError("Unexpected error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="py-5 px-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">🔮</span>
            <h2 className="text-base font-semibold leading-tight">Your Membership</h2>
          </div>
          <Badge
            variant="outline"
            className={`text-xs uppercase tracking-wide font-semibold ${statusClass}`}
          >
            {subscription.status}
          </Badge>
        </div>

        <Separator />

        {/* Details grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="font-medium mt-0.5">
              {subscription.tier_name ?? subscription.plan_label}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Billing</dt>
            <dd className="font-medium mt-0.5 capitalize">
              {formatCurrency(subscription.amount, subscription.currency)}
              {subscription.billing_cycle === "annual" ? "/year" : "/month"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Member Since</dt>
            <dd className="font-medium mt-0.5">{formatDate(subscription.created_at)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Next {renewalLabel}</dt>
            <dd className="font-medium mt-0.5">{formatDate(subscription.renewal_date)}</dd>
          </div>

          {isFamily && (
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-muted-foreground mb-1.5">
                Member Slots — {subscription.member_count} of {subscription.max_members} used
              </dt>
              <dd>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (subscription.member_count / subscription.max_members) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {subscription.max_members - subscription.member_count} slot
                  {subscription.max_members - subscription.member_count !== 1 ? "s" : ""} remaining
                </span>
              </dd>
            </div>
          )}
        </dl>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {isFamily && subscription.member_count < subscription.max_members && (
            <Button asChild size="sm">
              <Link href="/community/members/new">+ Add Member</Link>
            </Button>
          )}
          {canUpgrade && (
            <Button asChild size="sm" variant="outline">
              <Link href="/community/upgrade">Upgrade Plan</Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPaymentModalOpen(true)}
          >
            Update Payment
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleManageBilling}
            disabled={portalLoading}
            aria-busy={portalLoading}
          >
            {portalLoading ? "Redirecting…" : "Manage Billing"}
          </Button>
        </div>

        {portalError && (
          <p className="text-xs text-destructive" role="alert">
            {portalError}
          </p>
        )}
      </CardContent>

      <UpdatePaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        email={userEmail ?? ""}
      />
    </Card>
  );
}
