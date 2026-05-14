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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Save,
} from "lucide-react";

type SettingType = "ASTROLOGY_API" | "FREEASTROLOGY_API" | "SYSTEM_CONFIG";

interface Setting {
  id: string;
  type: SettingType;
  key_name: string;
  key_value: string;
  secret_value: string | null;
  status: "active" | "inactive";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<SettingType, string> = {
  ASTROLOGY_API: "ASTROLOGY_API (key + secret pair)",
  FREEASTROLOGY_API: "FREEASTROLOGY_API (key only)",
  SYSTEM_CONFIG: "SYSTEM_CONFIG (URL / scalar value)",
};

const TYPE_BADGE: Record<SettingType, string> = {
  ASTROLOGY_API: "bg-violet-500/15 text-violet-700 border-violet-500/30",
  FREEASTROLOGY_API: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  SYSTEM_CONFIG: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

function maskValue(v: string | null | undefined, show: boolean): string {
  if (!v) return "—";
  if (show) return v;
  if (v.length <= 6) return "•".repeat(v.length);
  return v.slice(0, 3) + "•".repeat(Math.min(v.length - 6, 12)) + v.slice(-3);
}

export default function AstroSystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Setting | null>(null);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<SettingType>("ASTROLOGY_API");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/astro-system-settings");
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setSettings((body.settings as Setting[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStatus(s: Setting) {
    setSavingId(s.id);
    try {
      const next = s.status === "active" ? "inactive" : "active";
      const r = await fetch(`/api/admin/astro-system-settings/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${r.status}`);
      }
      setSettings((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, status: next } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteSetting() {
    if (!deleteTarget) return;

    setSavingId(deleteTarget.id);
    try {
      const r = await fetch(
        `/api/admin/astro-system-settings/${deleteTarget.id}`,
        {
        method: "DELETE",
        },
      );
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${r.status}`);
      }
      setSettings((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const payload: Record<string, unknown> = {
        type: newType,
        key_name: newKeyName.trim(),
        key_value: newKeyValue.trim(),
        notes: newNotes.trim() || undefined,
      };
      if (newType === "ASTROLOGY_API") {
        payload.secret_value = newSecretValue.trim();
      }
      const r = await fetch("/api/admin/astro-system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await r.json();
      if (!r.ok) {
        throw new Error(body.error ?? `HTTP ${r.status}`);
      }
      setSettings((prev) => [...prev, body.setting as Setting]);
      setShowAdd(false);
      setNewKeyName("");
      setNewKeyValue("");
      setNewSecretValue("");
      setNewNotes("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  const grouped: Record<SettingType, Setting[]> = {
    ASTROLOGY_API: [],
    FREEASTROLOGY_API: [],
    SYSTEM_CONFIG: [],
  };
  for (const s of settings) grouped[s.type].push(s);

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Astro System Setting"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.type} / ${deleteTarget.key_name}? This cannot be undone.`
            : "Are you sure you want to delete this setting?"
        }
        confirmLabel="Delete"
        loading={!!deleteTarget && savingId === deleteTarget.id}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open && (!deleteTarget || savingId !== deleteTarget.id)) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void deleteSetting();
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Key className="size-7 text-primary mt-1" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Astro System Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Centralised store for astrology API credentials and system
              configuration. Three types: <code>ASTROLOGY_API</code> (key +
              secret), <code>FREEASTROLOGY_API</code> (key only),{" "}
              <code>SYSTEM_CONFIG</code> (URLs / scalar values).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCcw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            Reload
          </Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="mr-2 size-4" />
            Add setting
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Failed to load
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      {showAdd && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Add a new setting</CardTitle>
            <CardDescription className="text-xs">
              The combination of <code>type</code> and <code>key_name</code>{" "}
              must be unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-type">Type</Label>
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as SettingType)}
                  >
                    <SelectTrigger id="new-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABELS) as SettingType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-key-name">key_name</Label>
                  <Input
                    id="new-key-name"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={
                      newType === "SYSTEM_CONFIG"
                        ? "ASTRO_AI_API_URL"
                        : "Key 1"
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-key-value">
                  key_value{" "}
                  {newType === "SYSTEM_CONFIG"
                    ? "(URL or scalar value)"
                    : newType === "ASTROLOGY_API"
                      ? "(access_key)"
                      : "(API key)"}
                </Label>
                <Input
                  id="new-key-value"
                  required
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                />
              </div>
              {newType === "ASTROLOGY_API" && (
                <div className="space-y-1.5">
                  <Label htmlFor="new-secret-value">
                    secret_value (secret_key)
                  </Label>
                  <Input
                    id="new-secret-value"
                    type="password"
                    autoComplete="off"
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="new-notes">Notes (optional)</Label>
                <Textarea
                  id="new-notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                />
              </div>
              {addError && (
                <p className="text-sm text-destructive" role="alert">
                  {addError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={adding}>
                  {adding && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  <Save className="mr-2 size-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAdd(false);
                    setAddError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grouped lists */}
      {(Object.keys(grouped) as SettingType[]).map((type) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
              <Badge variant="outline" className={TYPE_BADGE[type]}>
                {grouped[type].length} row
                {grouped[type].length === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {grouped[type].length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No entries yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">key_name</th>
                      <th className="py-2 pr-3">key_value</th>
                      {type === "ASTROLOGY_API" && (
                        <th className="py-2 pr-3">secret_value</th>
                      )}
                      <th className="py-2 pr-3">status</th>
                      <th className="py-2 pr-3">updated</th>
                      <th className="py-2 text-right">actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[type].map((s) => {
                      const isRevealed = revealed[s.id] ?? false;
                      return (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">
                            {s.key_name}
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs break-all">
                            {maskValue(s.key_value, isRevealed)}
                          </td>
                          {type === "ASTROLOGY_API" && (
                            <td className="py-2 pr-3 font-mono text-xs break-all">
                              {maskValue(s.secret_value, isRevealed)}
                            </td>
                          )}
                          <td className="py-2 pr-3">
                            <Badge
                              variant="outline"
                              className={
                                s.status === "active"
                                  ? "border-emerald-500/40 text-emerald-700"
                                  : "border-muted-foreground/40 text-muted-foreground"
                              }
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">
                            {new Date(s.updated_at).toLocaleString()}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() =>
                                  setRevealed((prev) => ({
                                    ...prev,
                                    [s.id]: !isRevealed,
                                  }))
                                }
                                aria-label={isRevealed ? "Hide" : "Reveal"}
                              >
                                {isRevealed ? (
                                  <EyeOff className="size-3.5" />
                                ) : (
                                  <Eye className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={savingId === s.id}
                                onClick={() => void toggleStatus(s)}
                              >
                                {savingId === s.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : s.status === "active" ? (
                                  "Deactivate"
                                ) : (
                                  "Activate"
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                disabled={savingId === s.id}
                                onClick={() => setDeleteTarget(s)}
                                aria-label="Delete"
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
      ))}
    </div>
  );
}
