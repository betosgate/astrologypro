"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Check, X } from "lucide-react";

interface CalendarConnectionsProps {
  googleConnected: boolean;
  outlookConnected: boolean;
}

export function CalendarConnections({
  googleConnected,
  outlookConnected,
}: CalendarConnectionsProps) {
  const [googleStatus, setGoogleStatus] = useState(googleConnected);
  const [outlookStatus, setOutlookStatus] = useState(outlookConnected);
  const [loading, setLoading] = useState<string | null>(null);

  async function disconnect(provider: "google" | "microsoft") {
    setLoading(provider);
    try {
      const res = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error("Failed");
      if (provider === "google") setGoogleStatus(false);
      else setOutlookStatus(false);
      toast.success(
        `${provider === "google" ? "Google" : "Outlook"} calendar disconnected`
      );
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setLoading(null);
    }
  }

  const calendars = [
    {
      key: "google" as const,
      name: "Google Calendar",
      description:
        "Sync with Google Calendar. Clients will receive Google Calendar invites.",
      connected: googleStatus,
      connectHref: "/api/calendar/connect",
      icon: "🟢",
    },
    {
      key: "microsoft" as const,
      name: "Outlook / Microsoft 365",
      description:
        "Sync with Outlook. Clients will receive Microsoft Calendar invites.",
      connected: outlookStatus,
      connectHref: "/api/calendar/microsoft/connect",
      icon: "🔵",
    },
  ];

  return (
    <div className="space-y-4">
      {calendars.map((cal) => (
        <Card key={cal.key} className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cal.icon}</span>
                <div>
                  <CardTitle className="text-base">{cal.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {cal.description}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  cal.connected
                    ? "text-green-500 border-green-500/30 bg-green-500/10"
                    : "text-muted-foreground"
                }
              >
                {cal.connected ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Not connected
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {cal.connected ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={loading === cal.key}
                onClick={() => disconnect(cal.key)}
              >
                {loading === cal.key ? "Disconnecting…" : "Disconnect"}
              </Button>
            ) : (
              <Button size="sm" asChild>
                <a href={cal.connectHref}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect {cal.name}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
