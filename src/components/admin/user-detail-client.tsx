"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pencil,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  StickyNote,
  Trash2,
  Loader2,
  User,
  Link2,
  History,
  Activity,
  Shield,
  FileText,
  Lock,
  Unlock,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ─────────────────────────────────────────────────────────────────────

// ─── Business data types (exported for page.tsx) ─────────────────────────────

export interface DivinerAffiliate {
  id: string;
  name: string;
  email?: string;
  status: string;
  created_at: string;
}

export interface DivinerBusinessData {
  service_count: number;
  bookings_this_month: number;
  affiliates: DivinerAffiliate[];
  total_affiliates: number;
}

export interface AffiliateBusinessData {
  affiliate_row_id: string;
  parent_diviner_id: string;
  parent_diviner_name: string;
  commission_type?: string;
  commission_value?: number;
  status: string;
  created_at: string;
}

export type BusinessData =
  | { kind: "diviner"; data: DivinerBusinessData }
  | { kind: "affiliate"; data: AffiliateBusinessData }
  | null;

// ─── Session & lock types ─────────────────────────────────────────────────────

export interface UserSession {
  id: string;
  session_ref?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country_code?: string;
  last_seen_at: string;
  created_at: string;
  revoked_at?: string;
  is_current: boolean;
}

export interface AccountLock {
  locked_at: string;
  locked_reason?: string;
  locked_by?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ip_address?: string;
  attempted_at: string;
  success: boolean;
}

export interface UserDetailData {
  userId: string;
  rowId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  roleLabel: string;
  accountStatus?: string;
  isActive: boolean;
  isCertified?: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  // Profile fields per role
  profileFields?: Record<string, string | null>;
  // Related data
  notes: AdminNote[];
  loginLogs: LoginLog[];
  securityEvents: SecurityEvent[];
  relationships: UserRelationship[];
  activityLog: ActivityLogEntry[];
  userActivityLog: UserActivityEntry[];
  commPrefs?: CommunicationPrefs | null;
  // Business data (per role)
  businessData?: BusinessData;
  // Sessions & security
  sessions?: UserSession[];
  accountLock?: AccountLock | null;
  loginAttempts?: LoginAttempt[];
}

interface AdminNote {
  id: string;
  note: string;
  created_by?: string;
  created_at: string;
}

interface LoginLog {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  city?: string;
  country?: string;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address?: string;
  actor_user_id?: string;
  created_at: string;
}

interface UserRelationship {
  id: string;
  parent_user_id: string;
  child_user_id: string;
  relationship_type: string;
  status: string;
  active_from?: string;
  active_to?: string;
  partner_name?: string;
  partner_email?: string;
}

interface ActivityLogEntry {
  id: string;
  actor_email?: string;
  action_type: string;
  details?: string;
  created_at: string;
}

interface UserActivityEntry {
  id: string;
  event_category?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  actor_id?: string;
  created_at: string;
}

interface CommunicationPrefs {
  email_marketing?: boolean;
  email_transactional?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  unsubscribed_all?: boolean;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    active:               "bg-green-500/10 text-green-700 dark:text-green-400",
    suspended:            "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    locked:               "bg-red-500/10 text-red-700 dark:text-red-400",
    deactivated:          "bg-gray-500/10 text-gray-600",
    archived:             "bg-gray-500/10 text-gray-600",
    draft:                "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    invited:              "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    pending_verification: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    pending_approval:     "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Event type badge ──────────────────────────────────────────────────────────

function EventBadge({ type }: { type: string }) {
  const t = type.toLowerCase();
  let cls = "bg-muted text-muted-foreground";
  if (t.includes("login_success")) cls = "bg-green-500/10 text-green-700";
  if (t.includes("login_fail"))    cls = "bg-red-500/10 text-red-700";
  if (t.includes("role_change"))   cls = "bg-purple-500/10 text-purple-700";
  if (t.includes("suspend"))       cls = "bg-amber-500/10 text-amber-700";
  if (t.includes("password"))      cls = "bg-blue-500/10 text-blue-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

// ─── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  auth:         "bg-blue-500/15 text-blue-400",
  booking:      "bg-green-500/15 text-green-400",
  payment:      "bg-amber-500/15 text-amber-400",
  reading:      "bg-purple-500/15 text-purple-400",
  subscription: "bg-teal-500/15 text-teal-400",
  admin:        "bg-orange-500/15 text-orange-400",
  security:     "bg-red-500/15 text-red-400",
  system:       "bg-gray-500/15 text-gray-400",
};

function CategoryBadge({ category }: { category?: string }) {
  const cat = (category ?? "system").toLowerCase();
  const cls = CATEGORY_COLORS[cat] ?? "bg-gray-500/15 text-gray-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {cat}
    </span>
  );
}

