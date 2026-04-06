"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CalendarConnectionsProps {
  googleConnected: boolean;
  outlookConnected: boolean;
}

export function CalendarConnections({
  googleConnected: initialGoogleConnected,
  outlookConnected: initialOutlookConnected,
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
      toast.success(`${provider === "google" ? "Google" : "Outlook"} calendar disconnected`);
    } catch {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Google Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Google Calendar</CardTitle>
            <Badge
              variant="outline"
              className={
                googleConnected
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-muted bg-muted/30 text-muted-foreground"
              }
            >
              {googleConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <CardDescription>
            Sync your Google Calendar availability and send calendar invites to clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect("google")}
              disabled={disconnecting === "google"}
              className="w-full"
            >
              {disconnecting === "google" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full">
              <a href="/api/calendar/connect">Connect Google Calendar</a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Outlook Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Outlook Calendar</CardTitle>
            <Badge
              variant="outline"
              className={
                outlookConnected
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-muted bg-muted/30 text-muted-foreground"
              }
            >
              {outlookConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <CardDescription>
            Sync your Outlook / Microsoft 365 calendar and send native calendar invites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outlookConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect("microsoft")}
              disabled={disconnecting === "microsoft"}
              className="w-full"
            >
              {disconnecting === "microsoft" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full">
              <a href="/api/calendar/microsoft/connect">Connect Outlook Calendar</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
