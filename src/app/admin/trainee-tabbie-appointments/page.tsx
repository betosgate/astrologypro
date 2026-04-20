"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface TraineeSummary {
  id: string;
  name: string;
  username: string;
  training_status: string;
  graduated_at: string | null;
  tabbie_appointment_required: boolean;
  tabbie_appointment_status: string;
  tabbie_appointment_completed: boolean;
  tabbie_appointment_completed_at: string | null;
  tabbie_appointment_sync_status: string | null;
  tabbie_appointment_last_synced_at: string | null;
  user_id: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "not_required", label: "Not Required" },
  { value: "eligible_to_book", label: "Eligible to Book" },
  { value: "booking_in_progress", label: "Booking In Progress" },
  { value: "booked", label: "Booked" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
  { value: "manually_completed", label: "Manually Completed" },
  { value: "manually_cancelled", label: "Manually Cancelled" },
];

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
    case "manually_completed":
      return "default";
    case "booked":
    case "booking_in_progress":
      return "secondary";
    case "cancelled":
    case "manually_cancelled":
    case "no_show":
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default function TabbieAppointmentMonitoringPage() {
  const [trainees, setTrainees] = useState<TraineeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // Override modal
  const [overrideTarget, setOverrideTarget] = useState<TraineeSummary | null>(null);
  const [overrideAction, setOverrideAction] = useState<string>("mark_completed");
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchTrainees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/admin/tabbie-appointments?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.error ?? "Failed to load");
      setTrainees(json.data ?? []);
      setTotal(json.total ?? 0);
      setPages(json.pages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  async function handleOverride() {
    if (!overrideTarget || !overrideReason.trim()) return;
    setOverriding(true);
    setOverrideError(null);
    setOverrideSuccess(false);
    try {
      const res = await fetch(`/api/admin/tabbie-appointments/${overrideTarget.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: overrideAction, reason: overrideReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.error ?? "Override failed");
      setOverrideSuccess(true);
      await fetchTrainees();
      setTimeout(() => {
        setOverrideTarget(null);
        setOverrideReason("");
        setOverrideSuccess(false);
      }, 1500);
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setOverriding(false);
    }
  }

  async function handleSync(traineeId: string) {
    setSyncing(traineeId);
    try {
      await fetch(`/api/admin/tabbie-appointments/${traineeId}/sync`, { method: "POST" });
      await fetchTrainees();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tabbie Appointment Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track post-training appointment status for all trainees.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchTrainees()} disabled={loading} className="gap-2">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or username…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary row */}
      <p className="text-sm text-muted-foreground">{total} trainee{total !== 1 ? "s" : ""} found</p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Trainee Appointment Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">Trainee</th>
                  <th className="px-4 py-3 text-left font-medium">Training</th>
                  <th className="px-4 py-3 text-left font-medium">Appointment Status</th>
                  <th className="px-4 py-3 text-left font-medium">Completed</th>
                  <th className="px-4 py-3 text-left font-medium">Sync</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loading && trainees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No trainees found matching filters.
                    </td>
                  </tr>
                )}
                {!loading && trainees.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">@{t.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={t.training_status === "graduated" ? "default" : "secondary"} className="text-xs">
                        {t.training_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(t.tabbie_appointment_status)} className="text-xs">
                        {t.tabbie_appointment_status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {t.tabbie_appointment_completed ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="size-3.5" />
                          {t.tabbie_appointment_completed_at
                            ? new Date(t.tabbie_appointment_completed_at).toLocaleDateString("en-US")
                            : "Yes"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.tabbie_appointment_sync_status ? (
                        <Badge
                          variant={t.tabbie_appointment_sync_status === "error" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {t.tabbie_appointment_sync_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {t.tabbie_appointment_sync_status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={syncing === t.id}
                            onClick={() => handleSync(t.id)}
                            className="text-xs h-7"
                          >
                            {syncing === t.id ? <Loader2 className="size-3 animate-spin" /> : "Retry Sync"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            setOverrideTarget(t);
                            setOverrideAction("mark_completed");
                            setOverrideReason("");
                            setOverrideError(null);
                            setOverrideSuccess(false);
                          }}
                        >
                          Override
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      <Dialog open={!!overrideTarget} onOpenChange={(open) => !open && setOverrideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Override</DialogTitle>
            <DialogDescription>
              Override appointment status for <strong>{overrideTarget?.name}</strong>.
              This action is audited and requires a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={overrideAction} onValueChange={setOverrideAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark_completed">Mark as Completed</SelectItem>
                  <SelectItem value="reset_completed">Reset Completed Flag</SelectItem>
                  <SelectItem value="mark_cancelled">Mark as Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this override is needed…"
                rows={3}
              />
            </div>
            {overrideError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" /> {overrideError}
              </div>
            )}
            {overrideSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> Override applied successfully.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button
              onClick={handleOverride}
              disabled={overriding || !overrideReason.trim()}
              className="gap-2"
            >
              {overriding && <Loader2 className="size-4 animate-spin" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
