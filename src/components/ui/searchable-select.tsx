"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
    value: string;
    label: string;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    maxInitialDisplay = 5,
    className
}: {
    options: Option[];
    value: string;
    onValueChange: (v: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    maxInitialDisplay?: number;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    // If search is empty, only show up to maxInitialDisplay
    const displayed = search ? filtered : filtered.slice(0, maxInitialDisplay);

    const selectedOption = options.find(o => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-56 justify-between font-normal", className)}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {displayed.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
                    ) : (
                        displayed.map((o) => (
                            <div
                                key={o.value}
                                onClick={() => {
                                    onValueChange(o.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === o.value ? "bg-accent/50 text-accent-foreground" : ""
                                )}
                            >
                                <Check
                                    className={cn("mr-2 h-4 w-4 shrink-0", value === o.value ? "opacity-100" : "opacity-0")}
                                />
                                <span className="truncate">{o.label}</span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
