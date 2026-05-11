"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavDropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
  /** Optional leading icon (e.g. lucide icon component) */
  icon?: React.ReactNode;
}

/**
 * Sidebar nav group with a chevron toggle. Auto-opens when the current
 * pathname matches one of its child items, and highlights the active child.
 */
export function NavDropdown({ label, items, icon }: NavDropdownProps) {
  const pathname = usePathname();
  const childMatches = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const [open, setOpen] = useState(false);
  const expanded = childMatches || open;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          childMatches
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            expanded ? "rotate-180" : "rotate-0",
          )}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <ul className="mt-0.5 flex flex-col gap-0.5 pl-3">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
