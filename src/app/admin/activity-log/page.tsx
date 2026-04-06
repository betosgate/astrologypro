"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ActivityEntry {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

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

function dateStr(d: string) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(d));
}

function toCSV(entries: ActivityEntry[]): string {
  const headers = ["ID", "Admin", "Target User", "Action", "Details", "IP", "Timestamp"];
  const rows = entries.map((e) => [
    e.id,
    e.admin_user_id,
    e.target_user_id ?? "",
    e.action_type,
    JSON.stringify(e.details),
    e.ip_address ?? "",
    dateStr(e.created_at),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailEntry, setDetailEntry] = useState<ActivityEntry | null>(null);

  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      if (actionFilter && actionFilter !== "all") sp.set("action_type", actionFilter);
      if (dateFrom) sp.set("created_from", dateFrom);
      if (dateTo) sp.set("created_to", dateTo);

      const res = await fetch(`/api/admin/activity-log?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">{total} entries</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={entries.length === 0} className="gap-1.5">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-52">
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
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-9 w-40 text-xs"
          placeholder="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-9 w-40 text-xs"
          placeholder="To date"
        />
        {(dateFrom || dateTo || actionFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setActionFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No entries found</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Admin</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Target User</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Details</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">IP</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Timestamp</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-20">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">
                      {e.admin_user_id}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[140px] hidden md:table-cell">
                      {e.target_user_id ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-xs font-mono">
                        {e.action_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                      {JSON.stringify(e.details)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden xl:table-cell">
                      {e.ip_address ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                      {dateStr(e.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setDetailEntry(e)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailEntry} onOpenChange={(v) => { if (!v) setDetailEntry(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
          </DialogHeader>
          {detailEntry && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-y-2">
                <span className="text-muted-foreground text-xs">Admin</span>
                <span className="col-span-2 text-xs break-all">{detailEntry.admin_user_id}</span>
                <span className="text-muted-foreground text-xs">Target</span>
                <span className="col-span-2 text-xs break-all">{detailEntry.target_user_id ?? "—"}</span>
                <span className="text-muted-foreground text-xs">Action</span>
                <span className="col-span-2"><Badge variant="outline" className="text-xs font-mono">{detailEntry.action_type}</Badge></span>
                <span className="text-muted-foreground text-xs">IP</span>
                <span className="col-span-2 text-xs">{detailEntry.ip_address ?? "—"}</span>
                <span className="text-muted-foreground text-xs">Time</span>
                <span className="col-span-2 text-xs">{dateStr(detailEntry.created_at)}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Details (JSON)</p>
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
