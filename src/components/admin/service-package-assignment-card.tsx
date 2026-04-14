"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PackageOption {
  package_code: string;
  display_name: string;
  is_active: boolean;
}

export function ServicePackageAssignmentCard({
  userId,
  role,
  currentPackageCode,
  packages,
}: {
  userId: string;
  role: "diviner" | "trainee";
  currentPackageCode: string | null;
  packages: PackageOption[];
}) {
  const [value, setValue] = useState(currentPackageCode ?? "both");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/service-package`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          service_package_code: value,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to update service package");
      }

      toast.success("Service package updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Service Package</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Resolved package</Label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent>
              {packages
                .filter((pkg) => pkg.is_active)
                .map((pkg) => (
                  <SelectItem key={pkg.package_code} value={pkg.package_code}>
                    {pkg.display_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          Controls whether this {role} can work with astrology, tarot, or both.
        </div>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Package"}
        </Button>
      </CardContent>
    </Card>
  );
}
