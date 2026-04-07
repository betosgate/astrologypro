"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Search } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SendLogItem = {
  id: string;
  email_to: string;
  template_name: string;
  subject: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminEmailHistoryPage() {
  const [emailQuery, setEmailQuery] = useState("");
  const [items, setItems] = useState<SendLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function doSearch(cursor?: string) {
    if (!emailQuery.trim()) return;
    setErrorMsg("");

    if (!cursor) {
      setLoading(true);
      setItems([]);
    } else {
      setLoadingMore(true);
    }

    const params = new URLSearchParams({ email: emailQuery.trim() });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/admin/email-history?${params}`);
    if (!res.ok) {
      const json = await res.json();
      setErrorMsg(json.error ?? "Failed to load history");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const json = await res.json();
    setItems((prev) => (cursor ? [...prev, ...json.items] : json.items));
    setHasMore(json.hasMore);
    setNextCursor(json.nextCursor ?? null);
    setSearched(true);
    setLoading(false);
    setLoadingMore(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Email History</h1>
        <p className="text-muted-foreground">
          Search for a user by email to view their email send history.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter user email address…"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch();
            }}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => doSearch()}
          disabled={loading || !emailQuery.trim()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : searched && items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No emails found</p>
            <p className="text-sm text-muted-foreground">
              No send history for <strong>{emailQuery}</strong>.
            </p>
          </CardContent>
        </Card>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.template_name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.sent_at)}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="text-sm font-medium truncate">
                      {item.subject}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    To: {item.email_to}
                  </p>

                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Metadata
                      </summary>
                      <pre className="mt-1 rounded bg-muted px-2 py-1.5 text-[11px] overflow-auto max-h-32">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => doSearch(nextCursor ?? undefined)}
                disabled={loadingMore}
              >
                {loadingMore && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
