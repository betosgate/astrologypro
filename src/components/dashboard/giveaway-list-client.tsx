"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Plus, Users, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GiveawayDrawButton } from "@/components/dashboard/giveaway-draw-button";

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  status: GiveawayStatus;
  starts_at: string | null;
  ends_at: string | null;
  winner_count: number;
  entry_count: number;
  winner_count_selected: number;
  created_at: string;
}

function statusBadgeVariant(status: GiveawayStatus) {
  switch (status) {
    case "active":
      return "default" as const;
    case "ended":
      return "secondary" as const;
    case "draft":
      return "outline" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function formatDateRange(starts: string | null, ends: string | null): string {
  if (starts && ends) return `${fmt(starts)} - ${fmt(ends)}`;
  if (starts) return `Starts ${fmt(starts)}`;
  if (ends) return `Ends ${fmt(ends)}`;
  return "No dates set";
}

export function GiveawayListClient({ giveaways }: { giveaways: Giveaway[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GiveawayStatus | "all">("all");

  const filtered = giveaways.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!g.title.toLowerCase().includes(s) && !(g.prize_description ?? "").toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GiveawayStatus | "all")}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {giveaways.length} giveaway{giveaways.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Gift className="size-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {giveaways.length === 0 ? "No giveaways yet" : "No giveaways match filters"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {giveaways.length === 0
                  ? "Create one to engage your live audience. Viewers check in and enter automatically."
                  : "Try adjusting your search or status filter."}
              </p>
            </div>
            {giveaways.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/giveaways/new">
                  <Plus className="mr-2 size-4" />
                  Create Your First Giveaway
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-center">Entries</TableHead>
                    <TableHead className="text-center">Winners</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => {
                    const canDraw =
                      (g.status === "active" || g.status === "ended") &&
                      g.winner_count_selected === 0 &&
                      g.entry_count > 0;

                    return (
                      <TableRow key={g.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{g.title}</span>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {g.prize_description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(g.status)} className="capitalize">
                            {g.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateRange(g.starts_at, g.ends_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1 text-sm">
                            <Users className="size-3.5 text-muted-foreground" />
                            {g.entry_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {g.winner_count_selected > 0 ? (
                            <span className="flex items-center justify-center gap-1 text-sm text-amber-600">
                              <Trophy className="size-3.5" />
                              {g.winner_count_selected}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/giveaways/${g.id}`}>View</Link>
                            </Button>
                            {canDraw && (
                              <GiveawayDrawButton giveawayId={g.id} giveawayTitle={g.title} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
