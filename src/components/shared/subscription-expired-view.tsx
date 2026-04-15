"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  LogIn,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface SubscriptionExpiredViewProps {
  /** e.g. "Perennial Mandalism" or "Mystery School" */
  portalName: string;
  /** Icon character or emoji to show in the hero ring */
  portalEmoji?: string;
  /** The membership status string from DB (for display) */
  membershipStatus: string;
  /** API endpoint to POST to open Stripe billing portal */
  billingPortalEndpoint: string;
  /** Whether the user has a Stripe subscription (shows Resume btn if true) */
  hasStripeSubscription: boolean;
  /** href to the new-subscriber checkout / join page */
  resubscribeHref: string;
  /** ISO date string of when access ended, if known */
  accessEndedAt?: string | null;
}

function formatStatus(status: string): string {
  switch (status) {
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "paused":
      return "Paused";
    case "past_due":
      return "Payment Past Due";
    case "incomplete":
      return "Incomplete";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionExpiredView({
  portalName,
  portalEmoji = "✦",
  membershipStatus,
  billingPortalEndpoint,
  hasStripeSubscription,
  resubscribeHref,
  accessEndedAt,
}: SubscriptionExpiredViewProps) {
  const [resuming, setResuming] = useState(false);

  async function handleResume() {
    setResuming(true);
    try {
      const res = await fetch(billingPortalEndpoint, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not open billing portal. Please try again.");
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResuming(false);
    }
  }

  const endedDateLabel = formatDate(accessEndedAt);
  const statusLabel = formatStatus(membershipStatus);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Icon ring */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10 text-3xl">
          {portalEmoji !== "✦" ? (
            <span>{portalEmoji}</span>
          ) : (
            <AlertCircle className="size-9 text-destructive/70" />
          )}
        </div>

        {/* Heading */}
        <div className="text-center">
          <Badge variant="destructive" className="mb-3 text-xs">
            {statusLabel}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Your {portalName} subscription has ended
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {endedDateLabel
              ? `Your access ended on ${endedDateLabel}. `
              : ""}
            To continue accessing the {portalName} portal, you can resume your
            subscription or start a new one.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          {hasStripeSubscription && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleResume}
              disabled={resuming}
            >
              {resuming ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Resume Subscription
            </Button>
          )}

          <Button size="lg" variant={hasStripeSubscription ? "outline" : "default"} className="w-full" asChild>
            <Link href={resubscribeHref}>
              <CreditCard className="mr-2 size-4" />
              Subscribe Again
            </Link>
          </Button>

          <Button size="lg" variant="ghost" className="w-full text-muted-foreground" asChild>
            <a href="mailto:support@divineinfinitebeing.com?subject=Subscription%20Help">
              <Mail className="mr-2 size-4" />
              Contact Support
            </a>
          </Button>
        </div>

        {/* What you lose note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your personal data, charts, and session history are{" "}
          <strong className="text-foreground">safely retained</strong> — reactivating
          restores full access immediately.
        </p>

        {/* Go back to login link */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogIn className="size-3" />
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
