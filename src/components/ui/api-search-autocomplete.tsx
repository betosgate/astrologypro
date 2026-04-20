"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ApiSearchAutocomplete({
    defaultValue = "",
    placeholder = "Search...",
    endpoint,
    resultKey,
    displayKey,
    onSelect,
    className
}: {
    defaultValue?: string;
    placeholder?: string;
    endpoint: string;
    resultKey: string;
    displayKey: string;
    onSelect: (value: string) => void;
    className?: string;
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!isTypingRef.current) {
            setInputValue(defaultValue);
        }
    }, [defaultValue]);

    function fetchSuggestions(q: string) {
        if (!q || q.length < 2) {
            // Option: if they just click we can fetch all, or fetch none? 
            // The user wants suggestions when clicking. 
            // Let's fetch without query if q is empty to show initial suggestions
        }

        // We fetch with search param
        const qs = q ? `?search=${encodeURIComponent(q)}` : "";
        fetch(`${endpoint}${qs}`)
            .then((r) => r.json())
            .then((d) => {
                const s = d[resultKey] ?? [];
                setSuggestions(s);
                setOpen(s.length > 0);
                setActiveSuggestion(-1);
            })
            .catch(() => { });
    }

    function handleFocus() {
        fetchSuggestions(inputValue);
    }

    function handleChange(value: string) {
        isTypingRef.current = true;
        setInputValue(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onSelect(value);
            fetchSuggestions(value);
        }, 800);
    }

    function handleSelect(s: any) {
        const val = s[displayKey] ?? "";
        setInputValue(val);
        setSuggestions([]);
        setOpen(false);
        onSelect(val);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggestion((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter") {
            e.preventDefault();
            if (activeSuggestion >= 0) handleSelect(suggestions[activeSuggestion]);
            else onSelect(inputValue); // fallback to raw string
            setOpen(false);
        }
        if (e.key === "Escape") { setOpen(false); }
    }

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
                value={inputValue}
                placeholder={placeholder}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                className="pl-9 shadow-sm"
                autoComplete="off"
            />
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-lg border bg-popover shadow-lg">
                    {suggestions.map((s, idx) => (
                        <button
                            key={s.id ?? idx}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelect(s)}
                            className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                                idx === activeSuggestion
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <span className="truncate">{s[displayKey]}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
