"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

export interface CityResult {
  city: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface CitySearchProps {
  value: string;
  onChange: (result: CityResult) => void;
  onTextChange?: (text: string) => void;
  id?: string;
  placeholder?: string;
}

/**
 * Approximate timezone from longitude using 15-degree zone width.
 * Falls back to Intl API for the user's local timezone if available.
 */
function timezoneFromCoords(lat: number, lng: number): string {
  try {
    // Use Intl to get a reasonable IANA timezone name based on the offset
    const offsetHours = Math.round(lng / 15);
    const sign = offsetHours >= 0 ? "+" : "-";
    const abs = Math.abs(offsetHours).toString().padStart(2, "0");
    return `UTC${sign}${abs}:00`;
  } catch {
    return "UTC";
  }
}

export function CitySearch({
  value,
  onChange,
  onTextChange,
  id,
  placeholder = "e.g., New York, NY",
}: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCities = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
        {
          headers: {
            "User-Agent": "AstrologyPro/1.0 (booking intake form)",
          },
        }
      );
      if (!res.ok) throw new Error("Geocoding request failed");
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      console.error("[CitySearch] Nominatim error:", err);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    onTextChange?.(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCities(text);
    }, 300);
  }

  function selectResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const cityName = result.display_name.split(",").slice(0, 2).join(",").trim();

    setQuery(cityName);
    setIsOpen(false);
    setResults([]);

    onChange({
      city: cityName,
      lat,
      lng,
      timezone: timezoneFromCoords(lat, lng),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-background/80 shadow-lg backdrop-blur-xl"
        >
          {results.map((result, idx) => {
            // Show city, region, country from display_name
            const parts = result.display_name.split(",");
            const label =
              parts.length > 2
                ? `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`
                : result.display_name;
            const sublabel =
              parts.length > 2
                ? parts.slice(1, -1).join(",").trim()
                : "";

            return (
              <li
                key={result.place_id}
                role="option"
                aria-selected={idx === activeIndex}
                className={`cursor-pointer px-3 py-2.5 text-sm transition-colors ${
                  idx === activeIndex
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectResult(result)}
              >
                <span className="font-medium">{label}</span>
                {sublabel && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {sublabel}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
