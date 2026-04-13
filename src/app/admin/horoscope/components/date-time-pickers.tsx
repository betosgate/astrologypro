"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { HOURS, MINUTES } from "../constants";

export function DatePicker({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected: Date | undefined = value ? (() => { const d = parse(value, "yyyy-MM-dd", new Date()); return isValid(d) ? d : undefined; })() : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className={cn("h-9 w-full justify-start text-left font-normal text-sm", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-60" />
          {selected ? format(selected, "PPP") : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={(date) => { onChange(date ? format(date, "yyyy-MM-dd") : ""); setOpen(false); }} captionLayout="dropdown" startMonth={new Date(1900, 0)} endMonth={new Date()} disabled={(date) => date > new Date()} />
      </PopoverContent>
    </Popover>
  );
}

export function TimePicker({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [hh, mm] = value ? value.split(":") : ["", ""];
  function update(newHH: string, newMM: string) {
    if (newHH !== "" && newMM !== "") onChange(`${newHH}:${newMM}`);
    else if (newHH !== "") onChange(`${newHH}:${mm || "00"}`);
    else if (newMM !== "") onChange(`${hh || "00"}:${newMM}`);
  }
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="size-4 shrink-0 text-muted-foreground" />
      <Select value={hh} onValueChange={(v) => update(v, mm)} disabled={disabled}>
        <SelectTrigger className="h-9 w-[72px] text-sm"><SelectValue placeholder="HH" /></SelectTrigger>
        <SelectContent className="max-h-52">{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-muted-foreground font-semibold select-none">:</span>
      <Select value={mm} onValueChange={(v) => update(hh, v)} disabled={disabled}>
        <SelectTrigger className="h-9 w-[72px] text-sm"><SelectValue placeholder="MM" /></SelectTrigger>
        <SelectContent className="max-h-52">{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground ml-0.5">24h</span>
    </div>
  );
}
