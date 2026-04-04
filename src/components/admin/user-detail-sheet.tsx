"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Loader2,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Monitor,
  MapPin,
  Clock,
  StickyNote,
  User,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminUser } from "./user-management-client";

interface Note {
  id: string;
  note: string;
  role: string | null;
  created_by: string;
  created_at: string;
}

interface LoginLog {
  id: string;
  ip: string | null;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  return "Browser";
}

function parseOS(ua: string | null): string {
  if (!ua) return "Unknown OS";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown OS";
}

function dateTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Props {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onUserChanged: (userId: string, change: Partial<AdminUser>) => void;
}

export function UserDetailSheet({ user, open, onClose, onUserChanged }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/notes`);
      const data = await res.json();
      setNotes(data.notes ?? []);
    } finally {
      setNotesLoading(false);
    }
  }, [user]);

  const fetchLogins = useCallback(async () => {
    if (!user) return;
    setLoginsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/logins`);
      const data = await res.json();
      setLogins(data.logins ?? []);
    } finally {
      setLoginsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchNotes();
      fetchLogins();
    }
    if (!open) {
      setNotes([]);
      setLogins([]);
      setNewNote("");
    }
  }, [open, user, fetchNotes, fetchLogins]);

  async function handleAddNote() {
    if (!newNote.trim() || !user) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, role: user.role }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setNewNote("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!user) return;
    setDeletingNote(noteId);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeletingNote(null);
    }
  }

  async function handleBlock() {
    if (!user) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${user.name} has been blocked`);
      onUserChanged(user.userId, { blocked: true });
      setBlockDialogOpen(false);
      setBlockReason("");
    } catch {
      toast.error("Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleToggleCertified() {
    if (!user) return;
    setCertLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certified: !user.isCertified }),
      });
      if (!res.ok) throw new Error("Failed");
      const newVal = !user.isCertified;
      onUserChanged(user.userId, { isCertified: newVal });
      toast.success(newVal ? "Certified badge awarded" : "Certified badge removed");
    } catch {
      toast.error("Failed to update certification");
    } finally {
      setCertLoading(false);
    }
  }

  async function handleUnblock() {
    if (!user) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/unblock`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${user.name} has been unblocked`);
      onUserChanged(user.userId, { blocked: false });
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setBlockLoading(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-lg">{user.name}</SheetTitle>
                <SheetDescription className="text-sm">{user.email}</SheetDescription>
              </div>
              <div className="flex gap-2 items-center shrink-0 pt-0.5">
                {user.blocked ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : (
                  <Badge variant="default">Active</Badge>
                )}
                <Badge variant="outline" className="capitalize text-xs">{user.roleLabel}</Badge>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview"><User className="mr-1.5 size-3.5" />Info</TabsTrigger>
              <TabsTrigger value="notes"><StickyNote className="mr-1.5 size-3.5" />Notes {notes.length > 0 && `(${notes.length})`}</TabsTrigger>
              <TabsTrigger value="logins"><Monitor className="mr-1.5 size-3.5" />Logins</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="rounded-lg border divide-y text-sm">
                <InfoRow label="Name" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                {user.phone && <InfoRow label="Phone" value={user.phone} />}
                <InfoRow label="Role" value={user.roleLabel} />
                <InfoRow label="Status" value={user.status} />
                <InfoRow label="Joined" value={dateTime(user.joinedAt)} />
                {Object.entries(user.extra ?? {}).map(([k, v]) => (
                  <InfoRow key={k} label={k} value={v} />
                ))}
              </div>

              <div className="pt-2 space-y-2">
                {/* Certified badge toggle — diviners only */}
                {user.role === "diviner" && (
                  <Button
                    variant="outline"
                    className={`w-full ${user.isCertified ? "border-amber-600 text-amber-500 hover:bg-amber-950" : "border-amber-700/50 text-amber-600/80 hover:bg-amber-950/30"}`}
                    onClick={handleToggleCertified}
                    disabled={certLoading}
                  >
                    {certLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="mr-2 size-4" />
                    )}
                    {user.isCertified ? "Remove DIB Certified Badge" : "Award DIB Certified Badge"}
                  </Button>
                )}
                {user.blocked ? (
                  <Button
                    variant="outline"
                    className="w-full border-green-700 text-green-500 hover:bg-green-950"
                    onClick={handleUnblock}
                    disabled={blockLoading}
                  >
                    {blockLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                    Unblock User
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setBlockDialogOpen(true)}
                    disabled={blockLoading}
                  >
                    <ShieldOff className="mr-2 size-4" />
                    Block User
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* ── Notes ── */}
            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add an admin note about this user…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button size="sm" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                  {savingNote ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
                  Add Note
                </Button>
              </div>

              {notesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3 text-sm space-y-1.5 group">
                      <p className="text-foreground leading-relaxed">{n.note}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{n.created_by} · {dateTime(n.created_at)}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          disabled={deletingNote === n.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        >
                          {deletingNote === n.id
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <Trash2 className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Logins ── */}
            <TabsContent value="logins" className="mt-4">
              {loginsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : logins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No login history yet</p>
              ) : (
                <div className="space-y-2">
                  {logins.map((l) => (
                    <div key={l.id} className="rounded-lg border p-3 text-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Clock className="size-3" />
                          {dateTime(l.created_at)}
                        </div>
                        {(l.city || l.country) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {[l.city, l.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {l.ip && (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{l.ip}</code>
                        )}
                        {l.user_agent && (
                          <span className="text-xs text-muted-foreground">
                            {parseBrowser(l.user_agent)} on {parseOS(l.user_agent)}
                          </span>
                        )}
                      </div>
                      {l.user_agent && (
                        <p className="text-xs text-muted-foreground/60 truncate" title={l.user_agent}>
                          {l.user_agent}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Block confirmation dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately prevent them from logging in. You can unblock at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for blocking (optional but recommended)…"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={blockLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blockLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-3 py-2.5">
      <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5 capitalize">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
