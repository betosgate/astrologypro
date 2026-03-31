"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Eye, Loader2 } from "lucide-react";

interface ClientDetailProps {
  clientId: string;
  clientName: string;
  divinerId: string;
}

export function ClientDetailSheet({
  clientId,
  clientName,
  divinerId,
}: ClientDetailProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    async function loadSessions() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("id, scheduled_at, status, amount, duration, services(name)")
        .eq("client_id", clientId)
        .eq("diviner_id", divinerId)
        .order("scheduled_at", { ascending: false })
        .limit(10);

      setSessions(data ?? []);
      setLoading(false);
    }
    loadSessions();
  }, [open, clientId, divinerId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="size-4" />
          <span className="sr-only">View client details</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{clientName}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Session History</h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sessions found.
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {session.services?.name ?? "Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(session.scheduled_at)} &middot;{" "}
                        {session.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {session.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency((session.amount ?? 0) / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
