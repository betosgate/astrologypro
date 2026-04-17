"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  CalendarClock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Timer,
  Search,
} from "lucide-react";

type CallRecord = {
  id: string;
  caller_phone: string;
  session_type: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  phone_provider: string;
  created_at: string;
  booking_id: string | null;
  client_id: string | null;
  clients: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
};

type CallSummary = {
  total_calls: number;
  completed_calls: number;
  missed_calls: number;
  active_calls: number;
  avg_duration_seconds: number;
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return "Unknown";
  // Format +1XXXXXXXXXX or +91XXXXXXXXXX
  const clean = phone.replace(/\s/g, "");
  if (clean.startsWith("+1") && clean.length === 12) {
    return `+1 (${clean.slice(2, 5)}) ${clean.slice(5, 8)}-${clean.slice(8)}`;
  }
  if (clean.startsWith("+91") && clean.length === 13) {
    return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
  }
  return phone;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; bgColor: string; icon: typeof Phone }> = {
    completed: {
      label: "Completed",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      icon: PhoneIncoming,
    },
    active: {
      label: "In Progress",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20 animate-pulse",
      icon: Phone,
    },
    accepted: {
      label: "Accepted",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      icon: PhoneIncoming,
    },
    pending: {
      label: "Ringing",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      icon: PhoneOutgoing,
    },
    failed: {
      label: "Missed",
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      icon: PhoneMissed,
    },
    declined: {
      label: "Declined",
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      icon: PhoneOff,
    },
  };
  return map[status] ?? {
    label: status,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50 border-border",
    icon: Phone,
  };
}

export default function PhoneCallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce search input by 400ms
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/dashboard/phone-calls?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls);
        setTotal(data.total);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, perPage, debouncedSearch]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phone Calls</h1>
          <p className="text-muted-foreground">
            Your complete call history — track every conversation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCalls()}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <TrendingUp className="size-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative group hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Total Calls</CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{summary.total_calls}</div>
              <p className="mt-1 text-xs text-muted-foreground">All time call volume</p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-emerald-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Completed</CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <PhoneIncoming className="size-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-emerald-500">{summary.completed_calls}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.total_calls > 0
                  ? `${Math.round((summary.completed_calls / summary.total_calls) * 100)}% success rate`
                  : "No calls yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-red-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Missed / Declined</CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
                <PhoneMissed className="size-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-red-500">{summary.missed_calls}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.total_calls > 0
                  ? `${Math.round((summary.missed_calls / summary.total_calls) * 100)}% miss rate`
                  : "No missed calls"}
              </p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-amber-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Avg Duration</CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Timer className="size-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{formatDuration(summary.avg_duration_seconds)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Average call length</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Call History</CardTitle>
              <CardDescription>
                {total} call{total !== 1 ? "s" : ""} recorded
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[220px] pl-8 h-9 text-sm"
                />
              </div>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="failed">Missed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <PhoneOff className="size-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">No calls found</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
                {statusFilter !== "all"
                  ? "Try changing the filter to see other call types."
                  : "When clients call your Chime number, every call will be logged here with full details."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {calls.map((call) => {
                const config = getStatusConfig(call.status);
                const StatusIcon = config.icon;
                const clientName = call.clients?.full_name ?? "Unknown Caller";
                const isActive = call.status === "active" || call.status === "accepted";

                return (
                  <div
                    key={call.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30 ${
                      isActive ? "bg-blue-500/5" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className={`text-xs font-semibold ${
                        call.status === "failed" || call.status === "declined"
                          ? "bg-red-500/10 text-red-400"
                          : isActive
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-primary/10 text-primary"
                      }`}>
                        {call.clients ? getInitials(clientName) : <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>

                    {/* Caller info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{clientName}</span>
                        {call.booking_id && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-4 gap-1 font-normal">
                            <CalendarClock className="size-2.5" />
                            Booked
                          </Badge>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400">
                            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatPhoneDisplay(call.caller_phone)}
                        </span>
                        {call.clients?.email && (
                          <span className="text-xs text-muted-foreground/60 truncate hidden sm:inline">
                            {call.clients.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}>
                        <StatusIcon className="size-3" />
                        {config.label}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="text-right shrink-0 min-w-[70px]">
                      <div className="text-sm font-mono font-medium">
                        {formatDuration(call.duration_seconds)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {timeAgo(call.created_at)}
                      </div>
                    </div>

                    {/* Mobile status dot */}
                    <div className={`sm:hidden size-2.5 rounded-full shrink-0 ${
                      call.status === "completed" || call.status === "accepted"
                        ? "bg-emerald-500"
                        : call.status === "active"
                          ? "bg-blue-500 animate-pulse"
                          : call.status === "failed" || call.status === "declined"
                            ? "bg-red-500"
                            : "bg-amber-500"
                    }`} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="h-8 w-8 px-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="flex items-center px-1 text-xs text-muted-foreground">...</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-2"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
