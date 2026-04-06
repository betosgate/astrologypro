"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Calendar, BookOpen, FileText, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SearchResult, SearchResponse } from "@/app/api/admin/search/route";

type ResultGroup = {
  key: keyof SearchResponse["results"];
  label: string;
};

const GROUPS: ResultGroup[] = [
  { key: "users", label: "Users" },
  { key: "bookings", label: "Bookings" },
  { key: "lessons", label: "Lessons" },
  { key: "blog", label: "Blog" },
];

function typeIcon(type: SearchResult["type"]) {
  switch (type) {
    case "user":
      return <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
    case "booking":
      return <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
    case "lesson":
      return <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
    case "blog":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  }
}

function roleBadge(role?: string) {
  if (!role) return null;
  const colors: Record<string, string> = {
    diviner: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    trainee: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    community: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  const normalized = role.toLowerCase().includes("diviner")
    ? "diviner"
    : role.toLowerCase().includes("trainee")
    ? "trainee"
    : "community";
  return (
    <span
      className={cn(
        "ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium leading-none",
        colors[normalized] ?? "bg-muted text-muted-foreground"
      )}
    >
      {role}
    </span>
  );
}

function flatResults(results: SearchResponse["results"]): SearchResult[] {
  return [...results.users, ...results.bookings, ...results.lessons, ...results.blog];
}

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse["results"] | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K shortcut to focus
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(q)}&limit=5`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResponse = await res.json();
      setResults(data.results);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults(null);
      setLoading(false);
      setOpen(val.length > 0);
      return;
    }

    setOpen(true);
    setLoading(true);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function navigateTo(url: string) {
    router.push(url);
    setOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
  }

  // Keyboard navigation through flat result list
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results) return;

    const flat = flatResults(results);

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && flat[activeIndex]) {
      e.preventDefault();
      navigateTo(flat[activeIndex].url);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.bookings.length > 0 ||
      results.lessons.length > 0 ||
      results.blog.length > 0);

  // Compute flat index offset per group for keyboard navigation
  function groupOffset(groupKey: keyof SearchResponse["results"]) {
    let offset = 0;
    for (const g of GROUPS) {
      if (g.key === groupKey) return offset;
      offset += (results?.[g.key] ?? []).length;
    }
    return offset;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Trigger is just a wrapper; the actual input drives open state */}
        <div className="relative w-full min-w-[200px] max-w-[320px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2) setOpen(true);
            }}
            placeholder="Search everything…"
            className="h-8 pl-8 pr-8 text-sm"
            aria-label="Global admin search"
            aria-autocomplete="list"
            aria-expanded={open}
            role="combobox"
            autoComplete="off"
          />
          {query ? (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground md:block">
              ⌘K
            </kbd>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching…
          </div>
        )}

        {!loading && query.length >= 2 && !hasResults && results && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {!loading && query.length < 2 && (
          <div className="px-3 py-3 text-xs text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {!loading && hasResults && (
          <ScrollArea className="max-h-[400px]">
            <div ref={listRef} className="py-1" role="listbox" aria-label="Search results">
              {GROUPS.map((group) => {
                const items = results[group.key];
                if (!items || items.length === 0) return null;
                const offset = groupOffset(group.key);

                return (
                  <div key={group.key} className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </div>
                    {items.map((item, i) => {
                      const flatIdx = offset + i;
                      const isActive = activeIndex === flatIdx;
                      return (
                        <button
                          key={item.id}
                          data-idx={flatIdx}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => navigateTo(item.url)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                            isActive ? "bg-muted" : "hover:bg-muted/50"
                          )}
                        >
                          {typeIcon(item.type)}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-0">
                              <span className="truncate font-medium">{item.label}</span>
                              {item.role && roleBadge(item.role)}
                            </span>
                            {item.sublabel && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.sublabel}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
