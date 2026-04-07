"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Send,
  X,
  Copy,
  Check,
  Loader2,
  Mail,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InvitationRow {
  id: string;
  email: string;
  role_slug: string;
  status: string;
  invited_by?: string;
  expires_at?: string;
  resent_count?: number;
  created_at: string;
}

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

export interface InvitationsClientProps {
  invitations: InvitationRow[];
  roles: RoleOption[];
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function InviteStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    pending:   "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    accepted:  "bg-green-500/10 text-green-700 dark:text-green-400",
    expired:   "bg-gray-500/10 text-gray-600",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ─── Format helpers ────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function InvitationsClient({
  invitations: initialInvitations,
  roles,
}: InvitationsClientProps) {
  const [invitations, setInvitations] = useState<InvitationRow[]>(initialInvitations);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [parentDiviner, setParentDiviner] = useState("");
  const [inviting, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const STATUS_TABS = ["all", "pending", "accepted", "expired", "cancelled"];

  const filtered = statusFilter === "all"
    ? invitations
    : invitations.filter((inv) => inv.status.toLowerCase() === statusFilter);

  const selectedRole = roles.find((r) => r.id === inviteRole);
  const isAffiliate = selectedRole?.slug?.toLowerCase().includes("affiliate") ||
                      selectedRole?.slug?.toLowerCase().includes("advocate");

  // ── Send invite ───────────────────────────────────────────────────────────────
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRole) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        email: inviteEmail.trim(),
        role_id: inviteRole,
      };
      if (isAffiliate && parentDiviner.trim()) {
        payload.parent_diviner = parentDiviner.trim();
      }

      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to send invitation");
      }
      const saved = await res.json();
      setInvitations((prev) => [saved, ...prev]);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("");
      setParentDiviner("");
      toast.success("Invitation sent", {
        action: {
          label: "Copy link",
          onClick: () => copyInviteLink(saved.id),
        },
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSaving(false);
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────────────
  async function handleResend(invId: string) {
    try {
      const res = await fetch(`/api/admin/invitations/${invId}/resend`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resend");
      toast.success("Invitation resent");
      const updated = await res.json();
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invId ? { ...inv, ...updated } : inv))
      );
    } catch {
      toast.error("Failed to resend invitation");
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  async function handleCancel(invId: string) {
    try {
      const res = await fetch(`/api/admin/invitations/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invId ? { ...inv, status: "cancelled" } : inv
        )
      );
      toast.success("Invitation cancelled");
    } catch {
      toast.error("Failed to cancel invitation");
    }
  }

  // ── Copy link ─────────────────────────────────────────────────────────────────
  function copyInviteLink(invId: string) {
    const url = `${window.location.origin}/invite/${invId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(invId);
      toast.success("Link copied");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground">
            Manage pending and sent user invitations.
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} size="sm">
          <Plus className="mr-1.5 size-4" />
          Invite User
        </Button>
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 border-b pb-3">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === "all"
              ? invitations.length
              : invitations.filter((i) => i.status.toLowerCase() === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab}
              <Badge
                variant="secondary"
                className="ml-1.5 h-5 min-w-5 px-1 text-xs"
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4" />
            {statusFilter === "all" ? "All Invitations" : `${statusFilter} Invitations`}
            <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Mail className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {statusFilter === "all"
                  ? "No invitations yet."
                  : `No ${statusFilter} invitations.`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const isPending   = inv.status.toLowerCase() === "pending";
                  const isExpired   = inv.status.toLowerCase() === "expired";
                  const canResend   = isPending || isExpired;
                  const canCancel   = isPending;
                  const canCopyLink = isPending;

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                      <TableCell>
                        <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded">
                          {inv.role_slug}
                        </span>
                      </TableCell>
                      <TableCell>
                        <InviteStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.invited_by ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(inv.expires_at)}</TableCell>
                      <TableCell className="text-xs">{inv.resent_count ?? 0}x</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCopyLink && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 px-2"
                              onClick={() => copyInviteLink(inv.id)}
                            >
                              {copiedId === inv.id ? (
                                <Check className="size-3.5 text-green-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              <span className="sr-only">Copy link</span>
                            </Button>
                          )}
                          {canResend && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 px-2"
                              onClick={() => handleResend(inv.id)}
                            >
                              <Send className="size-3.5" />
                              <span className="sr-only">Resend</span>
                            </Button>
                          )}
                          {canCancel && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="size-3.5" />
                                  <span className="sr-only">Cancel</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The invitation to <strong>{inv.email}</strong> will be
                                    cancelled. They will not be able to sign up using this link.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleCancel(inv.id)}
                                  >
                                    Cancel Invitation
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Invite modal ────────────────────────────────────────────────────── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role *</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {isAffiliate && (
              <div className="space-y-1.5">
                <Label htmlFor="parent-diviner">
                  Parent Diviner <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="parent-diviner"
                  value={parentDiviner}
                  onChange={(e) => setParentDiviner(e.target.value)}
                  placeholder="Diviner user ID or email"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviting || !inviteEmail.trim() || !inviteRole}>
                {inviting ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 size-4" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
