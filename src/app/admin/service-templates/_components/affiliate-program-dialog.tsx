"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type RateType = "percent" | "flat";

export interface AffiliateProgramDialogTarget {
  id: string;
  name: string;
  affiliate_program_enabled?: boolean | null;
  commission_type?: RateType | null;
  commission_value?: number | string | null;
}

interface AffiliateProgramDialogProps {
  target: AffiliateProgramDialogTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

function parseValueOrNull(s: string): number | null {
  const trimmed = s.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function AffiliateProgramDialog({
  target,
  onClose,
  onSaved,
}: AffiliateProgramDialogProps) {
  const [enabled, setEnabled] = useState(false);
  const [commissionType, setCommissionType] = useState<RateType>("percent");
  const [commissionValue, setCommissionValue] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [baseline, setBaseline] = useState<{
    enabled: boolean;
    type: RateType | null;
    value: number | null;
  }>({ enabled: false, type: null, value: null });

  // Re-seed every time the dialog opens with a new target so the form
  // reflects the latest row state (no stale values across rows).
  useEffect(() => {
    if (!target) return;
    const initialEnabled = target.affiliate_program_enabled === true;
    const initialType = (target.commission_type ?? null) as RateType | null;
    const initialValue =
      target.commission_value === null || target.commission_value === undefined
        ? null
        : Number(target.commission_value);
    setEnabled(initialEnabled);
    setCommissionType(initialType ?? "percent");
    setCommissionValue(initialValue != null ? String(initialValue) : "");
    setBaseline({ enabled: initialEnabled, type: initialType, value: initialValue });
  }, [target]);

  const valueParsed = parseValueOrNull(commissionValue);
  const dirty =
    !!target &&
    (enabled !== baseline.enabled ||
      commissionType !== (baseline.type ?? "percent") ||
      valueParsed !== baseline.value);

  async function onSave() {
    if (!target) return;
    setSubmitting(true);
    try {
      if (valueParsed !== null) {
        if (valueParsed < 0) {
          toast.error("Rate must be a non-negative number");
          setSubmitting(false);
          return;
        }
        if (commissionType === "percent" && valueParsed > 100) {
          toast.error("Percentage rate cannot exceed 100");
          setSubmitting(false);
          return;
        }
        if (commissionType === "flat" && valueParsed > 100000) {
          toast.error("Flat rate cannot exceed $1000 (100000 cents)");
          setSubmitting(false);
          return;
        }
      }

      const patch: Record<string, unknown> = {};
      if (enabled !== baseline.enabled) {
        patch.affiliate_program_enabled = enabled;
      }
      if (commissionType !== (baseline.type ?? "percent")) {
        patch.commission_type = commissionType;
      }
      if (valueParsed !== baseline.value) {
        patch.commission_value = valueParsed;
      }

      const res = await fetch(`/api/admin/service-templates/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string>;
      };

      if (!res.ok) {
        const detail =
          body.details &&
          (body.details.affiliate_program_enabled ??
            body.details.commission_type ??
            body.details.commission_value);
        toast.error(detail ?? body.error ?? "Failed to save");
        setSubmitting(false);
        return;
      }

      toast.success("Affiliate program saved");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Affiliate program</DialogTitle>
          <DialogDescription>
            {target
              ? `Configure affiliate referrals for "${target.name}".`
              : "Configure affiliate referrals."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Switch
              id="aff-dlg-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={submitting}
            />
            <Label htmlFor="aff-dlg-enabled" className="cursor-pointer">
              Accept affiliate referrals for this template
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aff-dlg-type">Commission type</Label>
              <Select
                value={commissionType}
                onValueChange={(v: RateType) => setCommissionType(v)}
                disabled={submitting || !enabled}
              >
                <SelectTrigger id="aff-dlg-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="flat">Flat (cents)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-dlg-value">
                {commissionType === "flat" ? "Cents" : "Percent (%)"}
              </Label>
              <Input
                id="aff-dlg-value"
                type="number"
                min="0"
                step={commissionType === "flat" ? "1" : "0.01"}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                disabled={submitting || !enabled}
                placeholder="Leave blank for default 10%"
              />
            </div>
          </div>

          {enabled && commissionValue.trim() === "" && (
            <p className="text-xs text-muted-foreground">
              With no rate set, affiliates earn the system default of 10%.
            </p>
          )}

          <p className="border-t pt-3 text-xs text-muted-foreground">
            Rate edits apply to <strong>future bookings only</strong>. Already-
            stamped bookings continue to credit at their stamped rate.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={submitting || !dirty}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
