"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Info } from "lucide-react";
import type { ActivityLogEntry } from "./activity-log-table-client";
import { InfoRow } from "./admin-detail-parts";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

export function ActivityLogDetailSheet({
  entry,
  open,
  onClose,
}: {
  entry: ActivityLogEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg">Activity Entry</SheetTitle>
              <SheetDescription>{entry.admin_user_id}</SheetDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {entry.action_type}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <Info className="mr-1.5 size-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="details">
              <ClipboardList className="mr-1.5 size-3.5" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="rounded-lg border divide-y text-sm">
              <InfoRow label="Admin" value={entry.admin_user_id} />
              <InfoRow label="Target" value={entry.target_user_id ?? "—"} />
              <InfoRow label="Action" value={entry.action_type} />
              <InfoRow label="IP" value={entry.ip_address ?? "—"} />
              <InfoRow label="Time" value={fmtDate(entry.created_at)} />
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
