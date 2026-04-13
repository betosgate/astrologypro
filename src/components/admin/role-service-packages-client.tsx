"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminRoleServicePackageRow {
  package_code: string;
  display_name: string;
  description: string | null;
  allows_astrology: boolean;
  allows_tarot: boolean;
  default_for_roles: string[];
  is_active: boolean;
  sort_order: number;
}

export function RoleServicePackagesClient({
  initialPackages,
}: {
  initialPackages: AdminRoleServicePackageRow[];
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  function updateLocal(
    packageCode: string,
    patch: Partial<AdminRoleServicePackageRow>,
  ) {
    setPackages((current) =>
      current.map((pkg) =>
        pkg.package_code === packageCode ? { ...pkg, ...patch } : pkg,
      ),
    );
  }

  async function savePackage(pkg: AdminRoleServicePackageRow) {
    setSavingCode(pkg.package_code);
    try {
      const res = await fetch("/api/admin/role-service-packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_code: pkg.package_code,
          display_name: pkg.display_name,
          description: pkg.description,
          is_active: pkg.is_active,
          sort_order: pkg.sort_order,
          default_for_roles: pkg.default_for_roles,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save package");
      }

      toast.success(`${pkg.display_name} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Service Packages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          These packages define whether diviners and trainees can work with
          astrology, tarot, or both service categories.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead>Defaults</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Save</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.package_code}>
                <TableCell className="space-y-2 align-top">
                  <div>
                    <Label htmlFor={`pkg-name-${pkg.package_code}`}>Display name</Label>
                    <Input
                      id={`pkg-name-${pkg.package_code}`}
                      value={pkg.display_name}
                      onChange={(event) =>
                        updateLocal(pkg.package_code, {
                          display_name: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`pkg-desc-${pkg.package_code}`}>Description</Label>
                    <Input
                      id={`pkg-desc-${pkg.package_code}`}
                      value={pkg.description ?? ""}
                      onChange={(event) =>
                        updateLocal(pkg.package_code, {
                          description: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {pkg.package_code}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap gap-2">
                    {pkg.allows_astrology && <Badge variant="secondary">Astrology</Badge>}
                    {pkg.allows_tarot && <Badge variant="secondary">Tarot</Badge>}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={pkg.default_for_roles.includes("diviner")}
                        onCheckedChange={(checked) =>
                          updateLocal(pkg.package_code, {
                            default_for_roles: checked
                              ? Array.from(new Set([...pkg.default_for_roles, "diviner"]))
                              : pkg.default_for_roles.filter((role) => role !== "diviner"),
                          })
                        }
                      />
                      Diviner default
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={pkg.default_for_roles.includes("trainee")}
                        onCheckedChange={(checked) =>
                          updateLocal(pkg.package_code, {
                            default_for_roles: checked
                              ? Array.from(new Set([...pkg.default_for_roles, "trainee"]))
                              : pkg.default_for_roles.filter((role) => role !== "trainee"),
                          })
                        }
                      />
                      Trainee default
                    </label>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={(checked) =>
                        updateLocal(pkg.package_code, { is_active: checked })
                      }
                    />
                    {pkg.is_active ? "Active" : "Inactive"}
                  </label>
                </TableCell>
                <TableCell className="text-right align-top">
                  <Button
                    size="sm"
                    onClick={() => savePackage(pkg)}
                    disabled={savingCode === pkg.package_code}
                  >
                    {savingCode === pkg.package_code ? "Saving..." : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
