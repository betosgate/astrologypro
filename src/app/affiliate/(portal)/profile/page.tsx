"use client";

// Task 05 — /affiliate/profile
// Editable canonical profile for the authenticated affiliate. PATCH to
// /api/affiliate/profile. Email is read-only (change-email flow is separate).
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";

interface Me {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string | null;
  status: string;
  tax_form_status: string;
  payout_method: "bank" | "paypal" | "check" | "other" | null;
  partnership_count: number;
}

export default function AffiliateProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"" | "bank" | "paypal" | "check" | "other">("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/affiliate/me");
      if (res.ok) {
        const json = await res.json();
        const m = json.data as Me;
        setMe(m);
        setName(m.name ?? "");
        setPhone(m.phone ?? "");
        setAvatarUrl(m.avatar_url ?? "");
        setTimezone(m.timezone ?? "");
        setPayoutMethod((m.payout_method as typeof payoutMethod) ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/affiliate/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          timezone: timezone.trim() || null,
          payout_method: payoutMethod === "" ? null : payoutMethod,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.detail ?? json?.title ?? `Save failed (${res.status})`);
      } else {
        toast.success("Profile saved");
        setMe((prev) => (prev ? { ...prev, ...json.data } : prev));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-24 animate-pulse rounded-md bg-muted" />
        <div className="h-80 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load your profile. Try reloading the page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your canonical identity across{" "}
          <strong className="text-foreground">{me.partnership_count}</strong>{" "}
          diviner partnership{me.partnership_count === 1 ? "" : "s"}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge variant={me.status === "active" ? "default" : "outline"}>
              {me.status}
            </Badge>
            <Badge variant="outline">Tax: {me.tax_form_status}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={me.email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Email changes require support — contact us.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/New_York"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout</CardTitle>
          <CardDescription>
            Payouts are handled per diviner. Set a preferred method here so each
            diviner knows how you&rsquo;d like to be paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payout-method">Preferred method</Label>
            <select
              id="payout-method"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={payoutMethod}
              onChange={(e) =>
                setPayoutMethod(e.target.value as typeof payoutMethod)
              }
            >
              <option value="">Not set</option>
              <option value="bank">Bank transfer</option>
              <option value="paypal">PayPal</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" aria-hidden />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
