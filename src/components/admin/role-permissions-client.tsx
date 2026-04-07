"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Loader2, Info } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PermissionRow {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  status?: string;
  is_system?: boolean;
  user_count?: number;
}

export interface RolePermissionsClientProps {
  role: RoleDetail;
  allPermissions: PermissionRow[];
  grantedCodes: string[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RolePermissionsClient({
  role,
  allPermissions,
  grantedCodes: initialGrantedCodes,
}: RolePermissionsClientProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set(initialGrantedCodes));
  const [saving, setSaving] = useState(false);

  // Group permissions by module
  const byModule = useMemo(() => {
    const map: Record<string, PermissionRow[]> = {};
    for (const p of allPermissions) {
      const mod = p.module || "Other";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return map;
  }, [allPermissions]);

  const modules = Object.keys(byModule).sort();

  function toggle(code: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAll(module: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const p of byModule[module] ?? []) next.add(p.code);
      return next;
    });
  }

  function deselectAll(module: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const p of byModule[module] ?? []) next.delete(p.code);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: [...checked] }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to save permissions");
      }
      toast.success("Permissions saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const isSystem = !!role.is_system;

  return (
    <div className="space-y-6">
      {/* ── Role header ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold tracking-tight">{role.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Slug: <code className="text-xs bg-muted px-1 rounded">{role.slug}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role.status && (
                <Badge
                  variant="outline"
                  className={
                    role.status === "active"
                      ? "bg-green-500/10 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {role.status}
                </Badge>
              )}
              {isSystem && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                  System Role
                </Badge>
              )}
              {role.user_count !== undefined && (
                <Badge variant="secondary">{role.user_count} users</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── System role notice ───────────────────────────────────────────── */}
      {isSystem && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            System roles cannot be modified. Permissions shown below are read-only.
          </p>
        </div>
      )}

      {/* ── Warning if has users ─────────────────────────────────────────── */}
      {!isSystem && (role.user_count ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Changes will affect all <strong>{role.user_count}</strong> users with this role.
          </p>
        </div>
      )}

      {/* ── Permission matrix ────────────────────────────────────────────── */}
      {allPermissions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="mx-auto size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No permissions defined yet. Add permissions to the permissions table first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => {
            const perms = byModule[mod] ?? [];
            const allChecked = perms.every((p) => checked.has(p.code));
            const noneChecked = perms.every((p) => !checked.has(p.code));

            return (
              <Card key={mod}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {mod}
                    </CardTitle>
                    {!isSystem && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          onClick={() => selectAll(mod)}
                          disabled={allChecked}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          onClick={() => deselectAll(mod)}
                          disabled={noneChecked}
                        >
                          Deselect All
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perms.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={checked.has(p.code)}
                              onChange={() => !isSystem && toggle(p.code)}
                              disabled={isSystem}
                              className="size-4 rounded border-input"
                              aria-label={`Toggle ${p.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{p.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {p.code}
                            </code>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.description ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Save button ──────────────────────────────────────────────────── */}
      {!isSystem && allPermissions.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Shield className="mr-2 size-4" />
            )}
            Save Permissions
          </Button>
        </div>
      )}
    </div>
  );
}
