"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DivinerOption {
  id: string;
  display_name: string;
}

interface BookingsFilterFormProps {
  view: "all" | "my";
  status?: string;
  divinerId?: string;
  search?: string;
  from?: string;
  to?: string;
  divinerOptions: DivinerOption[];
}

export function BookingsFilterForm({
  view,
  status,
  divinerId,
  search,
  from,
  to,
  divinerOptions,
}: BookingsFilterFormProps) {
  const [statusValue, setStatusValue] = useState(status || "all");
  const [divinerValue, setDivinerValue] = useState(divinerId || "all");

  return (
    <form method="GET" action="/admin/bookings" className="flex flex-wrap gap-3 items-end">
      <input type="hidden" name="view" value={view} />
      <input type="hidden" name="status" value={statusValue} />
      {view === "all" && (
        <input
          type="hidden"
          name="diviner_id"
          value={divinerValue === "all" ? "" : divinerValue}
        />
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Client name / email</label>
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search client..."
          className="h-9 w-48 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <Select value={statusValue} onValueChange={setStatusValue}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {view === "all" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Diviner</label>
          <Select value={divinerValue} onValueChange={setDivinerValue}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <SelectItem value="all">All diviners</SelectItem>
              {divinerOptions.map((diviner) => (
                <SelectItem key={diviner.id} value={diviner.id}>
                  {diviner.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">From</label>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">To</label>
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button type="submit" size="sm">
        Filter
      </Button>
      <Button type="button" variant="ghost" size="sm" asChild>
        <Link href={`/admin/bookings?view=${view}`}>Clear</Link>
      </Button>
    </form>
  );
}
