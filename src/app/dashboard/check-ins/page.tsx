"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Gift,
  Download,
  CalendarDays,
  Baby,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
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

interface CheckIn {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string | null;
  birth_city: string | null;
  birth_time: string | null;
  created_at: string;
}

interface SummaryStats {
  total: number;
  thisWeek: number;
  withBirthData: number;
}

type DateFilter = "all" | "week" | "month";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateRange(filter: DateFilter): { from?: string; to?: string } {
  const now = new Date();
  if (filter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return { from: weekAgo.toISOString() };
  }
  if (filter === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    return { from: monthAgo.toISOString() };
  }
  return {};
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryStats>({
    total: 0,
    thisWeek: 0,
    withBirthData: 0,
  });

  const fetchCheckIns = useCallback(
    async (p: number, filter: DateFilter) => {
      setLoading(true);
      const { from, to } = getDateRange(filter);
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/dashboard/check-ins?${params}`);
      if (res.ok) {
        const json = await res.json();
        setCheckIns(json.checkIns ?? []);
        setTotal(json.total ?? 0);
        setTotalPages(json.totalPages ?? 1);
      }
      setLoading(false);
    },
    []
  );

  // Fetch summary stats (total, this week, with birth data) — always unfiltered
  const fetchStats = useCallback(async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [allRes, weekRes] = await Promise.all([
      fetch("/api/dashboard/check-ins?page=1&limit=1"),
      fetch(
        `/api/dashboard/check-ins?page=1&limit=1&from=${weekAgo.toISOString()}`
      ),
    ]);

    let totalAll = 0;
    let totalWeek = 0;

    if (allRes.ok) {
      const j = await allRes.json();
      totalAll = j.total ?? 0;
    }
    if (weekRes.ok) {
      const j = await weekRes.json();
      totalWeek = j.total ?? 0;
    }

    // For "with birth data" we need a quick full fetch to count locally.
    // Use a large limit on page 1 for a reasonable approximation.
    const allDataRes = await fetch("/api/dashboard/check-ins?page=1&limit=100");
    let withBirth = 0;
    if (allDataRes.ok) {
      const j = await allDataRes.json();
      withBirth = (j.checkIns as CheckIn[]).filter(
        (c) => c.birth_date != null
      ).length;
    }

    setStats({ total: totalAll, thisWeek: totalWeek, withBirthData: withBirth });
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCheckIns(page, dateFilter);
  }, [page, dateFilter, fetchCheckIns]);

  function handleFilterChange(f: DateFilter) {
    setDateFilter(f);
    setPage(1);
  }

  function exportCsv() {
    if (checkIns.length === 0) return;
    const headers = [
      "Date",
      "First Name",
      "Last Name",
      "Email",
      "City",
      "Birth Date",
      "Birth Time",
    ];
    const rows = checkIns.map((c) => [
      formatDateTime(c.created_at),
      c.first_name,
      c.last_name,
      c.email,
      c.birth_city ?? "",
      c.birth_date ?? "",
      c.birth_time ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `check-ins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Check-In Leads</h1>
            <p className="text-sm text-muted-foreground">
              Viewer sign-ups from your live sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={checkIns.length === 0}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/giveaways">
              <Gift className="mr-2 size-4" />
              Giveaways
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="size-4" /> Total Check-Ins
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> This Week
            </CardDescription>
            <CardTitle className="text-3xl">{stats.thisWeek}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Baby className="size-4" /> With Birth Data
            </CardDescription>
            <CardTitle className="text-3xl">{stats.withBirthData}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period:</span>
        {(["all", "week", "month"] as DateFilter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={dateFilter === f ? "default" : "outline"}
            onClick={() => handleFilterChange(f)}
          >
            {f === "all" ? "All Time" : f === "week" ? "This Week" : "This Month"}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Check-In Records</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${total} check-in${total !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && checkIns.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Users className="size-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No check-ins yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Check-ins are collected when viewers submit the live session form on
                  your public page.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Birth Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((__, j) => (
                            <TableCell key={j}>
                              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : checkIns.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(c.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {c.first_name} {c.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {c.email}
                          </TableCell>
                          <TableCell>
                            {c.birth_city ? (
                              <span className="flex items-center gap-1 text-sm">
                                <MapPin className="size-3 text-muted-foreground" />
                                {c.birth_city}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.birth_date ? (
                              <Badge variant="secondary">
                                {formatDate(c.birth_date)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.birth_time ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
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
