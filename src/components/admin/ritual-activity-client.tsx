"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Flame,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";

type Option = { value: string; label: string };

type RitualActivityRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  membership_status: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  current_step: number;
  is_complete: boolean;
};

type ActivityResponse = {
  rows: RitualActivityRow[];
  options: {
    rituals: Option[];
    users: Option[];
  };
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function statusFor(row: RitualActivityRow) {
  if (row.is_complete) {
    return {
      label: "Complete",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    };
  }

  if (row.current_step > 0) {
    return {
      label: "In Progress",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    };
  }

  return {
    label: "Not Started",
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  };
}

function safeDateTime(value: string | null | undefined): string {
  return value ? formatDateTime(value) : "-";
}

const SPECIAL_RITUAL = "Planetary Zodiacal Invocation Ritual of the Pentagram";

export function RitualActivityClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRitual, setSelectedRitual] = useState<RitualActivityRow | null>(
    null
  );

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
  );
  const pageSize = Math.max(
    1,
    Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10
  );
  const ritualName = searchParams.get("ritualName") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const status = searchParams.get("status") ?? "all";
  const createdFrom = searchParams.get("createdFrom") ?? "";
  const createdTo = searchParams.get("createdTo") ?? "";

  const sortField = searchParams.get("sortField") ?? "created_at";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const [localFrom, setLocalFrom] = useState(createdFrom);
  const [localTo, setLocalTo] = useState(createdTo);

  // Sync local state with URL params (e.g. when clearing filters)
  useEffect(() => {
    setLocalFrom(createdFrom);
    setLocalTo(createdTo);
  }, [createdFrom, createdTo]);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/community/ritual-activity?${queryString}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Failed to load ritual activity.");
        setData(null);
        return;
      }

      setData((await response.json()) as ActivityResponse);
    } catch {
      setError("Failed to load ritual activity.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleDateChange(patch: { createdFrom?: string; createdTo?: string }) {
    const from = patch.createdFrom !== undefined ? patch.createdFrom : localFrom;
    const to = patch.createdTo !== undefined ? patch.createdTo : localTo;

    setLocalFrom(from);
    setLocalTo(to);

    // Only update URL if BOTH are present, or BOTH are cleared
    if (from && to) {
      updateFilters({ createdFrom: from, createdTo: to });
    } else if (!from && !to) {
      updateFilters({ createdFrom: "", createdTo: "" });
    }
  }

  function updateFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleSort(field: string) {
    const next = new URLSearchParams(searchParams.toString());
    const currentField = next.get("sortField") ?? "created_at";
    const currentOrder = next.get("sortOrder") ?? "desc";

    if (currentField === field) {
      next.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
    } else {
      next.set("sortField", field);
      next.set("sortOrder", "asc");
    }

    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(nextPage));
    router.push(`${pathname}?${next.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters =
    ritualName || userId || status !== "all" || createdFrom || createdTo;

  function SortIndicator({ field }: { field: string }) {
    const active = sortField === field;
    
    return (
      <span className={`ml-1.5 inline-flex items-center transition-opacity ${active ? "opacity-100 text-amber-500" : "opacity-30"}`}>
        {active ? (
          sortOrder === "asc" ? (
            <ChevronRight className="-rotate-90 size-3 stroke-[3]" />
          ) : (
            <ChevronRight className="rotate-90 size-3 stroke-[3]" />
          )
        ) : (
          <div className="flex flex-col -space-y-1">
            <ChevronRight className="-rotate-90 size-2.5" />
            <ChevronRight className="rotate-90 size-2.5" />
          </div>
        )}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Flame className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ritual Activity</h1>
            <p className="text-sm text-muted-foreground">
              All rituals created from the Perennial Mandalism dashboard.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Ritual</p>
              <SearchableSelect
                options={data?.options.rituals ?? []}
                value={ritualName}
                onValueChange={(value) => updateFilters({ ritualName: value })}
                placeholder="All rituals"
                searchPlaceholder="Search rituals..."
                className="w-full"
                maxInitialDisplay={20}
              />
            </div>
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">User</p>
              <SearchableSelect
                options={data?.options.users ?? []}
                value={userId}
                onValueChange={(value) => updateFilters({ userId: value })}
                placeholder="All users"
                searchPlaceholder="Search users..."
                className="w-full"
                maxInitialDisplay={20}
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-40">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Select
                value={status}
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Complete</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1.5 sm:w-40">
              <p className="text-xs font-medium text-muted-foreground">Created From</p>
              <Input
                type="date"
                value={localFrom}
                onChange={(event) =>
                  handleDateChange({ createdFrom: event.target.value })
                }
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-40">
              <p className="text-xs font-medium text-muted-foreground">Created To</p>
              <Input
                type="date"
                value={localTo}
                onChange={(event) =>
                  handleDateChange({ createdTo: event.target.value })
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!hasFilters}
              onClick={clearFilters}
              title="Clear Filters"
            >
              <RotateCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4" />
            Perennial User Rituals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading ritual activity...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              No ritual activity found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sl No</TableHead>
                  <TableHead 
                    className="cursor-pointer transition-colors hover:text-foreground select-none"
                    onClick={() => handleSort("user_name")}
                  >
                    User Name <SortIndicator field="user_name" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer transition-colors hover:text-foreground select-none"
                    onClick={() => handleSort("ritual_name")}
                  >
                    Ritual <SortIndicator field="ritual_name" />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead 
                    className="cursor-pointer transition-colors hover:text-foreground select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    Created <SortIndicator field="created_at" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer transition-colors hover:text-foreground select-none"
                    onClick={() => handleSort("last_executed_at")}
                  >
                    Last Played <SortIndicator field="last_executed_at" />
                  </TableHead>
                  <TableHead className="w-[80px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const itemStatus = statusFor(row);
                  const tags = row.ritual_tags ?? [];
                  const slNo = (page - 1) * pageSize + index + 1;

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{slNo}</TableCell>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <p className="truncate font-medium">
                            {row.user_name || "Unknown user"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.user_email || row.user_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[280px] truncate font-medium">
                          {row.ritual_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={itemStatus.className}>
                          {itemStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[320px] flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="max-w-[150px] truncate text-[10px]"
                            >
                              {tag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {tags.length > 3 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="cursor-pointer text-[10px] hover:bg-muted transition-colors"
                                >
                                  +{tags.length - 3}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-3" align="start">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    All Ritual Tags
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {tag.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{safeDateTime(row.created_at)}</TableCell>
                      <TableCell>{safeDateTime(row.last_executed_at)}</TableCell>
                      <TableCell className="text-right">
                        {row.ritual_name === SPECIAL_RITUAL && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                            onClick={() => setSelectedRitual(row)}
                            title="View Details"
                          >
                            <Search className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {rows.length} of {total} rituals. Page {page} of{" "}
                {totalPages}.
              </p>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Rows per page</p>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => updateFilters({ pageSize: v, page: "1" })}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(1)}
                disabled={page <= 1 || loading}
                title="First Page"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                title="Previous Page"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show a window of pages around current page
                  let pageNum = page;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => goToPage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                title="Next Page"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(totalPages)}
                disabled={page >= totalPages || loading}
                title="Last Page"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RitualDetailsModal
        ritual={selectedRitual}
        onClose={() => setSelectedRitual(null)}
      />
    </div>
  );
}

function RitualDetailsModal({
  ritual,
  onClose,
}: {
  ritual: RitualActivityRow | null;
  onClose: () => void;
}) {
  if (!ritual) return null;

  const tags = ritual.ritual_tags ?? [];
  const isBanishing =
    ritual.ritual_name.toLowerCase().includes("banishing") ||
    tags.some((t) => t.toLowerCase().includes("banishing"));

  // Extract Gates (Elements)
  const gates = tags
    .filter((t) => t.includes("_Gate_"))
    .map((t) => {
      const match = t.match(/^(Fire|Water|Air|Earth|Spirit)_Gate_/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];

  // If no explicit gate tags, derive from zodiac tags
  if (gates.length === 0) {
    const zodiacs = tags
      .filter((t) => t.includes("_Invocation_Ritual"))
      .map((t) => t.split("_")[0].toLowerCase());

    const elements = new Set<string>();
    zodiacs.forEach(z => {
      if (["aries", "leo", "sagittarius"].includes(z)) elements.add("Fire");
      if (["cancer", "scorpio", "pisces"].includes(z)) elements.add("Water");
      if (["gemini", "libra", "aquarius"].includes(z)) elements.add("Air");
      if (["taurus", "virgo", "capricorn"].includes(z)) elements.add("Earth");
    });
    if (elements.size > 0) gates.push(...Array.from(elements));
  }

  // Extract Planets
  const planets = tags
    .filter((t) => t.includes("_Invocation_Ritual"))
    .map((t) => {
      const name = t.split("_")[0];
      const isPlanet = [
        "Mars", "Jupiter", "Moon", "Neptune", "Mercury",
        "Uranus", "Venus", "Saturn", "Sun", "Pluto"
      ].includes(name);
      return isPlanet ? name : null;
    })
    .filter(Boolean) as string[];

  const gateIcons: Record<string, React.ReactNode> = {
    Fire: <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-red-500 mb-0.5" />,
    Water: <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-blue-500 mt-0.5" />,
    Air: <div className="relative w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-yellow-500 mb-0.5">
      <div className="absolute left-[-4px] top-[6px] h-[1px] w-[8px] bg-yellow-900/50" />
    </div>,
    Earth: <div className="relative w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-emerald-500 mt-0.5">
      <div className="absolute left-[-4px] top-[-7px] h-[1px] w-[8px] bg-emerald-900/50" />
    </div>,
    Spirit: <div className="size-3.5 rounded-full border-2 border-white/20 bg-gray-600" />,
  };

  const planetSymbols: Record<string, string> = {
    Mars: "♂",
    Jupiter: "♃",
    Moon: "☽",
    Neptune: "♆",
    Mercury: "☿",
    Uranus: "♅",
    Venus: "♀",
    Saturn: "♄",
    Sun: "☉",
    Pluto: "♇",
  };

  return (
    <Dialog open={!!ritual} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden border-border/20 bg-[#161c2e] p-0 text-white">
        <div className="relative p-6 pt-8">
          {/* Custom Close Button */}
          {/* <button
            onClick={onClose}
            className="absolute -right-2 -top-2 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <X className="size-6 stroke-[3]" />
          </button> */}

          <DialogHeader className="mb-10">
            <div className="rounded-xl bg-[#1c243d]/80 py-4 text-center border border-white/5 shadow-inner">
              <DialogTitle className="text-2xl font-bold tracking-wider text-gray-100">
                Ritual Details
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {/* Banishing / Invoking */}
            <div className="rounded-full border border-white/10 bg-[#1c243d] px-8 py-2 text-sm font-medium text-gray-300 shadow-sm">
              {isBanishing ? "Banishing" : "Invoking"}
            </div>

            {gates.length > 0 && (
              <>
                <ArrowDown className="size-5 text-orange-500/80 animate-pulse" />
                <div className="w-full space-y-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                    GATES
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {gates.map((gate) => (
                      <div key={gate} className="flex items-center gap-2.5 rounded-full border border-white/5 bg-[#1c243d] px-5 py-2 text-sm text-gray-200 shadow-sm">
                        {gateIcons[gate] || gateIcons.Spirit}
                        {gate} Gate
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {planets.length > 0 && (
              <>
                <ArrowDown className="size-5 text-orange-500/80 animate-pulse" />
                <div className="w-full space-y-4 text-center pb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                    PLANETS
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {planets.map((planet) => (
                      <div key={planet} className="flex items-center gap-3 rounded-full border border-white/5 bg-[#1c243d] px-6 py-2 text-sm text-gray-200 shadow-sm">
                        <span className="text-xl font-serif text-gray-400">
                          {planetSymbols[planet] || "★"}
                        </span>
                        {planet}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {gates.length === 0 && planets.length === 0 && (
              <div className="pb-8 text-center text-sm text-muted-foreground">
                No planet or gate configuration found.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
