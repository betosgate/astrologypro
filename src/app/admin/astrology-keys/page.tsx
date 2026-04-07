"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Key } from "lucide-react";

type ApiKey = {
  id: string;
  label: string;
  access_key: string;
  secret_key_masked: string;
  is_active: boolean;
  requests_today: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  label: string;
  access_key: string;
  secret_key: string;
};

const EMPTY_FORM: FormState = { label: "", access_key: "", secret_key: "" };

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

export default function AstrologyKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/astrology-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowDialog(true);
  }

  function openEdit(key: ApiKey) {
    setEditingId(key.id);
    setForm({
      label: key.label,
      access_key: key.access_key,
      secret_key: "", // user must re-enter to change
    });
    setError(null);
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.access_key.trim()) {
      setError("Access key is required");
      return;
    }
    if (!editingId && !form.secret_key.trim()) {
      setError("Secret key is required");
      return;
    }

    setSaving(true);
    setError(null);

    if (editingId) {
      // Update
      const payload: Record<string, unknown> = {
        label: form.label || "Default",
        access_key: form.access_key,
      };
      if (form.secret_key.trim()) payload.secret_key = form.secret_key;

      const res = await fetch(`/api/admin/astrology-keys/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to update key");
        setSaving(false);
        return;
      }
    } else {
      // Create
      const res = await fetch("/api/admin/astrology-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label || "Default",
          access_key: form.access_key,
          secret_key: form.secret_key,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to create key");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowDialog(false);
    loadKeys();
  }

  async function handleToggleActive(key: ApiKey) {
    await fetch(`/api/admin/astrology-keys/${key.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !key.is_active }),
    });
    loadKeys();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/astrology-keys/${id}`, { method: "DELETE" });
    loadKeys();
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Astrology API Keys
          </h1>
          <p className="text-muted-foreground">
            Manage API key pairs for json.astrologyapi.com
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 size-4" />
          Add Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">
                No API keys configured yet.
              </p>
              <Button onClick={openAdd}>
                <Plus className="mr-2 size-4" />
                Add your first key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Access Key</TableHead>
                  <TableHead>Secret Key</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Requests Today</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.label}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {key.access_key}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {revealedIds.has(key.id)
                            ? key.secret_key_masked
                            : "************"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-6 p-0"
                          onClick={() => toggleReveal(key.id)}
                        >
                          {revealedIds.has(key.id) ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={() => handleToggleActive(key)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{key.requests_today}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmt(key.last_used_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(key)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{key.label}</strong> ({key.access_key})
                                will be permanently deleted. Astrology API calls
                                will no longer use this key.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(key.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit API Key" : "Add API Key"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-label">Label</Label>
              <Input
                id="key-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Key 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-access">Access Key *</Label>
              <Input
                id="key-access"
                value={form.access_key}
                onChange={(e) =>
                  setForm({ ...form, access_key: e.target.value })
                }
                placeholder="e.g. 645549"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-secret">
                Secret Key {editingId ? "(leave blank to keep current)" : "*"}
              </Label>
              <Input
                id="key-secret"
                type="password"
                value={form.secret_key}
                onChange={(e) =>
                  setForm({ ...form, secret_key: e.target.value })
                }
                placeholder={
                  editingId ? "Leave blank to keep current" : "Enter secret key"
                }
              />
            </div>
            {error && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
