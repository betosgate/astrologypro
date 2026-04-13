"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CheckCircle2, Circle, Loader2, Plus, RefreshCw, Unplug } from "lucide-react";

export interface CalendarConnectionSummary {
  id: string;
  provider: "google" | "microsoft";
  email: string | null;
  accountIdentifier: string;
  updatedAt?: string | null;
  createdAt?: string | null;
}

interface CalendarConnectionsProps {
  googleConnections: CalendarConnectionSummary[];
  microsoftConnections: CalendarConnectionSummary[];
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Just connected";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getConnectionLabel(connection: CalendarConnectionSummary): string {
  if (connection.email) {
    return connection.email;
  }

  const identifier = connection.accountIdentifier.trim();
  return identifier.length > 28 ? `${identifier.slice(0, 28)}...` : identifier;
}

interface ProviderCardProps {
  provider: "google" | "microsoft";
  name: string;
  description: string;
  connectHref: string;
  connections: CalendarConnectionSummary[];
  disconnectingConnectionId: string | null;
  onDisconnect: (provider: "google" | "microsoft", connectionId: string) => void;
}

function ProviderCard({
  provider,
  name,
  description,
  connectHref,
  connections,
  disconnectingConnectionId,
  onDisconnect,
}: ProviderCardProps) {
  const connected = connections.length > 0;
  const latestSync = connections[0]?.updatedAt ?? connections[0]?.createdAt ?? null;

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
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${
              provider === "google"
                ? "bg-gradient-to-br from-blue-500 to-red-500 text-white"
                : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white"
            }`}
          >
            {provider === "google" ? "G" : "M"}
          </div>

          <div className="min-w-0 flex-1">
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
                    {connections.length} connected
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="size-3 shrink-0" />
          <span>
            Last sync:{" "}
            <span className={connected ? "text-foreground/80" : ""}>
              {connected ? relativeTime(latestSync) : "—"}
            </span>
          </span>
        </div>

        {connected && (
          <div className="space-y-2">
            {connections.map((connection, index) => (
              <div
                key={connection.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getConnectionLabel(connection)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {index === 0 ? "Primary invite account" : "Also blocks availability"}
                    {connection.createdAt ? ` • Added ${relativeTime(connection.createdAt)}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect(provider, connection.id)}
                  disabled={disconnectingConnectionId === connection.id}
                  className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {disconnectingConnectionId === connection.id ? (
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
              </div>
            ))}
          </div>
        )}

        <Button asChild size="sm" className="w-full">
          <a href={connectHref}>
            <Plus className="mr-2 size-3.5" />
            {connected ? `Connect another ${name}` : `Connect ${name}`}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CalendarConnections({
  googleConnections,
  microsoftConnections,
}: CalendarConnectionsProps) {
  const [googleState, setGoogleState] = useState(googleConnections);
  const [microsoftState, setMicrosoftState] = useState(microsoftConnections);
  const [disconnectingConnectionId, setDisconnectingConnectionId] = useState<string | null>(null);

  useEffect(() => {
    setGoogleState(googleConnections);
  }, [googleConnections]);

  useEffect(() => {
    setMicrosoftState(microsoftConnections);
  }, [microsoftConnections]);

  async function handleDisconnect(
    provider: "google" | "microsoft",
    connectionId: string
  ) {
    setDisconnectingConnectionId(connectionId);
    try {
      // Legacy connections use a different disconnect path
      const isLegacy = connectionId.startsWith("legacy-");
      const endpoint = isLegacy ? "/api/calendar/disconnect-legacy" : "/api/calendar/disconnect";
      const body = isLegacy
        ? JSON.stringify({ provider })
        : JSON.stringify({ provider, connectionId });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to disconnect calendar");
        return;
      }

      if (provider === "google") {
        setGoogleState((current) => current.filter((connection) => connection.id !== connectionId));
      } else {
        setMicrosoftState((current) =>
          current.filter((connection) => connection.id !== connectionId)
        );
      }

      toast.success(
        `${provider === "google" ? "Google" : "Microsoft"} calendar disconnected`
      );
    } catch {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnectingConnectionId(null);
    }
  }

  const totalConnections = useMemo(
    () => googleState.length + microsoftState.length,
    [googleState.length, microsoftState.length]
  );

  return (
    <div className="space-y-4">
      {totalConnections > 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-300">
          <span className="font-medium">
            {totalConnections} calendar account{totalConnections === 1 ? "" : "s"} connected.
          </span>{" "}
          <span className="text-green-200/60">
            All connected accounts block availability. The newest account per provider sends booking invites.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderCard
          provider="google"
          name="Google Calendar"
          description="Sync availability and send native Google Calendar invites to clients."
          connectHref="/api/calendar/connect"
          connections={googleState}
          disconnectingConnectionId={disconnectingConnectionId}
          onDisconnect={handleDisconnect}
        />
        <ProviderCard
          provider="microsoft"
          name="Outlook Calendar"
          description="Sync with Outlook / Microsoft 365 and send native calendar invites."
          connectHref="/api/calendar/microsoft/connect"
          connections={microsoftState}
          disconnectingConnectionId={disconnectingConnectionId}
          onDisconnect={handleDisconnect}
        />
      </div>
    </div>
  );
}