// ─── Initials avatar ───────────────────────────────────────────────────────────

function InitialsAvatar({ name, email }: { name: string; email: string }) {
  const src = name || email;
  const initials = src
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 text-lg font-bold">
      {initials || "?"}
    </div>
  );
}

// ─── Format helpers ────────────────────────────────────────────────────────────

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function uaSnippet(ua?: string) {
  if (!ua) return "—";
  return ua.length > 60 ? ua.slice(0, 60) + "…" : ua;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function UserDetailClient({ user }: { user: UserDetailData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  // Sessions & lock state
  const [sessions, setSessions] = useState<UserSession[]>(user.sessions ?? []);
  const [accountLock, setAccountLock] = useState<AccountLock | null>(user.accountLock ?? null);
  const [lockReason, setLockReason] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [notes, setNotes] = useState<AdminNote[]>(user.notes ?? []);
  const [suspending, setSuspending] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const displayStatus = user.accountStatus ?? (user.isActive ? "active" : "inactive");

  // ── Save note ─────────────────────────────────────────────────────────────────
  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const saved = await res.json();
      setNotes((prev) => [saved, ...prev]);
      setNoteText("");
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  // ── Delete note ───────────────────────────────────────────────────────────────
  async function handleDeleteNote(noteId: string) {
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  // ── Reset password ────────────────────────────────────────────────────────────
  async function handleResetPassword() {
    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send reset");
      toast.success("Password reset email sent");
    } catch {
      toast.error("Failed to send password reset");
    } finally {
      setResetLoading(false);
    }
  }

  // ── Suspend / activate ────────────────────────────────────────────────────────
  async function handleToggleSuspend() {
    setSuspending(true);
    const action = displayStatus === "suspended" ? "activate" : "suspend";
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(action === "suspend" ? "User suspended" : "User activated");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setSuspending(false);
    }
  }

  // ── Lock account ──────────────────────────────────────────────────────────
  async function handleLockAccount() {
    if (!lockReason.trim()) {
      toast.error("Please enter a reason before locking.");
      return;
    }
    setLockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: lockReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to lock account");
      setAccountLock({
        locked_at: new Date().toISOString(),
        locked_reason: lockReason.trim(),
      });
      setLockReason("");
      toast.success("Account locked");
    } catch {
      toast.error("Failed to lock account");
    } finally {
      setLockLoading(false);
    }
  }

  // ── Unlock account ────────────────────────────────────────────────────────
  async function handleUnlockAccount() {
    setLockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/lock`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unlock account");
      setAccountLock(null);
      toast.success("Account unlocked");
    } catch {
      toast.error("Failed to unlock account");
    } finally {
      setLockLoading(false);
    }
  }

  // ── Revoke one session ────────────────────────────────────────────────────
  async function handleRevokeSession(sessionId: string) {
    setRevokingSession(sessionId);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/sessions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Failed");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, revoked_at: new Date().toISOString() } : s
        )
      );
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSession(null);
    }
  }

  // ── Revoke all sessions ───────────────────────────────────────────────────
  async function handleRevokeAllSessions() {
    setRevokingAll(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/sessions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed");
      const now = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) => (s.revoked_at ? s : { ...s, revoked_at: now }))
      );
      toast.success("All sessions revoked");
    } catch {
      toast.error("Failed to revoke sessions");
    } finally {
      setRevokingAll(false);
    }
  }

  const isSuspended = displayStatus === "suspended";

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={user.name} email={user.email} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{user.name || "—"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize text-xs">
                {user.roleLabel}
              </Badge>
              <StatusBadge status={displayStatus} />
              {user.isCertified && (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Certified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/users/edit/${user.userId}`}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit Profile
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            {resetLoading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <KeyRound className="mr-1.5 size-3.5" />
            )}
            Reset Password
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant={isSuspended ? "outline" : "destructive"}
                disabled={suspending}
              >
                {suspending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : isSuspended ? (
                  <ShieldCheck className="mr-1.5 size-3.5" />
                ) : (
                  <ShieldOff className="mr-1.5 size-3.5" />
                )}
                {isSuspended ? "Activate" : "Suspend"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isSuspended ? "Activate user?" : "Suspend user?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isSuspended
                    ? `${user.name || user.email} will be restored to active status.`
                    : `${user.name || user.email} will lose access to the platform.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleSuspend}>
                  {isSuspended ? "Activate" : "Suspend"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveTab("notes");
              setTimeout(() => {
                document.getElementById("note-textarea")?.focus();
              }, 100);
            }}
          >
            <StickyNote className="mr-1.5 size-3.5" />
            Add Note
          </Button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="access">Access &amp; Role</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="sessions">Sessions &amp; Security</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="notes">
            Notes {notes.length > 0 && `(${notes.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold capitalize">{user.roleLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Joined</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{fmtDate(user.joinedAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{fmtDate(user.lastLoginAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={displayStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{notes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Logins (recent)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{user.loginLogs.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          {user.securityEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="size-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.securityEvents.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between text-sm">
                      <EventBadge type={evt.event_type} />
                      <span className="text-xs text-muted-foreground">{fmt(evt.created_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Profile ───────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4" />
                Profile Details
              </CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/users/edit/${user.userId}`}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Edit Profile
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Name</dt>
                  <dd className="mt-0.5 text-sm font-medium">{user.name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Email</dt>
                  <dd className="mt-0.5 text-sm font-medium">{user.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Phone</dt>
                  <dd className="mt-0.5 text-sm font-medium">{user.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Role</dt>
                  <dd className="mt-0.5 text-sm font-medium capitalize">{user.roleLabel}</dd>
                </div>
                {user.profileFields &&
                  Object.entries(user.profileFields).map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium">{val ?? "—"}</dd>
                    </div>
                  ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Access & Role ─────────────────────────────────────────── */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4" />
                Role &amp; Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Current Role</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{user.roleLabel}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/users/edit/${user.userId}`}>Change Role</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Controls platform access
                  </p>
                </div>
                <StatusBadge status={displayStatus} />
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Block / Unblock Access</p>
                <p className="text-xs text-muted-foreground">
                  Suspending immediately revokes platform access.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={isSuspended ? "outline" : "destructive"}
                      disabled={suspending}
                    >
                      {isSuspended ? "Unblock User" : "Block User"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isSuspended ? "Unblock user?" : "Block user?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isSuspended
                          ? "User will regain platform access."
                          : "User will lose platform access immediately."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleToggleSuspend}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Hierarchy ─────────────────────────────────────────────── */}
        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="size-4" />
                Relationships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.relationships.length === 0 ? (
                <div className="py-12 text-center">
                  <Link2 className="mx-auto size-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No hierarchy relationships</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active From</TableHead>
                      <TableHead>Active To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.relationships.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{rel.partner_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{rel.partner_email ?? ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs capitalize">{rel.relationship_type}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={rel.status} />
                        </TableCell>
                        <TableCell className="text-xs">{fmtDate(rel.active_from)}</TableCell>
                        <TableCell className="text-xs">{rel.active_to ? fmtDate(rel.active_to) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            Reassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Sessions & Security ───────────────────────────────────── */}
        <TabsContent value="sessions" className="space-y-4">

          {/* ── Account lock status ─────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4" />
                Account Lock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountLock ? (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
                  <Lock className="size-5 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Account Locked
                    </p>
                    {accountLock.locked_reason && (
                      <p className="mt-0.5 text-sm text-red-600 dark:text-red-500">
                        Reason: {accountLock.locked_reason}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Locked at: {fmt(accountLock.locked_at)}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="shrink-0" disabled={lockLoading}>
                        {lockLoading ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Unlock className="mr-1.5 size-3.5" />
                        )}
                        Unlock
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlock account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will restore platform access for {user.name || user.email}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnlockAccount}>Unlock</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Account is not locked. Use the form below to lock it.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="lock-reason" className="text-sm">
                      Lock reason <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lock-reason"
                      placeholder="Enter reason for locking this account"
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={lockLoading || !lockReason.trim()}
                      >
                        {lockLoading ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Lock className="mr-1.5 size-3.5" />
                        )}
                        Lock Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Lock account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.name || user.email} will immediately lose platform access.
                          Reason: {lockReason}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleLockAccount}
                        >
                          Lock Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Active sessions ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="size-4" />
                Active Sessions
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                disabled={revokingAll}
                onClick={handleRevokeAllSessions}
              >
                {revokingAll && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Revoke All Sessions
              </Button>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No sessions tracked
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser / OS</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            {s.device_type === "mobile" ? (
                              <Smartphone className="size-3.5 shrink-0" />
                            ) : s.device_type === "tablet" ? (
                              <Tablet className="size-3.5 shrink-0" />
                            ) : (
                              <Monitor className="size-3.5 shrink-0" />
                            )}
                            <span className="capitalize">{s.device_type ?? "desktop"}</span>
                            {s.is_current && (
                              <span className="text-green-600 font-medium">(current)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[s.browser, s.os].filter(Boolean).join(" / ") || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{s.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-xs">{fmt(s.last_seen_at)}</TableCell>
                        <TableCell>
                          {s.revoked_at ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="size-3.5 text-red-400" />
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="size-3.5" />
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!s.revoked_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              disabled={revokingSession === s.id}
                              onClick={() => handleRevokeSession(s.id)}
                            >
                              {revokingSession === s.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Revoke"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Login history ────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" />
                Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.loginLogs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No login history</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.loginLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{fmt(log.created_at)}</TableCell>
                        <TableCell className="text-xs font-mono">{log.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {[log.city, log.country].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                          {uaSnippet(log.user_agent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Login attempts ───────────────────────────────────────────────── */}
          {(user.loginAttempts ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Recent Login Attempts (last 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(user.loginAttempts ?? []).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{fmt(a.attempted_at)}</TableCell>
                        <TableCell className="text-xs font-mono">{a.ip_address ?? "—"}</TableCell>
                        <TableCell>
                          {a.success ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="size-3.5" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500">
                              <XCircle className="size-3.5" />
                              Failed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ── Security events ──────────────────────────────────────────────── */}
          {user.securityEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.securityEvents.map((evt) => (
                      <TableRow key={evt.id}>
                        <TableCell>
                          <EventBadge type={evt.event_type} />
                        </TableCell>
                        <TableCell className="text-xs">{fmt(evt.created_at)}</TableCell>
                        <TableCell className="text-xs font-mono">{evt.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-xs">{evt.actor_user_id ?? "system"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 6: Activity Log ──────────────────────────────────────────── */}
        <TabsContent value="activity" className="space-y-4">
          {/* Unified timeline — merge user_activity_log + admin_activity_log, sort DESC */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.userActivityLog.length === 0 && user.activityLog.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity recorded for this user
                </p>
              ) : (() => {
                // Merge and sort unified timeline
                type TimelineItem =
                  | { kind: "user"; entry: UserActivityEntry }
                  | { kind: "admin"; entry: ActivityLogEntry };

                const timeline: TimelineItem[] = [
                  ...user.userActivityLog.map((e) => ({ kind: "user" as const, entry: e })),
                  ...user.activityLog.map((e) => ({ kind: "admin" as const, entry: e })),
                ].sort(
                  (a, b) =>
                    new Date(b.entry.created_at).getTime() -
                    new Date(a.entry.created_at).getTime()
                );

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">Time</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Details / Metadata</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Actor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeline.map((item) => {
                        if (item.kind === "user") {
                          const e = item.entry;
                          const metaSummary = e.metadata
                            ? Object.entries(e.metadata)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
                                .join(", ")
                            : "—";
                          return (
                            <TableRow key={`ua_${e.id}`}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {fmt(e.created_at)}
                              </TableCell>
                              <TableCell>
                                <CategoryBadge category={e.event_category} />
                              </TableCell>
                              <TableCell className="text-xs font-medium">{e.event_type}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                                {metaSummary}
                              </TableCell>
                              <TableCell className="text-xs font-mono">{e.ip_address ?? "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {e.actor_id ? (
                                  <span className="font-mono">{e.actor_id.slice(0, 8)}…</span>
                                ) : (
                                  "user"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        } else {
                          const e = item.entry;
                          return (
                            <TableRow key={`aa_${e.id}`}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {fmt(e.created_at)}
                              </TableCell>
                              <TableCell>
                                <CategoryBadge category="admin" />
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                                  {e.action_type}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                                {e.details ?? "—"}
                              </TableCell>
                              <TableCell className="text-xs font-mono">—</TableCell>
                              <TableCell className="text-xs">{e.actor_email ?? "admin"}</TableCell>
                            </TableRow>
                          );
                        }
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 7: Notes ─────────────────────────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4">
          {/* Note list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="size-4" />
                Admin Notes ({notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No notes yet. Add one below.
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.created_by ? `${note.created_by} · ` : ""}
                        {fmt(note.created_at)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete note</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete note?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add note form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                id="note-textarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write an admin note about this user…"
                rows={4}
              />
              <Button
                onClick={handleSaveNote}
                disabled={savingNote || !noteText.trim()}
                size="sm"
              >
                {savingNote ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <StickyNote className="mr-1.5 size-3.5" />
                )}
                Save Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
