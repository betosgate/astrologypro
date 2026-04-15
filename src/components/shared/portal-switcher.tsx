"use client";

import Link from "next/link";
import { Check, ChevronDown, ArrowLeftRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { UserPortal } from "@/lib/user-roles";

interface PortalSwitcherProps {
  portals: UserPortal[];
  currentBase: string; // e.g. "/dashboard", "/portal", "/advocate"
}

/**
 * Compact role-switcher dropdown shown in every portal header.
 * Only renders when the user has 2 or more portals (roles).
 * The current portal is highlighted with a check mark.
 */
export function PortalSwitcher({ portals, currentBase }: PortalSwitcherProps) {
  if (portals.length < 2) return null;

  const current = portals.find((p) => p.href === currentBase);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
            "text-muted-foreground border border-border/50 bg-muted/40",
            "hover:bg-muted hover:text-foreground hover:border-border",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          title="Switch portal"
        >
          <ArrowLeftRight className="size-3 shrink-0" />
          <span className="hidden sm:inline">
            {current?.label ?? "Switch"}
          </span>
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Your portals
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {portals.map((p) => {
          const isActive = p.href === currentBase;
          return (
            <DropdownMenuItem key={p.href} asChild>
              <Link
                href={p.href}
                className={cn(
                  "flex items-center justify-between gap-2 cursor-pointer",
                  isActive && "font-medium",
                )}
              >
                <span className="flex items-center gap-2">
                  {isActive ? (
                    <Check className="size-3 text-primary shrink-0" />
                  ) : (
                    <span className="size-3 shrink-0" />
                  )}
                  {p.label}
                </span>
                {p.badge && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {p.badge}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
