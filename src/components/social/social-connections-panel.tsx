"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bird,
  Share2,
  Camera,
  Briefcase,
  Music,
  Video,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Scope = "admin" | "diviner";

interface PlatformListItem {
  id: string;
  displayName: string;
  iconName: string;
  tagline: string;
  enabled: boolean;
}

interface PublicConnection {
  id: string;
  ownerType: Scope;
  ownerId: string | null;
  platform: string;
  platformAccountHandle: string | null;
  platformAccountName: string | null;
  connectedAt: string;
  lastPostAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  tokenExpiresAt: string | null;
}

interface AccountsResponse {
  platforms: PlatformListItem[];
  connections: PublicConnection[];
}

// lucide-react removed brand-name icons in recent versions; we map each
// platform to a themed generic icon. Swap for official SVGs later if
// design wants exact brand marks.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Bird,
  facebook: Share2,
  instagram: Camera,
  linkedin: Briefcase,
  music: Music,
  youtube: Video,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface SocialConnectionsPanelProps {
  /** Which identity are we managing connections for? */
  scope: Scope;
  /** Path to return to after successful connect (e.g. current page). */
  returnTo?: string;
}

export default function SocialConnectionsPanel({
  scope,
  returnTo,
}: SocialConnectionsPanelProps) {
  const [platforms, setPlatforms] = useState<PlatformListItem[]>([]);
  const [connections, setConnections] = useState<PublicConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/accounts?scope=${scope}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setBanner({
          kind: "error",
          message: "Failed to load connections (are you signed in?)",
        });
        return;
      }
      const data: AccountsResponse = await res.json();
      setPlatforms(data.platforms);
      setConnections(data.connections);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    // Surface ?connected= / ?connect_error= from the OAuth callback redirect.
    const url = new URL(window.location.href);
    const connected = url.searchParams.get("connected");
    const connectError = url.searchParams.get("connect_error");
    if (connected) {
      setBanner({
        kind: "success",
        message: `Connected ${connected}.`,
      });
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    } else if (connectError) {
      setBanner({
        kind: "error",
        message: `Connection failed: ${connectError}`,
      });
      url.searchParams.delete("connect_error");
      window.history.replaceState({}, "", url.toString());
    }
    load();
  }, [load]);

  function connectUrl(platformId: string): string {
    const params = new URLSearchParams();
    params.set("scope", scope);
    if (returnTo) params.set("redirect_to", returnTo);
    return `/api/social/connect/${platformId}/start?${params.toString()}`;
  }

  async function handleDisconnect(platformId: string) {
    if (
      !confirm(`Disconnect ${platformId}? You can reconnect at any time.`)
    ) {
      return;
    }
    setWorking(platformId);
    try {
      const res = await fetch(
        `/api/social/disconnect/${platformId}?scope=${scope}`,
        { method: "POST" },
      );
      if (res.ok) {
        setBanner({
          kind: "success",
          message: `Disconnected ${platformId}.`,
        });
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        setBanner({
          kind: "error",
          message: body.error ?? "Disconnect failed",
        });
      }
    } finally {
      setWorking(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading connections…</p>;
  }

  const connByPlatform = new Map(connections.map((c) => [c.platform, c]));

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            banner.kind === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((p) => {
          const Icon = ICONS[p.iconName] ?? LinkIcon;
          const conn = connByPlatform.get(p.id);
          const isConnected = !!conn;
          const isBusy = working === p.id;

          return (
            <Card key={p.id} className={!p.enabled ? "opacity-60" : undefined}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className="size-6" />
                    <div>
                      <CardTitle className="text-base">{p.displayName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{p.tagline}</p>
                    </div>
                  </div>
                  {!p.enabled && (
                    <Badge variant="outline" className="text-[10px]">
                      <Clock3 className="mr-1 size-3" /> Coming soon
                    </Badge>
                  )}
                  {p.enabled && isConnected && (
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle2 className="mr-1 size-3" /> Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                {isConnected && (
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Account:</span>{" "}
                      {conn?.platformAccountHandle ??
                        conn?.platformAccountName ??
                        "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Connected {formatDate(conn?.connectedAt ?? null)}
                    </div>
                    {conn?.lastPostAt && (
                      <div className="text-xs text-muted-foreground">
                        Last post {formatDate(conn.lastPostAt)}
                      </div>
                    )}
                    {conn?.lastErrorMessage && (
                      <div className="text-xs text-red-700">
                        Error: {conn.lastErrorMessage}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {!p.enabled ? (
                    <Button size="sm" disabled>
                      <LinkIcon className="mr-1.5 size-4" /> Connect
                    </Button>
                  ) : isConnected ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleDisconnect(p.id)}
                    >
                      <Unlink className="mr-1.5 size-4" />
                      {isBusy ? "Disconnecting…" : "Disconnect"}
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <a href={connectUrl(p.id)}>
                        <LinkIcon className="mr-1.5 size-4" /> Connect
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
