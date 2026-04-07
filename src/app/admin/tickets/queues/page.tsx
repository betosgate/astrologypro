"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketQueue {
  id: string;
  name: string;
  team_type: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface QueueFormState {
  name: string;
  team_type: string;
  description: string;
}

const EMPTY_FORM: QueueFormState = { name: "", team_type: "", description: "" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketQueuesPage() {
  const [queues, setQueues] = useState<TicketQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<QueueFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editQueue, setEditQueue] = useState<TicketQueue | null>(null);
  const [editForm, setEditForm] = useState<QueueFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Toggle active
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadQueues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ticket-queues?active_only=${showAll ? "false" : "true"}`);
      if (!res.ok) throw new Error("Failed to load queues.");
      const json = await res.json();
      setQueues(json.queues ?? []);
    } catch {
      toast.error("Failed to load queues.");
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    loadQueues();
  }, [loadQueues]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/ticket-queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          team_type: createForm.team_type.trim() || null,
          description: createForm.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create queue.");
      }
      toast.success("Queue created.");
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      await loadQueues();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create queue.");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(queue: TicketQueue) {
    setEditQueue(queue);
    setEditForm({
      name: queue.name,
      team_type: queue.team_type ?? "",
      description: queue.description ?? "",
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editQueue) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ticket-queues/${editQueue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          team_type: editForm.team_type.trim() || null,
          description: editForm.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to update queue.");
      }
      toast.success("Queue updated.");
      setEditQueue(null);
      await loadQueues();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update queue.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(queue: TicketQueue) {
    setTogglingId(queue.id);
    try {
      if (queue.is_active) {
        // Deactivate via DELETE
        const res = await fetch(`/api/admin/ticket-queues/${queue.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail ?? "Failed to deactivate queue.");
        }
        toast.success("Queue deactivated.");
      } else {
        // Reactivate via PATCH
        const res = await fetch(`/api/admin/ticket-queues/${queue.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail ?? "Failed to reactivate queue.");
        }
        toast.success("Queue reactivated.");
      }
      await loadQueues();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update queue.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Tickets
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ticket Queues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure routing queues. Tickets are assigned to queues for team ownership.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Hide Inactive" : "Show All"}
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4 mr-2" />
                New Queue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Queue</DialogTitle>
                <DialogDescription>
                  Add a new routing queue for support or job tickets.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="create-name">Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="e.g. Billing & Payments"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    disabled={creating}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-team">Team Type</Label>
                  <Input
                    id="create-team"
                    placeholder="e.g. finance, support, tech"
                    value={createForm.team_type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, team_type: e.target.value }))}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-desc">Description</Label>
                  <Textarea
                    id="create-desc"
                    placeholder="What types of tickets go here?"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    disabled={creating}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setCreateOpen(false); setCreateForm(EMPTY_FORM); }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating || !createForm.name.trim()}>
                    {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Create Queue
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Queue table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {showAll ? "All Queues" : "Active Queues"}
          </CardTitle>
          <CardDescription>
            {queues.length} queue{queues.length !== 1 ? "s" : ""} shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : queues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No queues found</p>
              <p className="text-sm mt-1">Create your first queue to start routing tickets.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queues.map((queue) => (
                  <TableRow key={queue.id} className={!queue.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{queue.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {queue.team_type ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      <span className="line-clamp-2">{queue.description ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          queue.is_active
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                        }
                      >
                        {queue.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => openEdit(queue)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleToggleActive(queue)}
                          disabled={togglingId === queue.id}
                          title={queue.is_active ? "Deactivate queue" : "Reactivate queue"}
                        >
                          {togglingId === queue.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : queue.is_active ? (
                            <ToggleRight className="size-3.5 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-3.5 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {queue.is_active ? "Deactivate" : "Reactivate"}
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editQueue} onOpenChange={(v) => { if (!v) setEditQueue(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Queue</DialogTitle>
            <DialogDescription>
              Update queue details. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-team">Team Type</Label>
              <Input
                id="edit-team"
                placeholder="e.g. finance, support, tech"
                value={editForm.team_type}
                onChange={(e) => setEditForm((f) => ({ ...f, team_type: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditQueue(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !editForm.name.trim()}>
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
