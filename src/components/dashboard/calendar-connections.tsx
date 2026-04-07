"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, Circle, RefreshCw, Unplug } from "lucide-react";

interface CalendarConnectionsProps {
  googleConnected: boolean;
  outlookConnected: boolean;
  /** ISO string of last successful Google sync (optional) */
  googleLastSync?: string | null;
  /** ISO string of last successful Outlook sync (optional) */
  outlookLastSync?: string | null;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ProviderCardProps {
  provider: "google" | "microsoft";
  name: string;
  description: string;
  connected: boolean;
  lastSync?: string | null;
  connectHref: string;
  disconnecting: boolean;
  onDisconnect: () => void;
}

function ProviderCard({
  provider,
  name,
  description,
  connected,
  lastSync,
  connectHref,
  disconnecting,
  onDisconnect,
}: ProviderCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        connected
          ? "border-green-500/30 bg-gradient-to-br from-green-950/30 to-card"
          : "border-border bg-card/60"
      }`}
    >
      {connected && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.08),transparent_60%)]" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Provider logo placeholder — colored circle with initial */}
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${
              provider === "google"
                ? "bg-gradient-to-br from-blue-500 to-red-500 text-white"
                : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white"
            }`}
          >
            {provider === "google" ? "G" : "M"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base leading-tight">{name}</CardTitle>
              <Badge
                variant="outline"
                className={
                  connected
                    ? "border-green-500/40 bg-green-500/15 text-green-400 text-[10px] px-1.5"
                    : "border-muted bg-muted/20 text-muted-foreground text-[10px] px-1.5"
                }
              >
                {connected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-2.5" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Circle className="size-2.5" />
                    Not connected
                  </span>
                )}
              </Badge>
            </div>
            <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Last sync row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="size-3 shrink-0" />
          <span>
            Last sync:{" "}
            <span className={connected ? "text-foreground/80" : ""}>
              {connected ? relativeTime(lastSync) : "—"}
            </span>
          </span>
        </div>

        {/* Action button */}
        {connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {disconnecting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Disconnecting…
              </>
            ) : (
              <>
                <Unplug className="mr-2 size-3.5" />
                Disconnect
              </>
            )}
          </Button>
        ) : (
          <Button asChild size="sm" className="w-full">
            <a href={connectHref}>
              Connect {name}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CalendarConnections({
  googleConnected: initialGoogleConnected,
  outlookConnected: initialOutlookConnected,
  googleLastSync,
  outlookLastSync,
}: CalendarConnectionsProps) {
  const [googleConnected, setGoogleConnected] = useState(initialGoogleConnected);
  const [outlookConnected, setOutlookConnected] = useState(initialOutlookConnected);
  const [disconnecting, setDisconnecting] = useState<"google" | "microsoft" | null>(null);

  async function handleDisconnect(provider: "google" | "microsoft") {
    setDisconnecting(provider);
    try {
      const res = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to disconnect calendar");
        return;
      }

      if (provider === "google") {
        setGoogleConnected(false);
      } else {
        setOutlookConnected(false);
      }
      toast.success(
        `${provider === "google" ? "Google" : "Outlook"} calendar disconnected`
      );
    } catch {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary banner when at least one is connected */}
      {(googleConnected || outlookConnected) && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-300">
          <span className="font-medium">
            {[googleConnected && "Google", outlookConnected && "Outlook"]
              .filter(Boolean)
              .join(" & ")}{" "}
            calendar{googleConnected && outlookConnected ? "s are" : " is"} connected.
          </span>{" "}
          <span className="text-green-200/60">
            Availability is syncing automatically.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderCard
          provider="google"
          name="Google Calendar"
          description="Sync availability and send native Google Calendar invites to clients."
          connected={googleConnected}
          lastSync={googleLastSync}
          connectHref="/api/calendar/connect"
          disconnecting={disconnecting === "google"}
          onDisconnect={() => handleDisconnect("google")}
        />
        <ProviderCard
          provider="microsoft"
          name="Outlook Calendar"
          description="Sync with Outlook / Microsoft 365 and send native calendar invites."
          connected={outlookConnected}
          lastSync={outlookLastSync}
          connectHref="/api/calendar/microsoft/connect"
          disconnecting={disconnecting === "microsoft"}
          onDisconnect={() => handleDisconnect("microsoft")}
        />
      </div>
    </div>
  );
}
