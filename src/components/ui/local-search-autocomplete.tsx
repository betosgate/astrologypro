"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface LocalOption {
    id: string;
    label: string;
}

export function LocalSearchAutocomplete({
    options,
    defaultValue = "",
    placeholder = "Search...",
    onSelect,
    className
}: {
    options: LocalOption[];
    defaultValue?: string;
    placeholder?: string;
    onSelect: (value: string) => void;
    className?: string;
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    const filteredSuggestions = options.filter(opt =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    function handleSelect(val: string) {
        setInputValue(val);
        setOpen(false);
        onSelect(val);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestion((i) => Math.min(i + 1, filteredSuggestions.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestion((i) => Math.max(i - 1, 0));
        }
        if (e.key === "Enter") {
            e.preventDefault();
            if (activeSuggestion >= 0) {
                handleSelect(filteredSuggestions[activeSuggestion].label);
            } else {
                onSelect(inputValue);
            }
            setOpen(false);
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    }

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
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
                onChange={(e) => {
                    const val = e.target.value;
                    setInputValue(val);
                    onSelect(val);
                    setOpen(true);
                    setActiveSuggestion(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    setOpen(true);
                    setActiveSuggestion(-1);
                }}
                className="pl-9 shadow-sm"
                autoComplete="off"
            />
            {open && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-lg border bg-popover shadow-lg">
                    {filteredSuggestions.map((s, idx) => (
                        <button
                            key={s.id ?? idx}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelect(s.label)}
                            className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                                idx === activeSuggestion
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <span className="truncate">{s.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
