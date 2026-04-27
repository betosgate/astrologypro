"use client";

// Period selector mirroring the four buckets supported by
// /api/admin/reports/affiliates/* (parseReportPeriod): 30d|90d|1y|all.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Period = "30d" | "90d" | "1y" | "all";

export function PeriodSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: Period;
  onChange: (value: Period) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Period)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="1y">Last year</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  );
}
