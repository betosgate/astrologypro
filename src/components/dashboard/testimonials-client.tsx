"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Status =
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "hidden"
  | "pending";

interface TestimonialRow {
  id: string;
  client_name: string | null;
  display_alias: string | null;
  rating: number | null;
  text: string;
  service_name: string | null;
  service_type: string | null;
  status: Status;
  is_featured: boolean;
  featured?: boolean;
  spam_score: number | null;
  moderation_notes: string | null;
  diviner_response: string | null;
  created_at: string;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "submitted", label: "New" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  hidden: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "New",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
  pending: "Pending",
};

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= rating ? "text-yellow-400" : "text-muted-foreground/30"}
          aria-hidden
        >
          {s <= rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(row: TestimonialRow): string {
  if (row.display_alias) return row.display_alias;
  if (row.client_name) {
    if (row.client_name.includes("@")) return row.client_name;
    return row.client_name;
  }
  return "—";
}

export function TestimonialsClient() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const actionInFlight = useRef(false);

  const load = useCallback(
    async (cursor?: string, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (statusFilter) params.set("status", statusFilter);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/dashboard/testimonials?${params}`);
        if (!res.ok) {
          toast.error("Failed to load testimonials.");
          return;
        }
        const data = await res.json() as {
          testimonials: TestimonialRow[];
          nextCursor: string | null;
        };
        setTestimonials((prev) =>
          append ? [...prev, ...data.testimonials] : data.testimonials
        );
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Failed to load testimonials.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    setTestimonials([]);
    setSelectedIds(new Set());
    setExpandedId(null);
    load();
  }, [load]);

  async function patch(id: string, updates: Record<string, unknown>) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    try {
      const res = await fetch("/api/dashboard/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to update.");
        return;
      }
      const { testimonial } = await res.json() as { testimonial: TestimonialRow };
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...testimonial } : t))
      );
      toast.success("Updated.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      actionInFlight.current = false;
    }
  }

  async function bulkApprove() {
    if (selectedIds.size === 0 || bulkLoading) return;
    setBulkLoading(true);
    const ids = [...selectedIds];
    let successCount = 0;
    for (const id of ids) {
      const res = await fetch("/api/dashboard/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      if (res.ok) {
        successCount++;
        const { testimonial } = await res.json() as { testimonial: TestimonialRow };
        setTestimonials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...testimonial } : t))
        );
      }
    }
    toast.success(`${successCount} testimonial${successCount !== 1 ? "s" : ""} approved.`);
    setSelectedIds(new Set());
    setBulkLoading(false);
  }

  const pendingRows = testimonials.filter(
    (t) => t.status === "submitted" || t.status === "pending_review" || t.status === "pending"
  );
  const allPendingSelected =
    pendingRows.length > 0 &&
    pendingRows.every((t) => selectedIds.has(t.id));

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRows.map((t) => t.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
          <span className="text-sm text-yellow-400">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkLoading}
            onClick={bulkApprove}
            className="text-green-500 border-green-500/30 hover:bg-green-500/5"
          >
            {bulkLoading ? "Approving…" : "Bulk Approve"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : testimonials.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No testimonials found.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all pending"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      disabled={pendingRows.length === 0}
                      className="accent-primary"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="max-w-[280px]">Review</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((t) => {
                  const isPending =
                    t.status === "submitted" ||
                    t.status === "pending_review" ||
                    t.status === "pending";
                  const isExpanded = expandedId === t.id;
                  const spamHigh = (t.spam_score ?? 0) > 0.5;

                  return (
                    <>
                      <TableRow
                        key={t.id}
                        className={isExpanded ? "bg-muted/30" : undefined}
                      >
                        <TableCell>
                          {isPending && (
                            <input
                              type="checkbox"
                              aria-label={`Select testimonial from ${displayName(t)}`}
                              checked={selectedIds.has(t.id)}
                              onChange={() => toggleSelect(t.id)}
                              className="accent-primary"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {displayName(t)}
                          {spamHigh && (
                            <span
                              className="ml-1.5 text-base"
                              title={`Spam score: ${t.spam_score}`}
                              aria-label="High spam score warning"
                            >
                              🚨
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stars rating={t.rating} />
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="truncate text-sm text-muted-foreground">
                            {t.text.slice(0, 80)}
                            {t.text.length > 80 ? "…" : ""}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.service_name ?? t.service_type ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {fmtDate(t.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={STATUS_BADGE[t.status] ?? ""}
                            variant="outline"
                          >
                            {STATUS_LABEL[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {t.status !== "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-500 hover:text-green-400 text-xs h-7 px-2"
                                onClick={() => patch(t.id, { status: "approved" })}
                              >
                                Approve
                              </Button>
                            )}
                            {t.status !== "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 text-xs h-7 px-2"
                                onClick={() => patch(t.id, { status: "rejected" })}
                              >
                                Reject
                              </Button>
                            )}
                            {t.status !== "hidden" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
                                onClick={() => patch(t.id, { status: "hidden" })}
                              >
                                Hide
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() =>
                                patch(t.id, { is_featured: !t.is_featured })
                              }
                              title={t.is_featured ? "Unfeature" : "Feature"}
                            >
                              {t.is_featured ? "★ Unfeature" : "☆ Feature"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-muted-foreground"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : t.id)
                              }
                            >
                              {isExpanded ? "Collapse" : "View"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${t.id}-expanded`} className="bg-muted/20">
                          <TableCell colSpan={8} className="py-4 px-6">
                            <div className="space-y-3 max-w-3xl">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Full Review
                                </p>
                                <p className="text-sm leading-relaxed">{t.text}</p>
                              </div>
                              {t.moderation_notes && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    Moderation Notes
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t.moderation_notes}
                                  </p>
                                </div>
                              )}
                              {t.spam_score != null && (
                                <p className="text-xs text-muted-foreground">
                                  Spam score:{" "}
                                  <span
                                    className={
                                      t.spam_score > 0.5
                                        ? "text-red-400 font-semibold"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {t.spam_score.toFixed(2)}
                                  </span>
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {testimonials.map((t) => {
              const spamHigh = (t.spam_score ?? 0) > 0.5;
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {displayName(t)}
                        {spamHigh && (
                          <span className="ml-1 text-sm" aria-label="High spam score">
                            🚨
                          </span>
                        )}
                      </p>
                      {t.rating && <Stars rating={t.rating} />}
                    </div>
                    <Badge
                      className={STATUS_BADGE[t.status] ?? ""}
                      variant="outline"
                    >
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {isExpanded ? t.text : `${t.text.slice(0, 120)}${t.text.length > 120 ? "…" : ""}`}
                  </p>
                  {t.text.length > 120 && (
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {t.status !== "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-500 border-green-500/30 text-xs h-7"
                        onClick={() => patch(t.id, { status: "approved" })}
                      >
                        Approve
                      </Button>
                    )}
                    {t.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-500/30 text-xs h-7"
                        onClick={() => patch(t.id, { status: "rejected" })}
                      >
                        Reject
                      </Button>
                    )}
                    {t.status !== "hidden" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => patch(t.id, { status: "hidden" })}
                      >
                        Hide
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() =>
                        patch(t.id, { is_featured: !t.is_featured })
                      }
                    >
                      {t.is_featured ? "★ Unfeature" : "☆ Feature"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.service_name ?? t.service_type ?? ""}{" "}
                    {t.service_name || t.service_type ? "·" : ""}{" "}
                    {fmtDate(t.created_at)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => load(nextCursor, true)}
              >
                {loadingMore ? "Loading…" : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
