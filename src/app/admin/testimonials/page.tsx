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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Testimonial = {
  id: string;
  diviner_id: string;
  client_name: string | null;
  display_alias: string | null;
  rating: number | null;
  text: string;
  service_type: string | null;
  service_name: string | null;
  title: string | null;
  status: "submitted" | "pending_review" | "approved" | "rejected" | "hidden" | "pending";
  is_featured: boolean;
  spam_score: number | null;
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

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-yellow-500">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800 border-blue-200",
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    hidden: "bg-gray-100 text-gray-700 border-gray-200",
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

export default function TestimonialsListPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadTestimonials(status?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/testimonials?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials ?? []);
      } else {
        toast.error("Failed to load testimonials.");
      }
    } catch {
      toast.error("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonials(statusFilter || undefined);
  }, [statusFilter]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to update status.");
        return;
      }
      toast.success(`Testimonial ${newStatus}.`);
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: newStatus as Testimonial["status"] } : t
        )
      );
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this testimonial? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Testimonial deleted.");
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const filtered = testimonials.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (t.client_name ?? "").toLowerCase().includes(s) ||
      (t.text ?? "").toLowerCase().includes(s) ||
      (t.title ?? "").toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Testimonials</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/testimonials/requests">View Requests</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/testimonials/create">+ Add Testimonial</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by client name or text…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="submitted">New (Submitted)</option>
              <option value="pending_review">Pending Review</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No testimonials found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.diviners?.display_name ?? "—"}
                      </TableCell>
                      <TableCell>{t.client_name ?? "—"}</TableCell>
                      <TableCell>
                        <Stars rating={t.rating} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(t.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/testimonials/${t.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          {t.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleStatusChange(t.id, "approved")}
                            >
                              Approve
                            </Button>
                          )}
                          {t.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => handleStatusChange(t.id, "rejected")}
                            >
                              Reject
                            </Button>
                          )}
                          {t.status !== "hidden" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-gray-600"
                              onClick={() => handleStatusChange(t.id, "hidden")}
                            >
                              Hide
                            </Button>
                          )}
                          {t.spam_score != null && t.spam_score > 0.5 && (
                            <span
                              title={`Spam score: ${t.spam_score}`}
                              className="text-base"
                              aria-label="High spam score"
                            >
                              🚨
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(t.id)}
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
                    {filtered.length} total · Page {page} of {totalPages}
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
