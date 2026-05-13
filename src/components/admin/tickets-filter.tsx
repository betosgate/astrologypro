"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface Queue {
  id: string;
  name: string;
}

interface TicketsFilterProps {
  currentStatus: string;
  currentType: string;
  currentPriority: string;
  currentQueue?: string;
  currentSearch?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  queues?: Queue[];
}

export function TicketsFilter({
  currentStatus,
  currentType,
  currentPriority,
  currentQueue = "",
  currentSearch = "",
  currentDateFrom = "",
  currentDateTo = "",
  queues = [],
}: TicketsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [dateFromValue, setDateFromValue] = useState(currentDateFrom);
  const [dateToValue, setDateToValue] = useState(currentDateTo);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setDateFromValue(currentDateFrom);
  }, [currentDateFrom]);

  useEffect(() => {
    setDateToValue(currentDateTo);
  }, [currentDateTo]);

  function buildUrl(overrides: Record<string, string>) {
    const current: Record<string, string> = {
      status: currentStatus,
      type: currentType,
      priority: currentPriority,
      queue: currentQueue,
      search: currentSearch,
      date_from: currentDateFrom,
      date_to: currentDateTo,
    };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    startTransition(() => {
      router.replace(buildUrl({ search: value.trim() }), { scroll: false });
    });
  }

  function handleDateFromChange(value: string) {
    setDateFromValue(value);
    router.push(buildUrl({ date_from: value, date_to: dateToValue }));
  }

  function handleDateToChange(value: string) {
    setDateToValue(value);
    router.push(buildUrl({ date_from: dateFromValue, date_to: value }));
  }

  const hasFilters =
    currentStatus ||
    currentType ||
    currentPriority ||
    currentQueue ||
    currentSearch ||
    currentDateFrom ||
    currentDateTo;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tickets by subject, requester, ticket #…"
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={currentStatus || "all"}
          onValueChange={(v) =>
            router.push(buildUrl({ status: v === "all" ? "" : v }))
          }
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {[
              "open",
              "in_progress",
              "waiting_requester",
              "waiting_internal",
              "escalated",
              "resolved",
              "closed",
              "cancelled",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentType || "all"}
          onValueChange={(v) =>
            router.push(buildUrl({ type: v === "all" ? "" : v }))
          }
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {[
              "support",
              "job",
              "incident",
              "escalation",
              "complaint",
              "refund",
              "payout",
              "bug",
              "moderation",
            ].map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentPriority || "all"}
          onValueChange={(v) =>
            router.push(buildUrl({ priority: v === "all" ? "" : v }))
          }
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["low", "normal", "high", "urgent", "critical"].map((p) => (
              <SelectItem key={p} value={p}>
                {p.replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {queues.length > 0 && (
          <Select
            value={currentQueue || "all"}
            onValueChange={(v) =>
              router.push(buildUrl({ queue: v === "all" ? "" : v }))
            }
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="All queues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All queues</SelectItem>
              {queues.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFromValue}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="h-9 w-36 text-sm"
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            type="date"
            value={dateToValue}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="h-9 w-36 text-sm"
            aria-label="To date"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(pathname)}
            className="text-muted-foreground h-9"
          >
            <X className="size-4 mr-1.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
