"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, Trash2, ArrowLeft, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  tradition: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  joined_at: string;
};

type AuditLog = {
  id: string;
  action: string;
  entity_type: string | null;
  user_id: string | null;
  created_at: string;
  diff: Record<string, unknown> | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADITION_BADGE: Record<string, string> = {
  western: "bg-blue-100 text-blue-700 border-blue-200",
  vedic: "bg-orange-100 text-orange-700 border-orange-200",
  hybrid: "bg-violet-100 text-violet-700 border-violet-200",
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  astrologer: "bg-violet-100 text-violet-700 border-violet-200",
  researcher: "bg-blue-100 text-blue-700 border-blue-200",
  editor: "bg-teal-100 text-teal-700 border-teal-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

const VALID_ROLES = ["super_admin", "admin", "astrologer", "researcher", "editor", "viewer"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WorkspaceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite form
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Removing
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/mundane/workspaces/${id}`);
    if (res.ok) {
      const json = await res.json();
      setWorkspace(json.workspace);
      setMembers(json.members ?? []);
    } else {
      setError("Failed to load workspace.");
    }

    // Audit logs
    const auditRes = await fetch(`/api/mundane/workspaces/${id}/audit`);
    if (auditRes.ok) {
      const aj = await auditRes.json();
      setAuditLogs(aj.logs ?? []);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteUserId.trim()) {
      setInviteError("User ID is required.");
      return;
    }
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch(`/api/mundane/workspaces/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: inviteUserId.trim(), role: inviteRole }),
    });

    if (res.ok) {
      setInviteUserId("");
      setInviteRole("viewer");
      setInviteSuccess("Member added successfully.");
      await load();
    } else {
      const json = await res.json().catch(() => ({}));
      setInviteError(json.detail ?? "Failed to invite member.");
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    setRemovingUserId(userId);
    const res = await fetch(`/api/mundane/workspaces/${id}/members/${userId}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) {
      await load();
    }
    setRemovingUserId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Workspace not found."}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/mundane/workspaces"><ArrowLeft className="mr-1.5 size-4" /> Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/mundane/workspaces" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="size-3.5" /> Workspaces
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-indigo-500" />
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1">{workspace.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-xs capitalize ${TRADITION_BADGE[workspace.tradition] ?? ""}`}>
              {workspace.tradition}
            </Badge>
            {!workspace.is_active && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
            )}
            <span className="text-xs text-muted-foreground">Created {formatDate(workspace.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-indigo-500" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">User ID</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Joined</th>
                    <th className="px-4 py-2 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px]">{m.user_id}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className={`text-xs capitalize ${ROLE_BADGE[m.role] ?? ""}`}>
                          {m.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDate(m.joined_at)}</td>
                      <td className="px-4 py-2">
                        {m.user_id !== workspace.owner_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(m.user_id)}
                            disabled={removingUserId === m.user_id}
                            title="Remove member"
                          >
                            {removingUserId === m.user_id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="User ID (UUID)"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                className="flex-1 min-w-[200px] font-mono text-xs"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <Button type="submit" size="sm" disabled={inviting}>
                {inviting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Invite
              </Button>
            </div>
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            {inviteSuccess && <p className="text-sm text-green-600">{inviteSuccess}</p>}
            <p className="text-xs text-muted-foreground">
              Enter the Supabase user UUID of the person to invite.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No audit events yet.</p>
          ) : (
            <div className="divide-y">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-2.5 text-sm flex items-start gap-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                    {formatDateTime(log.created_at)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                    {log.entity_type && (
                      <span className="text-muted-foreground ml-1.5 text-xs">({log.entity_type})</span>
                    )}
                    {log.user_id && (
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">by {log.user_id}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
