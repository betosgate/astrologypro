"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  className,
  exact,
  activeExclusions = [],
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
  activeExclusions?: string[];
}) {
  const pathname = usePathname();
  const baseActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  const isExcluded = activeExclusions.some(
    (excludedHref) =>
      pathname === excludedHref || pathname.startsWith(excludedHref + "/"),
  );
  const isActive = baseActive && !isExcluded;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground font-semibold"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
