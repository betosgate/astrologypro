"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
  Clock,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  StickyNote,
  Loader2,
  CalendarRange,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  booking_id: string | null;
  client_id: string | null;
  service_type: string | null;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  clients: { full_name: string; email: string } | null;
};

type Stats = {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
};

type SortBy = "created_at" | "amount";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "paid", label: "Paid" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "processing", label: "Processing" },
  { value: "awaiting_intake", label: "Awaiting Intake" },
  { value: "in_progress", label: "In Progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "delivered", label: "Delivered" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

/** Human-readable labels for order statuses */
function statusLabel(s: string): string {
  switch (s) {
    case "pending_payment": return "Pending Payment";
    case "awaiting_intake": return "Awaiting Intake";
    case "intake_submitted": return "Intake Submitted";
    case "in_progress": return "In Progress";
    case "processing": return "Processing";
    default: return s.replace(/_/g, " ");
  }
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "completed":
    case "delivered":
      return "default";
    case "paid":
    case "scheduled":
    case "in_progress":
    case "intake_submitted":
      return "default";
    case "pending":
    case "pending_payment":
    case "processing":
    case "awaiting_intake":
      return "secondary";
    case "refunded":
    case "cancelled":
      return "destructive";
    default: return "secondary";
  }
}

function SortIcon({ col, sortBy, sortDir }: { col: SortBy; sortBy: SortBy; sortDir: SortDir }) {
  if (col !== sortBy) return <ArrowUpDown className="size-3 ml-1 text-muted-foreground/50" />;
  return sortDir === "asc"
    ? <ArrowUp className="size-3 ml-1 text-primary" />
    : <ArrowDown className="size-3 ml-1 text-primary" />;
}

