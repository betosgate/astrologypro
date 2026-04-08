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
import { ClipboardList, Info } from "lucide-react";
import type { ActivityItem } from "@/app/api/admin/reports/activity/route";
import { InfoRow } from "./admin-detail-parts";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityReportDetailSheet({
  item,
  open,
  onClose,
}: {
  item: ActivityItem | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg">{item.user_email ?? item.user_id}</SheetTitle>
              <SheetDescription>{item.source}</SheetDescription>
            </div>
            <Badge variant="outline">{item.event_type}</Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <Info className="mr-1.5 size-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="metadata">
              <ClipboardList className="mr-1.5 size-3.5" />
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="rounded-lg border divide-y text-sm">
              <InfoRow label="User" value={item.user_email ?? item.user_id} />
              <InfoRow label="Source" value={item.source} />
              <InfoRow label="Category" value={item.event_category ?? "—"} />
              <InfoRow label="Event" value={item.event_type} />
              <InfoRow label="IP" value={item.ip_address ?? "—"} />
              <InfoRow label="Time" value={fmt(item.created_at)} />
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
              {JSON.stringify(item.metadata ?? {}, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
