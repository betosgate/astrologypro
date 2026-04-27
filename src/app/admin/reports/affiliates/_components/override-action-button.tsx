"use client";

// Reusable admin emergency-override button: opens a dialog that
// requires a reason (5-500 chars), POSTs to the configured endpoint,
// then refreshes the route. Used for:
//
//   - Reverse conversion → POST /api/admin/conversions/[id]/reverse
//   - Archive campaign   → POST /api/admin/affiliate-campaigns/[id]/archive
//   - Revoke assignment  → POST /api/admin/affiliate-assignments/[id]/revoke
//
// Each backend endpoint writes admin_action_log + sends notifications.
// All take a {reason} body with a 5-500 char CHECK on admin_action_log.
//
// Spec: docs/specs/affiliate-commission-system.md §5 Flow K + §7

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type OverrideMethod = "POST" | "PATCH";

interface OverrideActionButtonProps {
  endpoint: string;
  method?: OverrideMethod;
  buttonLabel: string;
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  buttonIcon?: React.ReactNode;
  disabled?: boolean;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel?: string;
  successToast: string;
}

export function OverrideActionButton({
  endpoint,
  method = "POST",
  buttonLabel,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  buttonIcon,
  disabled = false,
  dialogTitle,
  dialogDescription,
  confirmLabel = "Confirm",
  successToast,
}: OverrideActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = reason.trim();
  const valid = trimmed.length >= 5 && trimmed.length <= 500;

  async function onSubmit() {
    if (!valid) {
      toast.error("Reason must be 5-500 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        title?: string;
        detail?: string;
      };
      if (!res.ok) {
        toast.error(body.detail ?? body.title ?? "Action failed");
        setSubmitting(false);
        return;
      }
      toast.success(successToast);
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {buttonIcon}
        {buttonLabel}
      </Button>
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
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="override-reason">Reason</Label>
            <Textarea
              id="override-reason"
              value={reason}
              maxLength={500}
              minLength={5}
              rows={4}
              placeholder="Why are you taking this action? (5-500 characters, recorded in admin_action_log)"
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
              variant="destructive"
              disabled={!valid || submitting}
              onClick={onSubmit}
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
