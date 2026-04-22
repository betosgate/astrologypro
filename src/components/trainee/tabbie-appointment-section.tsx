"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DashboardTabbieConfig = {
  id: string;
  featureKey: string;
  isEnabled: boolean;
  blockTitle: string;
  blockBody: string;
  buttonLabel: string;
  bookingLink: string;
  openMode: "same_tab" | "new_tab";
  highlightVariant: "info" | "neutral" | "warning" | "success";
  helperText: string | null;
  successMessage: string | null;
  cancelledMessage: string | null;
  postBookingMessage: string | null;
  displayPriority: number;
  updatedBy: string | null;
  updatedAt: string;
  version: number;
};

type ApiResponse = {
  ok: boolean;
  data: DashboardTabbieConfig | null;
};

function resolveVariantClasses(variant: DashboardTabbieConfig["highlightVariant"]) {
  switch (variant) {
    case "success":
      return {
        card: "border-green-300/50 bg-green-50/30 dark:border-green-700/50 dark:bg-green-950/20",
        iconWrap: "bg-green-100 dark:bg-green-900/40",
        icon: "text-green-600",
        badge: "border-green-200 bg-green-100/70 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100",
      };
    case "warning":
      return {
        card: "border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20",
        iconWrap: "bg-amber-100 dark:bg-amber-900/40",
        icon: "text-amber-600",
        badge: "border-amber-200 bg-amber-100/70 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
      };
    case "neutral":
      return {
        card: "border-border bg-muted/10",
        iconWrap: "bg-muted/40",
        icon: "text-muted-foreground",
        badge: "border-border bg-muted/50 text-foreground",
      };
    default:
      return {
        card: "border-primary/30 bg-primary/5",
        iconWrap: "bg-primary/10",
        icon: "text-primary",
        badge: "border-primary/20 bg-primary/10 text-primary",
      };
  }
}

export function TabbieAppointmentSection({ trainingCompleted }: { trainingCompleted: boolean }) {
  const [config, setConfig] = useState<DashboardTabbieConfig | null>(null);
  const [isLoading, setIsLoading] = useState(trainingCompleted);

  useEffect(() => {
    if (!trainingCompleted) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadConfig() {
      try {
        const res = await fetch("/api/dashboard/tabbie-appointment-config", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const json = (await res.json()) as ApiResponse;
        if (cancelled || !json.ok || !json.data?.isEnabled) return;

        setConfig(json.data);
      } catch (error) {
        console.error("[trainee-dashboard] failed to load tabbie appointment config", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [trainingCompleted]);

  if (!trainingCompleted || (!isLoading && !config)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-5">
          <Loader2 className="size-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading appointment details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) return null;

  const styles = resolveVariantClasses(config.highlightVariant);
  const target = config.openMode === "new_tab" ? "_blank" : undefined;
  const rel = config.openMode === "new_tab" ? "noopener noreferrer" : undefined;

  // Append ?prefill=trainee so the admin booking page knows to resolve
  // the authenticated trainee's email server-side and lock the email
  // input. The trainee's email itself is NOT included in the URL —
  // the booking page reads it from Supabase auth.
  const bookingHref = appendPrefillQuery(config.bookingLink);

  return (
    <>
      <Card className={styles.card}>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 flex-1">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}>
              <CalendarCheck className={`size-5 ${styles.icon}`} />
            </div>
            <div>
              <p className="font-semibold">{config.blockTitle}</p>
              <p className="text-sm text-muted-foreground">{config.blockBody}</p>
              {config.helperText && (
                <p className="mt-1 text-xs text-muted-foreground">{config.helperText}</p>
              )}
            </div>
          </div>
          <Button asChild className="shrink-0">
            <a href={bookingHref} target={target} rel={rel}>
              {config.buttonLabel}
              {config.openMode === "new_tab" && <ExternalLink className="ml-1.5 size-4" />}
            </a>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Append `?prefill=trainee` to a bookingLink, preserving any existing
 * query string. Falls back to the raw link if URL parsing fails
 * (e.g. relative path without a base).
 */
function appendPrefillQuery(link: string): string {
  try {
    // Handle absolute and root-relative paths. URL() needs a base for the
    // latter — pick any placeholder then strip it back out.
    const hasProto = /^[a-z][a-z0-9+.-]*:/i.test(link);
    const base = hasProto ? undefined : "https://__placeholder__";
    const u = new URL(link, base);
    u.searchParams.set("prefill", "trainee");
    if (hasProto) return u.toString();
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = link.includes("?") ? "&" : "?";
    return `${link}${sep}prefill=trainee`;
  }
}
