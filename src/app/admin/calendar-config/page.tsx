"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CredentialRow {
  id: string;
  key: string;
  /** Masked by default. When value_masked is false, this is the raw value. */
  value: string;
  value_masked: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type Provider = "google" | "microsoft";

const PROVIDER_LABEL: Record<Provider, string> = {
  google: "Google Calendar",
  microsoft: "Microsoft Calendar",
};

const PROVIDER_WELL_KNOWN_KEYS: Record<Provider, string[]> = {
  google: ["client_id", "client_secret", "redirect_uri"],
  microsoft: ["client_id", "client_secret", "redirect_uri", "tenant_id"],
};

const PROVIDER_DEFAULT_DESCRIPTION: Record<string, string> = {
  client_id: "OAuth client / application ID issued by the provider.",
  client_secret: "OAuth client secret — keep private.",
  redirect_uri: "OAuth callback URL registered with the provider.",
  tenant_id: "Microsoft tenant — use 'common' for multi-tenant apps.",
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CalendarConfigPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="size-6 text-primary" />
          Calendar Config
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage the OAuth client credentials used by the Google and
          Microsoft calendar integrations. Values are masked by default —
          click the eye icon to reveal.
        </p>
      </div>

      <ProviderPanel provider="google" />
      <ProviderPanel provider="microsoft" />
    </div>
  );
}

// ─── Provider panel ────────────────────────────────────────────────────────

function ProviderPanel({ provider }: { provider: Provider }) {
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CredentialRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CredentialRow | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const basePath = `/api/admin/calendar-config/${provider}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(basePath);
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows(body.rows ?? []);
      setRevealedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReveal(row: CredentialRow) {
    if (revealedIds.has(row.id)) {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      // Switch the displayed row back to masked by refetching just the list.
      // Simpler: overwrite the value from the current row by re-fetching the
      // full list, which returns masked values.
      load();
      return;
    }
    try {
      const res = await fetch(`${basePath}/${row.id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, value: body.row.value, value_masked: false }
            : r,
        ),
      );
      setRevealedIds((prev) => new Set(prev).add(row.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reveal");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${basePath}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success(`Deleted ${deleteTarget.key}.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const missingWellKnown = PROVIDER_WELL_KNOWN_KEYS[provider].filter(
    (k) => !rows.some((r) => r.key.toLowerCase() === k && r.is_active),
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{PROVIDER_LABEL[provider]}</CardTitle>
            <CardDescription>
              {rows.length} credential{rows.length === 1 ? "" : "s"} stored
              for this provider. The runtime reads from here first, then
              falls back to environment variables if no active row exists
              for a key.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingRow(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add credential
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {missingWellKnown.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold">
                Missing well-known keys:{" "}
                <span className="font-mono">
                  {missingWellKnown.join(", ")}
                </span>
              </p>
              <p className="mt-1">
                The runtime will fall back to the matching environment
                variables for these until you add them here.
              </p>
            </div>
          )}

          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : "No credentials saved yet. The runtime is using env vars."}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Key</th>
                    <th className="px-3 py-2 text-left font-medium">Value</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isRevealed = revealedIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-2 font-mono text-xs">
                          {row.key}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs max-w-xs truncate">
                          {row.value || (
                            <span className="text-muted-foreground italic">
                              (empty)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate">
                          {row.description ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={
                              row.is_active
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : "bg-red-500/10 text-red-500 border-red-500/30"
                            }
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleReveal(row)}
                              title={isRevealed ? "Hide value" : "Reveal value"}
                            >
                              {isRevealed ? (
                                <EyeOff className="size-3.5" />
                              ) : (
                                <Eye className="size-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => {
                                setEditingRow(row);
                                setDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(row)}
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CredentialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={provider}
        basePath={basePath}
        editingRow={editingRow}
        onSaved={() => {
          setDialogOpen(false);
          setEditingRow(null);
          load();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete credential {deleteTarget?.key}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the row. The runtime will fall back
              to the corresponding environment variable for this key (if
              one is set). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Create/edit dialog ────────────────────────────────────────────────────

function CredentialDialog({
  open,
  onOpenChange,
  provider,
  basePath,
  editingRow,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  provider: Provider;
  basePath: string;
  editingRow: CredentialRow | null;
  onSaved: () => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset / populate when the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editingRow) {
      setKey(editingRow.key);
      // When editing, fetch the raw value from the single-row endpoint so
      // the user can see what they're editing instead of the mask.
      setValue("");
      fetch(`${basePath}/${editingRow.id}`)
        .then((r) => r.json())
        .then((body) => {
          if (body.row?.value !== undefined) setValue(body.row.value);
        })
        .catch(() => undefined);
      setDescription(editingRow.description ?? "");
      setIsActive(editingRow.is_active);
    } else {
      setKey("");
      setValue("");
      setDescription("");
      setIsActive(true);
    }
    setShowValue(false);
  }, [open, editingRow, basePath]);

  async function handleSave() {
    if (!key.trim()) {
      toast.error("Key is required.");
      return;
    }
    setSaving(true);
    try {
      const url = editingRow ? `${basePath}/${editingRow.id}` : basePath;
      const method = editingRow ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: key.trim(),
          value,
          description: description.trim() || null,
          is_active: isActive,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success(editingRow ? "Credential updated." : "Credential added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const wellKnownKeys = PROVIDER_WELL_KNOWN_KEYS[provider];
  const suggestedDescription =
    PROVIDER_DEFAULT_DESCRIPTION[key.trim().toLowerCase()] ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingRow ? "Edit credential" : "Add credential"}
          </DialogTitle>
          <DialogDescription>
            {PROVIDER_LABEL[provider]}. Well-known keys:{" "}
            <span className="font-mono text-xs">
              {wellKnownKeys.join(", ")}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cred-key">Key</Label>
            <Input
              id="cred-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="client_id"
              list={`wellknown-${provider}`}
            />
            <datalist id={`wellknown-${provider}`}>
              {wellKnownKeys.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-value" className="flex items-center justify-between">
              <span>Value</span>
              <button
                type="button"
                onClick={() => setShowValue((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showValue ? "Hide" : "Show"}
              </button>
            </Label>
            <Input
              id="cred-value"
              type={showValue ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste credential value here"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-desc">
              Description{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="cred-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={suggestedDescription}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="cred-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 cursor-pointer accent-primary"
            />
            <Label htmlFor="cred-active" className="cursor-pointer">
              Active — include in runtime credential lookup
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editingRow ? "Save changes" : "Add credential"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
