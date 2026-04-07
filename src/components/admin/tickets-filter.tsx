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
import { X } from "lucide-react";

interface TicketsFilterProps {
  currentStatus: string;
  currentType: string;
  currentPriority: string;
}

export function TicketsFilter({
  currentStatus,
  currentType,
  currentPriority,
}: TicketsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(
    status: string,
    type: string,
    priority: string
  ) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (type && type !== "all") params.set("type", type);
    if (priority && priority !== "all") params.set("priority", priority);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const hasFilters = currentStatus || currentType || currentPriority;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentStatus || "all"}
        onValueChange={(v) =>
          router.push(buildUrl(v === "all" ? "" : v, currentType, currentPriority))
        }
      >
        <SelectTrigger className="w-40">
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
          router.push(buildUrl(currentStatus, v === "all" ? "" : v, currentPriority))
        }
      >
        <SelectTrigger className="w-40">
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
          router.push(buildUrl(currentStatus, currentType, v === "all" ? "" : v))
        }
      >
        <SelectTrigger className="w-40">
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

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="text-muted-foreground"
        >
          <X className="size-4 mr-1.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
