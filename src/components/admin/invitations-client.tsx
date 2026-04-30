"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  AdminPagination,
  AdminResetButton,
  AdminSelectionBar,
  AdminTableSearch,
  SortHeader,
  useAdminTableParams,
} from "./admin-table-parts";
import { InvitationDetailSheet } from "./invitation-detail-sheet";
import { ALL_USER_TYPES } from "./user-type-options";

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

export interface InvitationsClientProps {
  invitations: InvitationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: string;
  q: string;
  status: string;
  initialRoleSlug?: string;
}

const STATUS_OPTIONS = ["all", "pending", "accepted", "expired", "cancelled"];

function InviteStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    accepted: "bg-green-500/10 text-green-700 dark:text-green-400",
    expired: "bg-gray-500/10 text-gray-600",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function exportSelectedCsv(invitations: InvitationRow[]) {
  const headers = ["email", "role", "status", "invited_by", "expires_at", "resent_count", "created_at"];
  const rows = invitations.map((invitation) => [
    invitation.email,
    invitation.role_slug,
    invitation.status,
    invitation.invited_by ?? "",
    invitation.expires_at ?? "",
    String(invitation.resent_count ?? 0),
    invitation.created_at,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invitations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function InvitationsClient({
  invitations,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDir,
  q,
  status,
  initialRoleSlug,
}: InvitationsClientProps) {
  const { pushParams, currentSort, currentDir, isPending } = useAdminTableParams({
    sort: sortBy,
    dir: sortDir,
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [parentDiviner, setParentDiviner] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailInvitation, setDetailInvitation] = useState<InvitationRow | null>(null);
  const lockedRole =
    ALL_USER_TYPES.find((role) => role.value === initialRoleSlug) ?? null;
  const lockedRoleId = lockedRole?.value ?? "";

  const selectedRole = ALL_USER_TYPES.find((role) => role.value === inviteRole);
  const isAffiliate =
    selectedRole?.value.toLowerCase().includes("affiliate") ||
    selectedRole?.value.toLowerCase().includes("advocate");

  useEffect(() => {
    if (lockedRoleId) {
      setInviteRole(lockedRoleId);
    }
  }, [lockedRoleId]);

  const allPageIds = invitations.map((invitation) => invitation.id);
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const selectedRows = invitations.filter((invitation) => selectedIds.has(invitation.id));
  const hasActiveFilters = !!(q || (status && status !== "all"));

  function handleSort(column: string) {
    const nextDirection =
      currentSort === column && currentDir === "desc" ? "asc" : "desc";
    pushParams({ sortBy: column, sortDir: nextDirection });
  }

  function handleStatusFilter(value: string) {
    pushParams({ status: value === "all" ? "" : value });
  }

  function handlePageChange(nextPage: number) {
    pushParams({ page: String(nextPage) });
  }

  function handlePageSizeChange(size: string) {
    pushParams({ pageSize: size, page: "1" });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(allPageIds));
      return;
    }
    setSelectedIds(new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim() || !inviteRole) return;
    setInviting(true);
    try {
      const payload: {
        email: string;
        role_slug: string;
        metadata?: Record<string, string>;
      } = {
        email: inviteEmail.trim(),
        role_slug: inviteRole,
      };
      if (isAffiliate && parentDiviner.trim()) {
        payload.metadata = {
          parent_diviner_id: parentDiviner.trim(),
        };
      }

      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to send invitation");
      }

      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole(lockedRoleId);
      setParentDiviner("");
      toast.success("Invitation sent");
      pushParams({ page: "1" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleResend(invitationId: string) {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resend invitation");
      toast.success("Invitation resent");
      pushParams({ page: String(page) });
    } catch {
      toast.error("Failed to resend invitation");
    }
  }

  async function handleCancel(invitationId: string) {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!response.ok) throw new Error("Failed to cancel invitation");
      toast.success("Invitation cancelled");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(invitationId);
        return next;
      });
      pushParams({ page: String(page) });
    } catch {
      toast.error("Failed to cancel invitation");
    }
  }

  function copyInviteLink(invitationId: string) {
    const url = `${window.location.origin}/invite/${invitationId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(invitationId);
      toast.success("Link copied");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
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

      <AdminSelectionBar
        count={selectedIds.size}
        label="invitation(s) selected"
        onClear={() => setSelectedIds(new Set())}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportSelectedCsv(selectedRows)}
          >
            Export Selected CSV
          </Button>
        }
      />

      <Card className="relative">
        {isPending ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Invitations
            <Badge variant="secondary">{total}</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-[320px]">
              <AdminTableSearch
                defaultValue={q}
                onSearch={(value) => pushParams({ q: value })}
                placeholder="Search email, role, inviter..."
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-md border p-1">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleStatusFilter(option)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    status === option
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <AdminResetButton
              hasActiveFilters={hasActiveFilters}
              onReset={() => pushParams({ q: "", status: "", sortBy: "", sortDir: "" })}
            />
          </div>

          {invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Mail className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No invitations found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => toggleAll(checked === true)}
                          aria-label="Select all invitations on this page"
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Email"
                          column="email"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Role"
                          column="role_slug"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Invited By"
                          column="invited_by"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Expires"
                          column="expires_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Sent"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => {
                      const normalizedStatus = invitation.status.toLowerCase();
                      const canResend = normalizedStatus === "pending" || normalizedStatus === "expired";
                      const canCancel = normalizedStatus === "pending";
                      const canCopyLink = normalizedStatus === "pending";

                      return (
                        <TableRow key={invitation.id} data-selected={selectedIds.has(invitation.id) ? "true" : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(invitation.id)}
                              onCheckedChange={(checked) => toggleOne(invitation.id, checked === true)}
                              aria-label={`Select invitation ${invitation.email}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{invitation.email}</TableCell>
                          <TableCell>
                            <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                              {invitation.role_slug}
                            </span>
                          </TableCell>
                          <TableCell>
                            <InviteStatusBadge status={invitation.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {invitation.invited_by ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">{fmtDate(invitation.expires_at)}</TableCell>
                          <TableCell className="text-xs">{fmtDate(invitation.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Invitation actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setDetailInvitation(invitation)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="size-3.5" />
                                  View Details
                                </DropdownMenuItem>
                                {canCopyLink ? (
                                  <DropdownMenuItem
                                    onClick={() => copyInviteLink(invitation.id)}
                                    className="flex items-center gap-2"
                                  >
                                    {copiedId === invitation.id ? (
                                      <Check className="size-3.5 text-green-600" />
                                    ) : (
                                      <Copy className="size-3.5" />
                                    )}
                                    Copy Link
                                  </DropdownMenuItem>
                                ) : null}
                                {canResend ? (
                                  <DropdownMenuItem
                                    onClick={() => handleResend(invitation.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <Send className="size-3.5" />
                                    Resend
                                  </DropdownMenuItem>
                                ) : null}
                                {canCancel ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(event) => event.preventDefault()}
                                          className="flex items-center gap-2 text-red-600"
                                        >
                                          <X className="size-3.5" />
                                          Cancel Invitation
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            The invitation to <strong>{invitation.email}</strong> will be cancelled.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Keep</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => handleCancel(invitation.id)}
                                          >
                                            Cancel Invitation
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isPending={isPending}
              />
            </>
          )}
        </CardContent>
      </Card>

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
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role *</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                required
                disabled={!!lockedRoleId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a role…</option>
                {ALL_USER_TYPES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {isAffiliate ? (
              <div className="space-y-1.5">
                <Label htmlFor="parent-diviner">
                  Parent Diviner <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="parent-diviner"
                  value={parentDiviner}
                  onChange={(event) => setParentDiviner(event.target.value)}
                  placeholder="Diviner user ID or email"
                />
              </div>
            ) : null}

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

      <InvitationDetailSheet
        invitation={detailInvitation}
        open={!!detailInvitation}
        onClose={() => setDetailInvitation(null)}
      />
    </div>
  );
}
