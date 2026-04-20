"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BirthCityOption {
  label: string;
  lat: number;
  lng: number;
  tzone: string;
}

interface BirthCityAutocompleteProps {
  id?: string;
  value: string;
  onChange: (label: string, option?: BirthCityOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Debounced autocomplete for the Birth City field.
 * - Triggers search at 2+ characters with a ~300ms debounce.
 * - Fetches GET /api/community/nativity-chart/city-search?q=…
 * - Emits the selected label string via onChange so the existing
 *   birth_city string payload remains unchanged.
 */
export function BirthCityAutocomplete({
  id,
  value,
  onChange,
  placeholder = "e.g. New York, NY",
  disabled = false,
  className,
}: BirthCityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<BirthCityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  // Keep internal query in sync when the parent value changes externally
  // (e.g. when the profile initially loads).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    // Skip the fetch that would fire right after selecting a result.
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // OLD DEBOUNCE (300ms was too fast and caused frequent cancellations)
    // debounceRef.current = setTimeout(async () => {
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/community/nativity-chart/city-search?q=${encodeURIComponent(trimmed)}`,
          { signal: ctrl.signal }
        );
        if (!res.status.toString().startsWith('2')) { // Handle non-200 responses
          setResults([]);
          return;
        }
        const json = (await res.json()) as { results?: BirthCityOption[] };
        setResults(Array.isArray(json.results) ? json.results : []);
        setHighlighted(-1);
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(opt: BirthCityOption) {
    justSelectedRef.current = true;
    setQuery(opt.label);
    setResults([]);
    setOpen(false);
    onChange(opt.label, opt);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open && query.trim().length >= 2 && (loading || results.length > 0);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          // Keep parent in sync so completion % and save payload update
          // even if the user types freely without selecting a suggestion.
          onChange(next);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div
          // z-50 matches shadcn popover/select layer so the dropdown is
          // never clipped by sibling Cards or the sticky save bar.
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-popover shadow-md"
          role="listbox"
        >
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Searching cities…
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching cities. Keep typing, or enter the city name manually.
            </div>
          )}

          {!loading &&
            results.map((opt, i) => (
              <button
                type="button"
                key={`${opt.label}-${i}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  highlighted === i
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60"
                )}
                role="option"
                aria-selected={highlighted === i}
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
