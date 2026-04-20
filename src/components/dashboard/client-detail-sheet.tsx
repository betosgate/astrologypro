"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Eye, Loader2, Search, Save } from "lucide-react";
import { toast } from "sonner";

interface ClientDetailProps {
  clientId: string;
  clientName: string;
  divinerId: string;
}

interface SessionWithNotes {
  id: string;
  scheduled_at: string;
  status: string;
  total_amount: number | null;
  duration_minutes: number;
  session_notes: string | null;
  client_session_notes: string | null;
  services: { name: string }[] | null;
}

interface ClientBirthData {
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
}

export function ClientDetailSheet({
  clientId,
  clientName,
  divinerId,
}: ClientDetailProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionWithNotes[]>([]);
  const [birthData, setBirthData] = useState<ClientBirthData | null>(null);
  const [generalNotes, setGeneralNotes] = useState("");
  const [notesSearch, setNotesSearch] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    async function loadData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch sessions with notes and general notes in parallel
      const [sessionsResult, clientDivinerResult, clientResult] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, scheduled_at, status, total_amount, duration_minutes, session_notes, client_session_notes, services(name)"
          )
          .eq("client_id", clientId)
          .eq("diviner_id", divinerId)
          .order("scheduled_at", { ascending: false })
          .limit(50),
        supabase
          .from("client_diviners")
          .select("notes")
          .eq("client_id", clientId)
          .eq("diviner_id", divinerId)
          .maybeSingle(),
        supabase
          .from("clients")
          .select("birth_date, birth_time, birth_city")
          .eq("id", clientId)
          .maybeSingle(),
      ]);

      setSessions(sessionsResult.data ?? []);
      setGeneralNotes(clientDivinerResult.data?.notes ?? "");
      setBirthData(clientResult.data ?? null);
      setLoading(false);
    }
    loadData();
  }, [open, clientId, divinerId]);

  const handleNotesBlur = useCallback(async () => {
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("client_diviners")
      .update({ notes: generalNotes })
      .eq("client_id", clientId)
      .eq("diviner_id", divinerId);

    setSavingNotes(false);
    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
    }
  }, [generalNotes, clientId, divinerId]);

  // Filter session notes by search term
  const sessionsWithNotes = sessions.filter(
    (s) => (s.session_notes && s.session_notes.trim().length > 0) || (s.client_session_notes && s.client_session_notes.trim().length > 0)
  );

  const filteredSessionNotes = notesSearch
    ? sessionsWithNotes.filter(
        (s) =>
          (s.session_notes?.toLowerCase().includes(notesSearch.toLowerCase())) ||
          (s.client_session_notes?.toLowerCase().includes(notesSearch.toLowerCase())) ||
          ((Array.isArray(s.services) ? s.services[0]?.name : (s.services as any)?.name) ?? "")
            .toLowerCase()
            .includes(notesSearch.toLowerCase())
      )
    : sessionsWithNotes;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="size-4" />
          <span className="sr-only">View client details</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{clientName}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Session History */}
              <div>
                <h3 className="text-sm font-medium mb-3">Session History</h3>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No sessions found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {Array.isArray(session.services) ? session.services[0]?.name : (session.services as any)?.name ?? "Session"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(session.scheduled_at)} &middot;{" "}
                            {session.duration_minutes} min
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {session.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(Number(session.total_amount ?? 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Birth Data */}
              {birthData && (birthData.birth_date || birthData.birth_time || birthData.birth_city) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Birth Data</h3>
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    {birthData.birth_date && (
                      <p>
                        <span className="text-muted-foreground text-xs">Date: </span>
                        {birthData.birth_date}
                      </p>
                    )}
                    {birthData.birth_time && (
                      <p>
                        <span className="text-muted-foreground text-xs">Time: </span>
                        {birthData.birth_time === "unknown" ? "Unknown" : birthData.birth_time}
                      </p>
                    )}
                    {birthData.birth_city && (
                      <p>
                        <span className="text-muted-foreground text-xs">City: </span>
                        {birthData.birth_city}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* General Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">General Notes</h3>
                  {savingNotes && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Save className="size-3 animate-pulse" />
                      Saving...
                    </span>
                  )}
                </div>
                <Textarea
                  ref={notesRef}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add general notes about this client..."
                  rows={4}
                  className="font-serif text-sm leading-relaxed"
                />
              </div>

              {/* Session Notes Journal */}
              <div>
                <h3 className="text-sm font-medium mb-2">Session Notes</h3>
                {sessionsWithNotes.length > 0 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={notesSearch}
                      onChange={(e) => setNotesSearch(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                )}

                {filteredSessionNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    {notesSearch
                      ? "No notes match your search."
                      : "No session notes recorded yet."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredSessionNotes.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-lg border p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "#d4a017" }}
                          >
                            {formatDate(session.scheduled_at)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Array.isArray(session.services) ? session.services[0]?.name : (session.services as any)?.name ?? "Session"}
                          </p>
                        </div>
                        {session.session_notes && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Your Notes</p>
                            <p className="font-serif text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                              {session.session_notes}
                            </p>
                          </div>
                        )}
                        {session.client_session_notes && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Client&apos;s Notes</p>
                            <p className="font-serif text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                              {session.client_session_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
