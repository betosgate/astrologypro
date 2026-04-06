"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type TestimonialRequest = {
  id: string;
  requested_to_name: string;
  requested_to_email: string;
  requested_to_phone_no: string | null;
  testimonial_for: string | null;
  notes: string | null;
  status: "pending" | "sent" | "completed" | "declined";
  created_by: string;
  created_at: string;
  diviners: { display_name: string } | null;
};

const fmt = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    sent: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    declined: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${variants[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function TestimonialRequestsListPage() {
  const [requests, setRequests] = useState<TestimonialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  async function loadRequests(status?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/testimonials/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      } else {
        toast.error("Failed to load requests.");
      }
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests(statusFilter || undefined);
  }, [statusFilter]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/testimonials/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to update status.");
        return;
      }
      toast.success(`Request marked as ${newStatus}.`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: newStatus as TestimonialRequest["status"] }
            : r
        )
      );
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Request deleted.");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const paginated = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/testimonials">← Testimonials</Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">
            Testimonial Requests
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/testimonials/requests/create">+ New Request</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No testimonial requests found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested To</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Astrologer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.requested_to_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.requested_to_email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.requested_to_phone_no ?? "—"}
                      </TableCell>
                      <TableCell>
                        {r.diviners?.display_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span
                          className="block truncate text-sm text-muted-foreground"
                          title={r.notes ?? ""}
                        >
                          {r.notes ? r.notes.slice(0, 60) + (r.notes.length > 60 ? "…" : "") : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleStatusChange(r.id, "sent")}
                            >
                              Mark Sent
                            </Button>
                          )}
                          {r.status === "sent" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() =>
                                handleStatusChange(r.id, "completed")
                              }
                            >
                              Complete
                            </Button>
                          )}
                          {r.status !== "declined" &&
                            r.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700"
                                onClick={() =>
                                  handleStatusChange(r.id, "declined")
                                }
                              >
                                Decline
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(r.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {requests.length} total · Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
