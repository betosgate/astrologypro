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
import { InfoRow } from "./admin-detail-parts";
import { AdminNotesSection } from "./admin-notes-section";

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
  login_method: string | null;
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
  initialTab?: "overview" | "notes" | "logins";
}

export function UserDetailSheet({ user, open, onClose, onUserChanged, initialTab = "overview" }: Props) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [loginsLoading, setLoginsLoading] = useState(false);
  // Current admin email (to determine edit ownership)
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
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

  // Fetch the current admin's email so we know which notes they can edit
  useEffect(() => {
    if (currentAdminEmail) return; // already fetched
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.email) setCurrentAdminEmail(d.email); })
      .catch(() => {});
  }, [currentAdminEmail]);

  // Sync activeTab with initialTab when the sheet opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (open && user) {
      fetchNotes();
      fetchLogins();
    }
    if (!open) {
      setNotes([]);
      setLogins([]);
    }
  }, [open, user, fetchNotes, fetchLogins]);

  async function handleAddNote(content: string) {
    if (!content.trim() || !user) return;
    const res = await fetch(`/api/admin/users/${user.userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: content, role: user.role }),
    });
    if (!res.ok) throw new Error("Failed to add note");
    const data = await res.json();
    setNotes((prev) => [data.note, ...prev]);
  }

  async function handleDeleteNote(noteId: string) {
    if (!user) return;
    const res = await fetch(`/api/admin/users/${user.userId}/notes/${noteId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete note");
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleSaveEdit(noteId: string, content: string) {
    if (!content.trim() || !user) return;
    const res = await fetch(`/api/admin/users/${user.userId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: content }),
    });
    if (!res.ok) throw new Error("Failed to update note");
    const data = await res.json();
    setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)));
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
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge key={r.slug} variant="outline" className="capitalize text-xs">{r.label}</Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="capitalize text-xs">{user.roleLabel}</Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
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
                <InfoRow label="Role" value={user.roles?.map((r) => r.label).join(", ") ?? user.roleLabel} />
                <InfoRow label="Status" value={user.status} />
                <InfoRow label="Joined" value={dateTime(user.joinedAt)} />
                {Object.entries(user.extra ?? {}).map(([k, v]) => (
                  <InfoRow key={k} label={k} value={v} />
                ))}
              </div>

              <div className="pt-2 space-y-2">
                {/* Certified badge toggle — diviners only */}
                {(user.roles?.some((r) => r.slug === "diviner") ?? user.role === "diviner") && (
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
              <AdminNotesSection
                title="Add an admin note about this user…"
                notes={notes.map((note) => ({
                  id: note.id,
                  content: note.note,
                  created_by: note.created_by,
                  created_at: note.created_at,
                }))}
                loading={notesLoading}
                currentAdminEmail={currentAdminEmail}
                onAdd={handleAddNote}
                onDelete={handleDeleteNote}
                onEdit={handleSaveEdit}
              />
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Clock className="size-3" />
                            {dateTime(l.created_at)}
                          </div>
                          {l.login_method && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-4 px-1.5 capitalize ${
                                l.login_method === "password"
                                  ? "border-blue-500/40 text-blue-600 dark:text-blue-400"
                                  : l.login_method === "magic_link"
                                  ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              }`}
                            >
                              {l.login_method === "magic_link" ? "Magic Link" : l.login_method}
                            </Badge>
                          )}
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
