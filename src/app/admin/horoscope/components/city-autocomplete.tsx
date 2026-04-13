"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import type { CityOption } from "../types";
import { fetchWithRetry } from "../api";

export function CityAutocomplete({ value, onChange, label = "Place of Birth", disabled = false }: {
  value: CityOption | null; onChange: (c: CityOption | null) => void; label?: string; disabled?: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (value) setQuery(value.label); }, [value]);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setOptions([]); setOpen(false); return; }
    setLoading(true);
    fetchWithRetry("/api/admin/astro/city-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) })
      .then((r) => r.json()).then((d) => { setOptions(d.results ?? []); setOpen((d.results ?? []).length > 0); })
      .catch(() => setOptions([])).finally(() => setLoading(false));
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value; setQuery(q); onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  }
  function select(c: CityOption) { onChange(c); setQuery(c.label); setOptions([]); setOpen(false); }

  return (
    <div className="relative space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground block">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
        <Input value={query} onChange={handleInput} onBlur={() => setTimeout(() => setOpen(false), 200)} placeholder="Search city, state or country..." disabled={disabled} className="h-9 text-sm pl-8 pr-8" />
        {loading && <Loader2 className="absolute right-2.5 top-2 size-4 animate-spin text-muted-foreground" />}
      </div>
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-0.5 w-full rounded-md border bg-popover shadow-lg text-sm max-h-60 overflow-y-auto">
          {options.map((opt, i) => {
            const parts = opt.label.split(","); const primary = parts[0]?.trim() ?? opt.label; const secondary = parts.slice(1).join(",").trim();
            return (
              <li key={i} className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors border-b border-border/50 last:border-0" onMouseDown={() => select(opt)}>
                <MapPin className="size-3.5 mt-0.5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{primary}</p>
                  {secondary && <p className="text-[11px] text-muted-foreground truncate">{secondary}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{opt.lat.toFixed(4)}, {opt.lng.toFixed(4)} · UTC{opt.timezone.offset_string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {value && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-400/30 px-2.5 py-1.5">
          <MapPin className="size-3 text-amber-500 shrink-0" />
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium truncate">{value.label}</span>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{value.lat.toFixed(3)}, {value.lng.toFixed(3)} · UTC{value.timezone.offset_string}</span>
        </div>
      )}
    </div>
  );
}
