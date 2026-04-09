"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin } from "lucide-react";

export interface CitySearchResult {
  label: string;
  lat: number;
  lng: number;
  timezone: {
    offset_string: string;
  };
}

interface CitySearchInputProps {
  id?: string;
  value: string;
  onChange: (result: CitySearchResult | null, textValue: string) => void;
  placeholder?: string;
}

export function CitySearchInput({ id, value, onChange, placeholder = "Search for a city..." }: CitySearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Sync external value
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value, isOpen, query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function search(q: string) {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/city-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      
      setResults(data.results || []);
      setIsOpen(true);
    } catch (err) {
      console.error("City search error:", err);
      setError("Failed to search cities");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onChange(null, val); // Clear selection if typing
    setFocusedIndex(-1);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(result: CitySearchResult) {
    setQuery(result.label);
    setIsOpen(false);
    onChange(result, result.label);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="pr-9"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
        </div>
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md outline-none animate-in fade-in-80 slide-in-from-top-1">
          {results.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((result, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(result)}
                  className={`flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors mx-1 ${
                    idx === focusedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <MapPin className="mr-2 size-4 opacity-50 shrink-0" />
                  <span className="truncate">{result.label}</span>
                </li>
              ))}
            </ul>
          ) : !isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
               {error ? error : "No matching cities found."}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