export default function DivinerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0, refunded: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Notes panel state
  type OrderNote = { id: string; content: string; created_by_name: string; created_at: string };
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [notesList, setNotesList] = useState<Record<string, OrderNote[]>>({});
  const [loadingNotesId, setLoadingNotesId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", sort_by: sortBy, sort_dir: sortDir });
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const res = await fetch(`/api/dashboard/orders?${params}`);
    if (res.ok) {
      const json = await res.json();
      setOrders(json.orders ?? []);
      setPages(json.pages ?? 1);
      setStats(json.stats ?? { total: 0, completed: 0, pending: 0, refunded: 0 });
    }
    setLoading(false);
  }, [page, status, search, dateFrom, dateTo, sortBy, sortDir]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [status, search, dateFrom, dateTo, sortBy, sortDir]);

  function toggleSort(col: SortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  function setStatusFilter(val: string) {
    setStatus(val);
    setPage(1);
  }

  const fmt = (amount: number, currency: string) =>
    `$${Number(amount).toFixed(2)} ${currency.toUpperCase()}`;

  async function openNotes(orderId: string) {
    if (expandedNoteId === orderId) { setExpandedNoteId(null); return; }
    setExpandedNoteId(orderId);
    if (notesList[orderId]) return; // already loaded
    setLoadingNotesId(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/notes`);
      if (res.ok) {
        const json = await res.json();
        setNotesList((prev) => ({ ...prev, [orderId]: json.notes ?? [] }));
      }
    } finally { setLoadingNotesId(null); }
  }

  async function handleAddNote(orderId: string) {
    const content = (newNoteText[orderId] ?? "").trim();
    if (!content) return;
    setSavingNoteId(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) { toast.error("Failed to add note"); return; }
      const json = await res.json();
      setNotesList((prev) => ({ ...prev, [orderId]: [json.note, ...(prev[orderId] ?? [])] }));
      setNewNoteText((prev) => ({ ...prev, [orderId]: "" }));
      toast.success("Note added");
    } catch { toast.error("Failed to add note"); }
    finally { setSavingNoteId(null); }
  }

  async function handleDeleteNote(orderId: string, noteId: string) {
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete note"); return; }
      setNotesList((prev) => ({ ...prev, [orderId]: (prev[orderId] ?? []).filter((n) => n.id !== noteId) }));
    } catch { toast.error("Failed to delete note"); }
    finally { setDeletingNoteId(null); }
  }

  const kpiCards = [
    {
      label: "Total Orders",
      value: stats.total,
      icon: <Package className="size-4 text-muted-foreground" />,
      filterValue: "all",
      valueClass: "",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <DollarSign className="size-4 text-green-500" />,
      filterValue: "completed",
      valueClass: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock className="size-4 text-amber-500" />,
      filterValue: "pending",
      valueClass: "text-amber-600",
    },
    {
      label: "Refunded",
      value: stats.refunded,
      icon: <RotateCcw className="size-4 text-red-500" />,
      filterValue: "refunded",
      valueClass: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground text-sm">
          Track all orders and payments from your clients.
        </p>
      </div>

      {/* KPI Cards — clickable to filter */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const isActive = status === kpi.filterValue;
          return (
            <Card
              key={kpi.filterValue}
              onClick={() => setStatusFilter(kpi.filterValue)}
              className={[
                "cursor-pointer transition-all select-none",
                isActive
                  ? "ring-2 ring-primary border-primary shadow-sm"
                  : "hover:border-primary/40 hover:shadow-sm",
              ].join(" ")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${kpi.valueClass}`}>{kpi.value}</p>
                {isActive && (
                  <p className="text-xs text-primary mt-0.5">Active filter</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name, email, service, or payment ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <CalendarRange className="size-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1"
              aria-label="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1"
              aria-label="To date"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-muted-foreground"
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead
                onClick={() => toggleSort("amount")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  Amount
                  <SortIcon col="amount" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                onClick={() => toggleSort("created_at")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  Date
                  <SortIcon col="created_at" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  Loading orders…
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <>
                  <TableRow key={order.id} className={expandedNoteId === order.id ? "border-b-0" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {(order.clients as { full_name?: string } | null)?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(order.clients as { email?: string } | null)?.email ?? ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {order.service_type?.replace(/_/g, " ") ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {fmt(order.amount, order.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)} className="capitalize">
                        {statusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 relative"
                          onClick={() => openNotes(order.id)}
                        >
                          <StickyNote className="size-3.5" />
                          Notes
                          {(notesList[order.id]?.length ?? 0) > 0 && (
                            <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-amber-400" />
                          )}
                        </Button>
                        {order.booking_id && (
                          <Link href={`/dashboard/bookings?highlight=${order.booking_id}`}>
                            <Button variant="ghost" size="sm" className="text-xs">
                              Booking
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expandable multi-note panel */}
                  {expandedNoteId === order.id && (
                    <TableRow key={`${order.id}-notes`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={6} className="pt-2 pb-4 px-4">
                        {loadingNotesId === order.id ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                            <Loader2 className="size-4 animate-spin" />
                            Loading notes…
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Existing notes list */}
                            {(notesList[order.id] ?? []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">No notes yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {(notesList[order.id] ?? []).map((note) => (
                                  <div
                                    key={note.id}
                                    className="flex items-start gap-2 rounded-md bg-background border p-2.5 text-sm"
                                  >
                                    <div className="flex-1 space-y-0.5">
                                      <p className="text-sm leading-snug">{note.content}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {note.created_by_name} &middot;{" "}
                                        {new Date(note.created_at).toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                      disabled={deletingNoteId === note.id}
                                      onClick={() => handleDeleteNote(order.id, note.id)}
                                    >
                                      {deletingNoteId === note.id ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="size-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add note form */}
                            <div className="flex gap-2 pt-1">
                              <Textarea
                                rows={2}
                                value={newNoteText[order.id] ?? ""}
                                onChange={(e) =>
                                  setNewNoteText((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                placeholder="Add a note…"
                                className="flex-1 text-sm"
                                maxLength={2000}
                              />
                              <div className="flex flex-col gap-1.5">
                                <Button
                                  size="sm"
                                  disabled={savingNoteId === order.id || !(newNoteText[order.id] ?? "").trim()}
                                  onClick={() => handleAddNote(order.id)}
                                  className="gap-1"
                                >
                                  {savingNoteId === order.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="size-3.5" />
                                      Add
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setExpandedNoteId(null)}
                                >
                                  Close
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
