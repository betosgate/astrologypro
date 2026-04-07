"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_requester"
  | "waiting_internal"
  | "escalated"
  | "resolved"
  | "closed"
  | "cancelled";

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

// ─── Color map ────────────────────────────────────────────────────────────────

const statusClassMap: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  waiting_requester: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  waiting_internal: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  escalated: "bg-red-500/10 text-red-600 border-red-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const colorClass = statusClassMap[status] ?? "bg-gray-400/10 text-gray-400 border-gray-400/20";

  return (
    <Badge
      variant="outline"
      className={cn(colorClass, className)}
    >
      {formatStatus(status)}
    </Badge>
  );
}
