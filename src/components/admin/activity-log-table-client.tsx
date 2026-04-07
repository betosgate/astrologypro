"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, Eye, FileText } from "lucide-react";
import {
  SortHeader,
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLogEntry = {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

interface ActivityLogTableClientProps {
  entries: ActivityLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: string;
  q: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_TYPES = [
  "all",
  "soft_delete",
  "restore_user",
  "change_role",
  "force_set_password",
  "update_training_status",
  "block",
  "unblock",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

function toCSV(entries: ActivityLogEntry[]): string {
  const headers = [
    "ID",
    "Admin",
    "Target User",
    "Action",
    "Details",
    "IP",
    "Timestamp",
  ];
  const rows = entries.map((e) => [
    e.id,
    e.admin_user_id,
    e.target_user_id ?? "",
    e.action_type,
    JSON.stringify(e.details),
    e.ip_address ?? "",
    fmtDate(e.created_at),
  ]);
  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityLogTableClient({
  entries,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDir,
  q,
  action,
  dateFrom,
  dateTo,
}: ActivityLogTableClientProps) {
  const { pushParams, currentSort, currentDir, isPending } =
    useAdminTableParams({ sort: sortBy, dir: sortDir });

  const [detailEntry, setDetailEntry] = useState<ActivityLogEntry | null>(null);

  const hasActiveFilters = !!(
    q ||
    (action && action !== "all") ||
    dateFrom ||
    dateTo
  );

  function handleSort(col: string) {
    const newDir =
      currentSort === col && currentDir === "desc" ? "asc" : "desc";
    pushParams({ sortBy: col, sortDir: newDir });
  }

  function handlePageChange(p: number) {
    pushParams({ page: String(p) });
  }

  function handlePageSizeChange(size: string) {
    pushParams({ pageSize: size, page: "1" });
  }

  function handleSearch(value: string) {
    pushParams({ q: value, page: "1" });
  }

  function handleActionFilter(value: string) {
    pushParams({ action: value === "all" ? "" : value, page: "1" });
  }

  function handleReset() {
    pushParams({
      q: "",
      action: "",
      dateFrom: "",
      dateTo: "",
      page: "1",
      sortBy: "",
      sortDir: "",
    });
  }

  function handleExportCSV() {
    const csv = toCSV(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Admin action audit trail.{" "}
            {total > 0 ? `${total} entries.` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          className="gap-1.5"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <AdminTableSearch
                defaultValue={q}
                onSearch={handleSearch}
                placeholder="Search admin, target, details..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="actionFilter" className="text-xs">
                Action type
              </Label>
              <Select
                value={action || "all"}
                onValueChange={handleActionFilter}
              >
                <SelectTrigger id="actionFilter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "all" ? "All Actions" : t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-xs">
                From date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                defaultValue={dateFrom}
                onChange={(e) =>
                  pushParams({ dateFrom: e.target.value, page: "1" })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-xs">
                To date
              </Label>
              <Input
                id="dateTo"
                type="date"
                defaultValue={dateTo}
                onChange={(e) =>
                  pushParams({ dateTo: e.target.value, page: "1" })
                }
              />
            </div>

            <div className="flex items-end">
              <AdminResetButton
                hasActiveFilters={hasActiveFilters}
                onReset={handleReset}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table or empty state */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No activity log entries found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Page {page} — {entries.length} of {total} entries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs">
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Admin"
                          column="admin_user_id"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">
                        <SortHeader
                          label="Target"
                          column="target_user_id"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Action"
                          column="action_type"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left hidden lg:table-cell">
                        <SortHeader
                          label="IP"
                          column="ip_address"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left hidden xl:table-cell">
                        <SortHeader
                          label="Timestamp"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[160px]">
                          {e.admin_user_id}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[160px] hidden md:table-cell">
                          {e.target_user_id ?? (
                            <span className="opacity-40">{"\u2014"}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {e.action_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground hidden lg:table-cell">
                          {e.ip_address ?? (
                            <span className="opacity-40">{"\u2014"}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                          {fmtDate(e.created_at)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Entry actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailEntry(e)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="size-3.5" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isPending={isPending}
          />
        </>
      )}

      {/* Detail dialog */}
      <Dialog
        open={!!detailEntry}
        onOpenChange={(v) => {
          if (!v) setDetailEntry(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
          </DialogHeader>
          {detailEntry && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-y-2">
                <span className="text-muted-foreground text-xs">Admin</span>
                <span className="col-span-2 text-xs break-all">
                  {detailEntry.admin_user_id}
                </span>
                <span className="text-muted-foreground text-xs">Target</span>
                <span className="col-span-2 text-xs break-all">
                  {detailEntry.target_user_id ?? "\u2014"}
                </span>
                <span className="text-muted-foreground text-xs">Action</span>
                <span className="col-span-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {detailEntry.action_type}
                  </Badge>
                </span>
                <span className="text-muted-foreground text-xs">IP</span>
                <span className="col-span-2 text-xs">
                  {detailEntry.ip_address ?? "\u2014"}
                </span>
                <span className="text-muted-foreground text-xs">Time</span>
                <span className="col-span-2 text-xs">
                  {fmtDate(detailEntry.created_at)}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Details (JSON)
                </p>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {JSON.stringify(detailEntry.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
