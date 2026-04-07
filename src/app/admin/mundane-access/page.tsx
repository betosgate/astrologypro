"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Trash2, Shield, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AccessRow = {
  id: string;
  user_id: string;
  user_email: string;
  access_level: "read" | "write";
  granted_by: string | null;
  granted_by_email: string | null;
  granted_at: string;
  notes: string | null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MundaneAccessPage() {
  const [access, setAccess] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Grant form
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"read" | "write">("read");
  const [notes, setNotes] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  async function loadAccess() {
    setLoading(true);
    const res = await fetch("/api/admin/mundane-access");
    if (res.ok) {
      const json = await res.json();
      setAccess(json.access ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadAccess(); }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setGrantError(null);
    setGranting(true);

    try {
      const res = await fetch("/api/admin/mundane-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, access_level: accessLevel, notes: notes || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to grant access");
      }
      setDialogOpen(false);
      setEmail("");
      setAccessLevel("read");
      setNotes("");
      await loadAccess();
    } catch (err: unknown) {
      setGrantError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/admin/mundane-access/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAccess((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mundane Astrology Access</h1>
          <p className="text-muted-foreground">
            Manage user access to mundane astrology features.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-4" /> Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Mundane Access</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGrant} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="grant_email">User Email *</Label>
                <Input
                  id="grant_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Access Level</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="access_level"
                      value="read"
                      checked={accessLevel === "read"}
                      onChange={() => setAccessLevel("read")}
                      className="size-4"
                    />
                    Read — View ingress charts
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="access_level"
                      value="write"
                      checked={accessLevel === "write"}
                      onChange={() => setAccessLevel("write")}
                      className="size-4"
                    />
                    Write — Full access
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grant_notes">Notes (optional)</Label>
                <Input
                  id="grant_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for granting access"
                />
              </div>

              {grantError && (
                <p className="text-sm text-destructive">{grantError}</p>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={granting}>
                  {granting ? "Granting…" : "Grant Access"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table / list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : access.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Shield className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No access grants yet</p>
            <p className="text-sm text-muted-foreground">
              Use &ldquo;Grant Access&rdquo; to give users access to mundane astrology features.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{access.length} user{access.length !== 1 ? "s" : ""} with access</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      User Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Access Level
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Granted By
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Granted At
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Notes
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {access.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.user_email || row.user_id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={row.access_level === "write" ? "default" : "outline"}
                          className="capitalize"
                        >
                          {row.access_level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.granted_by_email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.granted_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {row.notes ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Revoke</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove mundane astrology access for{" "}
                                <strong>{row.user_email}</strong>. They will no longer be able to
                                access ingress charts.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevoke(row.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
