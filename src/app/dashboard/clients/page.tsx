"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientDetailSheet } from "@/components/dashboard/client-detail-sheet";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SearchX,
} from "lucide-react";

type ClientRow = {
  id: string;
  client_id: string;
  total_sessions: number;
  total_spent: number;
  last_session_at: string | null;
  first_session_at: string | null;
  notes: string | null;
  clients: {
    id: string;
    full_name: string | null;
    email: string | null;
    birth_date: string | null;
    birth_time: string | null;
    birth_city: string | null;
  } | null;
};

type Stats = {
  total: number;
  active_30d: number;
  total_sessions: number;
  total_revenue: number;
};

type SortBy = "last_session_at" | "total_sessions" | "total_spent" | "first_session_at";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortBy, sortDir }: { col: SortBy; sortBy: SortBy; sortDir: SortDir }) {
  if (col !== sortBy) return <ArrowUpDown className="size-3 ml-1 text-muted-foreground/50" />;
  return sortDir === "asc"
    ? <ArrowUp className="size-3 ml-1 text-primary" />
    : <ArrowDown className="size-3 ml-1 text-primary" />;
}

function fmt(amount: number) {
  return `$${Number(amount).toFixed(2)}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active_30d: 0, total_sessions: 0, total_revenue: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("last_session_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // We need the diviner ID for the ClientDetailSheet — fetch once
  const [divinerId, setDivinerId] = useState<string>("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/dashboard/clients?${params}`);
    if (res.ok) {
      const json = await res.json();
      setClients(json.clients ?? []);
      setPages(json.pages ?? 1);
      setStats(json.stats ?? { total: 0, active_30d: 0, total_sessions: 0, total_revenue: 0 });
      if (json.diviner_id) setDivinerId(json.diviner_id);
    }
    setLoading(false);
  }, [page, search, sortBy, sortDir, divinerId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortDir]);

  function toggleSort(col: SortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const kpiCards = [
    {
      label: "Total Clients",
      value: stats.total,
      icon: <Users className="size-4 text-muted-foreground" />,
      sub: "all time",
      valueClass: "",
    },
    {
      label: "Active (30 days)",
      value: stats.active_30d,
      icon: <TrendingUp className="size-4 text-green-500" />,
      sub: "had a session",
      valueClass: "text-green-600",
    },
    {
      label: "Total Sessions",
      value: stats.total_sessions,
      icon: <Calendar className="size-4 text-blue-500" />,
      sub: "completed",
      valueClass: "text-blue-600",
    },
    {
      label: "Total Revenue",
      value: fmt(stats.total_revenue),
      icon: <DollarSign className="size-4 text-amber-500" />,
      sub: "from clients",
      valueClass: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm">
          View and manage your client relationships.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpi.valueClass}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead
                onClick={() => toggleSort("total_sessions")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  Sessions
                  <SortIcon col="total_sessions" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("total_spent")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  Spent
                  <SortIcon col="total_spent" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("first_session_at")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  First Session
                  <SortIcon col="first_session_at" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("last_session_at")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center">
                  Last Session
                  <SortIcon col="last_session_at" sortBy={sortBy} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="w-[60px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Loading clients…
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      {search ? (
                        <SearchX className="size-7 text-muted-foreground" />
                      ) : (
                        <Users className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {search ? "No clients match your search" : "No clients yet"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {search
                          ? `No clients found for "${search}". Try a different search term.`
                          : "Clients will appear here once they book a session with you."}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((relation) => {
                const client = relation.clients;
                return (
                  <TableRow key={relation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{client?.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{client?.email ?? "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client?.birth_date ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {relation.total_sessions ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {fmt(relation.total_spent ?? 0)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(relation.first_session_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(relation.last_session_at)}
                    </TableCell>
                    <TableCell>
                      {divinerId && client?.id && (
                        <ClientDetailSheet
                          clientId={client.id}
                          clientName={client.full_name ?? "Client"}
                          divinerId={divinerId}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
