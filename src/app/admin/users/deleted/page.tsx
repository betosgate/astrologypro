"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeletedUser {
  id: string;
  user_id: string;
  original_role: string;
  original_table: string;
  original_data: Record<string, unknown>;
  deleted_by: string;
  deleted_at: string;
  restored_at: string | null;
  restored_by: string | null;
}

function dateStr(d: string) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(d));
}

function extractName(data: Record<string, unknown>, role: string): string {
  if (role === "diviner") return (data.display_name as string) ?? "—";
  if (role === "client" || role === "community") return (data.full_name as string) ?? "—";
  return (data.name as string) ?? "—";
}

function extractEmail(data: Record<string, unknown>): string {
  return (data.email as string) ?? "—";
}

export default function DeletedUsersPage() {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<DeletedUser | null>(null);
  const [isRestoring, startRestoring] = useTransition();

  useEffect(() => {
    fetch("/api/admin/users/deleted-list")
      .then((r) => r.json())
      .then((d) => setDeletedUsers(d.deletedUsers ?? []))
      .catch(() => toast.error("Failed to load deleted users"))
      .finally(() => setLoading(false));
  }, []);

  function handleRestore(record: DeletedUser) {
    startRestoring(async () => {
      try {
        const res = await fetch(`/api/admin/users/${record.user_id}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedRecordId: record.id }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("User restored successfully");
        setDeletedUsers((prev) => prev.filter((u) => u.id !== record.id));
        setRestoreTarget(null);
      } catch {
        toast.error("Failed to restore user");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deleted Users</h1>
          <p className="text-sm text-muted-foreground">Soft-deleted accounts that can be restored</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : deletedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No deleted users</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Deleted By</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Deleted At</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">
                      {extractName(u.original_data, u.original_role)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                      {extractEmail(u.original_data)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="capitalize text-xs">{u.original_role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden lg:table-cell">
                      {u.deleted_by}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden xl:table-cell">
                      {dateStr(u.deleted_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setRestoreTarget(u)}
                      >
                        <RotateCcw className="size-3.5" />
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!restoreTarget} onOpenChange={(v) => { if (!v) setRestoreTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore User?</DialogTitle>
            <DialogDescription>
              This will re-activate{" "}
              <strong>
                {restoreTarget ? extractName(restoreTarget.original_data, restoreTarget.original_role) : ""}
              </strong>{" "}
              and mark their profile as active again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button onClick={() => restoreTarget && handleRestore(restoreTarget)} disabled={isRestoring}>
              {isRestoring && <Loader2 className="mr-2 size-4 animate-spin" />}
              Restore User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
