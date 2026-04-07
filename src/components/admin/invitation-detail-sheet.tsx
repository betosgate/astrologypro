"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Info, History } from "lucide-react";
import type { InvitationRow } from "./invitations-client";
import { InfoRow } from "./admin-detail-parts";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: string) {
  const value = status.toLowerCase();
  if (value === "accepted") return "default";
  if (value === "cancelled") return "destructive";
  return "secondary";
}

export function InvitationDetailSheet({
  invitation,
  open,
  onClose,
}: {
  invitation: InvitationRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!invitation) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg">{invitation.email}</SheetTitle>
              <SheetDescription>Invitation details and delivery state</SheetDescription>
            </div>
            <Badge variant={statusVariant(invitation.status)}>{invitation.status}</Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <Info className="mr-1.5 size-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="delivery">
              <History className="mr-1.5 size-3.5" />
              Delivery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="rounded-lg border divide-y text-sm">
              <InfoRow label="Email" value={invitation.email} />
              <InfoRow label="Role" value={invitation.role_slug} />
              <InfoRow label="Status" value={invitation.status} />
              <InfoRow label="Invited by" value={invitation.invited_by ?? "—"} />
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <div className="rounded-lg border divide-y text-sm">
              <InfoRow label="Sent at" value={fmtDateTime(invitation.created_at)} />
              <InfoRow label="Expires at" value={fmtDateTime(invitation.expires_at)} />
              <InfoRow label="Resent count" value={String(invitation.resent_count ?? 0)} />
              <InfoRow label="Link" value={`/invite/${invitation.id}`} />
            </div>

            <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="size-4" />
                Delivery notes
              </div>
              <p className="mt-2">
                Pending and expired invitations can be resent. Cancelled invitations remain visible for audit purposes.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
