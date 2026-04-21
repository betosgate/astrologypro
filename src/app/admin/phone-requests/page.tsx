"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Phone, PhoneCall, RefreshCcw } from "lucide-react";

type RequestStatus = "pending" | "assigned" | "rejected";

interface DivinerSummary {
  id: string;
  display_name: string | null;
  username: string | null;
  user_id: string | null;
}

interface AssignedPhoneSummary {
  id: string;
  phone_number: string;
}

interface AdminSummary {
  id: string;
  email: string;
}

interface PhoneRequest {
  id: string;
  status: RequestStatus;
  note: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  assigned_at: string | null;
  rejected_at: string | null;
  diviner: DivinerSummary | null;
  assigned_phone: AssignedPhoneSummary | null;
  assigned_by: AdminSummary | null;
}

interface PoolNumber {
  id: string;
  phone_number: string;
  phone_arn: string | null;
  status: "available" | "assigned";
  assigned_diviner: DivinerSummary | null;
}

type TabValue = "pending" | "assigned" | "rejected" | "all";

const TAB_LABELS: Record<TabValue, string> = {
  pending: "Pending",
  assigned: "Assigned",
  rejected: "Rejected",
  all: "All",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === "pending") {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (status === "assigned") {
    return <Badge className="bg-green-600 hover:bg-green-600">Assigned</Badge>;
  }
  return <Badge variant="destructive">Rejected</Badge>;
}

export default function AdminPhoneRequestsPage() {
  const [tab, setTab] = useState<TabValue>("pending");
  const [requests, setRequests] = useState<PhoneRequest[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment modal state
  const [assigningFor, setAssigningFor] = useState<PhoneRequest | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<PoolNumber[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string>("");
  const [loadingPool, setLoadingPool] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadRequests = useCallback(
    async (activeTab: TabValue) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/phone-requests?status=${activeTab}`,
          { cache: "no-store" },
        );
        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error ?? "Failed to load");
          return;
        }
        setRequests(payload.requests ?? []);
        setPendingCount(payload.pendingCount ?? 0);
      } catch {
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadRequests(tab);
  }, [tab, loadRequests]);

  async function openAssignDialog(req: PhoneRequest) {
    setAssigningFor(req);
    setSelectedNumberId("");
    setLoadingPool(true);
    try {
      const res = await fetch(
        "/api/admin/chime-phone-numbers?status=available",
        { cache: "no-store" },
      );
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error ?? "Failed to load available numbers");
        setAvailableNumbers([]);
        return;
      }
      setAvailableNumbers(payload.numbers ?? []);
    } catch {
      toast.error("Failed to load available numbers");
    } finally {
      setLoadingPool(false);
    }
  }

  function closeAssignDialog() {
    if (submitting) return;
    setAssigningFor(null);
    setSelectedNumberId("");
    setAvailableNumbers([]);
  }

  async function submitAssignment() {
    if (!assigningFor || !selectedNumberId) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/phone-requests/${assigningFor.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chime_phone_number_id: selectedNumberId }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error ?? "Assignment failed");
        return;
      }
      toast.success(`Assigned ${payload.phone_number ?? "number"} to diviner`);
      setAssigningFor(null);
      setSelectedNumberId("");
      setAvailableNumbers([]);
      await loadRequests(tab);
    } catch {
      toast.error("Assignment failed");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingBadge = useMemo(
    () =>
      pendingCount > 0 ? (
        <Badge variant="secondary" className="ml-2">
          {pendingCount}
        </Badge>
      ) : null,
    [pendingCount],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <PhoneCall className="size-6" />
            Phone Number Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diviners who don&apos;t have a Chime number yet can request one
            here. Assign a number from the pool to fulfil the request.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadRequests(tab)}
          disabled={loading}
        >
          <RefreshCcw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="pending">
            {TAB_LABELS.pending}
            {pendingBadge}
          </TabsTrigger>
          <TabsTrigger value="assigned">{TAB_LABELS.assigned}</TabsTrigger>
          <TabsTrigger value="rejected">{TAB_LABELS.rejected}</TabsTrigger>
          <TabsTrigger value="all">{TAB_LABELS.all}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{TAB_LABELS[tab]} requests</CardTitle>
          <CardDescription>
            {tab === "pending"
              ? "Requests waiting for admin action."
              : tab === "assigned"
                ? "Requests that have been fulfilled with a Chime number."
                : tab === "rejected"
                  ? "Requests that were rejected."
                  : "Every phone number request, any status."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              No {tab === "all" ? "" : tab} requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Assigned Number</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">
                          {req.diviner?.display_name ?? "(unnamed)"}
                        </div>
                        {req.diviner?.username && (
                          <div className="text-xs text-muted-foreground">
                            @{req.diviner.username}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                        {req.status === "rejected" && req.rejected_reason && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {req.rejected_reason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(req.created_at)}
                        {req.note && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            “{req.note}”
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.assigned_phone?.phone_number ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="size-3.5 text-green-600" />
                            {req.assigned_phone.phone_number}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(req.assigned_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => openAssignDialog(req)}
                          >
                            Assign number
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment dialog */}
      <Dialog
        open={!!assigningFor}
        onOpenChange={(open) => {
          if (!open) closeAssignDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Chime number</DialogTitle>
            <DialogDescription>
              Pick an available Chime number to assign to{" "}
              <span className="font-medium">
                {assigningFor?.diviner?.display_name ?? "this diviner"}
              </span>
              . This updates the diviner&apos;s profile and marks the pool row
              as assigned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {loadingPool ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading available numbers…
              </div>
            ) : availableNumbers.length === 0 ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                No available Chime numbers in the pool. Add numbers via the
                Chime pool API before assigning.
              </div>
            ) : (
              <Select
                value={selectedNumberId}
                onValueChange={setSelectedNumberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick an available number" />
                </SelectTrigger>
                <SelectContent>
                  {availableNumbers.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={closeAssignDialog}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAssignment}
              disabled={!selectedNumberId || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Assigning…
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
