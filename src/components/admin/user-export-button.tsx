"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserExportFilters {
  q?: string;
  role?: string;
  status?: string;
  joinedFrom?: string;
  joinedTo?: string;
  loginFrom?: string;
  loginTo?: string;
}

export interface UserExportButtonProps {
  filters?: UserExportFilters;
  /** Label override. Defaults to "Export CSV" */
  label?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function UserExportButton({
  filters = {},
  label = "Export CSV",
}: UserExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Build query string from current filters
      const params = new URLSearchParams();
      if (filters.q)          params.set("q", filters.q);
      if (filters.role)       params.set("role", filters.role);
      if (filters.status)     params.set("status", filters.status);
      if (filters.joinedFrom) params.set("joinedFrom", filters.joinedFrom);
      if (filters.joinedTo)   params.set("joinedTo", filters.joinedTo);
      if (filters.loginFrom)  params.set("loginFrom", filters.loginFrom);
      if (filters.loginTo)    params.set("loginTo", filters.loginTo);

      const url = `/api/admin/users/export?${params.toString()}`;
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Export failed");
      }

      // Trigger file download
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      a.href = objectUrl;
      a.download = `users-export-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      toast.success("CSV exported");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 size-4" />
      )}
      {label}
    </Button>
  );
}
