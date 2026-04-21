"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(e164: string): string {
  // +1XXXXXXXXXX → +1 (XXX) XXX-XXXX
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `+1 (${area}) ${prefix}-${line}`;
  }
  return e164;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PhoneAnswerMode = "browser" | "mobile" | "both";

interface ChimePhoneManagerProps {
  divinerId: string;
  currentPhone: string | null;
  chimeSmaPhoneArn: string | null;
  phoneAnswerMode: PhoneAnswerMode | null;
  phoneMobile: string | null;
  phoneDialinEnabled: boolean;
  /**
   * E.164 of the shared central Chime number (chime_phone_numbers.status='central').
   * When set, and this diviner has no per-diviner number, the empty state is
   * replaced with a "Central routing" info card instead of the legacy
   * provision flow.
   */
  centralChimeNumber?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChimePhoneManager({
  divinerId,
  currentPhone: initialPhone,
  chimeSmaPhoneArn: initialSmaArn,
  phoneAnswerMode: initialAnswerMode,
  phoneMobile: initialMobile,
  phoneDialinEnabled: initialDialinEnabled,
  centralChimeNumber,
}: ChimePhoneManagerProps) {
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [smaArn, setSmaArn] = useState<string | null>(initialSmaArn);
  const [releasing, setReleasing] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  // Answer mode state
  const [answerMode, setAnswerMode] = useState<PhoneAnswerMode>(
    initialAnswerMode ?? "both"
  );
  const [mobileMobile, setMobileMobile] = useState(initialMobile ?? "");
  const [dialinEnabled, setDialinEnabled] = useState(initialDialinEnabled);
  const [togglingDialin, setTogglingDialin] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Release ───────────────────────────────────────────────────────────────

  async function handleRelease() {
    setReleasing(true);
    setReleaseDialogOpen(false);
    try {
      const res = await fetch("/api/chime/voice/provision-number", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divinerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to release number");
        return;
      }
      setPhone(null);
      setSmaArn(null);
      toast.success("Phone number released");
    } catch {
      toast.error("Network error — could not release number");
    } finally {
      setReleasing(false);
    }
  }

  // ── Toggle dial-in ─────────────────────────────────────────────────────────

  async function handleToggleDialin(enabled: boolean) {
    setTogglingDialin(true);
    try {
      const res = await fetch(`/api/admin/diviners/${divinerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_dialin_enabled: enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update dial-in setting");
        return;
      }
      setDialinEnabled(enabled);
      toast.success(enabled ? "Inbound calls enabled" : "Inbound calls disabled");
    } catch {
      toast.error("Network error — could not update setting");
    } finally {
      setTogglingDialin(false);
    }
  }

  // ── Save settings ─────────────────────────────────────────────────────────

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/diviners/${divinerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_answer_mode: answerMode,
          phone_mobile:
            answerMode === "browser" ? null : mobileMobile.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save settings");
        return;
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Network error — could not save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const smaLinked = !!smaArn;

  return (
    <div className="space-y-4">
      {/* ── Phone number card ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            Chime Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phone ? (
            <>
              {/* Number display */}
              <div className="flex items-center gap-3">
                <p className="text-2xl font-mono font-semibold tracking-tight">
                  {formatPhone(phone)}
                </p>
                <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20">
                  Active
                </Badge>
              </div>

              {/* SMA link status */}
              <div className="flex items-center gap-2 text-sm">
                {smaLinked ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">
                      Linked to SMA — inbound calls will route correctly
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Not linked to SMA — inbound calls will not route
                    </span>
                  </>
                )}
              </div>

              {/* Release */}
              <div className="pt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={releasing}
                  onClick={() => setReleaseDialogOpen(true)}
                >
                  {releasing ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Releasing…
                    </>
                  ) : (
                    <>
                      <PhoneOff className="mr-1.5 size-4" />
                      Release Number
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : centralChimeNumber ? (
            <>
              {/* Central routing state — no per-diviner number needed */}
              <div className="flex items-center gap-3">
                <p className="text-2xl font-mono font-semibold tracking-tight">
                  {formatPhone(centralChimeNumber)}
                </p>
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">
                  Shared
                </Badge>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <KeyRound className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Inbound calls route through the shared central line. Clients
                  enter the 6-digit PIN from their booking confirmation — the
                  SMA Lambda looks up the matching booking and bridges to this
                  diviner automatically. No per-diviner number required.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* No central configured — operator needs to run migration 003 */}
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-600 dark:text-amber-400">
                  No central Chime number is configured. Run the{" "}
                  <span className="font-mono">
                    20260421000003_seed_central_chime_number
                  </span>{" "}
                  migration to enable shared-number + PIN routing for all
                  diviners.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Dial-in enabled toggle ─────────────────────────────────────
          Shown when the diviner has a per-diviner number OR when the
          central number is configured — the toggle + phone_mobile drive
          where PIN-matched `enqueue` calls bridge to. */}
      {(phone || centralChimeNumber) && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <PhoneIncoming className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Inbound Calls</p>
                <p className="text-xs text-muted-foreground">
                  {dialinEnabled
                    ? "Callers can reach this diviner via phone"
                    : "Inbound calls are disabled — callers will be rejected"}
                </p>
              </div>
            </div>
            <Switch
              checked={dialinEnabled}
              disabled={togglingDialin}
              onCheckedChange={handleToggleDialin}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Answer mode card ──────────────────────────────────────────── */}
      {(phone || centralChimeNumber) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="size-4 text-muted-foreground" />
              Answer Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="radiogroup"
              aria-label="Phone answer mode"
              className="grid gap-2 sm:grid-cols-3"
            >
              {(
                [
                  { value: "browser", label: "Browser Widget" },
                  { value: "mobile", label: "Mobile Phone" },
                  { value: "both", label: "Both" },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    answerMode === value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer-mode"
                    value={value}
                    checked={answerMode === value}
                    onChange={() => setAnswerMode(value)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>

            {(answerMode === "mobile" || answerMode === "both") && (
              <div className="space-y-1.5">
                <Label htmlFor="mobile-number" className="text-sm">
                  Diviner Mobile Number
                </Label>
                <Input
                  id="mobile-number"
                  placeholder="+16175550123"
                  value={mobileMobile}
                  onChange={(e) => setMobileMobile(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  E.164 format. Used for CallAndBridge when mobile answer mode is active.
                </p>
              </div>
            )}

            <div className="pt-1">
              <Button
                size="sm"
                disabled={savingSettings}
                onClick={handleSaveSettings}
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Release confirmation dialog ───────────────────────────────── */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Phone Number?</DialogTitle>
            <DialogDescription>
              This will permanently release{" "}
              <span className="font-mono font-semibold">
                {phone ? formatPhone(phone) : ""}
              </span>{" "}
              back to AWS. The diviner will no longer receive inbound calls on
              this number. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReleaseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRelease}>
              <PhoneOff className="mr-1.5 size-4" />
              Release Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
