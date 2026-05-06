"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Power } from "lucide-react";

export function PayoutsKillSwitchPanel() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/affiliate-payouts/kill-switch")
      .then((r) => r.json())
      .then((d: { affiliate_payouts_enabled?: boolean }) => {
        setEnabled(!!d.affiliate_payouts_enabled);
      })
      .catch(() => setLoadError(true));
  }, []);

  const trimmed = reason.trim();
  const valid = trimmed.length >= 5 && trimmed.length <= 500;

  async function onSubmit() {
    if (!valid || enabled === null) return;
    setSubmitting(true);
    try {
      const next = !enabled;
      const res = await fetch("/api/admin/affiliate-payouts/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next, reason: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        affiliate_payouts_enabled?: boolean;
        error?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Toggle failed");
        setSubmitting(false);
        return;
      }
      setEnabled(!!body.affiliate_payouts_enabled);
      toast.success(
        next
          ? "Affiliate payouts enabled — cron will run on next tick"
          : "Affiliate payouts disabled — cron will skip payout transfers",
      );
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const nextState = enabled === null ? null : !enabled;

  return (
    <>
      <Card className="border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className="size-4 text-orange-500" aria-hidden />
            Affiliate payouts kill-switch
          </CardTitle>
          <CardDescription>
            Controls whether the payout cron transfers funds to affiliate
            Stripe accounts. Disable before a deploy or incident; re-enable
            when safe. All actions are recorded in{" "}
            <code className="font-mono">admin_action_log</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {enabled === null ? (
            loadError ? (
              <span className="text-sm text-destructive">
                Failed to load — refresh to retry.
              </span>
            ) : (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )
          ) : (
            <>
              <Badge
                variant={enabled ? "default" : "secondary"}
                className={
                  enabled
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }
              >
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant={enabled ? "destructive" : "default"}
                onClick={() => setOpen(true)}
              >
                {enabled ? "Disable payouts" : "Enable payouts"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (submitting) return;
          setOpen(next);
          if (!next) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nextState ? "Enable affiliate payouts" : "Disable affiliate payouts"}
            </DialogTitle>
            <DialogDescription>
              {nextState
                ? "The payout cron will resume transferring funds to affiliates on its next tick. Make sure Phase 2 migrations are applied and you have reviewed the dry-run results."
                : "The payout cron will skip all Stripe transfers until you re-enable. Conversions continue to accrue — no data is lost."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="kill-switch-reason">Reason</Label>
            <Textarea
              id="kill-switch-reason"
              value={reason}
              maxLength={500}
              rows={3}
              placeholder="Why are you toggling this? (5–500 chars, recorded in admin_action_log)"
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              {trimmed.length}/500 — minimum 5 characters.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={nextState ? "default" : "destructive"}
              disabled={!valid || submitting}
              onClick={onSubmit}
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {nextState ? "Enable" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
