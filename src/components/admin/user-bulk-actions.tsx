"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ShieldCheck, ShieldOff, Archive, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BulkAction = "activate" | "suspend" | "archive";

export interface UserBulkActionsProps {
  /** Array of selected user IDs (auth user ids) */
  selectedUserIds: string[];
  /** Called after a successful bulk action so parent can refresh */
  onSuccess?: (action: BulkAction, userIds: string[]) => void;
}

interface PendingAction {
  type: BulkAction;
  label: string;
  description: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function UserBulkActions({ selectedUserIds, onSuccess }: UserBulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const count = selectedUserIds.length;
  if (count === 0) return null;

  function promptAction(type: BulkAction) {
    const labels: Record<BulkAction, { label: string; description: string }> = {
      activate: {
        label: "Activate",
        description: `Activate ${count} selected user${count > 1 ? "s" : ""}? They will regain platform access.`,
      },
      suspend: {
        label: "Suspend",
        description: `Suspend ${count} selected user${count > 1 ? "s" : ""}? They will lose platform access immediately.`,
      },
      archive: {
        label: "Archive",
        description: `Archive ${count} selected user${count > 1 ? "s" : ""}? This is a soft deactivation.`,
      },
    };
    setPendingAction({ type, ...labels[type] });
  }

  async function executeBulkAction() {
    if (!pendingAction) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: pendingAction.type,
          userIds: selectedUserIds,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Bulk action failed");
      }
      toast.success(
        `${pendingAction.label}d ${count} user${count > 1 ? "s" : ""}`
      );
      onSuccess?.(pendingAction.type, selectedUserIds);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  return (
    <>
      {/* Bulk action bar */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
        <span className="text-sm font-medium">
          {count} user{count > 1 ? "s" : ""} selected
        </span>
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 hover:text-green-800 hover:bg-green-50"
            onClick={() => promptAction("activate")}
            disabled={loading}
          >
            <ShieldCheck className="mr-1.5 size-3.5" />
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
            onClick={() => promptAction("suspend")}
            disabled={loading}
          >
            <ShieldOff className="mr-1.5 size-3.5" />
            Suspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => promptAction("archive")}
            disabled={loading}
          >
            <Archive className="mr-1.5 size-3.5" />
            Archive
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.label} {count} user{count > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
