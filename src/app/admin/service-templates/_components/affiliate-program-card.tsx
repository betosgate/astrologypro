"use client";

import { useState } from "react";
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

interface AffiliateProgramCardProps {
  templateId: string;
  initialEnabled: boolean;
  initialCommissionType: RateType | null;
  initialCommissionValue: number | null;
}

export function AffiliateProgramCard({
  templateId,
  initialEnabled,
  initialCommissionType,
  initialCommissionValue,
}: AffiliateProgramCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  // Display the commission type as 'percent' by default when enabling without
  // an explicit choice — matches the stamp resolver fallback.
  const [commissionType, setCommissionType] = useState<RateType>(
    initialCommissionType ?? "percent",
  );
  const [commissionValue, setCommissionValue] = useState<string>(
    initialCommissionValue != null ? String(initialCommissionValue) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  // Track baseline so we know what to send (omit unchanged fields).
  const [baseline, setBaseline] = useState({
    enabled: initialEnabled,
    type: initialCommissionType,
    value: initialCommissionValue,
  });

  const dirty =
    enabled !== baseline.enabled ||
    commissionType !== (baseline.type ?? "percent") ||
    parseValueOrNull(commissionValue) !== baseline.value;

  function parseValueOrNull(s: string): number | null {
    const trimmed = s.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return null;
    return n;
  }

  async function onSave() {
    setSubmitting(true);
    try {
      const valueParsed = parseValueOrNull(commissionValue);

      // Client-side cap matching the PATCH endpoint validators so we surface
      // the violation before the network round-trip.
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

      // Build a minimal patch — only fields that actually changed.
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

      const res = await fetch(`/api/admin/service-templates/${templateId}`, {
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
      setBaseline({
        enabled,
        type: commissionType,
        value: valueParsed,
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate program</CardTitle>
        <CardDescription>
          Active affiliates can earn commission when they refer a booking
          for this general product. Disable to stop accepting affiliate
          clicks for this template.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            id="affiliate-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={submitting}
          />
          <Label htmlFor="affiliate-enabled" className="cursor-pointer">
            Accept affiliate referrals for this template
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="commission-type">Commission type</Label>
            <Select
              value={commissionType}
              onValueChange={(v: RateType) => setCommissionType(v)}
              disabled={submitting || !enabled}
            >
              <SelectTrigger id="commission-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="flat">Flat (cents)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-value">
              {commissionType === "flat" ? "Cents" : "Percent (%)"}
            </Label>
            <Input
              id="commission-value"
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

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Rate edits apply to <strong>future bookings only</strong>. Already-
            stamped bookings continue to credit at their stamped rate.
          </p>
          <Button onClick={onSave} disabled={submitting || !dirty}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
