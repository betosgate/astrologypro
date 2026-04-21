"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Card on /admin/availability that lets an admin claim a username and shows
 * the shareable /book/<username> link. Calendar-only — no service/payment.
 */
export function AdminBookingLinkCard() {
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [draftUsername, setDraftUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/booking-profile");
      if (!res.ok) return;
      const json = await res.json();
      setCurrentUsername(json.username ?? null);
      setDraftUsername(json.username ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/booking-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: draftUsername }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Failed to save username.");
        return;
      }
      setCurrentUsername(json.username);
    } finally {
      setSaving(false);
    }
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = currentUsername ? `${origin}/book/${currentUsername}` : "";

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking link</CardTitle>
        <CardDescription>
          Share this link so anyone can pick a time on your calendar. Calendar
          only — no services, no payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-username"
                  value={draftUsername}
                  onChange={(e) =>
                    setDraftUsername(e.target.value.toLowerCase())
                  }
                  placeholder="e.g. debasis"
                  maxLength={32}
                  autoCapitalize="none"
                  autoComplete="off"
                />
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !draftUsername.trim() ||
                    draftUsername === currentUsername
                  }
                  size="sm"
                >
                  {saving ? "Saving…" : currentUsername ? "Update" : "Claim"}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                3–32 chars, lowercase letters/numbers/-/_. Must not collide with
                an existing diviner.
              </p>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            {currentUsername && publicUrl && (
              <div className="space-y-2">
                <Label>Your booking link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={publicUrl} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    title="Open booking page"
                  >
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
