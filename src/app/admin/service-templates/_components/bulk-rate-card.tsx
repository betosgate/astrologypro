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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type RateType = "percent" | "flat";

export function BulkRateCard() {
  const router = useRouter();
  const [type, setType] = useState<RateType>("percent");
  const [value, setValue] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const numericValue = (() => {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : NaN;
  })();
  const valid =
    value.trim() !== "" &&
    Number.isFinite(numericValue) &&
    numericValue >= 0 &&
    !(type === "percent" && numericValue > 100) &&
    !(type === "flat" && numericValue > 100000);

  async function applyBulk() {
    setSubmitting(true);
    try {
      const res = await fetch(
        "/api/admin/service-templates/bulk-set-commission",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commission_type: type,
            commission_value: numericValue,
          }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string>;
        data?: { updated_count: number };
      };
      if (!res.ok) {
        const detail =
          body.details &&
          (body.details.commission_value ?? body.details.commission_type);
        toast.error(detail ?? body.error ?? "Bulk update failed");
        return;
      }
      const n = body.data?.updated_count ?? 0;
      toast.success(`Updated ${n} enabled general template${n === 1 ? "" : "s"}`);
      setValue("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bulk rate update</CardTitle>
          <CardDescription>
            Apply one commission rate to all general templates that currently
            have the affiliate program enabled. Useful when launching the
            program platform-wide or running a promo. <strong>Overwrites</strong>{" "}
            any per-template rates you've customized.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 w-36">
            <Label htmlFor="bulk-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v: RateType) => setType(v)}
              disabled={submitting}
            >
              <SelectTrigger id="bulk-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="flat">Flat (cents)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-40">
            <Label htmlFor="bulk-value">
              {type === "flat" ? "Cents" : "Percent (%)"}
            </Label>
            <Input
              id="bulk-value"
              type="number"
              min="0"
              step={type === "flat" ? "1" : "0.01"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
            />
          </div>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || !valid}
          >
            Apply to all enabled
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply rate to all enabled templates?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite any per-template commission rates you&rsquo;ve
              customized on enabled general templates. Already-stamped bookings
              keep their stamped rate; only future bookings will use the new
              value.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyBulk} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
