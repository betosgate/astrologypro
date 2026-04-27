"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { AffiliateNotificationKind } from "@/lib/affiliate-notifications";

interface KindMeta {
  kind: AffiliateNotificationKind;
  label: string;
  description: string;
}

type PrefsState = Record<
  AffiliateNotificationKind,
  { email: boolean; in_app: boolean }
>;

export function PreferencesForm({
  accountId: _accountId,
  kinds,
  initialPrefs,
}: {
  accountId: string;
  kinds: KindMeta[];
  initialPrefs: PrefsState;
}) {
  const [prefs, setPrefs] = useState<PrefsState>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function setChannel(
    kind: AffiliateNotificationKind,
    channel: "email" | "in_app",
    value: boolean,
  ) {
    setPrefs((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], [channel]: value },
    }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliate/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        title?: string;
        detail?: string;
      };
      if (!res.ok) {
        toast.error(body.detail ?? body.title ?? "Failed to save");
        setSaving(false);
        return;
      }
      toast.success("Preferences saved");
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {kinds.map(({ kind, label, description }) => {
        const channels = prefs[kind];
        return (
          <Card key={kind}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id={`${kind}-in-app`}
                  checked={channels.in_app}
                  onCheckedChange={(v) => setChannel(kind, "in_app", Boolean(v))}
                  disabled={saving}
                />
                <Label htmlFor={`${kind}-in-app`} className="cursor-pointer">
                  In-app inbox
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`${kind}-email`}
                  checked={channels.email}
                  onCheckedChange={(v) => setChannel(kind, "email", Boolean(v))}
                  disabled={saving}
                />
                <Label htmlFor={`${kind}-email`} className="cursor-pointer">
                  Email
                </Label>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
