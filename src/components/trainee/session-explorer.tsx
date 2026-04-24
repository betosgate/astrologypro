"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  Download,
  Share2,
  Loader2,
  RefreshCw,
  NotebookPen,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

type BookingSource = "bookings" | "admin_bookings";

type UnifiedBooking = {
  id: string;
  source: BookingSource;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  hostDisplayName: string | null;
  hostUsername: string | null;
  serviceName: string | null;
  serviceCategory: string | null;
  joinHref: string | null;
  actionBasePath: string | null;
  clientName: string;
  clientEmail: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", timeZoneName: "short"
    }),
    full: d.toLocaleString()
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "Confirmed", variant: "default" },
    pending: { label: "Pending", variant: "outline" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    canceled: { label: "Canceled", variant: "destructive" },
    cancelled: { label: "Canceled", variant: "destructive" },
    no_show: { label: "No Show", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant} className="capitalize">{label}</Badge>;
}

export function SessionExplorer({ 
  upcoming, 
  past 
}: { 
  upcoming: UnifiedBooking[], 
  past: UnifiedBooking[] 
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    upcoming.length > 0 ? upcoming[0].id : (past.length > 0 ? past[0].id : null)
  );

  const allBookings = [...upcoming, ...past];
  const selected = allBookings.find(b => b.id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-12rem)]">
      {/* List Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Upcoming</h3>
            {upcoming.map((b) => (
              <SessionCard 
                key={b.id} 
                booking={b} 
                isSelected={selectedId === b.id} 
                onClick={() => setSelectedId(b.id)} 
              />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">History</h3>
            {past.map((b) => (
              <SessionCard 
                key={b.id} 
                booking={b} 
                isSelected={selectedId === b.id} 
                onClick={() => setSelectedId(b.id)} 
              />
            ))}
          </div>
        )}

        {allBookings.length === 0 && (
          <div className="py-12 text-center border rounded-lg bg-muted/20">
            <Calendar className="size-8 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">No sessions found</p>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="lg:col-span-8 overflow-y-auto">
        {selected ? (
          <SessionDetailView booking={selected} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center border rounded-xl bg-muted/5 border-dashed">
            <Video className="size-12 text-muted-foreground opacity-20" />
            <p className="mt-4 text-sm text-muted-foreground">Select a session to view recordings and notes</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ booking, isSelected, onClick }: { 
  booking: UnifiedBooking, 
  isSelected: boolean, 
  onClick: () => void 
}) {
  const { date, time } = formatDateTime(booking.scheduledAt);
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20" : "bg-card/40"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <p className="text-sm font-bold truncate">{booking.serviceName}</p>
          <StatusBadge status={booking.status} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {date}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {time}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionDetailView({ booking }: { booking: UnifiedBooking }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { full } = formatDateTime(booking.scheduledAt);

  // Fetch recordings if completed
  useState(() => {
    if (booking.status === "completed") {
      setLoading(true);
      fetch(`/api/bookings/${booking.id}/session-details`)
        .then(r => r.json())
        .then(d => setDetails(d))
        .finally(() => setLoading(false));
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-bold">{booking.serviceName}</CardTitle>
                <StatusBadge status={booking.status} />
              </div>
              <CardDescription className="flex items-center gap-2">
                <Video className="size-3.5" />
                {booking.hostDisplayName ? `Hosted by ${booking.hostDisplayName}` : "Mentor Session"}
              </CardDescription>
            </div>
            
            {booking.joinHref && (booking.status === 'confirmed' || booking.status === 'pending') && (
              <Button asChild className="shadow-lg shadow-primary/20">
                <a href={booking.joinHref}>
                  <Video className="mr-2 size-4" />
                  Join Session
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date & Time</p>
              <p className="text-sm font-medium">{full}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{booking.durationMinutes} Minutes</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Method</p>
              <p className="text-sm font-medium capitalize">{booking.source.replace("_", " ")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</p>
              <p className="text-sm font-mono text-muted-foreground">#{booking.id.slice(0, 8)}</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Recording Section */}
          {booking.status === "completed" && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Video className="size-4 text-primary" />
                Session Recording
              </h4>
              
              {loading ? (
                <div className="py-8 flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">Loading playback segments...</span>
                </div>
              ) : details?.recording_url || details?.recording_share_id || details?.chime_meeting_id ? (
                <div className="rounded-xl overflow-hidden border bg-black shadow-2xl shadow-primary/5">
                  <RecordingPlayer bookingId={booking.id} recordingUrl={details.recording_url} />
                </div>
              ) : (
                <div className="py-8 text-center border rounded-xl bg-muted/20 border-dashed">
                  <Info className="size-6 mx-auto text-muted-foreground opacity-40 mb-2" />
                  <p className="text-sm text-muted-foreground">Recording is being processed. Typical sync takes 15-30 minutes.</p>
                </div>
              )}
            </div>
          )}

          {/* Additional Info / Actions */}
          <div className="grid sm:grid-cols-2 gap-4">
             {booking.actionBasePath && (
               <Card className="bg-muted/30 border-none shadow-none">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold">Appointment Management</p>
                      <p className="text-[10px] text-muted-foreground">Schedule changes or cancellations</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                       Manage <ChevronRight className="ml-1 size-3" />
                    </Button>
                 </CardContent>
               </Card>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecordingPlayer({ bookingId, recordingUrl }: { bookingId: string, recordingUrl: string | null }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!recordingUrl);
  const [error, setError] = useState<string | null>(null);
  const finalUrl = recordingUrl ?? resolvedUrl;

  useEffect(() => {
    if (recordingUrl) return;

    fetch(`/api/bookings/${bookingId}/recording-segments`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.recording_url === "string" && d.recording_url) {
          setResolvedUrl(d.recording_url);
          setError(null);
        } else {
          setError("Recording is still being processed.");
        }
      })
      .catch(() => setError("Failed to load recording."))
      .finally(() => setLoading(false));
  }, [bookingId, recordingUrl]);

  if (loading) return null;

  return (
    <div className="p-1">
      {finalUrl ? (
        <div className="space-y-2">
          <video
            src={finalUrl}
            controls
            preload="metadata"
            className="w-full rounded-lg bg-black"
          />
          {finalUrl && (
             <div className="p-3 pt-0 flex gap-2">
               <Button size="xs" variant="ghost" className="text-[10px] text-zinc-400 hover:text-white" asChild>
                 <a href={finalUrl} download>
                    <Download className="mr-1 size-3" /> Download MP4
                 </a>
               </Button>
             </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-zinc-500 text-sm">
          {error ?? "Recording is still being processed. Please check back shortly."}
        </div>
      )}
    </div>
  );
}
